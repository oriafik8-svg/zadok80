/* ==========================================================================
   zadok80 – קהוט לסבא צדוק  |  לוגיקה מודולרית
   Firebase: Realtime Database + Auth (Google / Email)  |  SDK v10 מ-CDN
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, set, update, get, push, remove, onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getAuth, onAuthStateChanged, signOut,
  GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* ============================================================
   🔧 firebaseConfig
   ============================================================ */
const firebaseConfig = {
  apiKey:            "AIzaSyCrxIl0xAIS-eSVfNjhxFtRlyatTIx9xq8",
  authDomain:        "zadok-kahoot-80.firebaseapp.com",
  databaseURL:       "https://zadok-kahoot-80-default-rtdb.firebaseio.com",
  projectId:         "zadok-kahoot-80",
  storageBucket:     "zadok-kahoot-80.firebasestorage.app",
  messagingSenderId: "637860664391",
  appId:             "1:637860664391:web:317b669754f47e31818d62"
};

/* 🖼️ תמונת סבא צדוק (קובץ יחסי ברפוזיטורי) */
const GRANDPA_PHOTO = "data:image/jpeg;base64,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";

const SHAPES = ["▲", "◆", "●", "■"];
const DEFAULT_TIME = 60;
const TAB_EXAMPLES = [
  "מתי סבא נולד?", "מה המאכל האהוב על סבא?", "כמה נכדים יש לסבא?",
  "איזו קבוצה סבא אוהד?", "מה המקצוע של סבא?", "לאן סבא הכי אוהב לטייל?"
];

let db = null, auth = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
} catch (e) { console.error("Firebase init error:", e); }

/* ==========================================================================
   כלי עזר
   ========================================================================== */
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
const genPin = () => String(Math.floor(100000 + Math.random() * 900000));

let currentUser = null;      // אובייקט המשתמש המחובר
let pendingAction = null;    // פעולה להרצה אחרי התחברות

const NAV_SCREENS = ["screen-home", "screen-profile"];

function showScreen(id) {
  $$(".screen").forEach(s => s.classList.remove("active"));
  $("#" + id).classList.add("active");
  document.body.classList.toggle("nav-visible", NAV_SCREENS.includes(id));
  const map = { "screen-home": "home", "screen-profile": "profile" };
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.nav === map[id]));
  window.scrollTo(0, 0);
}
function showHostView(id) { $$("#screen-host .host-view").forEach(v => v.hidden = true); $("#" + id).hidden = false; }
function showPlayerView(id) { $$("#screen-player .player-view").forEach(v => v.hidden = true); $("#" + id).hidden = false; }

/* מעבר מסך עם אוברליי טעינה קצר (ספינר סבא) */
function transitionTo(id, text = "טוען...", after = null) {
  const ov = $("#transition-overlay");
  $("#transition-text").textContent = text;
  ov.hidden = false;
  setTimeout(() => {
    ov.hidden = true;
    showScreen(id);
    if (after) after();
  }, 650);
}

/* HTML של אווטאר: תמונת פרופיל אם קיימת, אחרת אות בעיגול */
function avatarHTML(p, cls) {
  if (p && p.photo) return `<img class="${cls}" src="${esc(p.photo)}" alt="">`;
  const letter = (p && (p.avatar || (p.name || "?")[0])) || "?";
  return `<span class="${cls} ava-letter">${esc(letter)}</span>`;
}

/* ==========================================================================
   🎊 קונפטי
   ========================================================================== */
const confetti = (() => {
  const canvas = $("#confetti-canvas"), ctx = canvas.getContext("2d");
  let W, H, pieces = [];
  const palette = ["#e21b3c", "#1368ce", "#ffd23f", "#26890c", "#ff8c00", "#ffffff"];
  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
  addEventListener("resize", resize); resize();
  const spawn = (n, top = false) => { for (let i = 0; i < n; i++) pieces.push({
    x: Math.random() * W, y: top ? -20 : Math.random() * H, r: 4 + Math.random() * 6,
    c: palette[Math.floor(Math.random() * palette.length)], vx: -2 + Math.random() * 4,
    vy: 2 + Math.random() * 4, rot: Math.random() * Math.PI, vr: -0.2 + Math.random() * 0.4 }); };
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    pieces.forEach(p => { p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); ctx.restore(); });
    pieces = pieces.filter(p => p.y < H + 30); requestAnimationFrame(loop);
  })();
  setInterval(() => { if (pieces.length < 60) spawn(6, true); }, 700);
  return { burst: (n = 140) => spawn(n, true) };
})();

