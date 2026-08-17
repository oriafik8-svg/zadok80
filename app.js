const GRANDPA_PHOTO = "https://via.placeholder.com/150/FFD700/000000?text=%D7%A1%D7%91%D7%90";

const AVATARS = [
  { id: "a1", src: GRANDPA_PHOTO, name: "סבא" },
  { id: "a2", src: "https://via.placeholder.com/150/3498db/ffffff?text=%D7%A9%D7%97%D7%A7%D7%9F+1", name: "שחקן 1" },
  { id: "a3", src: "https://via.placeholder.com/150/2ecc71/ffffff?text=%D7%A9%D7%97%D7%A7%D7%9F+2", name: "שחקן 2" }
];

let host1 = { name: "מנחה אלי", isConnected: true, avatarUrl: GRANDPA_PHOTO };
let host2 = { name: "מנחה דנה", isConnected: false, avatarUrl: "https://via.placeholder.com/150/e74c3c/ffffff?text=%D7%93%D7%A0%D7%94" };

let players = [
  { name: "סבא אהרון", score: 950, avatarUrl: GRANDPA_PHOTO },
  { name: "דניאל", score: 820, avatarUrl: "https://via.placeholder.com/150/3498db/ffffff?text=%D7%93%D7%A0%D7%94" },
  { name: "מיכל", score: 710, avatarUrl: "https://via.placeholder.com/150/2ecc71/ffffff?text=%D7%9E%D7%99%D7%9B%D7%9C" },
  { name: "יוסי", score: 500, avatarUrl: "https://via.placeholder.com/150/9b59b6/ffffff?text=%D7%99%D7%95%D7%A1%D7%99" }
];

window.isInGame = false;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');
}

function goToHome() {
    if (window.isInGame) {
        leaveCurrentGame();
    }
    showScreen('home-screen');
}

function leaveCurrentGame() {
    window.isInGame = false;
    console.log("המשחק אופס והשחקן הנותק בהצלחה.");
}

function renderAvatars() {
    const grid = document.getElementById('avatar-grid');
    if (!grid) return;
    grid.innerHTML = AVATARS.map(avatar => `
        <div class="avatar-card" onclick="selectAvatar('${avatar.id}', '${avatar.name}')">
            <img src="${avatar.src}" alt="${avatar.name}">
            <p>${avatar.name}</p>
        </div>
    `).join('');
}

function selectAvatar(id, name) {
    document.getElementById('selected-avatar-text').innerText = `נבחר פרופיל: ${name}`;
}

function renderHost() {
    const hostCard = document.getElementById('host-display-card');
    if (!hostCard) return;
    const host = getHostProfileRepresentation(host1, host2);
    if (host.isOfflinePlaceholder) {
        hostCard.innerHTML = `<p style="color: #7f8c8d;">${host.name}</p>`;
    } else {
        hostCard.innerHTML = `
            <img src="${host.avatarUrl}" style="width:60px; height:60px; border-radius:50%;" />
            <h3>${host.name}</h3>
            <p>סטטוס: מחובר/ת</p>
        `;
    }
}

function getHostProfileRepresentation(h1, h2) {
    const is1 = h1 && h1.isConnected;
    const is2 = h2 && h2.isConnected;
    if (is1 && is2) return Math.random() < 0.5 ? h1 : h2;
    if (is1) return h1;
    if (is2) return h2;
    return { name: "השחקנים אינם מחוברים, כאשר יתחברו הם יחוברו", isOfflinePlaceholder: true };
}

function renderLeaderboard() {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    if (sorted[0]) updatePodiumStep(1, sorted[0]);
    if (sorted[1]) updatePodiumStep(2, sorted[1]);
    if (sorted[2]) updatePodiumStep(3, sorted[2]);
    
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    list.innerHTML = sorted.map((p, index) => `
        <div class="leaderboard-item">
            <span><strong>#${index + 1}</strong></span>
            <img src="${p.avatarUrl}" class="profile-icon" alt="${p.name}">
            <span>${p.name}</span>
            <span>${p.score} נקודות</span>
        </div>
    `).join('');
}

function updatePodiumStep(place, player) {
    const step = document.getElementById(`podium-place-${place}`);
    if (step) {
        step.querySelector('.podium-details').innerHTML = `
            <img src="${player.avatarUrl}" class="podium-avatar" />
            <div><strong>${player.name}</strong></div>
            <div>${player.score} נ'</div>
        `;
    }
}

window.onload = () => {
    renderAvatars();
    renderHost();
    renderLeaderboard();
};
