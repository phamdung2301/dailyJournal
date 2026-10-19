// ============================================================
// Daily Journal Extension - options.js
// Full-screen View: Stats, Filters, Grid, Modal, i18n
// ============================================================

"use strict";

const DEFAULT_TOPICS_MAP = {
  "Hoc tap":    { vi: "Hoc tap",   en: "Learning",  ja: "Gakushu" },
  "Lap trinh":  { vi: "Lap trinh", en: "Coding",    ja: "Programming" },
  "Tieng Anh":  { vi: "Tieng Anh", en: "English",   ja: "Eigo" },
  "Tieng Nhat": { vi: "Tieng Nhat",en: "Japanese",  ja: "Nihongo" },
  "Cam xuc":    { vi: "Cam xuc",   en: "Emotions",  ja: "Kanjo" },
  "Cong viec":  { vi: "Cong viec", en: "Work",      ja: "Shigoto" },
};

const MOOD_EMOJIS = { great:"😄", good:"🙂", neutral:"😐", bad:"😔", terrible:"😢" };

// ===== i18n =====
const i18n = {
  vi: {
    appTitle: "Daily Journal",
    appSubtitle: "Nhat Ky Ca Nhan - Toan man hinh",
    autoRecorded: "Tu dong ghi nhan",
    statTotal: "Tong nhat ky",
    statToday: "Hom nay",
    statVocab: "Tu vung",
    statTopics: "Chu de",
    sidebarFilter: "Loc & Tim kiem",
    searchLabel: "Tim kiem noi dung",
    searchPlaceholder: "Nhap tu khoa...",
    filterTopicLabel: "Chu de",
    filterAll: "Tat ca",
    filterDateLabel: "Ngay",
    filterMoodLabel: "Tam trang",
    clearAllBtn: "Xoa tat ca bo loc",
    entries: "muc nhat ky",
    sortNewest: "Moi nhat",
    sortOldest: "Cu nhat",
    emptyState: "Chua co nhat ky nao.",
    deleteBtn: "Xoa",
    confirmDelete: "Ban co chac muon xoa nhat ky nay khong?",
    fromEntry: "Tu nhat ky:",
  },
  en: {
    appTitle: "Daily Journal",
    appSubtitle: "Personal Diary - Full Screen",
    autoRecorded: "Auto-recorded",
    statTotal: "Total entries",
    statToday: "Today",
    statVocab: "Vocabulary",
    statTopics: "Topics",
    sidebarFilter: "Filter & Search",
    searchLabel: "Search content",
    searchPlaceholder: "Enter keyword...",
    filterTopicLabel: "Topic",
    filterAll: "All",
    filterDateLabel: "Date",
    filterMoodLabel: "Mood",
    clearAllBtn: "Clear all filters",
    entries: "entries",
    sortNewest: "Newest",
    sortOldest: "Oldest",
    emptyState: "No entries yet.",
    deleteBtn: "Delete",
    confirmDelete: "Are you sure you want to delete this entry?",
    fromEntry: "From entry:",
  },
  ja: {
    appTitle: "Daily Journal",
    appSubtitle: "Kojin Nikki - Zengamen",
    autoRecorded: "Jido kiroku",
    statTotal: "Nikki goukei",
    statToday: "Kyo",
    statVocab: "Tango",
    statTopics: "Topikku",
    sidebarFilter: "Shibori & Kensaku",
    searchLabel: "Naiyou kensaku",
    searchPlaceholder: "Keyword...",
    filterTopicLabel: "Topikku",
    filterAll: "Subete",
    filterDateLabel: "Hi",
    filterMoodLabel: "Kibun",
    clearAllBtn: "Shibori wo kuria",
    entries: "ken no nikki",
    sortNewest: "Atarashii",
    sortOldest: "Furui",
    emptyState: "Nikki ga mada arimasen.",
    deleteBtn: "Sakujo",
    confirmDelete: "Kono nikki wo sakujo shimasuka?",
    fromEntry: "Nikki kara:",
  },
};

// ===== STATE =====
let state = {
  lang: "vi",
  entries: [],
  topics: [],
  filterTopic: "",
  filterDate: "",
  filterMood: "",
  searchQuery: "",
  sortOrder: "newest",
  currentEntryId: null,
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== MARKDOWN =====
function parseMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```([\w]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${langClass}>${code.trim()}</code></pre>`;
  });
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/\n/g, "<br />");
  html = html.replace(/<br \/>(<\/(h[1-3]|pre|ul|blockquote|li)>)/g, "$1");
  html = html.replace(/(<(h[1-3]|pre|ul|blockquote|li)[^>]*>)<br \/>/g, "$1");
  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== DATE HELPERS =====
