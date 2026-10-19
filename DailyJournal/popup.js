// ============================================================
// Daily Journal Extension - popup.js
// Main Logic: i18n, Storage, UI, Markdown, Filters, Modal
// ============================================================

"use strict";

// ===== CONSTANTS =====
const DEFAULT_TOPICS = ["Hoc tap", "Lap trinh", "Tieng Anh", "Tieng Nhat", "Cam xuc", "Cong viec"];
const DEFAULT_TOPICS_MAP = {
  "Hoc tap":    { vi: "Học tập",   en: "Learning",  ja: "学習" },
  "Lap trinh":  { vi: "Lập trình", en: "Coding",    ja: "プログラミング" },
  "Tieng Anh":  { vi: "Tiếng Anh", en: "English",   ja: "英語" },
  "Tieng Nhat": { vi: "Tiếng Nhật",en: "Japanese",  ja: "日本語" },
  "Cam xuc":    { vi: "Cảm xúc",   en: "Emotions",  ja: "感情" },
  "Cong viec":  { vi: "Công việc", en: "Work",      ja: "仕事" },
};

const MOOD_EMOJIS = {
  great: "😄",
  good: "🙂",
  neutral: "😐",
  bad: "😔",
  terrible: "😢",
};

// ===== i18n DATA =====
const i18n = {
  vi: {
    appTitle: "Daily Journal",
    appSubtitle: "Nhật Ký Cá Nhân",
    autoRecorded: "Tự động ghi nhận",
    tabWrite: "✏️ Viết",
    tabList: "📚 Nhật ký",
    tabVocab: "🗂️ Từ vựng",
    labelTopic: "🏷️ Chủ đề",
    addTopicBtn: "+ Thêm chủ đề",
    labelContent: "📝 Nội dung",
    contentPlaceholder: "Hôm nay bạn đã làm gì?\n\nBạn có thể dùng Markdown:\n**in đậm**, `code`, ```khối code```",
    vocabToggle: "🌍 Từ vựng hôm nay",
    vocabEnPlaceholder: "English word & meaning...",
    vocabJaPlaceholder: "日本語の単語・意味...",
    labelMood: "😊 Tâm trạng",
    saveBtn: "Lưu nhật ký",
    saveSuccess: "Đã lưu nhật ký thành công!",
    searchPlaceholder: "🔍 Tìm kiếm...",
    filterAll: "Tất cả",
    clearFilter: "✕ Xóa lọc",
    entries: "mục nhật ký",
    emptyState: "Chưa có nhật ký nào. Hãy bắt đầu viết!",
    vocabTitle: "🗂️ Bộ sưu tập từ vựng",
    vocabDesc: "Tất cả từ vựng bạn đã ghi lại",
    deleteBtn: "🗑️ Xóa",
    confirmDelete: "Bạn có chắc muốn xóa nhật ký này không?",
    noTopicError: "Vui lòng chọn một chủ đề!",
    noContentError: "Vui lòng nhập nội dung nhật ký!",
    openFullscreen: "Mở rộng toàn màn hình",
    fromEntry: "Từ nhật ký:",
    noVocab: "Chưa có từ vựng nào.",
  },
  en: {
    appTitle: "Daily Journal",
    appSubtitle: "Personal Diary",
    autoRecorded: "Auto-recorded",
    tabWrite: "✏️ Write",
    tabList: "📚 Journal",
    tabVocab: "🗂️ Vocab",
    labelTopic: "🏷️ Topic",
    addTopicBtn: "+ Add topic",
    labelContent: "📝 Content",
    contentPlaceholder: "What did you do today?\n\nMarkdown supported:\n**bold**, `code`, ```code block```",
    vocabToggle: "🌍 Today's vocabulary",
    vocabEnPlaceholder: "English word & meaning...",
    vocabJaPlaceholder: "Japanese word & meaning...",
    labelMood: "😊 Mood",
    saveBtn: "Save entry",
    saveSuccess: "Journal entry saved!",
    searchPlaceholder: "🔍 Search...",
    filterAll: "All",
    clearFilter: "✕ Clear",
    entries: "entries",
    emptyState: "No entries yet. Start writing!",
    vocabTitle: "🗂️ Vocabulary Collection",
    vocabDesc: "All vocabulary you have noted",
    deleteBtn: "🗑️ Delete",
    confirmDelete: "Are you sure you want to delete this entry?",
    noTopicError: "Please select a topic!",
    noContentError: "Please enter journal content!",
    openFullscreen: "Open fullscreen",
    fromEntry: "From entry:",
    noVocab: "No vocabulary yet.",
  },
  ja: {
    appTitle: "デイリージャーナル",
    appSubtitle: "個人日記",
    autoRecorded: "自動記録",
    tabWrite: "✏️ 書く",
    tabList: "📚 日記",
    tabVocab: "🗂️ 単語",
    labelTopic: "🏷️ トピック",
    addTopicBtn: "+ トピック追加",
    labelContent: "📝 内容",
    contentPlaceholder: "今日は何をしましたか？\n\nMarkdown対応:\n**太字**, `コード`, ```コードブロック```",
    vocabToggle: "🌍 今日の単語",
    vocabEnPlaceholder: "英語の単語・意味...",
    vocabJaPlaceholder: "日本語の単語・意味...",
    labelMood: "😊 気分",
    saveBtn: "保存する",
    saveSuccess: "日記を保存しました！",
    searchPlaceholder: "🔍 検索...",
    filterAll: "すべて",
    clearFilter: "✕ クリア",
    entries: "件の日記",
    emptyState: "日記がまだありません。書き始めましょう！",
    vocabTitle: "🗂️ 単語コレクション",
    vocabDesc: "記録した全ての単語",
    deleteBtn: "🗑️ 削除",
    confirmDelete: "この日記を削除しますか？",
    noTopicError: "トピックを選択してください！",
    noContentError: "内容を入力してください！",
    openFullscreen: "全画面で開く",
    fromEntry: "日記から:",
    noVocab: "単語がまだありません。",
  },
};

