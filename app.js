/* ==========================================================================
   קהוט חוגגים 80 לסבא צדוק!  –  לוגיקת המשחק
   טכנולוגיה: Firebase Realtime Database (SDK מודולרי v10 מ-CDN)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, set, update, get, push, remove,
  onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/* ============================================================
   🔧 firebaseConfig (כבר מוגדר)
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

/* ============================================================
   📝 שאלות דמו לטעינה ראשונית בעורך – ניתן לערוך/למחוק בתוך האתר
   correct: 0=אדום▲, 1=כחול◆, 2=צהוב●, 3=ירוק■
   ============================================================ */
const DEFAULT_QUESTIONS = [
  { text: "באיזו שנה נולד סבא צדוק?", answers: ["1946", "1950", "1938", "1962"], correct: 0 },
  { text: "מה המאכל האהוב על סבא צדוק?", answers: ["שניצל", "חמין של שבת", "פיצה", "סושי"], correct: 1 },
  { text: "מה היה המקצוע של סבא צדוק?", answers: ["רופא", "מורה", "בעל מפעל", "טייס"], correct: 2 },
  { text: "מה סבא צדוק אומר הכי הרבה?", answers: ["\"יאללה לישון\"", "\"בתיאבון!\"", "\"מי רעב?\"", "\"בזמני זה היה אחרת\""], correct: 3 }
];

const SHAPES = ["▲", "◆", "●", "■"];
const DEFAULT_TIME = 20;

/* ============================================================
   🖼️ תמונת סבא צדוק שמופיעה במרכז ספינר הטעינה (לובי + המתנה)
   • אפשר קישור אינטרנטי (URL) או שם קובץ מקומי שהעליתם ל-GitHub,
     למשל: "grandpa.jpg"
   ============================================================ */
const GRANDPA_PHOTO = "https://i.ibb.co/6cbrs04g/image.jpg";

/* השאלות שבהן ישוחק המשחק בפועל – מתמלאות מהעורך */
let GAME_QUESTIONS = [];

/* ---------- אתחול Firebase ---------- */
let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.error("שגיאה באתחול Firebase:", e);
}

/* ==========================================================================
   כלי עזר
   ========================================================================== */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(id) {
  $$(".screen").forEach(s => s.classList.remove("active"));
  $("#" + id).classList.add("active");
}
function showHostView(id) {
  $$("#screen-host .host-view").forEach(v => v.hidden = true);
  $("#" + id).hidden = false;
}
function showPlayerView(id) {
  $$("#screen-player .player-view").forEach(v => v.hidden = true);
  $("#" + id).hidden = false;
}
function genPin() { return String(Math.floor(100000 + Math.random() * 900000)); }
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

/* ==========================================================================
   🎊 מנוע קונפטי
   ========================================================================== */
const confetti = (() => {
  const canvas = $("#confetti-canvas");
  const ctx = canvas.getContext("2d");
  let W, H, pieces = [];
  const palette = ["#e21b3c", "#1368ce", "#ffd23f", "#26890c", "#ff9500", "#ffffff"];
  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  addEventListener("resize", resize); resize();
  function spawn(n, fromTop = false) {
    for (let i = 0; i < n; i++) pieces.push({
      x: Math.random() * W, y: fromTop ? -20 : Math.random() * H,
      r: 4 + Math.random() * 6, c: palette[Math.floor(Math.random() * palette.length)],
      vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI, vr: -0.2 + Math.random() * 0.4
    });
  }
  function loop() {
    ctx.clearRect(0, 0, W, H);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); ctx.restore();
    });
    pieces = pieces.filter(p => p.y < H + 30);
    requestAnimationFrame(loop);
  }
  loop();
  setInterval(() => { if (pieces.length < 60) spawn(6, true); }, 700);
  return { burst: (n = 140) => spawn(n, true) };
})();

/* ==========================================================================
   ✏️  עורך השאלות (EDITOR)
   ========================================================================== */
