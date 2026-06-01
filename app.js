/**
 * THƯ VIỆN CÂY THUỐC VIỆT NAM
 * app.js — Main application logic
 * Requires: data.js (loaded before this file)
 */

// ===================== STATE =====================
const STATE = {
  currentPage: 'home',       // 'home' | 'catalog' | 'disease' | 'detail'
  catalogFilter: 'all',      // chapter filter
  catalogSort: 'name',
  catalogCurrentPage: 1,
  catalogPageSize: 24,
  searchQuery: '',
  diseasePlantsResults: [],
  detailPlant: null,
  detailBookPage: 0,         // 0-based index within pages range
  lightboxImages: [],
  lightboxIndex: 0,
  wikiImageCache: {},        // { plantKey: [imageUrls] }
};


// ===================== HELPERS =====================
function fmt(n) { return String(n).padStart(3, '0'); }
function imgPath(page) { return `images/page_0${fmt(page)}.jpeg`; }

function getSlug(plant) {
  return plant.ten_khong_dau.toLowerCase().replace(/\s+/g, '_');
}

function chapterShort(ch) {
  return ch.replace(/^([IVXLC]+\.\s*)/, '').trim();
}

const CHAPTERS = (() => {
  const seen = new Set();
  const list = [];
  for (const p of CAY_THUOC_DATA) {
    if (!seen.has(p.chuong)) { seen.add(p.chuong); list.push(p.chuong); }
  }
  return list;
})();

// ===================== WIKI API =====================
async function fetchWikiImages(plant, maxImages = 4) {
  const cacheKey = plant.ten_khong_dau;
  if (STATE.wikiImageCache[cacheKey]) return STATE.wikiImageCache[cacheKey];

  const queries = [];
  if (plant.ten_anh) queries.push(plant.ten_anh.split('/')[0].trim());
  if (plant.ten_khoa_hoc) {
    const sci = plant.ten_khoa_hoc.split('(')[0].trim().split(' ').slice(0, 2).join(' ');
    if (sci !== queries[0]) queries.push(sci);
  }

  for (const query of queries) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?` +
        `action=query&titles=${encodeURIComponent(query)}&prop=pageimages|images&` +
        `pithumbsize=400&imlimit=10&format=json&origin=*`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const json = await res.json();
      const pages = json.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      if (!pageId || pageId === '-1') continue;

      const page = pages[pageId];
      const images = [];

      if (page.thumbnail?.source) images.push({
        src: page.thumbnail.source,
        caption: page.title
      });

      if (page.images && images.length < maxImages) {
        const imageNames = page.images
          .filter(i => /\.(jpg|jpeg|png|webp)$/i.test(i.title))
          .filter(i => !/icon|logo|flag|map|symbol|seal|coat|badge|small/i.test(i.title))
          .slice(0, maxImages * 2);

        for (const img of imageNames.slice(0, 4)) {
          try {
            const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&` +
              `titles=${encodeURIComponent(img.title)}&prop=imageinfo&` +
              `iiprop=url|thumburl&iiurlwidth=400&format=json&origin=*`;
            const ir = await fetch(imgUrl, { signal: AbortSignal.timeout(4000) });
            const ij = await ir.json();
            const ipages = ij.query?.pages || {};
            const ipid = Object.keys(ipages)[0];
            if (ipid && ipages[ipid].imageinfo?.[0]) {
              const info = ipages[ipid].imageinfo[0];
              const src = info.thumburl || info.url;
              if (src && !images.find(x => x.src === src)) {
                images.push({ src, caption: img.title.replace('File:', '').replace(/\.[^.]+$/, '') });
              }
            }
          } catch {}
          if (images.length >= maxImages) break;
        }
      }

      if (images.length > 0) {
        STATE.wikiImageCache[cacheKey] = images;
        return images;
      }
    } catch {}
  }

  STATE.wikiImageCache[cacheKey] = [];
  return [];
}

async function getWikiThumb(plant) {
  const images = await fetchWikiImages(plant, 1);
  return images[0]?.src || null;
}

// ===================== NAVIGATION =====================
function navigate(page, data = {}) {
  STATE.currentPage = page;
  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`.nav-tab[data-page="${page}"]`);
  if (tab) tab.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  const floatBtn = document.getElementById('floating-wiki-btn');
  if (floatBtn && page !== 'detail') floatBtn.classList.remove('visible');

  if (page === 'home') renderHome();
  else if (page === 'catalog') { STATE.catalogCurrentPage = 1; renderCatalog(); }
  else if (page === 'disease') renderDiseasePage();
  else if (page === 'detail') renderDetail(data.plant);
}

// ===================== HOME PAGE =====================
function renderHome() {
  const grid = document.getElementById('chapter-grid');
  grid.innerHTML = '';
  const total = CAY_THUOC_DATA.length;

  CHAPTERS.forEach(ch => {
    const count = CAY_THUOC_DATA.filter(p => p.chuong === ch).length;
    const short = chapterShort(ch);
    const numMatch = ch.match(/^([IVXLC]+)\./);
    const num = numMatch ? numMatch[1] : '';

    const card = document.createElement('div');
    card.className = 'chapter-card fade-in';
    card.innerHTML = `
      <div class="chapter-num">Chương ${num}</div>
      <h3>${short}</h3>
      <div class="plant-count">🌿 ${count} loại</div>
    `;
    card.addEventListener('click', () => {
      STATE.catalogFilter = ch;
      navigate('catalog');
    });
    grid.appendChild(card);
  });

  document.getElementById('hero-total').textContent = total;
  document.getElementById('hero-chapters').textContent = CHAPTERS.length;

  clearInterval(dyAutoTimer);
  dyCurrentIndex = 0;
  initDanhYSlider();
}