// ===== STATE =====
let state = {
  lang: "vi",
  topics: [],
  selectedTopic: null,
  selectedMood: null,
  entries: [],
  currentEntryId: null,
  filterTopic: "",
  filterDate: "",
  searchQuery: "",
};

// ===== DOM REFS =====
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== MARKDOWN PARSER (Lightweight) =====
function parseMarkdown(text) {
  if (!text) return "";
  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```)
  html = html.replace(/```([\w]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${langClass}>${code.trim()}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic (*text*)
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Blockquote
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered list
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");

  // Line breaks (preserve newlines outside of block elements)
  html = html.replace(/\n/g, "<br />");

  // Clean up extra breaks inside block elements
  html = html.replace(/<br \/>(<\/(h[1-3]|pre|ul|blockquote|li)>)/g, "$1");
  html = html.replace(/(<(h[1-3]|pre|ul|blockquote|li)[^>]*>)<br \/>/g, "$1");

  return html;
}

// ===== DATETIME =====
function formatDateTime(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const engDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const jaDays = ["日", "月", "火", "水", "木", "金", "土"];
  let dayName;
  if (state.lang === "vi") dayName = days[d.getDay()];
  else if (state.lang === "ja") dayName = jaDays[d.getDay()];
  else dayName = engDays[d.getDay()];

  return `${dayName}, ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateShort(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}

function formatTimeShort(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function startClock() {
  const update = () => {
    $("currentDateTime").textContent = formatDateTime(new Date());
  };
  update();
  setInterval(update, 1000);
}

// ===== STORAGE =====
async function loadFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["entries", "topics", "lang"], (result) => {
      state.entries = result.entries || [];
      state.lang = result.lang || "vi";
      const saved = result.topics || [];
      // Merge default keys (preserving custom topics)
      const defaultKeys = Object.keys(DEFAULT_TOPICS_MAP);
      const customTopics = saved.filter((t) => !defaultKeys.includes(t));
      state.topics = [...defaultKeys, ...customTopics];
      resolve();
    });
  });
}

async function saveEntriesToStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ entries: state.entries }, resolve);
  });
}

async function saveTopicsToStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ topics: state.topics }, resolve);
  });
}

async function saveLangToStorage(lang) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ lang }, resolve);
  });
}

// ===== i18n APPLY =====
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
  // Lang buttons
  $$(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === state.lang);
  });
  // Refresh clock format
  startClock();
}

// ===== TOPIC CHIPS =====
function getTopicLabel(key) {
  if (DEFAULT_TOPICS_MAP[key]) {
    return DEFAULT_TOPICS_MAP[key][state.lang] || DEFAULT_TOPICS_MAP[key]["vi"];
  }
  return key; // custom topics: use as-is
}

function renderTopicChips() {
  const container = $("topicChips");
  container.innerHTML = "";
  state.topics.forEach((key) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "topic-chip" + (state.selectedTopic === key ? " selected" : "");
    chip.textContent = getTopicLabel(key);
    chip.dataset.key = key;
    chip.addEventListener("click", () => {
      state.selectedTopic = state.selectedTopic === key ? null : key;
      renderTopicChips();
    });
    container.appendChild(chip);
  });
}

function renderFilterTopicSelect() {
  const sel = $("filterTopic");
  const prevVal = sel.value;
  // Remove all options except first (All)
  while (sel.options.length > 1) sel.remove(1);
  state.topics.forEach((key) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = getTopicLabel(key);
    sel.appendChild(opt);
  });
  sel.value = prevVal;
}

// ===== JOURNAL LIST =====
function filterEntries() {
  return state.entries.filter((entry) => {
    const matchTopic = state.filterTopic ? entry.topic === state.filterTopic : true;
    const matchDate = state.filterDate ? toDateInputValue(entry.timestamp) === state.filterDate : true;
    const matchSearch = state.searchQuery
      ? (entry.content || "").toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (entry.vocabEn || "").toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (entry.vocabJa || "").toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        getTopicLabel(entry.topic || "").toLowerCase().includes(state.searchQuery.toLowerCase())
      : true;
    return matchTopic && matchDate && matchSearch;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function renderJournalList() {
  const list = $("journalList");
  const filtered = filterEntries();
  $("entryCount").textContent = filtered.length;

  // Remove existing cards (keep empty state)
  const existingCards = list.querySelectorAll(".entry-card");
  existingCards.forEach((c) => c.remove());

  const emptyState = $("emptyState");

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  filtered.forEach((entry) => {
    const card = createEntryCard(entry);
    list.appendChild(card);
  });
}

function createEntryCard(entry) {
  const card = document.createElement("div");
  card.className = "entry-card";
  card.dataset.id = entry.id;

  const moodEmoji = entry.mood ? MOOD_EMOJIS[entry.mood] || "" : "";
  const topicLabel = getTopicLabel(entry.topic || "");
  const preview = (entry.content || "").replace(/```[\s\S]*?```/g, "[code]").replace(/[#*`>_\-]/g, "").slice(0, 100);

  let vocabHtml = "";
  if (entry.vocabEn || entry.vocabJa) {
    vocabHtml = `<div class="entry-vocab-preview">`;
    if (entry.vocabEn) vocabHtml += `<span class="mini-badge en">🇺🇸 ${escapeHtml(entry.vocabEn.slice(0, 20))}</span>`;
    if (entry.vocabJa) vocabHtml += `<span class="mini-badge ja">🇯🇵 ${escapeHtml(entry.vocabJa.slice(0, 20))}</span>`;
    vocabHtml += `</div>`;
  }

  card.innerHTML = `
    <div class="entry-card-header">
      <span class="entry-topic-badge">${escapeHtml(topicLabel)}</span>
      <span class="entry-mood-badge">${moodEmoji}</span>
      <span class="entry-date">${formatDateShort(entry.timestamp)} ${formatTimeShort(entry.timestamp)}</span>
    </div>
    <div class="entry-preview">${escapeHtml(preview)}${preview.length >= 100 ? "..." : ""}</div>
    ${vocabHtml}
  `;

  card.addEventListener("click", () => openModal(entry.id));
  return card;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== MODAL =====
