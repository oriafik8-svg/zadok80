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
const GRANDPA_PHOTO = "zadok.jpg";

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