/* ==========================================================================
   🔐 אימות (AUTH)
   ========================================================================== */
const Auth = (() => {
  function watch() {
    if (!auth) return;
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      renderProfile();
      if (user) {
        // שמירת/עדכון פרופיל בסיסי
        set(ref(db, "users/" + user.uid + "/profile"), {
          name: user.displayName || (user.email || "אורח").split("@")[0],
          photo: user.photoURL || ""
        });
        MyGames.load();
        if (pendingAction) { const a = pendingAction; pendingAction = null; a(); }
      }
    });
  }

  function renderProfile() {
    const inn = !!currentUser;
    $("#profile-login").hidden = inn;
    $("#profile-account").hidden = !inn;
    if (inn) {
      $("#profile-name").textContent = currentUser.displayName || (currentUser.email || "משתמש").split("@")[0];
      $("#profile-photo").src = currentUser.photoURL || GRANDPA_PHOTO;
    }
  }

  async function google() {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { authErr(e); }
  }
  async function email() {
    const em = $("#auth-email").value.trim(), pw = $("#auth-pass").value;
    if (!em || pw.length < 6) return authErr({ message: "אימייל וסיסמה (6+ תווים) נדרשים" });
    try { await signInWithEmailAndPassword(auth, em, pw); }
    catch (e1) {
      try { await createUserWithEmailAndPassword(auth, em, pw); }
      catch (e2) { authErr(e2); }
    }
  }
  function authErr(e) { const el = $("#auth-error"); el.textContent = "שגיאה: " + (e.message || e); el.hidden = false; }

  function profile() {
    return {
      name: currentUser ? (currentUser.displayName || (currentUser.email || "משתמש").split("@")[0]) : "אורח",
      photo: currentUser ? (currentUser.photoURL || "") : ""
    };
  }

  $("#btn-google").addEventListener("click", google);
  $("#btn-email-auth").addEventListener("click", email);
  $("#btn-logout").addEventListener("click", () => signOut(auth));

  return { watch, profile };
})();

/* דורש התחברות לפני פעולה */
function requireAuth(action) {
  if (currentUser) action();
  else { pendingAction = action; transitionTo("screen-profile", "מתחברים..."); }
}

/* ==========================================================================
   🎮 המשחקים שלי (MY GAMES)
   ========================================================================== */
