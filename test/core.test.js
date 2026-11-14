import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAdverseTable, labelBySymptom } from '../lib/labelTable.js';
import { matchSymptom, symptomsIn } from '../lib/symptoms.js';
import { buildComparison, ruleInsights } from '../lib/compare.js';
import { loadFixture } from '../lib/fixtures.js';

// Shaped like the SPL table openFDA returns for Zoloft (Table 3).
const TABLE = `<table><caption>Table 3: Common Adverse Reactions</caption>
<thead><tr><th>Body System</th><th>ZOLOFT (N=3066)</th><th>Placebo (N=2293)</th></tr></thead>
<tbody>
<tr><td><content styleCode="bold">Gastrointestinal disorders</content></td><td></td><td></td></tr>
<tr><td>Nausea</td><td>26%</td><td>12%</td></tr>
<tr><td>Diarrhea/Loose stools</td><td>20</td><td>10</td></tr>
<tr><td>Fatigue</td><td>12%</td><td>8%</td></tr>
<tr><td>Insomnia</td><td>20%</td><td>13%</td></tr>
<tr><td>Agitation</td><td>8%</td><td>5%</td></tr>
<tr><td>Libido decreased</td><td>6%</td><td>2%</td></tr>
<tr><td>Ejaculation failure<sup>†</sup></td><td>8%</td><td>1%</td></tr>
<tr><td>Hyperhidrosis</td><td>7%</td><td>3%</td></tr>
</tbody></table>`;

test('parses SPL adverse reaction table', () => {
  const rows = parseAdverseTable(TABLE);
  assert.equal(rows.length, 8);
  assert.deepEqual(rows[0], { term: 'Nausea', drug: 26, placebo: 12 });
  assert.deepEqual(rows[1], { term: 'Diarrhea/Loose stools', drug: 20, placebo: 10 });
});

test('maps label terms to canonical symptoms, first match wins', () => {
  const by = labelBySymptom(parseAdverseTable(TABLE));
  assert.equal(by.anxiety.drug, 8); // agitation
  assert.equal(by.sexual.drug, 6); // libido before ejaculation failure
  assert.equal(by.sweating.drug, 7);
});

test('symptom matching', () => {
  assert.equal(matchSymptom('Somnolence'), 'drowsiness');
  assert.equal(matchSymptom('Weight increased'), 'weight');
  assert.deepEqual(symptomsIn('Week 1: so nauseous and I can\'t sleep').sort(), ['insomnia', 'nausea']);
});

test('comparison flags gaps and missing-on-label rows', async () => {
  const fx = await loadFixture('sertraline');
  const label = { bySymptom: labelBySymptom(parseAdverseTable(TABLE)) };
  const { rows, patientSource } = buildComparison({ label, reviews: fx.reviews });
  assert.equal(patientSource, 'Drugs.com');
  const anx = rows.find((r) => r.key === 'anxiety');
  assert.equal(anx.gap, true);
  assert.equal(anx.labelPct, 8);
  const head = rows.find((r) => r.key === 'headache');
  assert.equal(head.labelPct, null);
  assert.equal(head.gap, true);
  assert.ok(ruleInsights(rows).length >= 2);
});
