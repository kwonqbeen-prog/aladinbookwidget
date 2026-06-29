export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(200).end();
  }

  const { query, queryType = 'Keyword', start = 1, maxResults = 10 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  const TTBKey = process.env.ALADIN_TTB_KEY;
  if (!TTBKey) {
    return res.status(500).json({ error: 'Aladin API key not configured' });
  }

  const params = new URLSearchParams({
    TTBKey,
    Query: query,
    QueryType: queryType,
    SearchTarget: 'Book',
    Start: start,
    MaxResults: maxResults,
    Output: 'js',
    Version: '20131101',
    Cover: 'Big',
  });

  const url = `https://www.aladin.us/ttb/api/ItemSearch.aspx?${params}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // Aladin API returns JSONP-like response, strip callback wrapper if present
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Aladin API', detail: err.message });
  }
}