const MyGames = (() => {
  let games = {};

  function load() {
    if (!currentUser) return;
    onValue(ref(db, "users/" + currentUser.uid + "/games"), (snap) => {
      games = snap.val() || {};
      render();
    });
  }

  function render() {
    const list = $("#mygames-list"); list.innerHTML = "";
    const entries = Object.entries(games).sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
    $("#mygames-empty").style.display = entries.length ? "none" : "block";
    entries.forEach(([id, g]) => {
      const count = (g.questions || []).length;
      const li = document.createElement("li");
      li.className = "mygame-item";
      li.innerHTML = `
        <span class="mygame-name">${esc(g.name || "משחק")}</span>
        <span class="mygame-meta">${count} שאלות</span>
        <span class="mygame-actions">
          <button class="mini-btn play" title="שחק">▶️</button>
          <button class="mini-btn edit" title="ערוך">✏️</button>
          <button class="mini-btn dup" title="שכפל">⧉</button>
          <button class="mini-btn del" title="מחק">🗑️</button>
        </span>`;
      li.querySelector(".mygame-name").addEventListener("click", () => edit(id));
      li.querySelector(".edit").addEventListener("click", () => edit(id));
      li.querySelector(".play").addEventListener("click", () => play(id));
      li.querySelector(".dup").addEventListener("click", () => duplicate(id));
      li.querySelector(".del").addEventListener("click", () => del(id));
      list.appendChild(li);
    });
  }

  function nextName() {
    let n = 1;
    const names = Object.values(games).map(g => g.name);
    while (names.includes("קהוט עם סבא " + n)) n++;
    return "קהוט עם סבא " + n;
  }

  async function create() {
    const gRef = push(ref(db, "users/" + currentUser.uid + "/games"));
    const data = { name: nextName(), questions: [], updatedAt: Date.now() };
    await set(gRef, data);
    Editor.open(gRef.key, data, true);
    transitionTo("screen-editor", "יוצר משחק חדש...");
  }
  function edit(id) { Editor.open(id, games[id], false); transitionTo("screen-editor", "פותח עורך..."); }
  function play(id) {
    const qs = (games[id].questions || []);
    if (qs.length === 0) { alert("אין שאלות במשחק הזה. ערכו אותו קודם."); return; }
    transitionTo("screen-host", "מכין משחק...", () => Host.init(qs, games[id].name));
  }
  async function duplicate(id) {
    const src = games[id];
    const gRef = push(ref(db, "users/" + currentUser.uid + "/games"));
    await set(gRef, { name: (src.name || "משחק") + " (עותק)", questions: src.questions || [], updatedAt: Date.now() });
  }
  async function del(id) {
    if (!confirm("למחוק את המשחק?")) return;
    await remove(ref(db, "users/" + currentUser.uid + "/games/" + id));
  }
  async function save(id, name, questions) {
    if (!currentUser || !id) return;
    await update(ref(db, "users/" + currentUser.uid + "/games/" + id), { name, questions, updatedAt: Date.now() });
  }

  $("#btn-new-game").addEventListener("click", create);
  return { load, save };
})();

/* ==========================================================================
   ✏️ עורך (EDITOR)
   ========================================================================== */
