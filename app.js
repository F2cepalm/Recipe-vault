/* ════════════════════════════════════════
   Recipe Vault — PWA App
   ════════════════════════════════════════ */

const STORAGE_KEY = 'recipe-vault-data';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '📚' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'lunch', label: 'Lunch', emoji: '🥗' },
  { id: 'dinner', label: 'Dinner', emoji: '🍝' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
  { id: 'snack', label: 'Snack', emoji: '🥨' },
  { id: 'drink', label: 'Drink', emoji: '🍹' },
  { id: 'soup', label: 'Soup', emoji: '🍜' },
  { id: 'salad', label: 'Salad', emoji: '🥬' },
  { id: 'other', label: 'Other', emoji: '🧑‍🍳' },
];

const SAMPLE_RECIPES = [
  { id: uid(), title: 'Classic Carbonara', category: 'dinner', time: '25 min', servings: 2, ingredients: 'Spaghetti, Eggs, Pecorino Romano, Guanciale, Black pepper', steps: '1. Cook pasta al dente\n2. Fry guanciale until crispy\n3. Mix eggs with pecorino\n4. Toss hot pasta with guanciale off heat\n5. Add egg mixture, toss quickly\n6. Serve with extra pecorino and pepper', favorite: true, created: Date.now() },
  { id: uid(), title: 'Avocado Toast', category: 'breakfast', time: '10 min', servings: 1, ingredients: 'Sourdough bread, Avocado, Lemon juice, Chili flakes, Salt, Olive oil, Cherry tomatoes', steps: '1. Toast sourdough until golden\n2. Mash avocado with lemon and salt\n3. Spread on toast\n4. Top with tomatoes, chili flakes, olive oil', favorite: false, created: Date.now() - 100000 },
  { id: uid(), title: 'Mango Lassi', category: 'drink', time: '5 min', servings: 2, ingredients: 'Mango, Yogurt, Milk, Sugar, Cardamom', steps: '1. Blend mango, yogurt, milk, sugar\n2. Add a pinch of cardamom\n3. Blend until smooth\n4. Serve cold with ice', favorite: false, created: Date.now() - 200000 },
  { id: uid(), title: 'Tomato Basil Soup', category: 'soup', time: '35 min', servings: 4, ingredients: 'Canned tomatoes, Onion, Garlic, Basil, Cream, Olive oil, Salt, Pepper', steps: '1. Sauté onion and garlic in olive oil\n2. Add canned tomatoes, simmer 20 min\n3. Blend until smooth\n4. Stir in cream and fresh basil\n5. Season to taste', favorite: true, created: Date.now() - 300000 },
  { id: uid(), title: 'Chocolate Lava Cake', category: 'dessert', time: '20 min', servings: 2, ingredients: 'Dark chocolate, Butter, Eggs, Sugar, Flour, Vanilla extract', steps: '1. Melt chocolate and butter together\n2. Whisk eggs and sugar until fluffy\n3. Fold in chocolate mixture\n4. Add flour gently\n5. Pour into greased ramekins\n6. Bake at 220°C for 10-12 min', favorite: true, created: Date.now() - 400000 },
];

/* ─── State ─── */
let recipes = [];
let currentView = 'grid'; // grid | detail | form
let selectedRecipe = null;
let editingRecipe = null;
let activeCategory = 'all';
let searchQuery = '';
let showFavOnly = false;
let sortBy = 'newest';
let deferredInstallPrompt = null;

/* ─── Helpers ─── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function cardHue(title) {
  return ((title.charCodeAt(0) * 37 + title.length * 53) % 360);
}

/* ─── Storage ─── */
function loadRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveRecipes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch (e) { console.error('Save failed:', e); }
}

/* ─── Toast ─── */
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  t.style.animation = 'none';
  t.offsetHeight; // reflow
  t.style.animation = 'toastIn 0.3s ease-out';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.display = 'none'; }, 2200);
}

/* ─── Filtering & Sorting ─── */
function getFilteredRecipes() {
  let list = recipes;
  if (activeCategory !== 'all') list = list.filter(r => r.category === activeCategory);
  if (showFavOnly) list = list.filter(r => r.favorite);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.ingredients.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }
  if (sortBy === 'newest') list = [...list].sort((a, b) => b.created - a.created);
  else if (sortBy === 'alpha') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  else if (sortBy === 'time') list = [...list].sort((a, b) => parseInt(a.time || '999') - parseInt(b.time || '999'));
  return list;
}