function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}
function formatTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toDateInputVal(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

// ===== STORAGE =====
async function loadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["entries", "topics", "lang"], (result) => {
      state.entries = result.entries || [];
      state.lang = result.lang || "vi";
      const saved = result.topics || [];
      const defaultKeys = Object.keys(DEFAULT_TOPICS_MAP);
      const custom = saved.filter((t) => !defaultKeys.includes(t));
      state.topics = [...defaultKeys, ...custom];
      resolve();
    });
  });
}

async function saveEntries() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ entries: state.entries }, resolve);
  });
}

async function saveLang(lang) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ lang }, resolve);
  });
}

// ===== i18n =====
function getTopicLabel(key) {
  if (DEFAULT_TOPICS_MAP[key]) {
    return DEFAULT_TOPICS_MAP[key][state.lang] || DEFAULT_TOPICS_MAP[key]["vi"];
  }
  return key;
}

function applyI18n() {
  const t = i18n[state.lang];
  $$("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] !== undefined) el.textContent = t[key];
  });
  $$("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key] !== undefined) el.placeholder = t[key];
  });
  $$(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === state.lang);
  });
}

// ===== STATS =====
function updateStats() {
  $("statTotal").textContent = state.entries.length;
  $("statToday").textContent = state.entries.filter((e) => isToday(e.timestamp)).length;
  $("statVocab").textContent = state.entries.filter((e) => e.vocabEn || e.vocabJa).length;
  const uniqueTopics = new Set(state.entries.map((e) => e.topic).filter(Boolean));
  $("statTopics").textContent = uniqueTopics.size;
}

// ===== FILTERS =====
function filterAndSort() {
  let result = state.entries.filter((entry) => {
    const matchTopic = state.filterTopic ? entry.topic === state.filterTopic : true;
    const matchDate = state.filterDate ? toDateInputVal(entry.timestamp) === state.filterDate : true;
    const matchMood = state.filterMood ? entry.mood === state.filterMood : true;
    const matchSearch = state.searchQuery
      ? (entry.content || "").toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (entry.vocabEn || "").toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (entry.vocabJa || "").toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        getTopicLabel(entry.topic || "").toLowerCase().includes(state.searchQuery.toLowerCase())
      : true;
    return matchTopic && matchDate && matchMood && matchSearch;
  });

  result.sort((a, b) => {
    const diff = new Date(b.timestamp) - new Date(a.timestamp);
    return state.sortOrder === "newest" ? diff : -diff;
  });
  return result;
}

// ===== RENDER GRID =====
function renderGrid() {
  const grid = $("entriesGrid");
  const emptyState = $("emptyState");
  const cards = grid.querySelectorAll(".opt-entry-card");
  cards.forEach((c) => c.remove());

  const filtered = filterAndSort();
  $("filteredCount").textContent = filtered.length;

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  filtered.forEach((entry) => {
    const card = createCard(entry);
    grid.appendChild(card);
  });
}

function createCard(entry) {
  const card = document.createElement("div");
  card.className = "opt-entry-card";
  card.dataset.id = entry.id;

  const moodEmoji = entry.mood ? MOOD_EMOJIS[entry.mood] || "" : "";
  const topicLabel = getTopicLabel(entry.topic || "");
  const preview = (entry.content || "")
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/[#*`>_\-]/g, "")
    .slice(0, 200);

  let vocabHtml = "";
  if (entry.vocabEn || entry.vocabJa) {
    vocabHtml = `<div class="opt-card-vocab">`;
    if (entry.vocabEn) vocabHtml += `<span class="opt-vocab-chip en">🇺🇸 ${escapeHtml(entry.vocabEn.slice(0, 25))}</span>`;
    if (entry.vocabJa) vocabHtml += `<span class="opt-vocab-chip ja">🇯🇵 ${escapeHtml(entry.vocabJa.slice(0, 25))}</span>`;
    vocabHtml += `</div>`;
  }

  card.innerHTML = `
    <div class="opt-card-header">
      <span class="opt-topic-badge">${escapeHtml(topicLabel)}</span>
      <span class="opt-mood">${moodEmoji}</span>
      <span class="opt-card-date">${formatDate(entry.timestamp)} ${formatTime(entry.timestamp)}</span>
    </div>
    <div class="opt-card-content">${escapeHtml(preview)}${preview.length >= 200 ? "..." : ""}</div>
    ${vocabHtml}
  `;

  card.addEventListener("click", () => openModal(entry.id));
  return card;
}

// ===== TOPIC SELECT =====
function renderTopicSelect() {
  const sel = $("filterTopic");
  const prevVal = sel.value;
  while (sel.options.length > 1) sel.remove(1);
  state.topics.forEach((key) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = getTopicLabel(key);
    sel.appendChild(opt);
  });
  sel.value = prevVal;
}

