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

    setTimeout(() => enterLobby(), 3000);
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