// ===================== CATALOG PAGE =====================
function renderCatalog() {
  const toolbar = document.getElementById('catalog-filters');
  toolbar.innerHTML = `
    <div class="filter-group" id="chapter-filters">
      <button class="filter-chip ${STATE.catalogFilter === 'all' ? 'active' : ''}" data-ch="all">Tất cả</button>
      ${CHAPTERS.map(ch => {
        const short = chapterShort(ch).substring(0, 30) + (chapterShort(ch).length > 30 ? '…' : '');
        return `<button class="filter-chip ${STATE.catalogFilter === ch ? 'active' : ''}" data-ch="${escapeAttr(ch)}">${short}</button>`;
      }).join('')}
    </div>
    <select class="sort-select" id="catalog-sort">
      <option value="name" ${STATE.catalogSort === 'name' ? 'selected' : ''}>Tên A-Z</option>
      <option value="page" ${STATE.catalogSort === 'page' ? 'selected' : ''}>Trang sách</option>
    </select>
  `;

  toolbar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.catalogFilter = btn.dataset.ch;
      STATE.catalogCurrentPage = 1;
      renderCatalog();
    });
  });

  toolbar.querySelector('#catalog-sort').addEventListener('change', e => {
    STATE.catalogSort = e.target.value;
    STATE.catalogCurrentPage = 1;
    renderCatalog();
  });

  let plants = STATE.catalogFilter === 'all'
    ? [...CAY_THUOC_DATA]
    : CAY_THUOC_DATA.filter(p => p.chuong === STATE.catalogFilter);

  if (STATE.searchQuery) {
    const q = STATE.searchQuery.toLowerCase();
    plants = plants.filter(p =>
      p.ten_co_dau.toLowerCase().includes(q) ||
      p.ten_khong_dau.toLowerCase().includes(q) ||
      p.ten_anh.toLowerCase().includes(q) ||
      p.ten_khoa_hoc.toLowerCase().includes(q)
    );
  }

  if (STATE.catalogSort === 'name') plants.sort((a, b) => a.ten_co_dau.localeCompare(b.ten_co_dau, 'vi'));
  else plants.sort((a, b) => a.page_start - b.page_start);

  const total = plants.length;
  const totalPages = Math.ceil(total / STATE.catalogPageSize);
  const start = (STATE.catalogCurrentPage - 1) * STATE.catalogPageSize;
  const pagePlants = plants.slice(start, start + STATE.catalogPageSize);

  const heading = document.getElementById('catalog-heading');
  heading.innerHTML = `<h2>Danh mục cây thuốc</h2><span class="count-badge">${total} loại</span>`;

  const list = document.getElementById('plant-list');
  list.innerHTML = '';
  if (pagePlants.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="icon">🌱</div><p>Không tìm thấy kết quả.</p></div>`;
    return;
  }

  pagePlants.forEach(plant => {
    const card = createPlantCard(plant);
    list.appendChild(card);
    loadThumbForCard(plant, card);
  });

  renderPagination(totalPages, STATE.catalogCurrentPage, page => {
    STATE.catalogCurrentPage = page;
    renderCatalog();
    document.getElementById('page-catalog').scrollIntoView({ behavior: 'smooth' });
  });
}

function createPlantCard(plant) {
  const card = document.createElement('div');
  card.className = 'plant-card fade-in';

  const tags = (plant.tac_dung_list || []).slice(0, 3).map(t =>
    `<span class="tac-dung-tag">${t}</span>`
  ).join('');

  card.innerHTML = `
    <div class="plant-card-header">
      <div class="plant-card-name">
        <h3>${plant.ten_co_dau}</h3>
        <span class="sci-name">${plant.ten_khoa_hoc}</span>
        <span class="eng-name">${plant.ten_anh}</span>
      </div>
      <div class="wiki-thumb-placeholder" data-plant-key="${escapeAttr(plant.ten_khong_dau)}">🌿</div>
    </div>
    <div class="plant-card-body">
      <div class="tac-dung-tags">${tags}</div>
      <div class="plant-card-footer">
        <span class="chapter-tag">${chapterShort(plant.chuong)}</span>
        <span class="page-badge">📖 Tr.${plant.page_start}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => navigate('detail', { plant }));
  return card;
}

async function loadThumbForCard(plant, card) {
  try {
    const src = await getWikiThumb(plant);
    const placeholder = card.querySelector('.wiki-thumb-placeholder');
    if (!placeholder) return;
    if (src) {
      const img = document.createElement('img');
      img.className = 'plant-wiki-thumb';
      img.src = src;
      img.alt = plant.ten_co_dau;
      img.loading = 'lazy';
      img.addEventListener('click', async (e) => {
        e.stopPropagation();
        await openWikiLightbox(plant);
      });
      placeholder.replaceWith(img);
    }
  } catch {}
}

// ===================== DISEASE SEARCH PAGE =====================
const QUICK_FILTERS = [
  'ho', 'hen suyễn', 'viêm phế quản', 'viêm phổi', 'viêm họng', 'cảm cúm', 'hắt hơi',
  'đau dạ dày', 'viêm loét dạ dày', 'tiêu chảy', 'táo bón', 'đầy hơi', 'buồn nôn', 'nôn mửa', 'trĩ', 'kiết lỵ',
  'huyết áp cao', 'huyết áp thấp', 'xơ vữa động mạch', 'tim hồi hộp', 'hạ mỡ máu',
  'an thần', 'mất ngủ', 'đau đầu', 'căng thẳng', 'chóng mặt', 'tê liệt',
  'phong thấp', 'đau lưng', 'đau khớp', 'viêm khớp', 'gout', 'thoái hóa khớp',
  'mụn nhọt', 'eczema', 'nấm da', 'ghẻ', 'vảy nến', 'viêm da',
  'gan mật', 'viêm gan', 'vàng da', 'sỏi thận', 'lợi tiểu', 'viêm đường tiết niệu',
  'tiểu đường', 'béo phì', 'tuyến giáp', 'suy nhược',
  'kháng khuẩn', 'tiêu viêm', 'ung thư', 'giải độc', 'tăng cường miễn dịch',
  'kinh nguyệt', 'đau bụng kinh', 'bạch đới', 'sau sinh',
  'hạ sốt', 'cầm máu', 'giảm đau', 'bổ dưỡng', 'bổ thận', 'bổ khí huyết',
  'viêm mắt', 'viêm tai', 'viêm xoang',
];

