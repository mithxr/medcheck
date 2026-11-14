import { getJson } from '../http.js';
import { loadFixture } from '../fixtures.js';

/**
 * Flashpoint survey adapter.
 *
 * Flashpoint's survey agent researches a topic, proposes a plan (screener, quotas,
 * question blocks), and fields it to paid, real respondents. Once you have API access,
 * set FLASHPOINT_API_URL and FLASHPOINT_API_KEY and adjust the request/response mapping
 * below to match their spec. Until then this returns clearly labelled sample results.
 */
export function surveyPlan(drug, generic) {
  return {
    respondents: 300,
    screener: `Have you taken ${drug}${generic && generic !== drug.toLowerCase() ? ` or ${generic}` : ''} in the past 12 months?`,
    quota: '50/50 split, ages 18–34 and 35–55',
    length: '10 questions in 3 blocks · about 5 minutes',
    blocks: ['What you felt', 'What you were told', 'How it changed over time'],
  };
}

export async function getSurvey(drug, generic) {
  const plan = surveyPlan(drug, generic);
  const { FLASHPOINT_API_URL: url, FLASHPOINT_API_KEY: key } = process.env;

  if (url && key) {
    try {
      // TODO: align with Flashpoint's published API once available.
      const res = await getJson(`${url.replace(/\/$/, '')}/surveys/results`, {
        method: 'POST',
        timeout: 15000,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: `${generic || drug} side effects`, plan }),
      });
      return { status: 'live', plan, results: res };
    } catch (e) {
      return { status: 'error', plan, error: e.message };
    }
  }

  const fx = await loadFixture(generic || drug);
  return { status: 'sample', plan, results: fx?.survey || null };
}
