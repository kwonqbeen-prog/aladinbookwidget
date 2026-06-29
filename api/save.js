export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    return res.status(500).json({ error: 'Notion credentials not configured' });
  }

  const book = req.body;

  // TODO: Notion DB 필드 구성 확정 후 properties 매핑 완성
  const properties = {
    // 필드 구성은 사용자 확인 후 추가
  };

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
        // cover, icon 등은 확정 후 추가
      }),
    });

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message });
    }
    res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save to Notion', detail: err.message });
  }
}