/* ─── Render: Header ─── */
function renderHeader() {
  return `
    <header class="header">
      <div class="header-inner">
        <div class="logo-row">
          <span class="logo-icon">🍽️</span>
          <h1 class="logo-text">Recipe Vault</h1>
          <span class="badge">${recipes.length}</span>
        </div>
        <p class="tagline">Your personal cookbook, always with you</p>
      </div>
    </header>`;
}

/* ─── Render: Toolbar ─── */
function renderToolbar() {
  return `
    <div class="toolbar">
      <div class="search-wrap">
        <span class="search-icon">⌕</span>
        <input type="text" class="search-input" id="searchInput"
          placeholder="Search recipes or ingredients…"
          value="${esc(searchQuery)}" />
        ${searchQuery ? '<button class="clear-btn" id="clearSearch">✕</button>' : ''}
      </div>
      <div class="toolbar-actions">
        <button class="icon-btn ${showFavOnly ? 'active' : ''}" id="favToggle" title="Favorites">
          ${showFavOnly ? '★' : '☆'}
        </button>
        <select class="sort-select" id="sortSelect">
          <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="alpha" ${sortBy === 'alpha' ? 'selected' : ''}>A → Z</option>
          <option value="time" ${sortBy === 'time' ? 'selected' : ''}>Quickest</option>
        </select>
        <button class="add-btn" id="addBtn">+ Add</button>
      </div>
    </div>`;
}

/* ─── Render: Categories ─── */
function renderCategories() {
  return `
    <div class="cat-row">
      ${CATEGORIES.map(c => `
        <button class="cat-chip ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
          <span>${c.emoji}</span> ${c.label}
        </button>`).join('')}
    </div>`;
}

/* ─── Render: Grid ─── */
function renderGrid() {
  const filtered = getFilteredRecipes();
  if (filtered.length === 0) {
    return `
      <div class="content">
        <div class="empty">
          <span class="empty-icon">🔍</span>
          <p class="empty-text">No recipes found</p>
          <button class="empty-btn" id="clearFilters">Clear filters</button>
        </div>
      </div>`;
  }
  return `
    <div class="content">
      <div class="grid">
        ${filtered.map((r, i) => {
          const cat = CATEGORIES.find(c => c.id === r.category) || CATEGORIES[CATEGORIES.length - 1];
          const hue = cardHue(r.title);
          return `
            <div class="card card-anim" style="animation-delay:${i * 40}ms;background:linear-gradient(145deg,hsl(${hue},28%,97%) 0%,hsl(${hue},20%,93%) 100%)" data-id="${r.id}">
              <div class="card-top">
                <span class="card-emoji">${cat.emoji}</span>
                <button class="fav-btn ${r.favorite ? 'active' : ''}" data-fav="${r.id}">${r.favorite ? '★' : '☆'}</button>
              </div>
              <h3 class="card-title">${esc(r.title)}</h3>
              <div class="card-meta">
                <span class="meta-tag">⏱ ${esc(r.time)}</span>
                <span class="meta-tag">👤 ${r.servings}</span>
              </div>
              <p class="card-ingredients">${esc(r.ingredients.split(',').slice(0, 3).join(', '))}…</p>
            </div>`;
        }).join('')}
      </div>
      <div class="bottom-bar">
        <button class="bottom-btn" id="importBtn">📥 Import</button>
        <button class="bottom-btn" id="exportBtn">📤 Export</button>
        <button class="bottom-btn danger" id="resetBtn">🗑 Reset</button>
      </div>
    </div>`;
}

/* ─── Render: Detail ─── */
function renderDetail() {
  const r = selectedRecipe;
  if (!r) return '';
  const cat = CATEGORIES.find(c => c.id === r.category) || CATEGORIES[CATEGORIES.length - 1];
  const ingredients = r.ingredients.split(',').map(s => s.trim()).filter(Boolean);
  const steps = r.steps.split('\n').filter(Boolean);

  return `
    <div class="detail fade-in">
      <div class="detail-nav">
        <button class="back-btn" id="backBtn">← Back</button>
        <div class="detail-actions">
          <button class="detail-action-btn" id="detailFav" style="color:${r.favorite ? 'var(--accent)' : '#888'}">${r.favorite ? '★' : '☆'}</button>
          <button class="detail-action-btn" id="editBtn">✏️</button>
          <button class="detail-action-btn" id="deleteBtn" style="color:var(--danger)">🗑</button>
        </div>
      </div>
      <div class="detail-header">
        <span class="detail-emoji">${cat.emoji}</span>
        <h2 class="detail-title">${esc(r.title)}</h2>
        <div class="detail-meta">
          <span class="detail-chip">${cat.label}</span>
          <span class="detail-chip">⏱ ${esc(r.time)}</span>
          <span class="detail-chip">👤 ${r.servings} servings</span>
        </div>
      </div>
      <section class="section">
        <h4 class="section-title">Ingredients</h4>
        <ul class="ing-list">
          ${ingredients.map(ing => `<li class="ing-item"><span class="ing-dot">●</span>${esc(ing)}</li>`).join('')}
        </ul>
      </section>
      <section class="section">
        <h4 class="section-title">Steps</h4>
        <div class="steps-list">
          ${steps.map((s, i) => `
            <div class="step-row">
              <span class="step-num">${i + 1}</span>
              <p class="step-text">${esc(s.replace(/^\d+\.\s*/, ''))}</p>
            </div>`).join('')}
        </div>
      </section>
    </div>`;
}

