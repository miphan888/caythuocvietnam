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

// Get unique chapters
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

  // Try English name first, fall back to scientific name
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

      // Main page thumbnail
      if (page.thumbnail?.source) images.push({
        src: page.thumbnail.source,
        caption: page.title
      });

      // Try to get more from images list
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
    // Async load wiki thumb
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
  'kháng khuẩn', 'tiêu viêm', 'hạ sốt', 'ho', 'đau dạ dày',
  'huyết áp', 'tiểu đường', 'an thần', 'phong thấp', 'cầm máu',
  'lợi tiểu', 'bổ dưỡng', 'giảm đau', 'ung thư', 'gan mật'
];

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

function searchDisease(keyword) {
  if (!keyword.trim()) return;
  const kw = keyword.trim().toLowerCase();

  const results = CAY_THUOC_DATA.filter(plant => {
    const combined = (plant.tac_dung + ' ' + (plant.tac_dung_list || []).join(' ')).toLowerCase();
    return combined.includes(kw);
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
    const card = createDiseaseCard(plant, kw);
    list.appendChild(card);
    loadDiseaseCardImage(plant, card);
  });
}

function createDiseaseCard(plant, kw) {
  const card = document.createElement('div');
  card.className = 'disease-plant-card fade-in';

  // Matched effects
  const matched = (plant.tac_dung_list || [])
    .filter(t => t.toLowerCase().includes(kw))
    .slice(0, 3);
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
  el.innerHTML = ''; // Reset

  // Back button
  const back = document.createElement('button');
  back.className = 'detail-back';
  back.innerHTML = '← Quay lại';
  back.addEventListener('click', () => history.back() || navigate('catalog'));
  el.appendChild(back);

  // Layout
  const layout = document.createElement('div');
  layout.className = 'detail-layout';
  el.appendChild(layout);

  // Main column
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

  // Sidebar
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

  // Render book pages navigator
  renderBookPages(plant, document.getElementById('page-navigator-container'));

  // Load wiki images
  loadSidebarWikiImages(plant);

  // Load related plants
  const related = CAY_THUOC_DATA
    .filter(p => p.chuong === plant.chuong && p.ten_co_dau !== plant.ten_co_dau)
    .slice(0, 6);
  renderRelatedPlants(related);

  // Show floating wiki btn
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

    // Render floating image on book page
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

  // Dots
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

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const p = tab.dataset.page;
      if (p) navigate(p);
    });
  });

  // Header search
  const searchInput = document.getElementById('header-search');
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

  // Close search suggestions on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.header-search')) {
      document.getElementById('search-suggestions').classList.remove('open');
    }
  });

  // Disease search
  const diseaseInput = document.getElementById('disease-input');
  diseaseInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchDisease(e.target.value);
  });
  document.getElementById('btn-search-disease').addEventListener('click', () => {
    searchDisease(diseaseInput.value);
  });

  // Lightbox controls
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

  // Keyboard for lightbox
  document.addEventListener('keydown', e => {
    const overlay = document.getElementById('lightbox-overlay');
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && STATE.lightboxIndex > 0) { STATE.lightboxIndex--; renderLightboxSlide(); }
    if (e.key === 'ArrowRight' && STATE.lightboxIndex < STATE.lightboxImages.length - 1) { STATE.lightboxIndex++; renderLightboxSlide(); }
  });

  // Floating wiki button hidden when not on detail
  // (managed per navigate)

  // Initial render
  navigate('home');
});