// ===================== ENHANCED DISEASE MAPPING (AI + 30 năm kinh nghiệm thuốc Nam) =====================
// Bản đồ bệnh → từ khóa bổ sung để tìm cây thuốc phù hợp trong data
const DISEASE_EXTRA_KEYWORDS = {
  'gout': ['lợi tiểu', 'thải độc', 'tiêu viêm', 'kháng viêm', 'chống viêm', 'giảm acid uric', 'phong thấp', 'đau khớp', 'thanh nhiệt', 'giải độc', 'sưng khớp'],
  'cảm cúm': ['hạ sốt', 'giải cảm', 'kháng khuẩn', 'kháng virus', 'ra mồ hôi', 'thông mũi', 'viêm họng', 'tăng cường miễn dịch', 'ho', 'cảm'],
  'hắt hơi': ['viêm mũi', 'thông mũi', 'dị ứng', 'viêm xoang', 'giải cảm', 'kháng histamin', 'cảm cúm'],
  'viêm loét dạ dày': ['đau dạ dày', 'viêm dạ dày', 'loét dạ dày', 'ợ chua', 'trung hòa acid', 'bảo vệ niêm mạc', 'kháng khuẩn h.pylori', 'tiêu hóa', 'chữa loét'],
  'trĩ': ['cầm máu', 'tiêu viêm', 'co mạch', 'táo bón', 'chữa trĩ', 'làm se', 'kháng khuẩn', 'thanh nhiệt', 'giảm đau'],
  'kiết lỵ': ['tiêu chảy', 'kháng khuẩn', 'kháng amíp', 'cầm tiêu chảy', 'tiêu viêm đường ruột', 'kiết lị', 'kháng khuẩn đường ruột', 'đau bụng'],
  'huyết áp cao': ['hạ áp', 'hạ huyết áp', 'giãn mạch', 'lợi tiểu', 'hạ mỡ máu', 'xơ vữa động mạch', 'tim mạch', 'an thần', 'thông huyết'],
  'huyết áp thấp': ['bổ khí', 'bổ huyết', 'tăng cường sinh lực', 'bổ dưỡng', 'kích thích tuần hoàn', 'bổ khí huyết', 'hồi sức'],
  'ho': ['ho', 'long đờm', 'giảm ho', 'viêm phế quản', 'hen suyễn', 'kháng khuẩn phổi', 'thông phổi'],
  'viêm phế quản': ['ho', 'viêm phế quản', 'long đờm', 'kháng khuẩn', 'thông phổi', 'giảm ho', 'hen suyễn'],
  'tiêu chảy': ['tiêu chảy', 'cầm tiêu chảy', 'kháng khuẩn đường ruột', 'săn ruột', 'kiết lị', 'đau bụng'],
  'táo bón': ['táo bón', 'nhuận tràng', 'thông tiện', 'kích thích tiêu hóa'],
  'mất ngủ': ['an thần', 'mất ngủ', 'dưỡng tâm', 'hạ huyết áp', 'căng thẳng', 'lo âu', 'thần kinh'],
  'đau đầu': ['đau đầu', 'giảm đau', 'hạ sốt', 'an thần', 'hạ huyết áp', 'chóng mặt'],
  'tiểu đường': ['tiểu đường', 'hạ đường huyết', 'insulin thảo dược', 'giảm đường máu', 'bổ thận'],
  'viêm gan': ['viêm gan', 'gan mật', 'bảo vệ gan', 'giải độc gan', 'vàng da', 'thanh nhiệt giải độc'],
  'sỏi thận': ['sỏi thận', 'lợi tiểu', 'thông tiểu', 'tan sỏi', 'viêm đường tiết niệu'],
  'phong thấp': ['phong thấp', 'đau khớp', 'viêm khớp', 'trừ thấp', 'khu phong', 'hoạt huyết', 'giảm đau xương khớp'],
  'mụn nhọt': ['mụn nhọt', 'kháng khuẩn', 'tiêu độc', 'thanh nhiệt giải độc', 'mụn', 'tiêu viêm da'],
  'sốt': ['hạ sốt', 'giải cảm', 'thanh nhiệt', 'ra mồ hôi', 'kháng khuẩn'],
  'kinh nguyệt': ['kinh nguyệt', 'điều kinh', 'hoạt huyết', 'đau bụng kinh', 'thông kinh'],
  'đau lưng': ['đau lưng', 'bổ thận', 'trừ thấp', 'phong thấp', 'hoạt huyết', 'giảm đau'],
  'eczema': ['eczema', 'viêm da', 'dị ứng da', 'ngứa da', 'kháng khuẩn da', 'thanh nhiệt giải độc'],
  'vảy nến': ['vảy nến', 'viêm da', 'kháng khuẩn da', 'thanh nhiệt', 'giải độc', 'ngứa'],
  'đau dạ dày': ['đau dạ dày', 'viêm dạ dày', 'tiêu hóa', 'chống co thắt', 'ợ chua', 'đầy bụng'],
};

function searchDisease(keyword) {
  if (!keyword.trim()) return;
  const kw = keyword.trim().toLowerCase();

  // Tìm từ khóa mở rộng dựa trên kiến thức y học cổ truyền
  const extraKws = DISEASE_EXTRA_KEYWORDS[kw] || [];
  const allKws = [kw, ...extraKws];

  const results = CAY_THUOC_DATA.filter(plant => {
    const combined = (plant.tac_dung + ' ' + (plant.tac_dung_list || []).join(' ')).toLowerCase();
    return allKws.some(k => combined.includes(k));
  });

  // Sắp xếp: ưu tiên kết quả khớp trực tiếp với từ khóa chính
  results.sort((a, b) => {
    const aMain = (a.tac_dung + ' ' + (a.tac_dung_list || []).join(' ')).toLowerCase().includes(kw) ? 0 : 1;
    const bMain = (b.tac_dung + ' ' + (b.tac_dung_list || []).join(' ')).toLowerCase().includes(kw) ? 0 : 1;
    return aMain - bMain;
  });

  STATE.diseasePlantsResults = results;

  const header = document.getElementById('disease-results-header');
  const list = document.getElementById('disease-results-list');

  if (results.length === 0) {
    header.innerHTML = `<h3>Không tìm thấy cây thuốc cho "<span class="disease-results-keyword">${keyword}</span>"</h3>`;
    list.innerHTML = `<div class="empty-state"><div class="icon">🌱</div><p>Thử từ khóa khác như: ho, sốt, đau dạ dày...</p></div>`;
    return;
  }

  header.innerHTML = `
    <h3>Kết quả cho "<span class="disease-results-keyword">${keyword}</span>"</h3>
    <span class="count-badge">${results.length} loại cây</span>
  `;

  list.innerHTML = '';
  results.forEach(plant => {
    const card = createDiseaseCard(plant, kw, allKws);
    list.appendChild(card);
    loadDiseaseCardImage(plant, card);
  });
}

function renderDiseasePage() {
  const qfContainer = document.getElementById('quick-filter-buttons');
  qfContainer.innerHTML = QUICK_FILTERS.map(f =>
    `<button class="quick-filter-btn" data-kw="${f}">${f}</button>`
  ).join('');
  qfContainer.querySelectorAll('.quick-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('disease-input').value = btn.dataset.kw;
      searchDisease(btn.dataset.kw);
    });
  });
}

function createDiseaseCard(plant, kw, allKws = [kw]) {
  const card = document.createElement('div');
  card.className = 'disease-plant-card fade-in';

  const matched = (plant.tac_dung_list || [])
    .filter(t => allKws.some(k => t.toLowerCase().includes(k)))
    .slice(0, 4);
  const matchedTags = matched.map(t => `<span class="matched-effect-tag">✓ ${t}</span>`).join('');

  card.innerHTML = `
    <div class="disease-plant-img-placeholder" data-key="${escapeAttr(plant.ten_khong_dau)}">🌿</div>
    <div class="disease-plant-info">
      <h4>${plant.ten_co_dau}</h4>
      <div class="sci">${plant.ten_khoa_hoc}</div>
      <div class="matched-effects">${matchedTags}</div>
    </div>
  `;
  card.addEventListener('click', () => navigate('detail', { plant }));
  return card;
}

async function loadDiseaseCardImage(plant, card) {
  try {
    const src = await getWikiThumb(plant);
    const placeholder = card.querySelector('.disease-plant-img-placeholder');
    if (!placeholder) return;
    if (src) {
      const img = document.createElement('img');
      img.className = 'disease-plant-img';
      img.src = src;
      img.alt = plant.ten_co_dau;
      img.loading = 'lazy';
      placeholder.replaceWith(img);
    }
  } catch {}
}