/* ─── Render: Form ─── */
function renderForm() {
  const r = editingRecipe || {};
  const isEdit = !!editingRecipe;
  const catOptions = CATEGORIES.filter(c => c.id !== 'all')
    .map(c => `<option value="${c.id}" ${(r.category || 'dinner') === c.id ? 'selected' : ''}>${c.emoji} ${c.label}</option>`)
    .join('');

  return `
    <div class="form-view fade-in">
      <div class="form-header">
        <button class="back-btn" id="formCancel">← Cancel</button>
        <h3 class="form-title">${isEdit ? 'Edit Recipe' : 'New Recipe'}</h3>
      </div>
      <label class="form-label">Title *</label>
      <input class="form-input" id="fTitle" value="${esc(r.title || '')}" placeholder="e.g. Grandma's Pie" />
      <label class="form-label">Category</label>
      <select class="form-input" id="fCategory">${catOptions}</select>
      <div class="form-row">
        <div>
          <label class="form-label">Cook Time</label>
          <input class="form-input" id="fTime" value="${esc(r.time || '')}" placeholder="25 min" />
        </div>
        <div>
          <label class="form-label">Servings</label>
          <input type="number" min="1" class="form-input" id="fServings" value="${r.servings || 2}" />
        </div>
      </div>
      <label class="form-label">Ingredients (comma-separated)</label>
      <textarea class="form-input" id="fIngredients" placeholder="Flour, Sugar, Butter…">${esc(r.ingredients || '')}</textarea>
      <label class="form-label">Steps (one per line)</label>
      <textarea class="form-input tall" id="fSteps" placeholder="1. Preheat oven\n2. Mix dry ingredients\n3. …">${esc(r.steps || '')}</textarea>
      <button class="save-btn" id="saveBtn">${isEdit ? 'Update Recipe' : 'Save Recipe'}</button>
    </div>`;
}

/* ─── Full Render ─── */
function render() {
  const app = document.getElementById('app');
  let html = renderHeader();

  if (currentView === 'grid') {
    html += renderToolbar() + renderCategories() + renderGrid();
  } else if (currentView === 'detail') {
    html += renderDetail();
  } else if (currentView === 'form') {
    html += renderForm();
  }

  app.innerHTML = html;
  bindEvents();
}

/* ─── Event Binding ─── */
function bindEvents() {
  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => { searchQuery = e.target.value; render(); focusSearch(); });
  }
  const clearSearch = document.getElementById('clearSearch');
  if (clearSearch) clearSearch.addEventListener('click', () => { searchQuery = ''; render(); });

  // Favorites toggle
  const favToggle = document.getElementById('favToggle');
  if (favToggle) favToggle.addEventListener('click', () => { showFavOnly = !showFavOnly; render(); });

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.addEventListener('change', e => { sortBy = e.target.value; render(); });

  // Add button
  const addBtn = document.getElementById('addBtn');
  if (addBtn) addBtn.addEventListener('click', () => { editingRecipe = null; currentView = 'form'; render(); });

  // Category chips
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => { activeCategory = chip.dataset.cat; render(); });
  });

  // Cards — open detail
  document.querySelectorAll('.card[data-id]').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.fav-btn')) return;
      const r = recipes.find(x => x.id === card.dataset.id);
      if (r) { selectedRecipe = r; currentView = 'detail'; render(); }
    });
  });

  // Card fav buttons
  document.querySelectorAll('.fav-btn[data-fav]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFav(btn.dataset.fav);
    });
  });

  // Clear filters
  const clearFilters = document.getElementById('clearFilters');
  if (clearFilters) clearFilters.addEventListener('click', () => {
    searchQuery = ''; activeCategory = 'all'; showFavOnly = false; render();
  });

  // Bottom bar
  const importBtn = document.getElementById('importBtn');
  if (importBtn) importBtn.addEventListener('click', importRecipes);
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportRecipes);
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetAll);

  // Detail view
  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => { currentView = 'grid'; selectedRecipe = null; render(); });
  const detailFav = document.getElementById('detailFav');
  if (detailFav) detailFav.addEventListener('click', () => {
    toggleFav(selectedRecipe.id);
    selectedRecipe = recipes.find(r => r.id === selectedRecipe.id);
    render();
  });
  const editBtn = document.getElementById('editBtn');
  if (editBtn) editBtn.addEventListener('click', () => { editingRecipe = selectedRecipe; currentView = 'form'; render(); });
  const deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) deleteBtn.addEventListener('click', () => {
    if (confirm('Delete this recipe?')) {
      recipes = recipes.filter(r => r.id !== selectedRecipe.id);
      saveRecipes();
      currentView = 'grid'; selectedRecipe = null; render();
      showToast('Recipe deleted');
    }
  });

  // Form
  const formCancel = document.getElementById('formCancel');
  if (formCancel) formCancel.addEventListener('click', () => {
    currentView = editingRecipe ? 'detail' : 'grid';
    editingRecipe = null;
    render();
  });
  const saveFormBtn = document.getElementById('saveBtn');
  if (saveFormBtn) saveFormBtn.addEventListener('click', saveForm);
}

