import { getJson } from '../http.js';
import { symptomsIn } from '../symptoms.js';
import { loadFixture } from '../fixtures.js';

const UA = () => process.env.REDDIT_USER_AGENT || 'medcheck/1.0';

async function token() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  const data = await getJson('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA(),
    },
    body: 'grant_type=client_credentials',
  });
  return data.access_token;
}

/**
 * Search drug subreddits (r/<brand>, r/<generic>) for side-effect posts.
 * Live with Reddit credentials; otherwise returns bundled real thread links if we have them.
 */
export async function getReddit(drug, generic) {
  const tok = await token().catch(() => null);
  if (!tok) {
    const fx = await loadFixture(generic || drug);
    return fx?.reddit ? { ...fx.reddit, status: 'sample' } : { status: 'unavailable', posts: [], mentions: {}, n: 0 };
  }

  const headers = { Authorization: `Bearer ${tok}`, 'User-Agent': UA() };
  const subs = [...new Set([drug, generic].filter(Boolean).map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')))];
  const queries = subs.map((s) =>
    getJson(`https://oauth.reddit.com/r/${s}/search?q=${encodeURIComponent('side effects')}&restrict_sr=1&sort=relevance&t=all&limit=50`, { headers }).catch(() => null)
  );
  queries.push(getJson(`https://oauth.reddit.com/search?q=${encodeURIComponent(`${drug} side effects`)}&sort=relevance&t=year&limit=50`, { headers }).catch(() => null));

  const seen = new Set();
  const posts = [];
  for (const res of await Promise.all(queries)) {
    for (const c of res?.data?.children || []) {
      const p = c.data;
      if (!p || seen.has(p.id) || p.over_18) continue;
      seen.add(p.id);
      posts.push({
        title: p.title,
        url: `https://www.reddit.com${p.permalink}`,
        subreddit: p.subreddit_name_prefixed,
        score: p.score,
        comments: p.num_comments,
        created: new Date(p.created_utc * 1000).toISOString(),
        symptoms: symptomsIn(`${p.title} ${p.selftext || ''}`),
      });
    }
  }

  const counts = {};
  for (const p of posts) for (const k of p.symptoms) counts[k] = (counts[k] || 0) + 1;
  const mentions = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +(100 * v / Math.max(posts.length, 1)).toFixed(1)]));

  return {
    status: 'live',
    n: posts.length,
    mentions,
    posts: posts.sort((a, b) => b.score - a.score).slice(0, 6),
  };
}