// ===================== DETAIL PAGE =====================
function renderDetail(plant) {
  STATE.detailPlant = plant;
  STATE.detailBookPage = 0;

  const el = document.getElementById('page-detail');
  el.innerHTML = '';

  const back = document.createElement('button');
  back.className = 'detail-back';
  back.innerHTML = '← Quay lại';
  back.addEventListener('click', () => history.back() || navigate('catalog'));
  el.appendChild(back);

  const layout = document.createElement('div');
  layout.className = 'detail-layout';
  el.appendChild(layout);

  const main = document.createElement('div');
  main.className = 'detail-main';
  main.innerHTML = `
    <div class="detail-header">
      <div class="detail-chapter-label">${plant.chuong}</div>
      <h1 class="detail-title">${plant.ten_co_dau}</h1>
      <div class="detail-sci">${plant.ten_khoa_hoc}</div>
      <div class="detail-eng">${plant.ten_anh}</div>
    </div>
    <div class="detail-body">
      <div class="detail-section">
        <h3>🌿 Tác dụng chữa bệnh</h3>
        <div class="tac-dung-full">${plant.tac_dung}</div>
        <div class="tac-dung-list">
          ${(plant.tac_dung_list || []).map(t => `<span class="tac-dung-item">${t}</span>`).join('')}
        </div>
      </div>
      <div class="detail-section page-viewer-section" id="book-pages-section">
        <h3>📖 Hình ảnh trong sách (Tr.${plant.page_start}–${plant.page_end})</h3>
        <div id="page-navigator-container"></div>
      </div>
    </div>
  `;
  layout.appendChild(main);

  const sidebar = document.createElement('div');
  sidebar.className = 'detail-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-card">
      <div class="sidebar-card-header">📸 Hình ảnh thực tế (Wikipedia)</div>
      <div class="sidebar-card-body" id="wiki-images-container">
        <div class="wiki-loading"><div class="spinner"></div><p style="margin-top:8px;color:var(--text-light);font-size:0.82rem">Đang tải...</p></div>
      </div>
    </div>
    <div class="sidebar-card">
      <div class="sidebar-card-header">🌱 Cùng chương</div>
      <div class="sidebar-card-body" id="related-plants-container"></div>
    </div>
  `;
  layout.appendChild(sidebar);

  renderBookPages(plant, document.getElementById('page-navigator-container'));
  loadSidebarWikiImages(plant);

  const related = CAY_THUOC_DATA
    .filter(p => p.chuong === plant.chuong && p.ten_co_dau !== plant.ten_co_dau)
    .slice(0, 6);
  renderRelatedPlants(related);

  const floatBtn = document.getElementById('floating-wiki-btn');
  floatBtn.classList.add('visible');
  floatBtn.onclick = () => openWikiLightbox(plant);
}

function renderBookPages(plant, container) {
  const pages = [];
  for (let p = plant.page_start; p <= plant.page_end; p++) pages.push(p);
  if (pages.length === 0) pages.push(plant.page_start);

  function updatePage() {
    const pg = pages[STATE.detailBookPage];
    const navHtml = pages.length > 1 ? `
      <div class="page-navigator">
        <button class="page-nav-btn" id="prev-page-btn" ${STATE.detailBookPage === 0 ? 'disabled' : ''}>◀</button>
        <span class="page-indicator">Trang ${STATE.detailBookPage + 1} / ${pages.length} (Tr. sách ${pg})</span>
        <button class="page-nav-btn" id="next-page-btn" ${STATE.detailBookPage === pages.length - 1 ? 'disabled' : ''}>▶</button>
      </div>
    ` : `<p style="font-size:0.8rem;color:var(--text-light);margin-bottom:10px">Trang sách: ${pg}</p>`;

    container.innerHTML = navHtml + `
      <div class="page-container" id="page-img-container">
        <img class="book-page-img" src="${imgPath(pg)}" alt="Trang ${pg}"
          onerror="this.style.opacity='0.4';this.parentElement.insertAdjacentHTML('afterbegin','<p style=\\'text-align:center;padding:20px;color:var(--text-light);font-size:0.85rem\\'>📷 Hình ảnh trang ${pg} chưa có trong thư mục /images</p>')">
        <div id="page-floating-img-container"></div>
      </div>
    `;

    if (pages.length > 1) {
      container.querySelector('#prev-page-btn')?.addEventListener('click', () => {
        if (STATE.detailBookPage > 0) { STATE.detailBookPage--; updatePage(); }
      });
      container.querySelector('#next-page-btn')?.addEventListener('click', () => {
        if (STATE.detailBookPage < pages.length - 1) { STATE.detailBookPage++; updatePage(); }
      });
    }

    loadFloatingImg(STATE.detailPlant, document.getElementById('page-floating-img-container'));
  }

  updatePage();
}

async function loadFloatingImg(plant, container) {
  if (!container) return;
  try {
    const images = await fetchWikiImages(plant, 2);
    if (images.length === 0) return;
    const img = document.createElement('img');
    img.className = 'page-floating-img';
    img.src = images[0].src;
    img.alt = plant.ten_co_dau;
    img.title = `Ảnh thực tế: ${plant.ten_co_dau} — Click để xem thêm`;
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openWikiLightbox(plant);
    });
    container.appendChild(img);
  } catch {}
}

async function loadSidebarWikiImages(plant) {
  const container = document.getElementById('wiki-images-container');
  if (!container) return;
  try {
    const images = await fetchWikiImages(plant, 4);
    if (images.length === 0) {
      container.innerHTML = `<div class="wiki-error">🌿 Không tìm thấy hình ảnh trên Wikipedia</div>`;
      return;
    }
    container.innerHTML = `<div class="wiki-images-grid"></div>`;
    const grid = container.querySelector('.wiki-images-grid');
    images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'wiki-image-item';
      item.innerHTML = `
        <img src="${img.src}" alt="${plant.ten_co_dau}" loading="lazy">
        <div class="wiki-img-overlay">🔍</div>
      `;
      item.addEventListener('click', () => openWikiLightboxAtIndex(images, idx));
      grid.appendChild(item);
    });
  } catch {
    container.innerHTML = `<div class="wiki-error">Không thể tải hình ảnh</div>`;
  }
}

function renderRelatedPlants(plants) {
  const container = document.getElementById('related-plants-container');
  if (!container) return;
  if (plants.length === 0) {
    container.innerHTML = '<p style="font-size:0.82rem;color:var(--text-light)">Không có cây cùng chương</p>';
    return;
  }
  container.innerHTML = `<div class="related-plants">
    ${plants.map(p => `
      <div class="related-plant-item" data-key="${escapeAttr(p.ten_khong_dau)}">
        <div class="related-plant-icon">🌿</div>
        <div>
          <div class="related-name">${p.ten_co_dau}</div>
          <div style="font-size:0.72rem;color:var(--text-light);font-style:italic">${p.ten_khoa_hoc.substring(0, 40)}</div>
        </div>
      </div>
    `).join('')}
  </div>`;

  container.querySelectorAll('.related-plant-item').forEach(item => {
    item.addEventListener('click', () => {
      const plant = CAY_THUOC_DATA.find(p => p.ten_khong_dau === item.dataset.key);
      if (plant) navigate('detail', { plant });
    });
  });
}

// ===================== LIGHTBOX =====================
async function openWikiLightbox(plant) {
  const images = await fetchWikiImages(plant, 6);
  if (images.length === 0) {
    showToast('Không tìm thấy hình ảnh trên Wikipedia');
    return;
  }
  openWikiLightboxAtIndex(images, 0, plant.ten_co_dau);
}

function openWikiLightboxAtIndex(images, startIdx, title = '') {
  STATE.lightboxImages = images;
  STATE.lightboxIndex = startIdx;

  const overlay = document.getElementById('lightbox-overlay');
  overlay.classList.add('open');
  renderLightboxSlide();

  document.body.style.overflow = 'hidden';
}

function renderLightboxSlide() {
  const { lightboxImages: imgs, lightboxIndex: idx } = STATE;
  const img = imgs[idx];

  document.getElementById('lb-title').textContent = STATE.detailPlant?.ten_co_dau || '';
  document.getElementById('lb-img').src = img.src;
  document.getElementById('lb-caption').textContent = img.caption || '';
  document.getElementById('lb-counter').textContent = `${idx + 1} / ${imgs.length}`;
  document.getElementById('lb-prev').disabled = idx === 0;
  document.getElementById('lb-next').disabled = idx === imgs.length - 1;

  const dotsContainer = document.getElementById('lb-dots');
  dotsContainer.innerHTML = imgs.map((_, i) =>
    `<div class="lb-dot ${i === idx ? 'active' : ''}" data-i="${i}"></div>`
  ).join('');
  dotsContainer.querySelectorAll('.lb-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      STATE.lightboxIndex = parseInt(dot.dataset.i);
      renderLightboxSlide();
    });
  });
}

function closeLightbox() {
  document.getElementById('lightbox-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ===================== SEARCH =====================
let searchDebounce;
function handleSearchInput(q) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    if (!q.trim()) {
      document.getElementById('search-suggestions').classList.remove('open');
      return;
    }
    const results = CAY_THUOC_DATA
      .filter(p =>
        p.ten_co_dau.toLowerCase().includes(q.toLowerCase()) ||
        p.ten_khong_dau.toLowerCase().includes(q.toLowerCase()) ||
        p.ten_anh.toLowerCase().includes(q.toLowerCase()) ||
        p.ten_khoa_hoc.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 8);

    const dd = document.getElementById('search-suggestions');
    if (results.length === 0) { dd.classList.remove('open'); return; }

    dd.innerHTML = results.map(p => `
      <div class="suggestion-item" data-key="${escapeAttr(p.ten_khong_dau)}">
        <span class="s-name">${highlightMatch(p.ten_co_dau, q)}</span>
        <span class="s-sci">${p.ten_khoa_hoc}</span>
      </div>
    `).join('');
    dd.classList.add('open');

    dd.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const plant = CAY_THUOC_DATA.find(p => p.ten_khong_dau === item.dataset.key);
        if (plant) {
          dd.classList.remove('open');
          document.getElementById('header-search').value = '';
          navigate('detail', { plant });
        }
      });
    });
  }, 200);
}

function highlightMatch(text, q) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return text.substring(0, idx) +
    `<strong style="color:var(--gold-light)">${text.substring(idx, idx + q.length)}</strong>` +
    text.substring(idx + q.length);
}

// ===================== PAGINATION =====================
function renderPagination(totalPages, current, onPage) {
  const container = document.getElementById('catalog-pagination');
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - current) <= 2) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '←';
  prev.disabled = current === 1;
  prev.addEventListener('click', () => onPage(current - 1));
  container.appendChild(prev);

  pages.forEach(p => {
    const btn = document.createElement('button');
    if (p === '…') {
      btn.className = 'page-btn';
      btn.textContent = '…';
      btn.disabled = true;
    } else {
      btn.className = `page-btn ${p === current ? 'active' : ''}`;
      btn.textContent = p;
      btn.addEventListener('click', () => onPage(p));
    }
    container.appendChild(btn);
  });

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = '→';
  next.disabled = current === totalPages;
  next.addEventListener('click', () => onPage(current + 1));
  container.appendChild(next);
}

// ===================== UTILS =====================
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showToast(msg, duration = 2500) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ===================== VIETNAMESE IME SUPPORT =====================
const TELEX_MAP = {
  aa: 'â', ee: 'ê', oo: 'ô', ow: 'ơ', uw: 'ư', aw: 'ă',
  dd: 'đ',
  as: 'á', af: 'à', ar: 'ả', ax: 'ã', aj: 'ạ',
  âs: 'ấ', âf: 'ầ', âr: 'ẩ', âx: 'ẫ', âj: 'ậ',
  ăs: 'ắ', ăf: 'ằ', ăr: 'ẳ', ăx: 'ẵ', ăj: 'ặ',
  es: 'é', ef: 'è', er: 'ẻ', ex: 'ẽ', ej: 'ẹ',
  ês: 'ế', êf: 'ề', êr: 'ể', êx: 'ễ', êj: 'ệ',
  is: 'í', if: 'ì', ir: 'ỉ', ix: 'ĩ', ij: 'ị',
  os: 'ó', of: 'ò', or: 'ỏ', ox: 'õ', oj: 'ọ',
  ôs: 'ố', ôf: 'ồ', ôr: 'ổ', ôx: 'ỗ', ôj: 'ộ',
  ơs: 'ớ', ơf: 'ờ', ơr: 'ở', ơx: 'ỡ', ơj: 'ợ',
  us: 'ú', uf: 'ù', ur: 'ủ', ux: 'ũ', uj: 'ụ',
  ưs: 'ứ', ưf: 'ừ', ưr: 'ử', ưx: 'ữ', ưj: 'ự',
  ys: 'ý', yf: 'ỳ', yr: 'ỷ', yx: 'ỹ', yj: 'ỵ',
};

function applyTelex(input) {
  const val = input.value;
  const cursor = input.selectionStart;
  if (cursor < 2) return;
  const twoChar = val.slice(cursor - 2, cursor).toLowerCase();
  if (TELEX_MAP[twoChar]) {
    const replacement = TELEX_MAP[twoChar];
    const newVal = val.slice(0, cursor - 2) + replacement + val.slice(cursor);
    input.value = newVal;
    const newPos = cursor - 2 + replacement.length;
    input.setSelectionRange(newPos, newPos);
  }
}

function enableVietnameseInput(inputEl) {
  inputEl.addEventListener('keyup', e => {
    const skip = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Backspace','Delete','Tab','Enter','Escape'];
    if (!skip.includes(e.key)) applyTelex(inputEl);
  });
}

// ===================== DANH Y SLIDER (v2 — ảnh thật + nhiều câu nói) =====================
// Hàm lấy đường dẫn ảnh từ thư mục danh_y/
function dyPhoto(filename) {
  return `danh_y/${filename}`;
}

const DANH_Y_DATA = [
  // ═══════════════════════════════════════════════
  // HẢI THƯỢNG LÃN ÔNG — nhiều câu nói
  // ═══════════════════════════════════════════════
  {
    alias: 'Hải Thượng Lãn Ông',
    realname: 'Lê Hữu Trác · 1720–1791',
    role: 'Tổ ngành Y học cổ truyền Việt Nam',
    photo: dyPhoto('hai_thuong_lan_ong.jpg'),
    quoteTitle: '"Tám chữ vàng nghề y"',
    quoteBody: 'Nhân – Minh – Đức – Trí – Lượng – Thành – Khiêm – Cần. Tám đức tính người làm thuốc phải tu dưỡng suốt đời. Thầy thuốc giỏi phải có cả tài lẫn đức, xem bệnh nhân như người thân.',
    gradStart: '#8B0000', gradEnd: '#4a2000', hanzi: '海上懶翁',
  },
  {
    alias: 'Hải Thượng Lãn Ông',
    realname: 'Lê Hữu Trác · 1720–1791',
    role: 'Tổ ngành Y học cổ truyền Việt Nam',
    photo: dyPhoto('hai_thuong_lan_ong.jpg'),
    quoteTitle: '"Thầy thuốc như mẹ hiền"',
    quoteBody: 'Người thầy thuốc phải yêu thương bệnh nhân như yêu thương bản thân mình. Khi ngồi trước người bệnh, phải tập trung toàn tâm, không được xao lãng bởi bất kỳ điều gì khác.',
    gradStart: '#8B0000', gradEnd: '#4a2000', hanzi: '海上懶翁',
  },
  {
    alias: 'Hải Thượng Lãn Ông',
    realname: 'Lê Hữu Trác · 1720–1791',
    role: 'Tổ ngành Y học cổ truyền Việt Nam',
    photo: dyPhoto('hai_thuong_lan_ong.jpg'),
    quoteTitle: '"Học y là học đạo làm người"',
    quoteBody: 'Nghề y không chỉ là nghề kiếm sống mà là đạo làm người. Ai học y mà chỉ lo tư lợi thì chẳng khác kẻ cướp đoạt tính mạng người bệnh. Hãy lấy lương tâm làm kim chỉ nam.',
    gradStart: '#8B0000', gradEnd: '#4a2000', hanzi: '海上懶翁',
  },
  {
    alias: 'Hải Thượng Lãn Ông',
    realname: 'Lê Hữu Trác · 1720–1791',
    role: 'Tổ ngành Y học cổ truyền Việt Nam',
    photo: dyPhoto('hai_thuong_lan_ong.jpg'),
    quoteTitle: '"Thuốc Nam — kho báu của đất Việt"',
    quoteBody: 'Trên dải đất này, trời đã ban cho muôn loài cỏ cây chứa đựng sức mạnh chữa lành. Người thầy thuốc Việt nếu không biết dùng thuốc Nam thì chưa xứng gọi là thầy thuốc Việt.',
    gradStart: '#8B0000', gradEnd: '#4a2000', hanzi: '海上懶翁',
  },

  // ═══════════════════════════════════════════════
  // TUỆ TĨNH — nhiều câu nói
  // ═══════════════════════════════════════════════
  {
    alias: 'Tuệ Tĩnh',
    realname: 'Nguyễn Bá Tĩnh · Thế kỷ XIV',
    role: 'Ông tổ ngành thuốc Nam Việt Nam',
    photo: dyPhoto('tue_tinh.jpg'),
    quoteTitle: '"Nam dược trị Nam nhân"',
    quoteBody: 'Thuốc Nam chữa bệnh cho người Nam. Đất nước ta có sẵn cỏ cây, không cần lệ thuộc thuốc ngoại. Hãy tin vào những gì thiên nhiên ban tặng trên chính mảnh đất mình sống.',
    gradStart: '#1a4a2e', gradEnd: '#0a1a0e', hanzi: '慧靜',
  },
  {
    alias: 'Tuệ Tĩnh',
    realname: 'Nguyễn Bá Tĩnh · Thế kỷ XIV',
    role: 'Ông tổ ngành thuốc Nam Việt Nam',
    photo: dyPhoto('tue_tinh.jpg'),
    quoteTitle: '"Ăn uống là gốc của sức khỏe"',
    quoteBody: 'Bổ bằng thức ăn hơn bổ bằng thuốc. Người biết ăn uống đúng cách thì ít bệnh. Ngũ cốc, rau quả hàng ngày chính là vị thuốc trường sinh mà trời đất đã sắp sẵn.',
    gradStart: '#1a4a2e', gradEnd: '#0a1a0e', hanzi: '慧靜',
  },
  {
    alias: 'Tuệ Tĩnh',
    realname: 'Nguyễn Bá Tĩnh · Thế kỷ XIV',
    role: 'Ông tổ ngành thuốc Nam Việt Nam',
    photo: dyPhoto('tue_tinh.jpg'),
    quoteTitle: '"Phòng bệnh từ lối sống"',
    quoteBody: 'Bốn mùa thay đổi, con người phải thuận theo. Mùa hè tránh nóng, mùa đông tránh lạnh, tránh no quá đói quá. Giữ được sự điều hòa thì thân thể ít ốm đau.',
    gradStart: '#1a4a2e', gradEnd: '#0a1a0e', hanzi: '慧靜',
  },
  {
    alias: 'Tuệ Tĩnh',
    realname: 'Nguyễn Bá Tĩnh · Thế kỷ XIV',
    role: 'Ông tổ ngành thuốc Nam Việt Nam',
    photo: dyPhoto('tue_tinh.jpg'),
    quoteTitle: '"Vị thuốc quý ngay trước cửa"',
    quoteBody: 'Sài đất chữa ho, gừng chữa lạnh, tía tô giải cảm, nghệ lành vết thương. Kho thuốc quý nhất chính là vườn rau trước sân nhà — hãy biết dùng trước khi tìm đến nơi xa.',
    gradStart: '#1a4a2e', gradEnd: '#0a1a0e', hanzi: '慧靜',
  },

  // ═══════════════════════════════════════════════
  // HIPPOCRATES — nhiều câu nói
  // ═══════════════════════════════════════════════
  {
    alias: 'Hippocrates',
    realname: 'Hippocrates · 460–370 TCN',
    role: 'Cha đẻ của Y học phương Tây',
    photo: dyPhoto('Hippocrates.jpg'),
    quoteTitle: '"Primum non nocere"',
    quoteBody: 'Trước hết, đừng gây hại. Bổn phận đầu tiên của người thầy thuốc không phải chữa bệnh, mà là không làm tình trạng người bệnh trở nên tệ hơn.',
    gradStart: '#1a2a5e', gradEnd: '#0a0a2e', hanzi: 'Ἱπποκράτης', latinScript: true,
  },
  {
    alias: 'Hippocrates',
    realname: 'Hippocrates · 460–370 TCN',
    role: 'Cha đẻ của Y học phương Tây',
    photo: dyPhoto('Hippocrates.jpg'),
    quoteTitle: '"Thức ăn là thuốc của bạn"',
    quoteBody: 'Hãy để thức ăn là thuốc của bạn và thuốc là thức ăn của bạn. Thiên nhiên chữa lành, thầy thuốc chỉ là người dẫn đường. Cơ thể con người vốn dĩ có khả năng tự hồi phục kỳ diệu.',
    gradStart: '#1a2a5e', gradEnd: '#0a0a2e', hanzi: 'Ἱπποκράτης', latinScript: true,
  },
  {
    alias: 'Hippocrates',
    realname: 'Hippocrates · 460–370 TCN',
    role: 'Cha đẻ của Y học phương Tây',
    photo: dyPhoto('Hippocrates.jpg'),
    quoteTitle: '"Biết bệnh để chữa bệnh"',
    quoteBody: 'Không có bệnh, chỉ có người bệnh. Mỗi người là một cơ thể khác nhau — thầy thuốc giỏi không chữa bệnh mà chữa người. Hãy quan sát kỹ trước khi phán xét.',
    gradStart: '#1a2a5e', gradEnd: '#0a0a2e', hanzi: 'Ἱπποκράτης', latinScript: true,
  },
  {
    alias: 'Hippocrates',
    realname: 'Hippocrates · 460–370 TCN',
    role: 'Cha đẻ của Y học phương Tây',
    photo: dyPhoto('Hippocrates.jpg'),
    quoteTitle: '"Đi bộ là thuốc tốt nhất"',
    quoteBody: 'Đi bộ là bài thuốc tốt nhất của con người. Vận động điều độ, hít thở không khí trong lành và ngủ đủ giấc — ba điều này còn quý hơn mọi thứ thuốc trên đời.',
    gradStart: '#1a2a5e', gradEnd: '#0a0a2e', hanzi: 'Ἱπποκράτης', latinScript: true,
  },

  // ═══════════════════════════════════════════════
  // HOA ĐÀ — nhiều câu nói
  // ═══════════════════════════════════════════════
  {
    alias: 'Hoa Đà',
    realname: 'Hoa Đà · 140–208',
    role: 'Thần y Trung Hoa, người phát minh gây mê',
    photo: dyPhoto('Hoa_Da.jpg'),
    quoteTitle: '"Thượng y trị quốc"',
    quoteBody: 'Thượng y trị quốc, trung y trị nhân, hạ y trị bệnh. Thầy thuốc giỏi nhất không chữa bệnh có sẵn mà ngăn bệnh chưa sinh ra — đó mới là đỉnh cao của y thuật.',
    gradStart: '#3a1a5e', gradEnd: '#1a0a2e', hanzi: '華佗',
  },
  {
    alias: 'Hoa Đà',
    realname: 'Hoa Đà · 140–208',
    role: 'Thần y Trung Hoa, người phát minh gây mê',
    photo: dyPhoto('Hoa_Da.jpg'),
    quoteTitle: '"Vận động — bí quyết trường thọ"',
    quoteBody: 'Cây cối nhờ có gió lay mà không mục ruỗng, người nhờ có vận động mà khí huyết lưu thông. Ngũ cầm hí — năm động tác bắt chước thú vật — chính là liều thuốc trường sinh ta trao lại hậu thế.',
    gradStart: '#3a1a5e', gradEnd: '#1a0a2e', hanzi: '華佗',
  },
  {
    alias: 'Hoa Đà',
    realname: 'Hoa Đà · 140–208',
    role: 'Thần y Trung Hoa, người phát minh gây mê',
    photo: dyPhoto('Hoa_Da.jpg'),
    quoteTitle: '"Phẫu thuật là biện pháp cuối cùng"',
    quoteBody: 'Khi kim châm và thuốc thang không còn hiệu lực, dao mổ mới là giải pháp. Nhưng trước khi dùng dao, hãy thử hết mọi cách khác — bởi mỗi vết cắt đều để lại dấu vết mà không thể xóa nhòa.',
    gradStart: '#3a1a5e', gradEnd: '#1a0a2e', hanzi: '華佗',
  },
  {
    alias: 'Hoa Đà',
    realname: 'Hoa Đà · 140–208',
    role: 'Thần y Trung Hoa, người phát minh gây mê',
    photo: dyPhoto('Hoa_Da.jpg'),
    quoteTitle: '"Quan sát thiên nhiên để học y thuật"',
    quoteBody: 'Ta học y từ rừng xanh, từ loài thú, từ mùa hạn và mùa lũ. Thiên nhiên là người thầy vĩ đại nhất — cỏ cây vô tri vô giác mà chứa đựng sức mạnh chữa lành vô biên.',
    gradStart: '#3a1a5e', gradEnd: '#1a0a2e', hanzi: '華佗',
  },

  // ═══════════════════════════════════════════════
  // BIỂN THƯỚC — nhiều câu nói
  // ═══════════════════════════════════════════════
  {
    alias: 'Biển Thước',
    realname: 'Tần Việt Nhân · 407–310 TCN',
    role: 'Thần y huyền thoại thời Chiến Quốc',
    photo: dyPhoto('bien_thuoc.jpg'),
    quoteTitle: '"Phòng bệnh hơn chữa bệnh"',
    quoteBody: 'Bệnh chưa sinh mà đã trị được mới là thầy thuốc giỏi nhất. Anh ta của ta chữa bệnh trước khi có triệu chứng, nên không ai biết tài năng của anh — đó mới là bậc thần y.',
    gradStart: '#5e4a1a', gradEnd: '#2e1a0a', hanzi: '扁鵲',
  },
  {
    alias: 'Biển Thước',
    realname: 'Tần Việt Nhân · 407–310 TCN',
    role: 'Thần y huyền thoại thời Chiến Quốc',
    photo: dyPhoto('bien_thuoc.jpg'),
    quoteTitle: '"Sáu trường hợp không chữa được"',
    quoteBody: 'Người kiêu ngạo không nghe lời thầy thuốc; kẻ tham tiền hơn thân thể; người ăn uống không điều độ; khí huyết đã loạn; người quá suy kiệt; người tin thầy cúng hơn thầy thuốc — sáu loại này ta không thể chữa.',
    gradStart: '#5e4a1a', gradEnd: '#2e1a0a', hanzi: '扁鵲',
  },
  {
    alias: 'Biển Thước',
    realname: 'Tần Việt Nhân · 407–310 TCN',
    role: 'Thần y huyền thoại thời Chiến Quốc',
    photo: dyPhoto('bien_thuoc.jpg'),
    quoteTitle: '"Vọng – Văn – Vấn – Thiết"',
    quoteBody: 'Nhìn sắc mặt, nghe âm thanh, hỏi bệnh sử, bắt mạch — bốn phép chẩn đoán này là nền tảng của y thuật. Thầy thuốc dùng đủ bốn phép sẽ không bao giờ đi sai đường.',
    gradStart: '#5e4a1a', gradEnd: '#2e1a0a', hanzi: '扁鵲',
  },
  {
    alias: 'Biển Thước',
    realname: 'Tần Việt Nhân · 407–310 TCN',
    role: 'Thần y huyền thoại thời Chiến Quốc',
    photo: dyPhoto('bien_thuoc.jpg'),
    quoteTitle: '"Bệnh nằm ở tâm"',
    quoteBody: 'Nhiều căn bệnh khởi nguồn từ tâm trí trước khi lan ra thân xác. Lo âu sinh nhiệt, giận dữ tổn can, sợ hãi thương thận. Chữa được tâm bệnh thì thân bệnh tự khỏi phân nửa.',
    gradStart: '#5e4a1a', gradEnd: '#2e1a0a', hanzi: '扁鵲',
  },
];

const DY_DURATION = 6000;
let dyCurrentIndex = 0;
let dyAutoTimer = null;

// Build avatar: ưu tiên dùng ảnh thật, fallback về SVG minh họa
function buildDanyAvatar(person, personIndex) {
  if (person.photo) {
    return `<img src="${person.photo}" alt="${person.alias}"
      style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
      onerror="this.parentElement.innerHTML=buildDanyAvatarSVG_fallback(${personIndex})">`;
  }
  return buildDanyAvatarSVG(person, personIndex);
}

function buildDanyAvatarSVG(person, personIndex) {
  const isLatin = person.latinScript;
  const fontSize = isLatin ? '10' : '22';
  const uid = `dy_${personIndex}_${Date.now()}`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="dyg${uid}" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="${person.gradStart}"/>
        <stop offset="100%" stop-color="${person.gradEnd}"/>
      </radialGradient>
      <clipPath id="dyc${uid}"><circle cx="50" cy="50" r="50"/></clipPath>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#dyg${uid})"/>
    <ellipse cx="50" cy="82" rx="28" ry="22" fill="rgba(255,255,255,0.07)"/>
    <ellipse cx="50" cy="44" rx="16" ry="18" fill="rgba(255,255,255,0.12)"/>
    <ellipse cx="50" cy="28" rx="22" ry="6" fill="rgba(255,255,255,0.10)"/>
    <rect x="38" y="22" width="24" height="8" rx="2" fill="rgba(255,255,255,0.09)"/>
    <path d="M44 60 Q50 68 56 60" stroke="rgba(255,255,255,0.15)" stroke-width="2" fill="none"/>
    <text x="50" y="53" text-anchor="middle" dominant-baseline="middle"
      font-family="'Playfair Display', serif" font-size="${fontSize}"
      fill="rgba(255,255,255,0.45)" font-style="italic">${person.hanzi}</text>
    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(232,184,75,0.2)" stroke-width="1"/>
  </svg>`;
}

