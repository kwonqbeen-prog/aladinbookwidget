// placeholder — 기능 확정 후 작성
const API_BASE = '/api';

document.getElementById('search-btn').addEventListener('click', search);
document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') search();
});

async function search() {
  const query = document.getElementById('search-input').value.trim();
  const queryType = document.getElementById('query-type').value;
  if (!query) return;

  const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}&queryType=${queryType}`);
  const data = await res.json();
  renderResults(data.item || []);
}

function renderResults(items) {
  const container = document.getElementById('results');
  container.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'book-card';
    el.innerHTML = `
      <img src="${item.cover}" alt="표지" />
      <div>
        <p class="title">${item.title}</p>
        <p class="author">${item.author}</p>
        <p class="publisher">${item.publisher} · ${item.pubDate}</p>
        <button onclick='saveToNotion(${JSON.stringify(item)})'>노션에 저장</button>
      </div>
    `;
    container.appendChild(el);
  });
}

async function saveToNotion(book) {
  const res = await fetch(`${API_BASE}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  const data = await res.json();
  if (data.success) alert('저장 완료!');
  else alert('저장 실패: ' + data.error);
}
