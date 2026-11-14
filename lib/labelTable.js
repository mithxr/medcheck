import { matchSymptom } from './symptoms.js';

const clean = (html) =>
  html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[†‡*§¶]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const NUM = /^\s*<?\s*(\d+(?:\.\d+)?)\s*%?\s*$/;

/**
 * Parse an SPL adverse-reactions table (HTML from openFDA's adverse_reactions_table)
 * into rows of { term, drug, placebo }. The first number in a row is taken as the
 * drug arm and the second as placebo, which matches the standard FDA layout.
 */
export function parseAdverseTable(html) {
  if (!html) return [];
  const rows = [];
  for (const tr of html.split(/<tr[\s>]/i).slice(1)) {
    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => clean(m[1]));
    if (cells.length < 2) continue;
    const nums = cells.map((c) => c.match(NUM)).filter(Boolean).map((m) => Number(m[1]));
    const term = cells.find((c) => c && !NUM.test(c));
    if (!term || nums.length < 2) continue;
    rows.push({ term, drug: nums[0], placebo: nums[1] });
  }
  return rows;
}

/** Collapse parsed rows onto canonical symptoms (first matching row wins). */
export function labelBySymptom(rows) {
  const out = {};
  for (const r of rows) {
    const key = matchSymptom(r.term);
    if (key && !out[key]) out[key] = { term: r.term, drug: r.drug, placebo: r.placebo };
  }
  return out;
}
