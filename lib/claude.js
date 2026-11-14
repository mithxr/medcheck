import { getJson } from './http.js';

/**
 * Ask Claude to write three short, neutral insights about the label-vs-patient gaps.
 * Returns null when no key is configured or the call fails, so callers can fall back.
 */
export async function claudeInsights({ drug, rows, faers }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const prompt = `You are helping patients compare a medicine's FDA label with what patients report.
Medicine: ${drug}
Comparison rows (labelPct = % of trial patients on drug; placeboPct; patientPct = % of patient reports mentioning it):
${JSON.stringify(rows)}
Top FAERS terms: ${JSON.stringify((faers?.top || []).slice(0, 8))}

Write exactly 3 insights as JSON: {"insights":[{"kicker":"2-4 words","title":"max 6 words","body":"max 22 words"}]}
Rules: plain language, factual, no medical advice, never tell anyone to start/stop a medicine, note that trial rates and review mentions measure different things when relevant. JSON only.`;

  try {
    const data = await getJson('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      timeout: 15000,
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const text = data.content?.find((c) => c.type === 'text')?.text || '';
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return Array.isArray(json.insights) ? json.insights.slice(0, 3) : null;
  } catch {
    return null;
  }
}
