/* ==========================================================================
   קהוט חוגגים 80 לסבא צדוק!  –  לוגיקת המשחק
   טכנולוגיה: Firebase Realtime Database (SDK מודולרי v10 מ-CDN)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, set, update, get, push, remove,
  onValue, onChildAdded, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/* ============================================================
   🔧 1. הדביקו כאן את ה-firebaseConfig שלכם
   (מקבלים אותו ב-Firebase Console → Project settings → Your apps)
   ⚠️ חובה שיהיה databaseURL של Realtime Database.
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
   📝 2. השאלות של המשחק – ערכו בחופשיות!
   • text = טקסט השאלה (מוצג במסך המנחה)
   • answers = בדיוק 4 תשובות, לפי הסדר: אדום▲, כחול◆, צהוב●, ירוק■
   • correct = מספר התשובה הנכונה (0=אדום, 1=כחול, 2=צהוב, 3=ירוק)
   • time = כמה שניות לשאלה (אופציונלי, ברירת מחדל 20)
   ============================================================ */
const QUESTIONS = [
  {
    text: "באיזו שנה נולד סבא צדוק?",
    answers: ["1946", "1950", "1938", "1962"],
    correct: 0,
    time: 20
  },
  {
    text: "מה המאכל האהוב על סבא צדוק?",
    answers: ["שניצל", "חמין של שבת", "פיצה", "סושי"],
    correct: 1,
    time: 20
  },
  {
    text: "כמה נכדים יש לסבא צדוק?",
    answers: ["3", "5", "8", "12"],
    correct: 2,
    time: 20
  },
  {
    text: "מה היה המקצוע של סבא צדוק?",
    answers: ["רופא", "מורה", "בעל מפעל", "טייס"],
    correct: 2,
    time: 20
  },
  {
    text: "איזו קבוצת כדורגל סבא צדוק אוהד?",
    answers: ["מכבי חיפה", "הפועל תל אביב", "בית\"ר ירושלים", "מכבי תל אביב"],
    correct: 0,
    time: 20
  },
  {
    text: "מה שם הרכב הראשון של סבא צדוק?",
    answers: ["סוסיתא", "פורד אסקורט", "פיאט 127", "סובארו"],
    correct: 2,
    time: 20
  },
  {
    text: "לאן סבא צדוק הכי אוהב לטייל?",
    answers: ["הכנרת", "אילת", "הגולן", "חו\"ל"],
    correct: 2,
    time: 20
  },
  {
    text: "מה סבא צדוק אומר הכי הרבה?",
    answers: ["\"יאללה לישון\"", "\"בתיאבון!\"", "\"מי רעב?\"", "\"בזמני זה היה אחרת\""],
    correct: 3,
    time: 20
  }
];

const SHAPES  = ["▲", "◆", "●", "■"];
const COLORS  = ["אדום", "כחול", "צהוב", "ירוק"];
const DEFAULT_TIME = 20;

/* ---------- אתחול Firebase ---------- */
let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.error("שגיאה באתחול Firebase – ודאו שהדבקתם firebaseConfig תקין:", e);
}

/* ==========================================================================
   כלי עזר כלליים
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

/* ==========================================================================
   🎊 מנוע קונפטי (canvas)
   ========================================================================== */
const confetti = (() => {
  const canvas = $("#confetti-canvas");
  const ctx = canvas.getContext("2d");
  let W, H, pieces = [];
  const palette = ["#e21b3c", "#1368ce", "#ffd23f", "#26890c", "#ff9500", "#ffffff"];

  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  addEventListener("resize", resize); resize();

  function spawn(n, fromTop = false) {
    for (let i = 0; i < n; i++) {
      pieces.push({
        x: Math.random() * W,
        y: fromTop ? -20 : Math.random() * H,
        r: 4 + Math.random() * 6,
        c: palette[Math.floor(Math.random() * palette.length)],
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4
      });
    }
  }
  function burst(n = 140) { spawn(n, true); }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.restore();
    });
    pieces = pieces.filter(p => p.y < H + 30);
    requestAnimationFrame(loop);
  }
  loop();
  // רקע חגיגי עדין קבוע
  setInterval(() => { if (pieces.length < 60) spawn(6, true); }, 700);

  return { burst };
})();

/* ==========================================================================
   ניווט ראשי
   ========================================================================== */
$("#btn-goto-host").addEventListener("click", () => { showScreen("screen-host"); Host.init(); });
$("#btn-goto-player").addEventListener("click", () => { showScreen("screen-player"); });

/* ==========================================================================
   🖥️  לוגיקת המנחה (HOST)
   ========================================================================== */