const Editor = (() => {
  const wrap = $("#questions-editor");
  let blockSeq = 0;
  let built = false;

  function init() {
    if (built) return;
    built = true;
    DEFAULT_QUESTIONS.forEach(q => addBlock(q));
    validate();
  }

  function addBlock(data) {
    const id = ++blockSeq;
    const block = document.createElement("div");
    block.className = "q-block";
    block.dataset.id = id;
    block.innerHTML = `
      <div class="q-block-head">
        <span class="q-index"></span>
        <button type="button" class="q-remove" title="מחק שאלה">🗑️</button>
      </div>
      <div class="q-text editable" contenteditable="true" data-ph="רשמו כאן שאלה..."></div>
      <div class="q-answers">
        ${[0,1,2,3].map(i => `
          <div class="q-answer c${i}" data-idx="${i}">
            <button type="button" class="mark-correct" title="סמן כתשובה הנכונה">✓</button>
            <span class="shape">${SHAPES[i]}</span>
            <div class="a-text editable" contenteditable="true" data-ph="תשובה ${i + 1}"></div>
          </div>`).join("")}
      </div>`;
    wrap.appendChild(block);

    // מילוי ערכי ברירת מחדל
    if (data) {
      block.querySelector(".q-text").innerHTML = data.text || "";
      const aTexts = block.querySelectorAll(".a-text");
      (data.answers || []).forEach((a, i) => { if (aTexts[i]) aTexts[i].innerHTML = a; });
      if (typeof data.correct === "number") {
        const row = block.querySelector(`.q-answer[data-idx="${data.correct}"]`);
        if (row) row.classList.add("is-correct");
      }
    }

    // ניהול placeholder לכל שדה עריכה
    block.querySelectorAll(".editable").forEach(el => {
      refreshPh(el);
      el.addEventListener("input", () => { refreshPh(el); validate(); });
      el.addEventListener("blur", () => refreshPh(el));
    });

    // סימון תשובה נכונה
    block.querySelectorAll(".mark-correct").forEach(btn => {
      btn.addEventListener("click", () => {
        block.querySelectorAll(".q-answer").forEach(r => r.classList.remove("is-correct"));
        btn.closest(".q-answer").classList.add("is-correct");
        validate();
      });
    });

    // מחיקת בלוק
    block.querySelector(".q-remove").addEventListener("click", () => {
      block.remove(); renumber(); validate();
    });

    renumber();
  }

  function refreshPh(el) {
    el.classList.toggle("empty", el.textContent.trim() === "");
  }
  function renumber() {
    wrap.querySelectorAll(".q-block").forEach((b, i) => {
      b.querySelector(".q-index").textContent = "שאלה " + (i + 1);
    });
  }

  // איסוף השאלות התקינות בלבד
  function collect() {
    const out = [];
    wrap.querySelectorAll(".q-block").forEach(b => {
      const qText = b.querySelector(".q-text");
      if (qText.textContent.trim() === "") return;
      const aRows = b.querySelectorAll(".q-answer");
      const answers = [];
      let ok = true;
      aRows.forEach(r => {
        const t = r.querySelector(".a-text");
        if (t.textContent.trim() === "") ok = false;
        answers.push(t.innerHTML.trim());
      });
      const correctRow = b.querySelector(".q-answer.is-correct");
      if (!ok || !correctRow) return;
      out.push({
        text: qText.innerHTML.trim(),
        answers,
        correct: Number(correctRow.dataset.idx),
        time: DEFAULT_TIME
      });
    });
    return out;
  }

  function validate() {
    const valid = collect().length >= 1;
    $("#btn-start-editor").disabled = !valid;
    $("#editor-hint").style.display = valid ? "none" : "block";
    return valid;
  }

  $("#btn-add-question").addEventListener("click", () => { addBlock(); });
  $("#btn-start-editor").addEventListener("click", () => {
    const qs = collect();
    if (qs.length === 0) return;
    GAME_QUESTIONS = qs;
    showScreen("screen-host");
    Host.init(qs);
  });

  return { init };
})();

/* ==========================================================================
   🖥️  לוגיקת המנחה (HOST)
   ========================================================================== */
