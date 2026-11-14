import { getLabel, getFaers } from '../lib/sources/openfda.js';
import { getReddit } from '../lib/sources/reddit.js';
import { getReviews } from '../lib/sources/reviews.js';
import { getSurvey } from '../lib/sources/flashpoint.js';
import { buildComparison, ruleInsights } from '../lib/compare.js';
import { claudeInsights } from '../lib/claude.js';

/**
 * GET /api/research?drug=zoloft
 * The MedCheck agent loop: resolve the drug, gather both sides in parallel,
 * align them on symptoms, and explain the gaps.
 */
export default async function handler(req, res) {
  const drug = String(req.query?.drug || '').trim().slice(0, 60);
  if (!drug) return res.status(400).json({ error: 'Add ?drug=<name>' });

  const started = Date.now();
  const sources = {};

  // 1. Resolve + read the official label (live, openFDA)
  let label = null;
  try {
    label = await getLabel(drug);
    sources.label = label ? 'live' : 'not_found';
  } catch (e) {
    sources.label = 'error';
  }
  const generic = label?.generic || drug.toLowerCase();
  const brand = label?.brand || drug;

  // 2. Everything else in parallel
  const [faers, reviews, reddit, survey] = await Promise.all([
    getFaers(brand, generic).then((r) => ((sources.faers = 'live'), r)).catch(() => ((sources.faers = 'error'), null)),
    getReviews(generic).then((r) => ((sources.reviews = r.status), r)),
    getReddit(brand, generic).then((r) => ((sources.reddit = r.status), r)).catch(() => ((sources.reddit = 'error'), null)),
    getSurvey(brand, generic).then((r) => ((sources.flashpoint = r.status), r)),
  ]);

  // 3. Align both sides
  const comparison = buildComparison({ label, reviews, reddit });

  // 4. Explain (Claude if configured, otherwise rules)
  let insights = await claudeInsights({ drug: brand, rows: comparison.rows, faers });
  sources.insights = insights ? 'claude' : 'rules';
  if (!insights) insights = ruleInsights(comparison.rows);

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({
    query: drug,
    drug: {
      brand,
      generic,
      manufacturer: label?.manufacturer || null,
      pharmClass: label?.pharmClass || null,
      dailymedUrl: label?.dailymedUrl || null,
      labelUpdated: label?.effectiveTime || null,
      boxedWarning: label?.boxedWarning || null,
    },
    comparison,
    insights,
    faers,
    reviews: reviews?.status === 'curated' ? reviews : null,
    reddit,
    survey,
    sources,
    tookMs: Date.now() - started,
  });
}