const Editor = (() => {
  const wrap = $("#questions-editor");
  let seq = 0, openId = null;

  function open(id, data, isNew) {
    openId = id;
    wrap.innerHTML = ""; seq = 0;
    $("#game-title").value = (data && data.name) || "קהוט עם סבא";
    const qs = (data && data.questions) || [];
    if (qs.length) qs.forEach((q, i) => addBlock(q.type || "quad", q, i === 0));
    else addBlock("quad", null, true);  // משחק חדש: שאלת דוגמה ראשונה
    validate();
  }

  function addBlock(type, data, isFirst) {
    const id = ++seq;
    const n = type === "tf" ? 2 : 4;
    const block = document.createElement("div");
    block.className = "q-block"; block.dataset.id = id; block.dataset.type = type;
    const phQ = isFirst ? "מתי סבא נולד?" : "רשמו כאן שאלה...";
    let rows = "";
    for (let i = 0; i < n; i++) {
      const ph = type === "tf" ? (i === 0 ? "אמת" : "שקר") : ("תשובה " + (i + 1));
      rows += `
        <div class="q-answer c${i}" data-idx="${i}">
          <button type="button" class="mark-correct" title="סמן כנכונה">✓</button>
          <span class="shape">${SHAPES[i]}</span>
          <div class="a-text editable" contenteditable="true" data-ph="${ph}"></div>
        </div>`;
    }
    block.innerHTML = `
      <div class="q-block-head">
        <span class="q-index"></span>
        <span class="q-type-badge">${type === "tf" ? "אמת / שקר" : "4 תשובות"}</span>
        <button type="button" class="q-tab-btn" title="השלם דוגמה (TAB)">TAB</button>
        <button type="button" class="q-remove" title="מחק">🗑️</button>
      </div>
      <div class="q-text editable" contenteditable="true" data-ph="${phQ}"></div>
      <div class="q-answers">${rows}</div>`;
    wrap.appendChild(block);

    if (data) {
      block.querySelector(".q-text").innerHTML = data.text || "";
      const aT = block.querySelectorAll(".a-text");
      (data.answers || []).forEach((a, i) => { if (aT[i]) aT[i].innerHTML = a; });
      if (typeof data.correct === "number") {
        const r = block.querySelector(`.q-answer[data-idx="${data.correct}"]`);
        if (r) r.classList.add("is-correct");
      }
    } else if (type === "tf") {
      const aT = block.querySelectorAll(".a-text");
      aT[0].textContent = "אמת"; aT[1].textContent = "שקר";
    }

    block.querySelectorAll(".editable").forEach(el => {
      refreshPh(el);
      el.addEventListener("input", () => { refreshPh(el); validate(); });
      el.addEventListener("blur", () => refreshPh(el));
    });
    // TAB בשדה השאלה משלים דוגמה כשהוא ריק
    const qText = block.querySelector(".q-text");
    qText.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && qText.textContent.trim() === "") {
        e.preventDefault(); fillExample(qText);
      }
    });
    block.querySelector(".q-tab-btn").addEventListener("click", () => fillExample(qText));

    block.querySelectorAll(".mark-correct").forEach(btn => btn.addEventListener("click", () => {
      block.querySelectorAll(".q-answer").forEach(r => r.classList.remove("is-correct"));
      btn.closest(".q-answer").classList.add("is-correct"); validate();
    }));
    block.querySelector(".q-remove").addEventListener("click", () => { block.remove(); renumber(); validate(); });
    renumber();
  }

  function fillExample(el) {
    el.textContent = TAB_EXAMPLES[Math.floor(Math.random() * TAB_EXAMPLES.length)];
    refreshPh(el); validate();
  }
  const refreshPh = (el) => el.classList.toggle("empty", el.textContent.trim() === "");
  const renumber = () => wrap.querySelectorAll(".q-block").forEach((b, i) =>
    b.querySelector(".q-index").textContent = "שאלה " + (i + 1));

  function collect() {
    const out = [];
    wrap.querySelectorAll(".q-block").forEach(b => {
      const qT = b.querySelector(".q-text");
      if (qT.textContent.trim() === "") return;
      const rows = b.querySelectorAll(".q-answer"); const answers = []; let ok = true;
      rows.forEach(r => { const t = r.querySelector(".a-text");
        if (t.textContent.trim() === "") ok = false; answers.push(t.innerHTML.trim()); });
      const correct = b.querySelector(".q-answer.is-correct");
      if (!ok || !correct) return;
      out.push({ text: qT.innerHTML.trim(), answers, correct: Number(correct.dataset.idx), type: b.dataset.type });
    });
    return out;
  }
  function validate() {
    const ok = collect().length >= 1;
    $("#btn-start-editor").disabled = !ok;
    $("#editor-hint").style.display = ok ? "none" : "block";
  }
  function persist() { if (openId) MyGames.save(openId, $("#game-title").value.trim() || "קהוט עם סבא", collect()); }

  $("#btn-add-quad").addEventListener("click", () => addBlock("quad"));
  $("#btn-add-tf").addEventListener("click", () => addBlock("tf"));
  $("#game-title").addEventListener("input", () => { /* נשמר בעת יציאה/התחלה */ });
  $("#btn-editor-back").addEventListener("click", () => { persist(); transitionTo("screen-profile", "שומר..."); });
  $("#btn-start-editor").addEventListener("click", () => {
    const qs = collect(); if (!qs.length) return;
    persist();
    transitionTo("screen-host", "מכין משחק...", () => Host.init(qs, $("#game-title").value.trim()));
  });

  return { open };
})();

/* ==========================================================================
   🖥️ מנחה (HOST)
   ========================================================================== */
