import { byKey } from './symptoms.js';

/**
 * Join the label (left) and patient reports (right) on canonical symptoms.
 * Patient side prefers curated review stats, then live Reddit mention shares.
 */
export function buildComparison({ label, reviews, reddit, max = 9 }) {
  const patient = reviews?.mentions && Object.keys(reviews.mentions).length
    ? { source: reviews.source || 'Reviews', n: reviews.count, values: reviews.mentions, links: reviews.sfx || {} }
    : reddit?.mentions && Object.keys(reddit.mentions).length
      ? { source: 'Reddit', n: reddit.n, values: reddit.mentions, links: {} }
      : null;

  const L = label?.bySymptom || {};
  const keys = new Set([...Object.keys(L), ...Object.keys(patient?.values || {})]);

  const rows = [...keys].map((k) => {
    const l = L[k];
    const p = patient?.values?.[k];
    const gap = p != null && (l == null || p > l.drug * 1.2);
    return {
      key: k,
      name: byKey[k]?.label || k,
      labelTerm: l && l.term.toLowerCase() !== (byKey[k]?.label || '').toLowerCase() ? l.term : null,
      labelPct: l?.drug ?? null,
      placeboPct: l?.placebo ?? null,
      patientPct: p ?? null,
      gap,
      href: patient?.links?.[k] || null,
    };
  });

  rows.sort((a, b) => (b.patientPct ?? -1) - (a.patientPct ?? -1) || (b.labelPct ?? 0) - (a.labelPct ?? 0));
  return { patientSource: patient?.source || null, patientN: patient?.n || null, rows: rows.slice(0, max) };
}

/** Rule-based insights used when Claude isn't configured. */
export function ruleInsights(rows) {
  const out = [];
  const flip = rows.filter((r) => r.patientPct != null && r.labelPct != null && r.patientPct > r.labelPct)
    .sort((a, b) => b.patientPct / b.labelPct - a.patientPct / a.labelPct)[0];
  if (flip) out.push({ kicker: 'Biggest gap', title: `${flip.name} comes up more`, body: `${flip.patientPct}% of patient reports mention it. The label lists ${flip.labelTerm ? flip.labelTerm.toLowerCase() : 'it'} at ${flip.labelPct}%.`, href: flip.href });
  const missing = rows.filter((r) => r.labelPct == null && r.patientPct != null).slice(0, 2);
  if (missing.length) out.push({ kicker: 'Not in the main table', title: missing.map((m) => m.name).join(' and '), body: `Patients bring ${missing.length > 1 ? 'them' : 'it'} up, but the trials didn't show ${missing.length > 1 ? 'them' : 'it'} clearly above placebo.`, href: missing[0].href });
  const top = rows.filter((r) => r.labelPct != null).sort((a, b) => b.labelPct - a.labelPct)[0];
  if (top) out.push({ kicker: 'Top on the label', title: `${top.name} in trials`, body: `${top.labelPct}% of trial patients had it (vs ${top.placeboPct}% on placebo).${top.patientPct != null ? ` ${top.patientPct}% of patient reports mention it.` : ''}` });
  return out.slice(0, 3);
}
