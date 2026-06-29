export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, maxResults = 20 } = req.query;
  if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

  const TTBKey = process.env.ALADIN_TTB_KEY;
  if (!TTBKey) return res.status(500).json({ error: 'Aladin API key not configured' });

  const params = new URLSearchParams({
    TTBKey,
    Query: query,
    QueryType: 'Keyword',
    SearchTarget: 'Book',
    Start: 1,
    MaxResults: maxResults,
    Output: 'js',
    Version: '20131101',
  });

  try {
    const response = await fetch(`https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?${params}`);
    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = JSON.parse(text.replace(/^[^({[]+/, '').replace(/[)]\s*;?\s*$/, ''));
    }

    if (json.errorCode) {
      return res.status(400).json({ error: json.errorMessage });
    }

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json({
      totalResults: json.totalResults ?? 0,
      items: (json.item || []).map(item => ({
        title: item.title,
        author: item.author,
        publisher: item.publisher,
        pubDate: item.pubDate,
        cover: (item.cover || '').replace(/cover\d+x(?=\.jpg)/i, 'coverxlarge'),
        isbn13: item.isbn13 || item.isbn,
        link: item.link,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from Aladin API', detail: err.message });
  }
}