function openModal(entryId) {
  const entry = state.entries.find((e) => e.id === entryId);
  if (!entry) return;
  state.currentEntryId = entryId;

  $("modalTopic").textContent = getTopicLabel(entry.topic || "");
  $("modalMood").textContent = entry.mood ? MOOD_EMOJIS[entry.mood] : "";
  $("modalDate").textContent = `${formatDateShort(entry.timestamp)} ${formatTimeShort(entry.timestamp)}`;
  $("modalContent").innerHTML = parseMarkdown(entry.content || "");

  // Vocab flashcards in modal
  const vocabDiv = $("modalVocab");
  vocabDiv.innerHTML = "";
  if (entry.vocabEn) {
    vocabDiv.innerHTML += `
      <div class="vocab-flashcard-mini en">
        <span class="vfc-flag">🇺🇸</span>
        <div class="vfc-word">${escapeHtml(entry.vocabEn)}</div>
      </div>`;
  }
  if (entry.vocabJa) {
    vocabDiv.innerHTML += `
      <div class="vocab-flashcard-mini ja">
        <span class="vfc-flag">🇯🇵</span>
        <div class="vfc-word">${escapeHtml(entry.vocabJa)}</div>
      </div>`;
  }

  $("modalOverlay").classList.remove("hidden");
}