const Host = (() => {
  let pin = null, gameRef = null, players = {}, questions = [];
  let idx = -1, timerId = null, ansUnsub = null, revealing = false, voteTime = DEFAULT_TIME;

  async function init(qs, title) {
    if (!db) { alert("Firebase לא מוגדר."); return; }
    questions = qs; idx = -1; players = {}; voteTime = DEFAULT_TIME;
    pin = genPin(); gameRef = ref(db, "games/" + pin);

    showHostView("host-loading");   // "יוצר חדר..." 4 שניות
    await set(gameRef, { meta: { state: "lobby", currentQuestion: -1, questionCount: qs.length, title: title || "" } });

    setTimeout(() => enterLobby(), 4000);
  }

  function enterLobby() {
    $("#host-pin").textContent = pin;
    $("#host-qtotal").textContent = questions.length;
    showHostView("host-lobby");

    const joinUrl = location.origin + location.pathname + "?pin=" + pin;
    const qr = $("#qr-box"); qr.innerHTML = "";
    try { new QRCode(qr, { text: joinUrl, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M }); }
    catch (e) { qr.textContent = "QR"; }

    onValue(ref(db, "games/" + pin + "/players"), (snap) => {
      players = snap.val() || {};
      const list = Object.entries(players);
      $("#lobby-count").textContent = list.length;
      const ul = $("#lobby-players"); ul.innerHTML = "";
      list.forEach(([, p]) => {
        const li = document.createElement("li");
        li.innerHTML = `${avatarHTML(p, "pcard-photo")}<span>${esc(p.name)}</span>`;
        ul.appendChild(li);
      });
      $("#host-players-total").textContent = list.length;
      const enough = list.length >= 2;
      $("#btn-start-game").disabled = !enough;
      $("#lobby-hint").style.display = enough ? "none" : "block";
    });
    addEventListener("beforeunload", () => { if (gameRef) remove(gameRef); });
  }

  // ספירה לאחור 5 שניות ואז שאלה
  function countdownThenQuestion(i) {
    idx = i;
    update(ref(db, "games/" + pin + "/meta"), { state: "countdown", currentQuestion: i });
    showHostView("host-countdown");
    let c = 5; const el = $("#host-countdown-num"); el.textContent = c;
    const t = setInterval(() => {
      c--;
      if (c <= 0) { clearInterval(t); startQuestion(i); }
      else el.textContent = c;
    }, 1000);
  }

  function startQuestion(i) {
    const q = questions[i];
    const isTf = q.type === "tf";
    remove(ref(db, "games/" + pin + "/answers/" + i));
    revealing = false;

    update(ref(db, "games/" + pin + "/meta"), {
      state: "question", currentQuestion: i, startAt: serverTimestamp(),
      optCount: q.answers.length, tf: isTf, optLabels: isTf ? q.answers : null
    });

    $("#host-qnum").textContent = i + 1;
    $("#host-question-text").innerHTML = q.text;
    $("#host-answered").textContent = "0";
    const grid = $("#host-answers"); grid.innerHTML = "";
    grid.style.gridTemplateColumns = isTf ? "1fr 1fr" : "1fr 1fr";
    q.answers.forEach((txt, k) => {
      const el = document.createElement("div");
      el.className = "answer-tile c" + k;
      el.innerHTML = `<span class="shape">${SHAPES[k]}</span><span>${txt}</span>`;
      grid.appendChild(el);
    });
    showHostView("host-question");

    if (ansUnsub) ansUnsub();
    ansUnsub = onValue(ref(db, "games/" + pin + "/answers/" + i), (snap) => {
      const a = snap.val() || {}; const nn = Object.keys(a).length;
      $("#host-answered").textContent = nn;
      const total = Object.keys(players).length;
      if (total > 0 && nn >= total) endQuestion();
    });

    let rem = voteTime; const tEl = $("#host-timer");
    tEl.textContent = rem; tEl.classList.remove("urgent");
    clearInterval(timerId);
    timerId = setInterval(() => {
      rem--; tEl.textContent = Math.max(rem, 0);
      if (rem <= 5) tEl.classList.add("urgent");
      if (rem <= 0) endQuestion();
    }, 1000);
  }

  async function endQuestion() {
    if (revealing) return; revealing = true;
    clearInterval(timerId);
    if (ansUnsub) { ansUnsub(); ansUnsub = null; }
    const i = idx, q = questions[i], limit = voteTime * 1000;

    const [mSnap, aSnap] = await Promise.all([
      get(ref(db, "games/" + pin + "/meta/startAt")),
      get(ref(db, "games/" + pin + "/answers/" + i))
    ]);
    const startAt = mSnap.val() || 0, answers = aSnap.val() || {};
    const counts = [0, 0, 0, 0], updates = {};
    for (const [pid, a] of Object.entries(answers)) {
      const ch = a.choice; if (ch >= 0 && ch < 4) counts[ch]++;
      const ok = ch === q.correct; let pts = 0;
      if (ok) { const el = Math.max(0, (a.answeredAt || startAt) - startAt);
        pts = Math.round(500 + 500 * Math.max(0, 1 - el / limit)); }
      updates["answers/" + i + "/" + pid + "/correct"] = ok;
      updates["answers/" + i + "/" + pid + "/points"] = pts;
      updates["players/" + pid + "/score"] = ((players[pid] && players[pid].score) || 0) + pts;
    }
    updates["meta/state"] = "reveal"; updates["meta/correct"] = q.correct;
    await update(gameRef, updates);

    $("#reveal-question-text").innerHTML = q.text;
    const bw = $("#reveal-bars"); bw.innerHTML = "";
    const mx = Math.max(1, ...counts);
    q.answers.forEach((txt, k) => {
      const col = document.createElement("div");
      col.className = "bar-col" + (k === q.correct ? " correct" : "");
      const h = 20 + (counts[k] / mx) * 200;
      col.innerHTML = `<div class="bar c${k}" style="height:0px">${counts[k]}</div><div class="bar-shape">${SHAPES[k]}</div>`;
      bw.appendChild(col);
      requestAnimationFrame(() => col.querySelector(".bar").style.height = h + "px");
    });
    showHostView("host-reveal"); confetti.burst(80);
  }

  function sortedPlayers() {
    return Object.entries(players)
      .map(([pid, p]) => ({ pid, name: p.name, photo: p.photo, avatar: p.avatar, score: p.score || 0 }))
      .sort((a, b) => b.score - a.score);
  }

  function showLeaderboard() {
    const sorted = sortedPlayers();
    const medals = ["🥇", "🥈", "🥉"];
    const ul = $("#leaderboard-list"); ul.innerHTML = "";
    sorted.slice(0, 5).forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="rank-name"><span class="medal">${medals[i] || (i + 1)}</span>
        ${avatarHTML(p, "ava")}${esc(p.name)}</span><span class="score">${p.score}</span>`;
      ul.appendChild(li);
    });
    update(ref(db, "games/" + pin + "/meta"), { state: "leaderboard" });
    showHostView("host-leaderboard"); confetti.burst(120);
  }

  function next() {
    const n = idx + 1;
    if (n >= questions.length) endGame();
    else countdownThenQuestion(n);
  }

  function endGame() {
    update(ref(db, "games/" + pin + "/meta"), { state: "ended" });
    const sorted = sortedPlayers();
    const end = $("#host-end");
    showHostView("host-end");
    // איפוס
    ["1", "2", "3"].forEach(k => { const c = $("#podium-" + k); c.classList.remove("show", "winner-glow"); c.innerHTML = ""; });
    end.classList.remove("spotlight");

    const fill = (place, p) => {
      const col = $("#podium-" + place);
      if (!p) { col.style.visibility = "hidden"; return; }
      col.style.visibility = "visible";
      col.innerHTML = `<div class="p-place">${place === "1" ? "🥇" : place === "2" ? "🥈" : "🥉"}</div>
        ${avatarHTML(p, "p-photo")}<div class="p-name">${esc(p.name)}</div><div class="p-score">${p.score} נק'</div>`;
    };
    fill("3", sorted[2]); fill("2", sorted[1]); fill("1", sorted[0]);

    // חשיפה דרמטית: 3 → 2 → 1
    setTimeout(() => $("#podium-3").classList.add("show"), 500);
    setTimeout(() => $("#podium-2").classList.add("show"), 1600);
    setTimeout(() => {
      end.classList.add("spotlight");
      const c1 = $("#podium-1"); c1.classList.add("show", "winner-glow");
      confetti.burst(260);
    }, 2900);
  }

  async function restart() { if (gameRef) await remove(gameRef); transitionTo("screen-profile", "חוזרים..."); }

  $("#vote-time").addEventListener("input", (e) => { voteTime = Number(e.target.value); $("#vote-time-val").textContent = voteTime; });
  $("#btn-start-game").addEventListener("click", () => countdownThenQuestion(0));
  $("#btn-reveal").addEventListener("click", () => endQuestion());
  $("#btn-show-leaderboard").addEventListener("click", () => showLeaderboard());
  $("#btn-next-question").addEventListener("click", () => next());
  $("#btn-restart").addEventListener("click", () => restart());

  return { init };
})();