// ===== MODAL =====
function openModal(entryId) {
  const entry = state.entries.find((e) => e.id === entryId);
  if (!entry) return;
  state.currentEntryId = entryId;

  $("modalTopic").textContent = getTopicLabel(entry.topic || "");
  $("modalMood").textContent = entry.mood ? MOOD_EMOJIS[entry.mood] : "";
  $("modalDate").textContent = `${formatDate(entry.timestamp)} ${formatTime(entry.timestamp)}`;
  $("modalContent").innerHTML = parseMarkdown(entry.content || "");

  const vocabDiv = $("modalVocab");
  vocabDiv.innerHTML = "";
  if (entry.vocabEn) {
    vocabDiv.innerHTML += `
      <div class="vocab-flashcard-full en">
        <span class="vfc-flag">🇺🇸</span>
        <div class="vfc-word">${escapeHtml(entry.vocabEn)}</div>
      </div>`;
  }
  if (entry.vocabJa) {
    vocabDiv.innerHTML += `
      <div class="vocab-flashcard-full ja">
        <span class="vfc-flag">🇯🇵</span>
        <div class="vfc-word">${escapeHtml(entry.vocabJa)}</div>
      </div>`;
  }

  $("modalOverlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  $("modalOverlay").classList.add("hidden");
  document.body.style.overflow = "";
  state.currentEntryId = null;
}

// ===== EVENTS =====
function initEvents() {
  // Lang
  $$(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.lang = btn.dataset.lang;
      await saveLang(state.lang);
      applyI18n();
      renderTopicSelect();
      renderGrid();
    });
  });

  // Search
  $("searchInput").addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderGrid();
  });

  // Topic filter
  $("filterTopic").addEventListener("change", (e) => {
    state.filterTopic = e.target.value;
    renderGrid();
  });

  // Date filter
  $("filterDate").addEventListener("change", (e) => {
    state.filterDate = e.target.value;
    renderGrid();
  });

  // Mood filter
  $$(".mood-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filterMood = btn.dataset.mood;
      $$(".mood-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderGrid();
    });
  });

  // Sort
  $("sortSelect").addEventListener("change", (e) => {
    state.sortOrder = e.target.value;
    renderGrid();
  });

  // Clear all
  $("clearAllFilters").addEventListener("click", () => {
    state.filterTopic = "";
    state.filterDate = "";
    state.filterMood = "";
    state.searchQuery = "";
    $("searchInput").value = "";
    $("filterTopic").value = "";
    $("filterDate").value = "";
    $$(".mood-filter-btn").forEach((b) => b.classList.remove("active"));
    renderGrid();
  });

  // Modal close
  $("modalClose").addEventListener("click", closeModal);
  $("modalOverlay").addEventListener("click", (e) => {
    if (e.target === $("modalOverlay")) closeModal();
  });

  // Delete
  $("deleteEntryBtn").addEventListener("click", async () => {
    const t = i18n[state.lang];
    if (!state.currentEntryId) return;
    if (confirm(t.confirmDelete)) {
      state.entries = state.entries.filter((e) => e.id !== state.currentEntryId);
      await saveEntries();
      closeModal();
      updateStats();
      renderGrid();
    }
  });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Listen for storage changes (from popup)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.entries) {
      state.entries = changes.entries.newValue || [];
      updateStats();
      renderGrid();
    }
  });
}

// ===== INIT =====
async function init() {
  await loadData();
  applyI18n();
  renderTopicSelect();
  updateStats();
  renderGrid();
  initEvents();
}

document.addEventListener("DOMContentLoaded", init);
