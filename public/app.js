const API_BASE = '/api';

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultsEl = document.getElementById('results');
const toastEl = document.getElementById('toast');

let toastTimer = null;

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

async function doSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  resultsEl.innerHTML = '<p class="state-msg">검색 중…</p>';

  try {
    const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok) {
      resultsEl.innerHTML = '';
      showToast(data.error || '검색에 실패했습니다');
      return;
    }

    renderResults(data.items || []);
  } catch {
    resultsEl.innerHTML = '';
    showToast('네트워크 오류가 발생했습니다');
  }
}

// "홍길동 (지은이), 김철수 (옮긴이), 이영희 (해설)" → "홍길동 저, 김철수 역"
function parseAuthor(raw) {
  if (!raw) return '';
  const roleMap = {
    지은이: '저', 저자: '저', 글: '저',
    옮긴이: '역', 역자: '역', 번역: '역', 편역: '편역',
  };
  const parts = raw.split(',').map(s => s.trim());
  const out = [];

  for (const part of parts) {
    const m = part.match(/^(.+?)\s*[(\[](.+?)[)\]]$/);
    if (!m) continue;
    const name = m[1].trim();
    const roleRaw = m[2].trim();
    const suffix = Object.keys(roleMap).find(k => roleRaw.includes(k));
    if (suffix) out.push(`${name} ${roleMap[suffix]}`);
  }

  if (out.length) return out.join(', ');
  // fallback: return first name without role annotation
  return raw.split(',')[0]?.split('(')[0]?.trim() || raw;
}

function renderResults(items) {
  if (!items.length) {
    resultsEl.innerHTML = '<p class="state-msg">검색 결과가 없습니다</p>';
    return;
  }

  resultsEl.innerHTML = '';

  for (const item of items) {
    const authorText = parseAuthor(item.author);
    const year = item.pubDate?.substring(0, 4) || '';
    const meta = [authorText, item.publisher, year].filter(Boolean).join(' · ');

    const el = document.createElement('div');
    el.className = 'book-item';
    el.innerHTML = `
      <img class="book-cover" src="${esc(item.cover)}" alt="${esc(item.title)}" loading="lazy" />
      <div class="book-info">
        <div class="book-title">${esc(item.title)}</div>
        <div class="book-meta">${esc(meta)}</div>
      </div>
      <button class="save-btn">저장</button>
    `;

    el.querySelector('.save-btn').addEventListener('click', () => {
      saveBook(el.querySelector('.save-btn'), {
        title: item.title,
        author: authorText,
        publisher: item.publisher,
        pubDate: item.pubDate,
        cover: item.cover,
      });
    });

    resultsEl.appendChild(el);
  }
}

async function saveBook(btn, book) {
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = '저장 중';

  try {
    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    const data = await res.json();

    if (data.success) {
      btn.textContent = '저장됨';
      btn.classList.add('saved');
      showToast('노션에 저장했습니다');
    } else {
      btn.disabled = false;
      btn.textContent = '저장';
      showToast(data.error || '저장에 실패했습니다');
    }
  } catch {
    btn.disabled = false;
    btn.textContent = '저장';
    showToast('네트워크 오류가 발생했습니다');
  }
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
