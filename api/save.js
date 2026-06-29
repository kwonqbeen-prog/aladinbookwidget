// Notion DB property names — must match your database column names exactly.
// Title column: "제목" (the main title property)
// Other columns to create in Notion: 저자 (텍스트), 출판사 (텍스트), 출판연도 (숫자), 표지 (파일과 미디어)
const PROPS = {
  title: '제목',
  author: '저자',
  publisher: '출판사',
  year: '출판연도',
  cover: '표지',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    return res.status(500).json({ error: 'Notion credentials not configured' });
  }

  const { title, author, publisher, pubDate, cover } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });

  const year = pubDate ? parseInt(pubDate.substring(0, 4), 10) : null;

  const properties = {
    [PROPS.title]: {
      title: [{ text: { content: title } }],
    },
    ...(author && {
      [PROPS.author]: { rich_text: [{ text: { content: author } }] },
    }),
    ...(publisher && {
      [PROPS.publisher]: { rich_text: [{ text: { content: publisher } }] },
    }),
    ...(year && {
      [PROPS.year]: { number: year },
    }),
    ...(cover && {
      [PROPS.cover]: {
        files: [{ name: 'cover', type: 'external', external: { url: cover } }],
      },
    }),
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
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Notion API error' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save to Notion', detail: err.message });
  }
}