/* ==========================================================================
   📱 שחקן (PLAYER)
   ========================================================================== */
const Player = (() => {
  let pin = null, pid = null, lastQ = -1, answered = false, metaUnsub = null, cdTimer = null;

  function prefill() {
    const p = Auth.profile();
    if (p.name && !$("#input-name").value) $("#input-name").value = p.name;
    if (p.photo) $("#player-avatar-big").src = p.photo;
  }

  async function join() {
    $("#join-error").hidden = true;
    pin = $("#input-pin").value.trim();
    const name = $("#input-name").value.trim();
    const prof = Auth.profile();
    if (!db) return err("Firebase לא מוגדר.");
    if (!/^\d{4,6}$/.test(pin)) return err("קוד חדר לא תקין");
    if (!name) return err("נא להזין שם");

    const m = await get(ref(db, "games/" + pin + "/meta"));
    if (!m.exists()) return err("לא נמצא חדר עם הקוד הזה");
    if (m.val().state !== "lobby") return err("המשחק כבר התחיל 😅");

    const pRef = push(ref(db, "games/" + pin + "/players"));
    pid = pRef.key;
    await set(pRef, { name, photo: prof.photo || "", avatar: name[0] || "?", score: 0 });

    $("#player-name-echo").textContent = name;
    $("#player-avatar-big").src = prof.photo || GRANDPA_PHOTO;
    showPlayerView("player-wait"); confetti.burst(60);

    if (metaUnsub) metaUnsub();
    metaUnsub = onValue(ref(db, "games/" + pin + "/meta"), (s) => onMeta(s.val() || {}));
  }

  function onMeta(meta) {
    const st = meta.state, q = meta.currentQuestion;
    if (st === "lobby") showPlayerView("player-wait");
    else if (st === "countdown") { if (q !== lastQ) { lastQ = q; runCountdown(); } }
    else if (st === "question") renderButtons(meta);
    else if (st === "reveal") showResult(q);
    else if (st === "ended") showFinal();
  }

  function runCountdown() {
    answered = false;
    showPlayerView("player-countdown");
    let c = 5; const el = $("#player-countdown-num"); el.textContent = c;
    clearInterval(cdTimer);
    cdTimer = setInterval(() => { c--; if (c <= 0) clearInterval(cdTimer); else el.textContent = c; }, 1000);
  }

  function renderButtons(meta) {
    if (answered) return;   // כבר ענה על השאלה הזו
    $("#player-qnum").textContent = (meta.currentQuestion || 0) + 1;
    const grid = $("#player-answers"); grid.innerHTML = "";
    const isTf = !!meta.tf; const n = meta.optCount || (isTf ? 2 : 4);
    grid.style.gridTemplateColumns = "1fr 1fr";
    for (let i = 0; i < n; i++) {
      const btn = document.createElement("button");
      btn.className = "answer-tile c" + i;
      const label = isTf && meta.optLabels ? `<span>${meta.optLabels[i]}</span>` : "";
      btn.innerHTML = `<span class="shape">${SHAPES[i]}</span>${label}`;
      btn.addEventListener("click", () => answer(meta.currentQuestion, i));
      grid.appendChild(btn);
    }
    showPlayerView("player-answer");
  }

  async function answer(q, choice) {
    if (answered) return; answered = true;
    await set(ref(db, "games/" + pin + "/answers/" + q + "/" + pid), { choice, answeredAt: serverTimestamp() });
    showPlayerView("player-locked");
  }

  async function showResult(q) {
    const [aS, meS, plS] = await Promise.all([
      get(ref(db, "games/" + pin + "/answers/" + q + "/" + pid)),
      get(ref(db, "games/" + pin + "/players/" + pid)),
      get(ref(db, "games/" + pin + "/players"))
    ]);
    const a = aS.val(), me = meS.val() || { score: 0 }, all = plS.val() || {};
    const ok = a && a.correct, pts = (a && a.points) || 0;
    $("#result-emoji").textContent = ok ? "✅" : (a ? "❌" : "⏰");
    $("#result-text").textContent = ok ? "כל הכבוד!" : (a ? "אוף, לא נכון" : "לא הספקת לענות");
    $("#result-points").textContent = pts;
    $("#result-total-score").textContent = me.score || 0;
    const sorted = Object.values(all).map(p => p.score || 0).sort((x, y) => y - x);
    $("#result-rank").textContent = sorted.indexOf(me.score || 0) + 1;
    if (ok) confetti.burst(50);
    showPlayerView("player-result");
  }

  async function showFinal() {
    const [meS, plS] = await Promise.all([
      get(ref(db, "games/" + pin + "/players/" + pid)),
      get(ref(db, "games/" + pin + "/players"))
    ]);
    const me = meS.val() || { score: 0 }, all = plS.val() || {};
    const sorted = Object.values(all).map(p => p.score || 0).sort((x, y) => y - x);
    const rank = sorted.indexOf(me.score || 0) + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🎉";
    $("#player-final-rank").textContent = `${medal} מקום ${rank}`;
    $("#player-final-score").textContent = me.score || 0;
    showPlayerView("player-end"); if (rank <= 3) confetti.burst(120);
  }

  const err = (m) => { const e = $("#join-error"); e.textContent = m; e.hidden = false; };

  $("#btn-join").addEventListener("click", join);
  $("#input-name").addEventListener("keydown", (e) => { if (e.key === "Enter") join(); });

  return { prefill };
})();

