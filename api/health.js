/** GET /api/health — which data sources are configured. Never returns key values. */
export default function handler(req, res) {
  const has = (k) => Boolean(process.env[k]);
  res.status(200).json({
    ok: true,
    sources: {
      openfda: has('OPENFDA_API_KEY') ? 'live (keyed)' : 'live (keyless)',
      reddit: has('REDDIT_CLIENT_ID') && has('REDDIT_CLIENT_SECRET') ? 'live' : 'sample',
      claude: has('ANTHROPIC_API_KEY') ? 'live' : 'rules',
      flashpoint: has('FLASHPOINT_API_KEY') && has('FLASHPOINT_API_URL') ? 'live' : 'sample',
      reviews: 'curated',
    },
  });
}
