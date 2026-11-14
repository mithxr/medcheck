import { getJson } from '../http.js';
import { parseAdverseTable, labelBySymptom } from '../labelTable.js';

const BASE = 'https://api.fda.gov/drug';
const withKey = (qs) => (process.env.OPENFDA_API_KEY ? `${qs}&api_key=${process.env.OPENFDA_API_KEY}` : qs);
const q = (s) => `"${String(s).replace(/"/g, '').trim()}"`;

/** Find the product label by brand or generic name and parse its adverse-reaction table. */
export async function getLabel(drug) {
  const search = `openfda.brand_name:${q(drug)}+openfda.generic_name:${q(drug)}`;
  const data = await getJson(`${BASE}/label.json?${withKey(`search=${encodeURIComponent(search).replace(/%2B/g, '+')}&limit=1`)}`);
  const r = data.results?.[0];
  if (!r) return null;

  const rows = parseAdverseTable((r.adverse_reactions_table || [])[0] || '');
  const brand = r.openfda?.brand_name?.[0] || drug;
  const generic = (r.openfda?.generic_name?.[0] || '').toLowerCase();
  const setId = r.set_id || r.openfda?.spl_set_id?.[0] || null;

  return {
    brand,
    generic,
    manufacturer: r.openfda?.manufacturer_name?.[0] || null,
    pharmClass: r.openfda?.pharm_class_epc?.[0] || null,
    setId,
    effectiveTime: r.effective_time || null,
    dailymedUrl: setId ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}` : null,
    boxedWarning: (r.boxed_warning?.[0] || '').slice(0, 600) || null,
    tableRows: rows,
    bySymptom: labelBySymptom(rows),
  };
}

/** Most-reported reaction terms in FAERS for this drug, plus total report count. */
export async function getFaers(drug, generic) {
  const names = [...new Set([drug, generic].filter(Boolean))];
  const search = names.map((n) => `patient.drug.openfda.brand_name:${q(n)}+patient.drug.openfda.generic_name:${q(n)}`).join('+');
  const enc = encodeURIComponent(search).replace(/%2B/g, '+');
  const [counts, meta] = await Promise.all([
    getJson(`${BASE}/event.json?${withKey(`search=${enc}&count=patient.reaction.reactionmeddrapt.exact&limit=15`)}`),
    getJson(`${BASE}/event.json?${withKey(`search=${enc}&limit=1`)}`).catch(() => null),
  ]);
  return {
    total: meta?.meta?.results?.total ?? null,
    top: (counts.results || []).map((x) => ({ term: x.term, count: x.count })),
  };
}