// Không có cột danh sách bên phải nữa — đã bỏ theo yêu cầu
function dyRenderDots() {
  const dots = document.getElementById('dy-dots');
  if (!dots) return;
  // Nhóm dot theo người (alias), không theo slide
  const aliases = [...new Set(DANH_Y_DATA.map(p => p.alias))];
  const currentAlias = DANH_Y_DATA[dyCurrentIndex].alias;
  dots.innerHTML = aliases.map((alias, i) => {
    const firstIdx = DANH_Y_DATA.findIndex(p => p.alias === alias);
    const isActive = alias === currentAlias;
    return `<div class="dy-dot ${isActive ? 'active' : ''}" data-dy-i="${firstIdx}"
      title="${alias}" style="--dy-duration:${DY_DURATION}ms"></div>`;
  }).join('');
  dots.querySelectorAll('.dy-dot').forEach(d => {
    d.addEventListener('click', () => dyGoTo(parseInt(d.dataset.dyI)));
  });
}

function dyUpdate(animate = true) {
  const person = DANH_Y_DATA[dyCurrentIndex];

  const label = document.getElementById('dy-label');
  if (label) label.textContent = `SLIDE ${String(dyCurrentIndex + 1).padStart(2,'0')} / ${DANH_Y_DATA.length}`;

  const slideInner = document.getElementById('dy-slide-inner');
  if (slideInner) {
    if (animate) {
      slideInner.classList.add('fade-out');
      setTimeout(() => {
        document.getElementById('dy-quote-title').textContent = person.quoteTitle;
        document.getElementById('dy-quote-body').textContent = person.quoteBody;
        slideInner.classList.remove('fade-out');
      }, 300);
    } else {
      document.getElementById('dy-quote-title').textContent = person.quoteTitle;
      document.getElementById('dy-quote-body').textContent = person.quoteBody;
    }
  }

  const avatarWrap = document.getElementById('dy-avatar-wrap');
  const personInfo = document.getElementById('dy-person-info');
  if (avatarWrap && animate) {
    avatarWrap.style.opacity = '0';
    personInfo.style.opacity = '0';
    setTimeout(() => {
      document.getElementById('dy-avatar').innerHTML = buildDanyAvatar(person, dyCurrentIndex);
      document.getElementById('dy-alias').textContent = person.alias;
      document.getElementById('dy-realname').textContent = person.realname;
      document.getElementById('dy-role').textContent = person.role;
      avatarWrap.style.transition = 'opacity 0.5s ease';
      personInfo.style.transition = 'opacity 0.5s ease';
      avatarWrap.style.opacity = '1';
      personInfo.style.opacity = '1';
    }, 250);
  } else if (avatarWrap) {
    document.getElementById('dy-avatar').innerHTML = buildDanyAvatar(person, dyCurrentIndex);
    document.getElementById('dy-alias').textContent = person.alias;
    document.getElementById('dy-realname').textContent = person.realname;
    document.getElementById('dy-role').textContent = person.role;
  }

  dyRenderDots();
  // Bỏ render cột danh sách bên phải
}