function focusSearch() {
  const s = document.getElementById('searchInput');
  if (s) { const len = s.value.length; s.focus(); s.setSelectionRange(len, len); }
}

/* ─── Actions ─── */
function toggleFav(id) {
  recipes = recipes.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r);
  saveRecipes();
  render();
}

function saveForm() {
  const title = document.getElementById('fTitle').value.trim();
  if (!title) { alert('Title is required'); return; }
  const data = {
    title,
    category: document.getElementById('fCategory').value,
    time: document.getElementById('fTime').value || '? min',
    servings: parseInt(document.getElementById('fServings').value) || 2,
    ingredients: document.getElementById('fIngredients').value,
    steps: document.getElementById('fSteps').value,
  };

  if (editingRecipe) {
    recipes = recipes.map(r => r.id === editingRecipe.id ? { ...r, ...data } : r);
    selectedRecipe = recipes.find(r => r.id === editingRecipe.id);
    showToast('Recipe updated ✓');
  } else {
    const newR = { ...data, id: uid(), favorite: false, created: Date.now() };
    recipes = [newR, ...recipes];
    showToast('Recipe added ✓');
  }
  saveRecipes();
  currentView = editingRecipe ? 'detail' : 'grid';
  editingRecipe = null;
  render();
}

function exportRecipes() {
  const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'my_recipes.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Exported ' + recipes.length + ' recipes');
}

function importRecipes() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const withIds = data.map(r => ({ ...r, id: r.id || uid(), created: r.created || Date.now() }));
        recipes = [...withIds, ...recipes];
        saveRecipes(); render();
        showToast('Imported ' + withIds.length + ' recipes');
      }
    } catch { showToast('Invalid file format'); }
  };
  input.click();
}

function resetAll() {
  if (confirm('Delete ALL recipes and start fresh?')) {
    localStorage.removeItem(STORAGE_KEY);
    recipes = [...SAMPLE_RECIPES];
    saveRecipes();
    activeCategory = 'all'; searchQuery = ''; showFavOnly = false;
    currentView = 'grid'; selectedRecipe = null; editingRecipe = null;
    render();
    showToast('Reset to defaults');
  }
}

/* ─── PWA Install ─── */
function showInstallBanner() {
  if (!deferredInstallPrompt) return;
  const existing = document.getElementById('installBanner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'installBanner';
  banner.className = 'install-banner';
  banner.innerHTML = `
    <p>📲 Install Recipe Vault for offline access</p>
    <div class="install-banner-actions">
      <button class="install-btn" id="installAccept">Install</button>
      <button class="dismiss-btn" id="installDismiss">Later</button>
    </div>`;
  document.body.appendChild(banner);

  document.getElementById('installAccept').addEventListener('click', async () => {
    banner.remove();
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;
      if (result.outcome === 'accepted') showToast('App installed! ✓');
      deferredInstallPrompt = null;
    }
  });
  document.getElementById('installDismiss').addEventListener('click', () => banner.remove());
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  const stored = loadRecipes();
  recipes = stored && stored.length > 0 ? stored : [...SAMPLE_RECIPES];
  saveRecipes();
  render();
});

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// PWA install prompt
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  setTimeout(showInstallBanner, 2000);
});
