/* ═══════════ 绘语 · 逻辑 ═══════════ */
"use strict";
const $ = (id) => document.getElementById(id);

/* ---------- 词库 ---------- */
const BOOKS = {
  en: { label: "英语本", read: true, words: [
    ["hello", "həˈləʊ", "你好；问候"],
    ["courage", "ˈkʌrɪdʒ", "勇气"],
    ["wander", "ˈwɒndə", "漫游；闲逛"],
    ["gentle", "ˈdʒentl", "温柔的"],
    ["harvest", "ˈhɑːvɪst", "收获；收割"],
    ["lantern", "ˈlæntən", "灯笼"],
    ["meadow", "ˈmedəʊ", "草地"],
    ["pebble", "ˈpebl", "鹅卵石"],
    ["ripple", "ˈrɪpl", "涟漪"],
    ["twilight", "ˈtwaɪlaɪt", "暮色"],
    ["velvet", "ˈvelvɪt", "天鹅绒"],
    ["whisper", "ˈwɪspə", "低语"]
  ]},
  ja: { label: "日语本", read: true, words: [
    ["風", "かぜ", "风"],
    ["光", "ひかり", "光"],
    ["海", "うみ", "海"],
    ["空", "そら", "天空"],
    ["桜", "さくら", "樱花"],
    ["雪", "ゆき", "雪"],
    ["月", "つき", "月亮"],
    ["花", "はな", "花"],
    ["星", "ほし", "星星"],
    ["雨", "あめ", "雨"]
  ]},
  ko: { label: "韩语本", read: true, words: [
    ["안녕", "annyeong", "你好"],
    ["사랑", "sarang", "爱"],
    ["바다", "bada", "大海"],
    ["하늘", "haneul", "天空"],
    ["별", "byeol", "星星"],
    ["꽃", "kkot", "花"],
    ["책", "chaek", "书"],
    ["커피", "keopi", "咖啡"]
  ]}
};

/* ---------- 状态 ---------- */
let lang = localStorage.getItem("cottage-lang") || "en";
let queue = [];          /* 待学队列 */
let known = {};          /* { lang: [word,…] 已认识 */
let todayCount = +(localStorage.getItem("cottage-today-count") || 0);
const todayKey = new Date().toISOString().slice(0, 10);
if (localStorage.getItem("cottage-today-date") !== todayKey) {
  todayCount = 0;
  localStorage.setItem("cottage-today-date", todayKey);
  localStorage.setItem("cottage-today-count", "0");
}

function loadKnown() {
  known = JSON.parse(localStorage.getItem("cottage-known") || "{}");
  for (const k of Object.keys(BOOKS)) if (!known[k]) known[k] = [];
}
loadKnown();

function buildQueue() {
  const list = BOOKS[lang].words.map(w => w[0]);
  const kset = new Set(known[lang]);
  const fresh = list.filter(w => !kset.has(w));
  /* 简单洗牌 */
  for (let i = fresh.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
  }
  queue = fresh;
}

/* ---------- 渲染 ---------- */
function renderStats() {
  $("fTotal").textContent = BOOKS[lang].words.length;
  $("fToday").textContent = todayCount;
  $("fKnown").textContent = known[lang].length;
  $("pocketZone").hidden = known[lang].length === 0;
}
function renderCard() {
  const card = $("flipCard");
  card.classList.remove("flipped");
  if (queue.length === 0) {
    $("wFront").textContent = "本册读完啦";
    $("wWord").textContent = "🎉";
    $("wReading").textContent = "yay!";
    $("wMeaning").textContent = "这本单词全认识了，换下一本吧";
    card.dataset.empty = "1";
    return;
  }
  card.dataset.empty = "";
  const [w, r, m] = BOOKS[lang].words.find(x => x[0] === queue[0]);
  $("wFront").textContent = w;
  $("wWord").textContent = w;
  $("wReading").textContent = r;
  $("wMeaning").textContent = m;
}
function renderPocket() {
  const kset = new Set(known[lang]);
  $("pocketList").innerHTML = [...kset].map(w => {
    const item = BOOKS[lang].words.find(x => x[0] === w);
    return `<span class="pocket-chip">${w} <small>${item ? item[2] : ""}</small></span>`;
  }).join("");
}

/* ---------- 交互 ---------- */
$("flipCard").addEventListener("click", () => {
  if ($("flipCard").dataset.empty === "1") return;
  $("flipCard").classList.toggle("flipped");
});

document.querySelectorAll(".shelf-book").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".shelf-book").forEach(x => x.classList.toggle("on", x === b));
  lang = b.dataset.lang;
  localStorage.setItem("cottage-lang", lang);
  buildQueue(); renderStats(); renderCard(); renderPocket();
}));

function mark(type) {
  if ($("flipCard").dataset.empty === "1" || queue.length === 0) return;
  const w = queue.shift();
  todayCount++;
  localStorage.setItem("cottage-today-count", todayCount);
  if (type === "yes") {
    known[lang].push(w);
    localStorage.setItem("cottage-known", JSON.stringify(known));
    renderPocket();
  } else if (type === "fuzzy") {
    /* 放回队中 */
    const mid = Math.min(queue.length, 2 + Math.floor(Math.random() * 2));
    queue.splice(mid, 0, w);
  } else {
    /* 放回队首 */
    queue.unshift(w);
  }
  renderStats();
  renderCard();
}
$("btnYes").addEventListener("click", () => mark("yes"));
$("btnFuzzy").addEventListener("click", () => mark("fuzzy"));
$("btnNo").addEventListener("click", () => mark("no"));

$("tuckToggle").addEventListener("click", () => {
  const list = $("pocketList");
  list.hidden = !list.hidden;
  $("tuckToggle").textContent = list.hidden ? "打开看看" : "先收起来";
});

/* ---------- 初始化 ---------- */
document.querySelectorAll(".shelf-book").forEach(b =>
  b.classList.toggle("on", b.dataset.lang === lang));
buildQueue(); renderStats(); renderCard(); renderPocket();