function closeModal() {
  $("modalOverlay").classList.add("hidden");
  state.currentEntryId = null;
}

// ===== VOCAB TAB =====
function renderVocabTab() {
  const enList = $("vocabListEn");
  const jaList = $("vocabListJa");
  enList.innerHTML = "";
  jaList.innerHTML = "";

  const t = i18n[state.lang];

  const entriesWithVocab = [...state.entries]
    .filter((e) => e.vocabEn || e.vocabJa)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (entriesWithVocab.length === 0) {
    enList.innerHTML = `<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">${t.noVocab}</p>`;
    jaList.innerHTML = `<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">${t.noVocab}</p>`;
    return;
  }

  const enEntries = entriesWithVocab.filter((e) => e.vocabEn);
  const jaEntries = entriesWithVocab.filter((e) => e.vocabJa);

  if (enEntries.length === 0) {
    enList.innerHTML = `<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">${t.noVocab}</p>`;
  } else {
    enEntries.forEach((entry) => {
      const card = document.createElement("div");
      card.className = "flashcard";
      card.innerHTML = `
        <div class="flashcard-word">🇺🇸 ${escapeHtml(entry.vocabEn)}</div>
        <div class="flashcard-date">${formatDateShort(entry.timestamp)}</div>
        <div class="flashcard-source">${t.fromEntry} ${escapeHtml(getTopicLabel(entry.topic || ""))}</div>
      `;
      card.addEventListener("click", () => openModal(entry.id));
      enList.appendChild(card);
    });
  }

  if (jaEntries.length === 0) {
    jaList.innerHTML = `<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">${t.noVocab}</p>`;
  } else {
    jaEntries.forEach((entry) => {
      const card = document.createElement("div");
      card.className = "flashcard";
      card.innerHTML = `
        <div class="flashcard-word">🇯🇵 ${escapeHtml(entry.vocabJa)}</div>
        <div class="flashcard-date">${formatDateShort(entry.timestamp)}</div>
        <div class="flashcard-source">${t.fromEntry} ${escapeHtml(getTopicLabel(entry.topic || ""))}</div>
      `;
      card.addEventListener("click", () => openModal(entry.id));
      jaList.appendChild(card);
    });
  }
}

// ===== SAVE ENTRY =====
async function saveEntry(e) {
  e.preventDefault();
  const t = i18n[state.lang];
  const content = $("journalContent").value.trim();

  // Validation
  if (!state.selectedTopic) {
    showError("topicError", t.noTopicError);
    return;
  }
  if (!content) {
    showError("contentError", t.noContentError);
    return;
  }

  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    topic: state.selectedTopic,
    mood: state.selectedMood,
    content,
    vocabEn: $("vocabEn").value.trim(),
    vocabJa: $("vocabJa").value.trim(),
  };

  state.entries.push(entry);
  await saveEntriesToStorage();

  // Reset form
  $("journalContent").value = "";
  $("charCount").textContent = "0";
  $("vocabEn").value = "";
  $("vocabJa").value = "";
  state.selectedTopic = null;
  state.selectedMood = null;
  renderTopicChips();
  $$(".mood-btn").forEach((btn) => btn.classList.remove("selected"));

  // Close vocab section
  $("vocabInputs").classList.add("hidden");
  $("vocabToggle").classList.remove("open");

  showToast();
}

function showError(id, msg) {
  // Remove existing
  const existing = $(id);
  if (existing) existing.remove();
  const err = document.createElement("p");
  err.id = id;
  err.className = "error-msg";
  err.textContent = msg;
  if (id === "topicError") {
    $("topicChips").after(err);
  } else {
    $("journalContent").after(err);
  }
  setTimeout(() => { const el = $(id); if (el) el.remove(); }, 3000);
}