const Host = (() => {
  let pin = null;
  let gameRef = null;
  let players = {};          // pid -> {name, score}
  let currentIndex = -1;
  let timerId = null;
  let answersUnsub = null;
  let ended = false;
  let revealing = false;

  async function init() {
    if (!db) { alert("Firebase לא מוגדר. הדביקו firebaseConfig ב-app.js"); return; }
    pin = genPin();
    gameRef = ref(db, "games/" + pin);
    ended = false;
    currentIndex = -1;
    players = {};

    await set(gameRef, {
      meta: {
        state: "lobby",
        currentQuestion: -1,
        questionCount: QUESTIONS.length,
        startAt: 0
      }
    });

    $("#host-pin").textContent = pin;
    $("#host-qtotal").textContent = QUESTIONS.length;
    showHostView("host-lobby");

    // מאזין לשחקנים
    onValue(ref(db, "games/" + pin + "/players"), (snap) => {
      players = snap.val() || {};
      const list = Object.entries(players);
      $("#lobby-count").textContent = list.length;
      const ul = $("#lobby-players");
      ul.innerHTML = "";
      list.forEach(([, p]) => {
        const li = document.createElement("li");
        li.textContent = p.name;
        ul.appendChild(li);
      });
      $("#btn-start-game").disabled = list.length === 0;
      // עדכון מונה בשאלה
      $("#host-players-total").textContent = list.length;
    });

    // ניקוי החדר כשעוזבים את הדף
    addEventListener("beforeunload", () => { if (gameRef) remove(gameRef); });
  }

  function startQuestion(i) {
    currentIndex = i;
    const q = QUESTIONS[i];
    const timeLimit = q.time || DEFAULT_TIME;

    // ניקוי תשובות קודמות לשאלה זו
    remove(ref(db, "games/" + pin + "/answers/" + i));
    revealing = false;

    update(ref(db, "games/" + pin + "/meta"), {
      state: "question",
      currentQuestion: i,
      startAt: serverTimestamp()
    });

    // תצוגת מנחה
    $("#host-qnum").textContent = i + 1;
    $("#host-question-text").textContent = q.text;
    $("#host-answered").textContent = "0";
    const grid = $("#host-answers");
    grid.innerHTML = "";
    q.answers.forEach((txt, idx) => {
      const el = document.createElement("div");
      el.className = "answer-tile c" + idx;
      el.innerHTML = `<span class="shape">${SHAPES[idx]}</span><span>${txt}</span>`;
      grid.appendChild(el);
    });
    showHostView("host-question");

    // מונה תשובות בזמן אמת
    if (answersUnsub) answersUnsub();
    answersUnsub = onValue(ref(db, "games/" + pin + "/answers/" + i), (snap) => {
      const ans = snap.val() || {};
      const n = Object.keys(ans).length;
      $("#host-answered").textContent = n;
      const total = Object.keys(players).length;
      if (total > 0 && n >= total) endQuestion(); // כולם ענו
    });

    // טיימר ספירה לאחור
    let remaining = timeLimit;
    const timerEl = $("#host-timer");
    timerEl.textContent = remaining;
    timerEl.classList.remove("urgent");
    clearInterval(timerId);
    timerId = setInterval(() => {
      remaining--;
      timerEl.textContent = Math.max(remaining, 0);
      if (remaining <= 5) timerEl.classList.add("urgent");
      if (remaining <= 0) endQuestion();
    }, 1000);
  }

  async function endQuestion() {
    if (revealing) return;       // מונע חישוב ניקוד כפול
    revealing = true;
    clearInterval(timerId);
    if (answersUnsub) { answersUnsub(); answersUnsub = null; }

    const i = currentIndex;
    const q = QUESTIONS[i];
    const timeLimit = (q.time || DEFAULT_TIME) * 1000;

    // קריאת הזמן ההתחלתי (שרת) והתשובות
    const [metaSnap, ansSnap] = await Promise.all([
      get(ref(db, "games/" + pin + "/meta/startAt")),
      get(ref(db, "games/" + pin + "/answers/" + i))
    ]);
    const startAt = metaSnap.val() || 0;
    const answers = ansSnap.val() || {};

    // חישוב ניקוד + ספירה לגרף
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
        points = Math.round(500 + 500 * factor); // 500–1000 נק'
      }
      // כתיבת תוצאה עבור השחקן
      updates["answers/" + i + "/" + pid + "/correct"] = isCorrect;
      updates["answers/" + i + "/" + pid + "/points"] = points;
      const prev = (players[pid] && players[pid].score) || 0;
      updates["players/" + pid + "/score"] = prev + points;
    }
    updates["meta/state"] = "reveal";
    updates["meta/correct"] = q.correct;
    await update(gameRef, updates);

    // תצוגת חשיפה + גרף
    $("#reveal-question-text").textContent = q.text;
    const barsWrap = $("#reveal-bars");
    barsWrap.innerHTML = "";
    const maxCount = Math.max(1, ...counts);
    q.answers.forEach((txt, idx) => {
      const col = document.createElement("div");
      col.className = "bar-col" + (idx === q.correct ? " correct" : "");
      const h = 20 + (counts[idx] / maxCount) * 200;
      col.innerHTML = `
        <div class="bar c${idx}" style="height:0px">${counts[idx]}</div>
        <div class="bar-shape">${SHAPES[idx]}</div>`;
      barsWrap.appendChild(col);
      requestAnimationFrame(() => {
        col.querySelector(".bar").style.height = h + "px";
      });
    });
    showHostView("host-reveal");
    confetti.burst(80);
  }

  function showLeaderboard(final = false) {
    // מיון שחקנים לפי ניקוד
    const sorted = Object.entries(players)
      .map(([pid, p]) => ({ pid, name: p.name, score: p.score || 0 }))
      .sort((a, b) => b.score - a.score);

    const medals = ["🥇", "🥈", "🥉"];
    const targetList = final ? $("#final-leaderboard") : $("#leaderboard-list");
    targetList.innerHTML = "";
    sorted.slice(0, final ? 20 : 8).forEach((p, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="rank-name"><span class="medal">${medals[idx] || (idx + 1)}</span>${p.name}</span>
        <span class="score">${p.score}</span>`;
      targetList.appendChild(li);
    });

    if (final) {
      const winner = sorted[0];
      $("#winner-podium").innerHTML = winner
        ? `<span class="crown">👑</span>${winner.name} – ${winner.score} נק'!`
        : "";
      update(ref(db, "games/" + pin + "/meta"), { state: "ended" });
      showHostView("host-end");
      confetti.burst(220);
    } else {
      update(ref(db, "games/" + pin + "/meta"), { state: "leaderboard" });
      showHostView("host-leaderboard");
      confetti.burst(120);
    }
  }

  function next() {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= QUESTIONS.length) { showLeaderboard(true); }
    else { startQuestion(nextIdx); }
  }

  async function restart() {
    if (gameRef) await remove(gameRef);
    showScreen("screen-home");
  }

  // חיבור כפתורים
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
  let pin = null;
  let pid = null;
  let name = "";
  let lastQuestion = -1;
  let answeredThis = false;
  let metaUnsub = null;

  async function join() {
    const errEl = $("#join-error");
    errEl.hidden = true;
    pin = $("#input-pin").value.trim();
    name = $("#input-name").value.trim();

    if (!db) { showErr("Firebase לא מוגדר. הדביקו firebaseConfig ב-app.js"); return; }
    if (!/^\d{4,6}$/.test(pin)) { showErr("קוד חדר לא תקין"); return; }
    if (!name) { showErr("נא להזין שם"); return; }

    // בדיקת קיום החדר
    const metaSnap = await get(ref(db, "games/" + pin + "/meta"));
    if (!metaSnap.exists()) { showErr("לא נמצא חדר עם הקוד הזה"); return; }
    if (metaSnap.val().state !== "lobby") { showErr("המשחק כבר התחיל 😅"); return; }

    // רישום השחקן
    const playerRef = push(ref(db, "games/" + pin + "/players"));
    pid = playerRef.key;
    await set(playerRef, { name, score: 0 });

    $("#player-name-echo").textContent = name;
    showPlayerView("player-wait");
    confetti.burst(60);

    // מאזין למצב המשחק
    if (metaUnsub) metaUnsub();
    metaUnsub = onValue(ref(db, "games/" + pin + "/meta"), (snap) => onMeta(snap.val() || {}));
  }

  function onMeta(meta) {
    const state = meta.state;
    const q = meta.currentQuestion;

    if (state === "lobby") {
      showPlayerView("player-wait");
    }
    else if (state === "question") {
      if (q !== lastQuestion) {   // שאלה חדשה
        lastQuestion = q;
        answeredThis = false;
        renderAnswerButtons(q);
      }
    }
    else if (state === "reveal") {
      if (!answeredThis || true) showResult(q); // הצגת תוצאה
    }
    else if (state === "ended") {
      showFinal();
    }
  }

  function renderAnswerButtons(q) {
    $("#player-qnum").textContent = q + 1;
    const grid = $("#player-answers");
    grid.innerHTML = "";
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
      choice,
      answeredAt: serverTimestamp()
    });
    showPlayerView("player-locked");
  }

  async function showResult(q) {
    // קריאת התשובה שלי + הניקוד הכולל
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

    // חישוב דירוג
    const sorted = Object.values(allPlayers).map(p => p.score || 0).sort((x, y) => y - x);
    const rank = sorted.indexOf(me.score || 0) + 1;
    $("#result-rank").textContent = rank;

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

  function showErr(msg) {
    const e = $("#join-error");
    e.textContent = msg; e.hidden = false;
  }

  $("#btn-join").addEventListener("click", join);
  $("#input-name").addEventListener("keydown", (e) => { if (e.key === "Enter") join(); });

  return {};
})();

/* התחלה במסך הבית */
showScreen("screen-home");