function dyGoTo(idx) {
  dyCurrentIndex = idx;
  dyUpdate(true);
  dyRestartTimer();
}

function dyRestartTimer() {
  clearInterval(dyAutoTimer);
  dyAutoTimer = setInterval(() => {
    dyCurrentIndex = (dyCurrentIndex + 1) % DANH_Y_DATA.length;
    dyUpdate(true);
  }, DY_DURATION);
}

function initDanhYSlider() {
  const section = document.getElementById('danh-y-section');
  if (!section) return;

  // Ẩn cột danh sách bên phải
  const listCol = document.getElementById('dy-list-col');
  if (listCol) listCol.style.display = 'none';

  dyUpdate(false);
  dyRestartTimer();

  // Swipe support (mobile)
  let touchStartX = 0;
  section.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  section.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) dyGoTo((dyCurrentIndex + 1) % DANH_Y_DATA.length);
      else dyGoTo((dyCurrentIndex - 1 + DANH_Y_DATA.length) % DANH_Y_DATA.length);
    }
  }, { passive: true });
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const p = tab.dataset.page;
      if (p) navigate(p);
    });
  });

  const searchInput = document.getElementById('header-search');
  enableVietnameseInput(searchInput);
  searchInput.addEventListener('input', e => handleSearchInput(e.target.value));
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('search-suggestions').classList.remove('open');
    }
  });

  document.getElementById('search-btn').addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) {
      STATE.searchQuery = q;
      STATE.catalogFilter = 'all';
      navigate('catalog');
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.header-search')) {
      document.getElementById('search-suggestions').classList.remove('open');
    }
  });

  const diseaseInput = document.getElementById('disease-input');
  enableVietnameseInput(diseaseInput);
  diseaseInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchDisease(e.target.value);
  });
  document.getElementById('btn-search-disease').addEventListener('click', () => {
    searchDisease(diseaseInput.value);
  });

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });
  document.getElementById('lb-prev').addEventListener('click', () => {
    if (STATE.lightboxIndex > 0) { STATE.lightboxIndex--; renderLightboxSlide(); }
  });
  document.getElementById('lb-next').addEventListener('click', () => {
    if (STATE.lightboxIndex < STATE.lightboxImages.length - 1) {
      STATE.lightboxIndex++; renderLightboxSlide();
    }
  });

  document.addEventListener('keydown', e => {
    const overlay = document.getElementById('lightbox-overlay');
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && STATE.lightboxIndex > 0) { STATE.lightboxIndex--; renderLightboxSlide(); }
    if (e.key === 'ArrowRight' && STATE.lightboxIndex < STATE.lightboxImages.length - 1) { STATE.lightboxIndex++; renderLightboxSlide(); }
  });

  navigate('home');
});