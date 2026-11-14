# MedCheck — What the label says. What patients share.

> Built at **Hack the Unreachable** (Fordham Gabelli · Nov 14, 2026) · Surveys powered by **Flashpoint.AI**

MedCheck is an agentic research tool. It compares what a medicine's **official FDA label** says about side effects with what **real patients report**, then checks the gap with **real surveys through Flashpoint**.

Think of it as checking the reviews before you take the pill.

---

## The problem

- The drug label shows side effects from clinical trials. It does not show what patients feel in real life.
- Up to 40% of the side effects that patients write about online do not go into official reports.

## The solution

Type a medicine (or upload a photo of the bottle). The MedCheck agent runs one research loop:

1. **Resolve** the brand/generic name and fetch the official label (**live**, openFDA).
2. **Parse** the label's clinical-trial adverse-reaction table, drug vs. placebo (**live**).
3. **Pull** post-approval FDA safety reports (**live**, FAERS via openFDA).
4. **Read** what patients share: Reddit drug communities (**live** with keys) and curated review stats.
5. **Check actual surveys using Flashpoint** (adapter; sample data until API access).
6. **Align** both sides on canonical symptoms and flag the gaps.
7. **Explain** the gaps in plain language (Claude when a key is set, rules otherwise).

## Architecture

```
index.html                 Frontend (single page, no build step)
api/
  research.js              GET /api/research?drug=zoloft  → the agent loop
  health.js                GET /api/health                → which sources are configured
lib/
  sources/openfda.js       FDA label + FAERS (live, keyless)
  sources/reddit.js        Reddit search via app-only OAuth (live with keys)
  sources/reviews.js       Curated review statistics (fixtures)
  sources/flashpoint.js    Flashpoint survey adapter (sample until API access)
  labelTable.js            Parses SPL adverse-reaction tables (drug % vs placebo %)
  symptoms.js              Symptom dictionary: maps label + patient language to one key
  compare.js               Joins both sides, flags gaps, rule-based insights
  claude.js                Optional Claude-written insights
fixtures/sertraline.json   Curated Zoloft data (reviews, real Reddit links, sample survey)
test/core.test.js          Unit tests (node --test)
```

The frontend calls `/api/research`. If the API is unreachable (e.g. opened as a local file), it falls back to built-in Zoloft data, so the demo always works. A status row under the chart shows which sources were **live**, **curated** or **sample** for each search.

## Data sources: what's real

| Source | Status | Notes |
|---|---|---|
| FDA label (DailyMed/openFDA) | ✅ **Live**, any drug | Parses the adverse-reaction table, drug vs. placebo |
| FDA FAERS reports | ✅ **Live**, any drug | Top reaction terms + total report count. Raw counts, unvalidated |
| Reddit | ✅ **Live** with keys | Searches r/&lt;brand&gt;, r/&lt;generic&gt; + site-wide. Without keys: real saved r/zoloft links |
| Drugs.com review stats | 📚 **Curated** | Real public stats for Zoloft. No public API, and scraping breaks their terms, so this is a licensed-feed slot |
| Flashpoint survey | 🧪 **Sample** | Adapter ready, with plan (screener, quota, blocks) generated per drug |
| Insights | 🤖 Claude or rules | Claude when `ANTHROPIC_API_KEY` is set |
| Votes, login, photo reading | 🧪 Demo | Front-end only; nothing stored |

## Environment variables (all optional)

Copy `.env.example`. In Vercel: **Project → Settings → Environment Variables**.

| Variable | What it unlocks | Get it |
|---|---|---|
| `OPENFDA_API_KEY` | Higher FDA rate limits | https://open.fda.gov/apis/authentication/ |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` | Live Reddit patient posts | https://www.reddit.com/prefs/apps → create "script" app |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Claude-written insights | https://console.anthropic.com |
| `FLASHPOINT_API_KEY`, `FLASHPOINT_API_URL` | Live survey results | Flashpoint team |

## Run locally

```bash
npm i -g vercel
vercel dev          # serves index.html + /api on http://localhost:3000
npm test            # unit tests
```

Try `http://localhost:3000/api/research?drug=zoloft` to see the raw JSON.

## Deploy

Import the repo at https://vercel.com/new → **Deploy**. No build settings needed; `api/*.js` become serverless functions automatically.

## Business model

- **Free for patients:** search, review, vote.
- **Drug companies pay an annual fee per drug** for the signal dashboard.
- **Plus a fee per Flashpoint survey** to validate a signal with real respondents.

**Vision:** pharmacies hand out a MedCheck QR code at pickup. Patients see what to expect and log their own side effects two weeks later. That consented, prescription-linked data is the moat.

## Responsible use

MedCheck shows what is documented and what people report. It is **not medical advice**. Talk with your doctor before changing any medicine. Crisis support (US): call or text **988**.

## License

MIT