const Host = (() => {
  let pin = null, gameRef = null, players = {};
  let currentIndex = -1, timerId = null, answersUnsub = null, revealing = false;

  async function init(questions) {
    if (!db) { alert("Firebase לא מוגדר."); return; }
    GAME_QUESTIONS = questions;
    pin = genPin();
    gameRef = ref(db, "games/" + pin);
    currentIndex = -1; players = {};

    await set(gameRef, {
      meta: { state: "lobby", currentQuestion: -1, questionCount: questions.length, startAt: 0 }
    });

    $("#host-pin").textContent = pin;
    $("#host-qtotal").textContent = questions.length;
    showHostView("host-lobby");

    // יצירת QR שמפנה לכתובת האתר עם ה-PIN
    const joinUrl = location.origin + location.pathname + "?pin=" + pin;
    const qrBox = $("#qr-box");
    qrBox.innerHTML = "";
    try {
      new QRCode(qrBox, { text: joinUrl, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
    } catch (e) { qrBox.textContent = "QR"; }

    // מאזין לשחקנים (מגביל התחלה ל-2 לפחות)
    onValue(ref(db, "games/" + pin + "/players"), (snap) => {
      players = snap.val() || {};
      const list = Object.entries(players);
      $("#lobby-count").textContent = list.length;
      const ul = $("#lobby-players"); ul.innerHTML = "";
      list.forEach(([, p]) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="ava">${esc(p.avatar || "?")}</span>${esc(p.name)}`;
        ul.appendChild(li);
      });
      $("#host-players-total").textContent = list.length;
      const enough = list.length >= 2;
      $("#btn-start-game").disabled = !enough;
      $("#lobby-hint").style.display = enough ? "none" : "block";
    });

    addEventListener("beforeunload", () => { if (gameRef) remove(gameRef); });
  }

  function startQuestion(i) {
    currentIndex = i;
    const q = GAME_QUESTIONS[i];
    const timeLimit = q.time || DEFAULT_TIME;
    remove(ref(db, "games/" + pin + "/answers/" + i));
    revealing = false;

    update(ref(db, "games/" + pin + "/meta"), {
      state: "question", currentQuestion: i, startAt: serverTimestamp()
    });

    $("#host-qnum").textContent = i + 1;
    $("#host-question-text").innerHTML = q.text;
    $("#host-answered").textContent = "0";
    const grid = $("#host-answers"); grid.innerHTML = "";
    q.answers.forEach((txt, idx) => {
      const el = document.createElement("div");
      el.className = "answer-tile c" + idx;
      el.innerHTML = `<span class="shape">${SHAPES[idx]}</span><span>${txt}</span>`;
      grid.appendChild(el);
    });
    showHostView("host-question");

    if (answersUnsub) answersUnsub();
    answersUnsub = onValue(ref(db, "games/" + pin + "/answers/" + i), (snap) => {
      const ans = snap.val() || {};
      const n = Object.keys(ans).length;
      $("#host-answered").textContent = n;
      const total = Object.keys(players).length;
      if (total > 0 && n >= total) endQuestion();
    });

    let remaining = timeLimit;
    const timerEl = $("#host-timer");
    timerEl.textContent = remaining; timerEl.classList.remove("urgent");
    clearInterval(timerId);
    timerId = setInterval(() => {
      remaining--;
      timerEl.textContent = Math.max(remaining, 0);
      if (remaining <= 5) timerEl.classList.add("urgent");
      if (remaining <= 0) endQuestion();
    }, 1000);
  }

  async function endQuestion() {
    if (revealing) return;
    revealing = true;
    clearInterval(timerId);
    if (answersUnsub) { answersUnsub(); answersUnsub = null; }

    const i = currentIndex;
    const q = GAME_QUESTIONS[i];
    const timeLimit = (q.time || DEFAULT_TIME) * 1000;

    const [metaSnap, ansSnap] = await Promise.all([
      get(ref(db, "games/" + pin + "/meta/startAt")),
      get(ref(db, "games/" + pin + "/answers/" + i))
    ]);
    const startAt = metaSnap.val() || 0;
    const answers = ansSnap.val() || {};

    const counts = [0, 0, 0, 0];
    const updates = {};
    for (const [pid, a] of Object.entries(answers)) {
      const choice = a.choice;
      if (choice >= 0 && choice < 4) counts[choice]++;
      const isCorrect = choice === q.correct;
      let points = 0;
      if (isCorrect) {
        const elapsed = Math.max(0, (a.answeredAt || startAt) - startAt);
        const factor = Math.max(0, 1 - elapsed / timeLimit);
        points = Math.round(500 + 500 * factor);
      }
      updates["answers/" + i + "/" + pid + "/correct"] = isCorrect;
      updates["answers/" + i + "/" + pid + "/points"] = points;
      const prev = (players[pid] && players[pid].score) || 0;
      updates["players/" + pid + "/score"] = prev + points;
    }
    updates["meta/state"] = "reveal";
    updates["meta/correct"] = q.correct;
    await update(gameRef, updates);

    $("#reveal-question-text").innerHTML = q.text;
    const barsWrap = $("#reveal-bars"); barsWrap.innerHTML = "";
    const maxCount = Math.max(1, ...counts);
    q.answers.forEach((txt, idx) => {
      const col = document.createElement("div");
      col.className = "bar-col" + (idx === q.correct ? " correct" : "");
      const h = 20 + (counts[idx] / maxCount) * 200;
      col.innerHTML = `<div class="bar c${idx}" style="height:0px">${counts[idx]}</div><div class="bar-shape">${SHAPES[idx]}</div>`;
      barsWrap.appendChild(col);
      requestAnimationFrame(() => { col.querySelector(".bar").style.height = h + "px"; });
    });
    showHostView("host-reveal");
    confetti.burst(80);
  }

  function showLeaderboard(final = false) {
    const sorted = Object.entries(players)
      .map(([pid, p]) => ({ pid, name: p.name, avatar: p.avatar || "?", score: p.score || 0 }))
      .sort((a, b) => b.score - a.score);
    const medals = ["🥇", "🥈", "🥉"];
    const targetList = final ? $("#final-leaderboard") : $("#leaderboard-list");
    targetList.innerHTML = "";
    sorted.slice(0, final ? 20 : 8).forEach((p, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="rank-name"><span class="medal">${medals[idx] || (idx + 1)}</span>
        <span class="ava">${esc(p.avatar)}</span>${esc(p.name)}</span>
        <span class="score">${p.score}</span>`;
      targetList.appendChild(li);
    });
    if (final) {
      const w = sorted[0];
      $("#winner-podium").innerHTML = w ? `<span class="crown">👑</span>${esc(w.name)} – ${w.score} נק'!` : "";
      update(ref(db, "games/" + pin + "/meta"), { state: "ended" });
      showHostView("host-end"); confetti.burst(220);
    } else {
      update(ref(db, "games/" + pin + "/meta"), { state: "leaderboard" });
      showHostView("host-leaderboard"); confetti.burst(120);
    }
  }

  function next() {
    const n = currentIndex + 1;
    if (n >= GAME_QUESTIONS.length) showLeaderboard(true);
    else startQuestion(n);
  }
  async function restart() {
    if (gameRef) await remove(gameRef);
    showScreen("screen-home");
  }

  $("#btn-start-game").addEventListener("click", () => startQuestion(0));
  $("#btn-reveal").addEventListener("click", () => endQuestion());
  $("#btn-show-leaderboard").addEventListener("click", () => showLeaderboard(false));
  $("#btn-next-question").addEventListener("click", () => next());
  $("#btn-restart").addEventListener("click", () => restart());

  return { init };
})();

/* ==========================================================================
   📱  לוגיקת השחקן (PLAYER)
   ========================================================================== */
const Player = (() => {
  let pin = null, pid = null, name = "", avatar = "";
  let lastQuestion = -1, answeredThis = false, metaUnsub = null;

  // בחירת אווטאר
  $$("#avatar-picker .avatar-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      $$("#avatar-picker .avatar-opt").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      avatar = btn.dataset.av;
    });
  });

  async function join() {
    $("#join-error").hidden = true;
    pin = $("#input-pin").value.trim();
    name = $("#input-name").value.trim();
    if (!db) return showErr("Firebase לא מוגדר.");
    if (!/^\d{4,6}$/.test(pin)) return showErr("קוד חדר לא תקין");
    if (!name) return showErr("נא להזין שם");
    if (!avatar) return showErr("נא לבחור דמות");

    const metaSnap = await get(ref(db, "games/" + pin + "/meta"));
    if (!metaSnap.exists()) return showErr("לא נמצא חדר עם הקוד הזה");
    if (metaSnap.val().state !== "lobby") return showErr("המשחק כבר התחיל 😅");

    const playerRef = push(ref(db, "games/" + pin + "/players"));
    pid = playerRef.key;
    await set(playerRef, { name, avatar, score: 0 });

    $("#player-name-echo").textContent = name;
    $("#player-avatar-big").textContent = avatar;
    showPlayerView("player-wait");
    confetti.burst(60);

    if (metaUnsub) metaUnsub();
    metaUnsub = onValue(ref(db, "games/" + pin + "/meta"), (snap) => onMeta(snap.val() || {}));
  }

  function onMeta(meta) {
    const state = meta.state, q = meta.currentQuestion;
    if (state === "lobby") showPlayerView("player-wait");
    else if (state === "question") {
      if (q !== lastQuestion) { lastQuestion = q; answeredThis = false; renderAnswerButtons(q); }
    }
    else if (state === "reveal") showResult(q);
    else if (state === "ended") showFinal();
    // 'leaderboard' – השחקן נשאר במסך התוצאה שלו
  }

  function renderAnswerButtons(q) {
    $("#player-qnum").textContent = q + 1;
    const grid = $("#player-answers"); grid.innerHTML = "";
    for (let idx = 0; idx < 4; idx++) {
      const btn = document.createElement("button");
      btn.className = "answer-tile c" + idx;
      btn.innerHTML = `<span class="shape">${SHAPES[idx]}</span>`;
      btn.addEventListener("click", () => answer(q, idx));
      grid.appendChild(btn);
    }
    showPlayerView("player-answer");
  }

  async function answer(q, choice) {
    if (answeredThis) return;
    answeredThis = true;
    await set(ref(db, "games/" + pin + "/answers/" + q + "/" + pid), {
      choice, answeredAt: serverTimestamp()
    });
    showPlayerView("player-locked");
  }

  async function showResult(q) {
    const [ansSnap, meSnap, playersSnap] = await Promise.all([
      get(ref(db, "games/" + pin + "/answers/" + q + "/" + pid)),
      get(ref(db, "games/" + pin + "/players/" + pid)),
      get(ref(db, "games/" + pin + "/players"))
    ]);
    const a = ansSnap.val();
    const me = meSnap.val() || { score: 0 };
    const allPlayers = playersSnap.val() || {};
    const correct = a && a.correct;
    const points = (a && a.points) || 0;

    $("#result-emoji").textContent = correct ? "✅" : (a ? "❌" : "⏰");
    $("#result-text").textContent = correct ? "כל הכבוד!" : (a ? "אוף, לא נכון" : "לא הספקת לענות");
    $("#result-points").textContent = points;
    $("#result-total-score").textContent = me.score || 0;
    const sorted = Object.values(allPlayers).map(p => p.score || 0).sort((x, y) => y - x);
    $("#result-rank").textContent = sorted.indexOf(me.score || 0) + 1;
    if (correct) confetti.burst(50);
    showPlayerView("player-result");
  }

  async function showFinal() {
    const [meSnap, playersSnap] = await Promise.all([
      get(ref(db, "games/" + pin + "/players/" + pid)),
      get(ref(db, "games/" + pin + "/players"))
    ]);
    const me = meSnap.val() || { score: 0 };
    const allPlayers = playersSnap.val() || {};
    const sorted = Object.values(allPlayers).map(p => p.score || 0).sort((x, y) => y - x);
    const rank = sorted.indexOf(me.score || 0) + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🎉";
    $("#player-final-rank").textContent = `${medal} מקום ${rank}`;
    $("#player-final-score").textContent = me.score || 0;
    showPlayerView("player-end");
    if (rank <= 3) confetti.burst(120);
  }

  function showErr(msg) { const e = $("#join-error"); e.textContent = msg; e.hidden = false; }

  $("#btn-join").addEventListener("click", join);
  $("#input-name").addEventListener("keydown", (e) => { if (e.key === "Enter") join(); });

  return {};
})();

/* ==========================================================================
   ניווט ראשי + טעינה
   ========================================================================== */
// החלת תמונת סבא צדוק על כל ספינרי הטעינה
$$(".grandpa-photo").forEach(img => { img.src = GRANDPA_PHOTO; });

$("#btn-goto-host").addEventListener("click", () => { showScreen("screen-editor"); Editor.init(); });
$("#btn-goto-player").addEventListener("click", () => { showScreen("screen-player"); });

// אם נכנסו דרך QR עם ?pin=XXXXXX – פתיחה ישירה במסך שחקן עם הקוד ממולא
const pinParam = new URLSearchParams(location.search).get("pin");
if (pinParam && /^\d{4,6}$/.test(pinParam)) {
  showScreen("screen-player");
  $("#input-pin").value = pinParam;
} else {
  showScreen("screen-home");
}