/* ==========================================================================
   ניווט + טעינה ראשונית
   ========================================================================== */
$$(".grandpa-photo").forEach(img => img.src = GRANDPA_PHOTO);
$("#profile-photo") && ($("#profile-photo").src = GRANDPA_PHOTO);

// תפריט עליון
$$(".nav-btn").forEach(btn => btn.addEventListener("click", () => {
  const nav = btn.dataset.nav;
  if (nav === "home") transitionTo("screen-home", "מסך הבית");
  else if (nav === "profile") transitionTo("screen-profile", "פרופיל");
  else if (nav === "create") requireAuth(() => goToMyGames());
  else if (nav === "join") requireAuth(() => { Player.prefill(); transitionTo("screen-player", "מצטרפים..."); });
}));

// כפתורי מסך הבית
$("#home-create").addEventListener("click", () => requireAuth(() => goToMyGames()));
$("#home-join").addEventListener("click", () => requireAuth(() => { Player.prefill(); transitionTo("screen-player", "מצטרפים..."); }));

// עוקף: "ליצור" מפרופיל/נאב פותח את רשימת המשחקים שלי (שם אפשר גם +חדש)
function goToMyGames() { transitionTo("screen-profile", "המשחקים שלי..."); }

// כניסה דרך QR עם ?pin=
const pinParam = new URLSearchParams(location.search).get("pin");
Auth.watch();
if (pinParam && /^\d{4,6}$/.test(pinParam)) {
  requireAuth(() => { Player.prefill(); $("#input-pin").value = pinParam; transitionTo("screen-player", "מצטרפים..."); });
} else {
  showScreen("screen-home");
}
