/* ══════════════════════════════════════════════
   INKWELL — Poetry Website Application Logic
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── STORAGE KEYS ───
  const STORAGE_POEMS = 'inkwell_poems';
  const STORAGE_THEME = 'inkwell_theme';
  const STORAGE_DRAFT = 'inkwell_draft';

  // ─── STATE ───
  let poems = [];
  let activeTagFilter = null;
  let currentSearch = '';
  let currentSort = 'newest';
  let editingPoemId = null;
  let deletingPoemId = null;

  // ─── DOM REFS ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    app: $('#app'),
    viewHome: $('#view-home'),
    viewPoem: $('#view-poem'),
    poemsGrid: $('#poems-grid'),
    emptyState: $('#empty-state'),

    // Header
    btnAdd: $('#btn-add'),
    btnTheme: $('#btn-theme'),
    btnRandom: $('#btn-random'),

    // Search & Sort
    searchInput: $('#search-input'),
    searchClear: $('#search-clear'),
    sortSelect: $('#sort-select'),
    activeTagBar: $('#active-tag-bar'),
    activeTagName: $('#active-tag-name'),
    clearTagFilter: $('#clear-tag-filter'),

    // Poem View
    poemTitle: $('#poem-title'),
    poemSubtitle: $('#poem-subtitle'),
    poemDate: $('#poem-date'),
    poemTags: $('#poem-tags'),
    poemContent: $('#poem-content'),
    poemLikeBtn: $('#poem-like-btn'),
    poemLikeCount: $('#poem-like-count'),
    poemEditBtn: $('#poem-edit-btn'),
    poemDeleteBtn: $('#poem-delete-btn'),
    btnBack: $('#btn-back'),

    // Modal
    modalOverlay: $('#modal-overlay'),
    modal: $('#modal'),
    modalTitle: $('#modal-title'),
    modalClose: $('#modal-close'),
    poemForm: $('#poem-form'),
    inputTitle: $('#input-title'),
    inputSubtitle: $('#input-subtitle'),
    inputContent: $('#input-content'),
    inputTags: $('#input-tags'),
    charCount: $('#char-count'),
    draftStatus: $('#draft-status'),
    btnCancel: $('#btn-cancel'),
    btnSubmit: $('#btn-submit'),

    // Confirm
    confirmOverlay: $('#confirm-overlay'),
    confirmCancel: $('#confirm-cancel'),
    confirmDelete: $('#confirm-delete'),

    // Toast
    toastContainer: $('#toast-container'),

    // Empty state add button
    emptyAddBtn: $('#empty-add-btn'),
  };

  // ═══════════════════ STORAGE ═══════════════════

  function loadPoems() {
    try {
      const raw = localStorage.getItem(STORAGE_POEMS);
      poems = raw ? JSON.parse(raw) : [];
    } catch {
      poems = [];
    }
  }

  function savePoems() {
    localStorage.setItem(STORAGE_POEMS, JSON.stringify(poems));
  }

  function loadTheme() {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_THEME, next);
  }

  function saveDraft() {
    const draft = {
      title: dom.inputTitle.value,
      subtitle: dom.inputSubtitle.value,
      content: dom.inputContent.value,
      tags: dom.inputTags.value,
    };
    localStorage.setItem(STORAGE_DRAFT, JSON.stringify(draft));
    dom.draftStatus.textContent = 'Draft saved';
    clearTimeout(saveDraft._timeout);
    saveDraft._timeout = setTimeout(() => {
      dom.draftStatus.textContent = '';
    }, 2000);
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_DRAFT);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_DRAFT);
    dom.draftStatus.textContent = '';
  }

  // ═══════════════════ HELPERS ═══════════════════

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function parseTags(tagString) {
    return tagString
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
  }

  function getPreviewLines(content, maxLines = 4) {
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    return lines.slice(0, maxLines).join('\n');
  }

  // Debounce
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ═══════════════════ ROUTING ═══════════════════

  function navigate(hash) {
    window.location.hash = hash;
  }

  function handleRoute() {
    const hash = window.location.hash || '#/';
    const parts = hash.slice(2).split('/'); // remove '#/'

    // Hide all views
    $$('.view').forEach((v) => v.classList.remove('active'));

    if (parts[0] === 'poem' && parts[1]) {
      showPoemView(parts[1]);
    } else if (parts[0] === 'add') {
      showHomeView();
      openModal();
    } else if (parts[0] === 'edit' && parts[1]) {
      showHomeView();
      openModal(parts[1]);
    } else {
      showHomeView();
    }
  }

  // ═══════════════════ HOME VIEW ═══════════════════

  function showHomeView() {
    dom.viewHome.classList.add('active');
    renderPoems();
  }

  function getFilteredPoems() {
    let filtered = [...poems];

    // Search filter
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(q))
      );
    }

    // Tag filter
    if (activeTagFilter) {
      filtered = filtered.filter(
        (p) => p.tags && p.tags.includes(activeTagFilter)
      );
    }

    // Sort
    switch (currentSort) {
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'most-liked':
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  }

  function renderPoems() {
    const filtered = getFilteredPoems();

    if (poems.length === 0) {
      dom.poemsGrid.innerHTML = '';
      dom.poemsGrid.classList.add('hidden');
      dom.emptyState.classList.remove('hidden');
      return;
    }

    dom.emptyState.classList.add('hidden');
    dom.poemsGrid.classList.remove('hidden');

    if (filtered.length === 0) {
      dom.poemsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; padding: var(--space-2xl) 0;">
          <h3 style="font-family: var(--font-serif); font-size: var(--font-size-xl); margin-bottom: var(--space-sm);">No matches found</h3>
          <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">Try a different search term or clear your filters.</p>
        </div>`;
      return;
    }

    dom.poemsGrid.innerHTML = filtered.map((poem, i) => {
      const preview = escapeHtml(getPreviewLines(poem.content));
      const tagsHtml = (poem.tags || [])
        .map((t) => `<span class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`)
        .join('');
      const hasLikes = (poem.likes || 0) > 0;

      return `
        <article class="poem-card" data-id="${poem.id}" style="animation-delay: ${i * 60}ms">
          <h3 class="poem-card-title">${escapeHtml(poem.title)}</h3>
          ${poem.subtitle ? `<p class="poem-card-subtitle">${escapeHtml(poem.subtitle)}</p>` : ''}
          <p class="poem-card-preview">${preview}</p>
          <div class="poem-card-footer">
            <div class="poem-card-tags">${tagsHtml}</div>
            <span class="poem-card-likes ${hasLikes ? 'has-likes' : ''}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              ${poem.likes || 0}
            </span>
          </div>
        </article>`;
    }).join('');

    // Card click handlers
    dom.poemsGrid.querySelectorAll('.poem-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking a tag
        if (e.target.classList.contains('tag')) {
          e.stopPropagation();
          setTagFilter(e.target.dataset.tag);
          return;
        }
        navigate(`#/poem/${card.dataset.id}`);
      });
    });
  }

  // ═══════════════════ POEM VIEW ═══════════════════

  function showPoemView(id) {
    const poem = poems.find((p) => p.id === id);
    if (!poem) {
      navigate('#/');
      return;
    }

    dom.viewPoem.classList.add('active');

    dom.poemTitle.textContent = poem.title;
    dom.poemSubtitle.textContent = poem.subtitle || '';
    dom.poemSubtitle.style.display = poem.subtitle ? 'block' : 'none';
    dom.poemDate.textContent = formatDate(poem.createdAt);
    dom.poemContent.textContent = poem.content;

    // Tags
    dom.poemTags.innerHTML = (poem.tags || [])
      .map((t) => `<span class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`)
      .join('');

    // Tags click handler in poem view
    dom.poemTags.querySelectorAll('.tag').forEach((tag) => {
      tag.addEventListener('click', () => {
        setTagFilter(tag.dataset.tag);
        navigate('#/');
      });
    });

    // Likes
    dom.poemLikeCount.textContent = poem.likes || 0;
    dom.poemLikeBtn.classList.toggle('liked', poem.liked || false);

    // Store current poem id for actions
    dom.poemLikeBtn.dataset.id = poem.id;
    dom.poemEditBtn.dataset.id = poem.id;
    dom.poemDeleteBtn.dataset.id = poem.id;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ═══════════════════ MODAL ═══════════════════

  function openModal(editId) {
    editingPoemId = editId || null;

    if (editingPoemId) {
      const poem = poems.find((p) => p.id === editingPoemId);
      if (!poem) return;
      dom.modalTitle.textContent = 'Edit Poem';
      dom.btnSubmit.textContent = 'Save Changes';
      dom.inputTitle.value = poem.title;
      dom.inputSubtitle.value = poem.subtitle || '';
      dom.inputContent.value = poem.content;
      dom.inputTags.value = (poem.tags || []).join(', ');
      updateCharCount();
    } else {
      dom.modalTitle.textContent = 'New Poem';
      dom.btnSubmit.textContent = 'Publish';
      // Try load draft
      const draft = loadDraft();
      if (draft) {
        dom.inputTitle.value = draft.title || '';
        dom.inputSubtitle.value = draft.subtitle || '';
        dom.inputContent.value = draft.content || '';
        dom.inputTags.value = draft.tags || '';
        if (draft.title || draft.content) {
          dom.draftStatus.textContent = 'Draft restored';
        }
      }
      updateCharCount();
    }

    dom.modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Focus first input after animation
    setTimeout(() => dom.inputTitle.focus(), 100);
  }

  function closeModal() {
    dom.modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    editingPoemId = null;
    dom.poemForm.reset();
    dom.charCount.textContent = '0';
    dom.draftStatus.textContent = '';

    // Reset URL if on /add or /edit
    const hash = window.location.hash;
    if (hash.startsWith('#/add') || hash.startsWith('#/edit')) {
      navigate('#/');
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const title = dom.inputTitle.value.trim();
    const content = dom.inputContent.value.trim();

    if (!title || !content) {
      if (!title) dom.inputTitle.focus();
      else dom.inputContent.focus();
      showToast('Please fill in the required fields.');
      return;
    }

    const subtitle = dom.inputSubtitle.value.trim();
    const tags = parseTags(dom.inputTags.value);

    if (editingPoemId) {
      // Update existing poem
      const poem = poems.find((p) => p.id === editingPoemId);
      if (poem) {
        poem.title = title;
        poem.subtitle = subtitle;
        poem.content = content;
        poem.tags = tags;
        poem.updatedAt = Date.now();
        savePoems();
        showToast('Poem updated.');
      }
    } else {
      // Create new poem
      const newPoem = {
        id: generateId(),
        title,
        subtitle,
        content,
        tags,
        likes: 0,
        liked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      poems.unshift(newPoem);
      savePoems();
      clearDraft();
      showToast('Poem published!');
    }

    closeModal();
    renderPoems();
  }

  // ═══════════════════ DELETE ═══════════════════

  function openConfirm(poemId) {
    deletingPoemId = poemId;
    dom.confirmOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeConfirm() {
    dom.confirmOverlay.classList.remove('open');
    document.body.style.overflow = '';
    deletingPoemId = null;
  }

  function confirmDeletePoem() {
    if (!deletingPoemId) return;
    poems = poems.filter((p) => p.id !== deletingPoemId);
    savePoems();
    closeConfirm();
    navigate('#/');
    renderPoems();
    showToast('Poem deleted.');
  }

  // ═══════════════════ LIKE ═══════════════════

  function toggleLike(poemId) {
    const poem = poems.find((p) => p.id === poemId);
    if (!poem) return;

    if (poem.liked) {
      poem.likes = Math.max(0, (poem.likes || 1) - 1);
      poem.liked = false;
    } else {
      poem.likes = (poem.likes || 0) + 1;
      poem.liked = true;
    }

    savePoems();

    // Update UI
    dom.poemLikeCount.textContent = poem.likes;
    dom.poemLikeBtn.classList.toggle('liked', poem.liked);

    // Pulse animation
    dom.poemLikeBtn.style.animation = 'none';
    dom.poemLikeBtn.offsetHeight; // force reflow
    dom.poemLikeBtn.style.animation = 'pulse 0.3s ease';
  }

  // ═══════════════════ SEARCH ═══════════════════

  function handleSearch() {
    currentSearch = dom.searchInput.value.trim();
    dom.searchClear.classList.toggle('visible', currentSearch.length > 0);
    renderPoems();
  }

  function clearSearch() {
    dom.searchInput.value = '';
    currentSearch = '';
    dom.searchClear.classList.remove('visible');
    renderPoems();
  }

  // ═══════════════════ TAG FILTER ═══════════════════

  function setTagFilter(tag) {
    if (activeTagFilter === tag) {
      clearTagFilter();
      return;
    }
    activeTagFilter = tag;
    dom.activeTagName.textContent = `#${tag}`;
    dom.activeTagBar.classList.remove('hidden');
    renderPoems();
  }

  function clearTagFilter() {
    activeTagFilter = null;
    dom.activeTagBar.classList.add('hidden');
    renderPoems();
  }

  // ═══════════════════ SORT ═══════════════════

  function handleSort() {
    currentSort = dom.sortSelect.value;
    renderPoems();
  }

  // ═══════════════════ RANDOM ═══════════════════

  function goToRandomPoem() {
    if (poems.length === 0) {
      showToast('No poems to show. Write one first!');
      return;
    }
    const randomIndex = Math.floor(Math.random() * poems.length);
    navigate(`#/poem/${poems[randomIndex].id}`);
  }

  // ═══════════════════ CHAR COUNTER ═══════════════════

  function updateCharCount() {
    dom.charCount.textContent = dom.inputContent.value.length;
  }

  // ═══════════════════ TOAST ═══════════════════

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 2500);
  }

  // ═══════════════════ EVENT LISTENERS ═══════════════════

  function bindEvents() {
    // Navigation
    window.addEventListener('hashchange', handleRoute);

    // Theme
    dom.btnTheme.addEventListener('click', toggleTheme);

    // Add poem buttons
    dom.btnAdd.addEventListener('click', () => navigate('#/add'));
    dom.emptyAddBtn.addEventListener('click', () => navigate('#/add'));

    // Random
    dom.btnRandom.addEventListener('click', goToRandomPoem);

    // Search
    dom.searchInput.addEventListener('input', debounce(handleSearch, 200));
    dom.searchClear.addEventListener('click', clearSearch);

    // Sort
    dom.sortSelect.addEventListener('change', handleSort);

    // Tag filter
    dom.clearTagFilter.addEventListener('click', clearTagFilter);

    // Back button
    dom.btnBack.addEventListener('click', () => navigate('#/'));

    // Poem actions
    dom.poemLikeBtn.addEventListener('click', () => {
      toggleLike(dom.poemLikeBtn.dataset.id);
    });

    dom.poemEditBtn.addEventListener('click', () => {
      navigate(`#/edit/${dom.poemEditBtn.dataset.id}`);
    });

    dom.poemDeleteBtn.addEventListener('click', () => {
      openConfirm(dom.poemDeleteBtn.dataset.id);
    });

    // Modal
    dom.modalClose.addEventListener('click', closeModal);
    dom.btnCancel.addEventListener('click', closeModal);
    dom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === dom.modalOverlay) closeModal();
    });

    // Form
    dom.poemForm.addEventListener('submit', handleFormSubmit);

    // Character counter
    dom.inputContent.addEventListener('input', () => {
      updateCharCount();
      // Auto-save draft (only for new poems)
      if (!editingPoemId) {
        debounce(saveDraft, 1000)();
      }
    });

    // Also auto-save on other fields
    dom.inputTitle.addEventListener('input', () => {
      if (!editingPoemId) debounce(saveDraft, 1000)();
    });
    dom.inputSubtitle.addEventListener('input', () => {
      if (!editingPoemId) debounce(saveDraft, 1000)();
    });
    dom.inputTags.addEventListener('input', () => {
      if (!editingPoemId) debounce(saveDraft, 1000)();
    });

    // Confirm dialog
    dom.confirmCancel.addEventListener('click', closeConfirm);
    dom.confirmDelete.addEventListener('click', confirmDeletePoem);
    dom.confirmOverlay.addEventListener('click', (e) => {
      if (e.target === dom.confirmOverlay) closeConfirm();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to close modals
      if (e.key === 'Escape') {
        if (dom.confirmOverlay.classList.contains('open')) {
          closeConfirm();
        } else if (dom.modalOverlay.classList.contains('open')) {
          closeModal();
        }
      }

      // Ctrl+N to add new poem
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('#/add');
      }
    });
  }

  // ═══════════════════ INIT ═══════════════════

  function init() {
    loadTheme();
    loadPoems();
    bindEvents();
    handleRoute();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