function showToast() {
  const toast = $("toast");
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
  // Language
  $$(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.lang = btn.dataset.lang;
      await saveLangToStorage(state.lang);
      applyI18n();
      renderTopicChips();
      renderFilterTopicSelect();
      renderJournalList();
      renderVocabTab();
    });
  });

  // Tabs
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      $$(".tab-btn").forEach((b) => b.classList.remove("active"));
      $$(".tab-content").forEach((c) => { c.classList.add("hidden"); c.classList.remove("active"); });
      btn.classList.add("active");
      $(`tab-${tab}`).classList.remove("hidden");
      $(`tab-${tab}`).classList.add("active");
      if (tab === "list") {
        renderFilterTopicSelect();
        renderJournalList();
      }
      if (tab === "vocab") renderVocabTab();
    });
  });

  // Mood
  $$(".mood-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mood = btn.dataset.mood;
      state.selectedMood = state.selectedMood === mood ? null : mood;
      $$(".mood-btn").forEach((b) => b.classList.toggle("selected", b.dataset.mood === state.selectedMood));
    });
  });

  // Char counter
  $("journalContent").addEventListener("input", (e) => {
    const len = e.target.value.length;
    $("charCount").textContent = len;
    if (len > 2700) {
      $("charCount").style.color = "var(--accent2)";
    } else {
      $("charCount").style.color = "";
    }
  });

  // Vocab toggle
  $("vocabToggle").addEventListener("click", () => {
    const inputs = $("vocabInputs");
    const toggle = $("vocabToggle");
    inputs.classList.toggle("hidden");
    toggle.classList.toggle("open");
  });

  // Add topic
  $("addTopicBtn").addEventListener("click", () => {
    $("addTopicForm").classList.remove("hidden");
    $("newTopicInput").focus();
  });

  $("cancelAddTopic").addEventListener("click", () => {
    $("addTopicForm").classList.add("hidden");
    $("newTopicInput").value = "";
  });

  $("confirmAddTopic").addEventListener("click", async () => {
    const val = $("newTopicInput").value.trim();
    if (val && !state.topics.includes(val)) {
      state.topics.push(val);
      await saveTopicsToStorage();
      renderTopicChips();
      renderFilterTopicSelect();
    }
    $("addTopicForm").classList.add("hidden");
    $("newTopicInput").value = "";
  });

  $("newTopicInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("confirmAddTopic").click();
    }
    if (e.key === "Escape") $("cancelAddTopic").click();
  });

  // Form submit
  $("journalForm").addEventListener("submit", saveEntry);

  // Filters (List tab)
  $("searchInput").addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderJournalList();
  });

  $("filterTopic").addEventListener("change", (e) => {
    state.filterTopic = e.target.value;
    renderJournalList();
  });

  $("filterDate").addEventListener("change", (e) => {
    state.filterDate = e.target.value;
    renderJournalList();
  });

  $("clearFilters").addEventListener("click", () => {
    $("searchInput").value = "";
    $("filterTopic").value = "";
    $("filterDate").value = "";
    state.searchQuery = "";
    state.filterTopic = "";
    state.filterDate = "";
    renderJournalList();
  });

  // Modal
  $("modalClose").addEventListener("click", closeModal);
  $("modalOverlay").addEventListener("click", (e) => {
    if (e.target === $("modalOverlay")) closeModal();
  });

  $("deleteEntryBtn").addEventListener("click", async () => {
    const t = i18n[state.lang];
    if (!state.currentEntryId) return;
    if (confirm(t.confirmDelete)) {
      state.entries = state.entries.filter((e) => e.id !== state.currentEntryId);
      await saveEntriesToStorage();
      closeModal();
      renderJournalList();
      renderVocabTab();
    }
  });

  // Open Options (full screen)
  $("openOptions").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Vocab sub-tabs
  $$(".vtab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const vtab = btn.dataset.vtab;
      $$(".vtab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $("vocabListEn").classList.toggle("active-vtab", vtab === "en");
      $("vocabListEn").classList.toggle("hidden-vtab", vtab !== "en");
      $("vocabListJa").classList.toggle("active-vtab", vtab === "ja");
      $("vocabListJa").classList.toggle("hidden-vtab", vtab !== "ja");
    });
  });

  // Keyboard shortcut: Ctrl+Enter to save
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      const activeTab = document.querySelector(".tab-btn.active")?.dataset.tab;
      if (activeTab === "write") {
        $("journalForm").requestSubmit();
      }
    }
    if (e.key === "Escape") {
      closeModal();
    }
  });
}

// ===== INIT =====
async function init() {
  await loadFromStorage();
  applyI18n();
  startClock();
  renderTopicChips();
  renderFilterTopicSelect();
  initEventListeners();
}

document.addEventListener("DOMContentLoaded", init);
