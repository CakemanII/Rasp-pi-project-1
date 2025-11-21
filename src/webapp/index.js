const livesBox = document.getElementById("lives");
const timerBox = document.getElementById("timer");
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameRoot = document.getElementById('game-root');

let lives = 3;
let pollInterval = null;
let lastClickedColor = null;
let lastClickedBtn = null;
let prevCorrectCount = 0;
let prevLives = lives;
let prevTotalSlots = 0;
let comboLock = false;

function renderHearts() {
    livesBox.innerHTML = "";
    for (let i = 0; i < lives; i++) {
        const h = document.createElement("div");
        h.classList.add("heart");
        h.textContent = "❤️";
        livesBox.appendChild(h);
    }
}

function updateTimer(seconds) {
    timerBox.textContent = `Time: ${Math.max(0, seconds).toFixed(1)}s`;
}

/* ---------------- EXPLOSION EFFECT ---------------- */
function explodeHeart() {
    const hearts = livesBox.querySelectorAll(".heart");
    if (!hearts.length) return;

    const heart = hearts[hearts.length - 1];
    const rect = heart.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    /* SCREEN SHAKE */
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 280);

    /* SHOCKWAVE */
    const ring = document.createElement("div");
    ring.classList.add("shockwave");
    ring.style.left = centerX - 40 + "px";
    ring.style.top  = centerY - 40 + "px";
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 550);

    /* FLASH BURST */
    const flash = document.createElement("div");
    flash.classList.add("flash-burst");
    flash.style.left = centerX - 25 + "px";
    flash.style.top  = centerY - 25 + "px";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 350);

    /* SPARK PARTICLES */
    for (let i = 0; i < 14; i++) {
        const spark = document.createElement("div");
        spark.classList.add("spark");

        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 40;

        spark.style.left = centerX + "px";
        spark.style.top  = centerY + "px";
        spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);

        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 600);
    }

    /* Remove heart */
    heart.remove();
}

/* ---------------- COMBO COMPLETE ---------------- */
function playComboComplete() {
    // overlay card
    const overlay = document.createElement('div');
    overlay.className = 'combo-overlay';

    const card = document.createElement('div');
    card.className = 'combo-card';
    card.textContent = 'PERFECT!';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // spawn confetti pieces
    const colors = ['#ff5a6e', '#ffd36b', '#6ee7b7', '#7cc5ff', '#d58cff'];
    const count = 40;
    for (let i = 0; i < count; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];
        // randomize size
        conf.style.width = (6 + Math.random() * 12) + 'px';
        conf.style.height = (10 + Math.random() * 20) + 'px';
        conf.style.top = (-10 - Math.random() * 20) + 'vh';
        conf.style.transform = `rotate(${Math.random() * 360}deg)`;
        conf.style.animationDelay = (Math.random() * 300) + 'ms';
        conf.style.animationDuration = (900 + Math.random() * 800) + 'ms';
        document.body.appendChild(conf);
        // remove after animation
        setTimeout(() => conf.remove(), 2200);
    }

    // remove overlay after animations complete
    setTimeout(() => {
        overlay.remove();
    }, 1400);
}

function fetchStatus() {
    // Fetch status, time and colors in parallel then process together so we can
    // detect events (correct/wrong/combo) reliably.
    const statusReq = fetch('/api/status').then(r => r.ok ? r.json() : null).catch(() => null);
    const timeReq = fetch('/api/time').then(r => r.ok ? r.json() : null).catch(() => null);
    const colorsReq = fetch('/api/colors').then(r => r.ok ? r.json() : null).catch(() => null);

    Promise.all([statusReq, timeReq, colorsReq]).then(([status, timeData, colorsData]) => {
        // Process status (lives, game over)
        if (status && status.lives !== undefined) {
            // wrong input detection by lives decrease
            if (status.lives < prevLives) {
                explodeHeart();
                // mark last clicked as wrong if exists
                if (lastClickedBtn) {
                    lastClickedBtn.classList.add('btn-wrong');
                    // retrigger the flash animation so the wrong shadow appears
                    lastClickedBtn.classList.remove('flash');
                    void lastClickedBtn.offsetWidth;
                    lastClickedBtn.classList.add('flash');
                    setTimeout(() => lastClickedBtn && lastClickedBtn.classList.remove('btn-wrong'), 600);
                }
            }

            lives = status.lives;
            renderHearts();

            if (status.is_game_over) {
                startScreen.style.display = 'flex';
                gameRoot.setAttribute('aria-hidden','true');
                startScreen.querySelector('#start-btn').textContent = 'Restart';
                clearInterval(pollInterval);
                pollInterval = null;
                renderProgress([], 0);
            }

            prevLives = status.lives;
        }

        // Process time
        if (timeData && timeData.time_remaining !== undefined) {
            updateTimer(timeData.time_remaining);
        }

        // Process colors/progress and detect correct inputs or combo completion
        const colors = colorsData && Array.isArray(colorsData.colors) ? colorsData.colors : [];
        const correctCount = colorsData && typeof colorsData.correct_count === 'number' ? colorsData.correct_count : 0;
        const total = colors.length > 0 ? colors.length : 3;

        // If correct_count increased, mark lastClickedBtn as correct
        if (correctCount > prevCorrectCount) {
            if (lastClickedBtn) {
                lastClickedBtn.classList.add('btn-correct');
                // retrigger flash so the correct white shadow appears
                lastClickedBtn.classList.remove('flash');
                void lastClickedBtn.offsetWidth;
                lastClickedBtn.classList.add('flash');
                setTimeout(() => lastClickedBtn && lastClickedBtn.classList.remove('btn-correct'), 500);
            }
        }

        // If correct_count decreased unexpectedly (server reset on wrong), mark wrong
        if (correctCount < prevCorrectCount) {
            if (lastClickedBtn) {
                lastClickedBtn.classList.add('btn-wrong');
                lastClickedBtn.classList.remove('flash');
                void lastClickedBtn.offsetWidth;
                lastClickedBtn.classList.add('flash');
                setTimeout(() => lastClickedBtn && lastClickedBtn.classList.remove('btn-wrong'), 600);
            }
        }

        // Combo complete: just reached full correct count
        if (correctCount === total && total > 0 && prevCorrectCount < total && !comboLock) {
            comboLock = true;
            playComboComplete();
            // allow future combos after a short delay
            setTimeout(() => { comboLock = false; }, 1400);
        }

        renderProgress(colors, correctCount);
        prevCorrectCount = correctCount;
        prevTotalSlots = total;

        // clear lastClicked if we've handled it
        // reset lastClicked if it was handled by above feedback
        // (we clear it every interval to avoid stale references)
        lastClickedBtn = null;
        lastClickedColor = null;

    }).catch(() => {
        // on failure, clear progress but keep polling
        renderProgress([], 0);
    });
}

function startPolling() {
    fetchStatus();
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(fetchStatus, 300);
}

/* Buttons visual feedback */
document.querySelectorAll(".circle").forEach(btn => {
    btn.addEventListener("click", () => {
        btn.classList.remove("flash");
        void btn.offsetWidth;
        btn.classList.add("flash");
    });
});

// Add click listeners to circles for color input
const circles = document.querySelectorAll('.circle');
circles.forEach(circle => {
    circle.addEventListener('click', () => {
        const color = circle.dataset.color;

        // track the last clicked button so we can mark it correct/wrong when the server responds
        lastClickedColor = color;
        lastClickedBtn = circle;
        // remove any previous feedback classes
        circle.classList.remove('btn-correct', 'btn-wrong');

        fetch('/api/input', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color })
        }).catch(() => {});
    });
});

const progressBox = document.getElementById('progress');

function renderProgress(colors = [], correctCount = 0) {
    if (!progressBox) return;
    progressBox.innerHTML = '';
    // Determine total slots: prefer the provided colors length, otherwise show 3 placeholders
    const total = (Array.isArray(colors) && colors.length > 0) ? colors.length : 3;
    const safeCorrect = Math.max(0, Math.min(correctCount || 0, total));

    for (let i = 0; i < total; i++) {
        const chip = document.createElement('div');
        chip.classList.add('chip');

        if (i < safeCorrect) {
            // fill with the correct color if available
            const color = Array.isArray(colors) && colors[i] ? colors[i] : null;
            if (color) chip.classList.add(color);
            chip.classList.add('correct');
        } else {
            // empty placeholder slot
            chip.classList.add('placeholder');
        }

        progressBox.appendChild(chip);
    }
}

/* START BUTTON */
startBtn.addEventListener('click', () => {
    fetch('/api/start', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
            // hide start screen
            startScreen.style.display = 'none';
            gameRoot.setAttribute('aria-hidden','false');
            // ensure UI in sync
            startPolling();
        })
        .catch(() => {
            // still hide and start polling for local dev
            startScreen.style.display = 'none';
            gameRoot.setAttribute('aria-hidden','false');
            startPolling();
        });
});

// initial render
renderHearts();

// Initialize UI state from server: if a game is already started, skip start screen
function initFromServer() {
    // initialize status and colors together
    Promise.all([
        fetch('/api/status').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/time').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/colors').then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([status, timeData, colorsData]) => {
        if (status && status.lives !== undefined) {
            lives = status.lives;
            renderHearts();
        }

        if (timeData && timeData.time_remaining !== undefined) {
            updateTimer(timeData.time_remaining);
        }

        // init progress state from server if available
        if (colorsData) {
            const colors = Array.isArray(colorsData.colors) ? colorsData.colors : [];
            const correctCount = typeof colorsData.correct_count === 'number' ? colorsData.correct_count : 0;
            prevCorrectCount = correctCount;
            prevTotalSlots = colors.length > 0 ? colors.length : 3;
            renderProgress(colors, correctCount);
        }

        // If a game is started on the server and not over, hide the start screen
        if (status && status.game_started && !status.is_game_over) {
            startScreen.style.display = 'none';
            gameRoot.setAttribute('aria-hidden','false');
            startPolling();
        } else {
            // show start screen; set appropriate button text
            startScreen.style.display = 'flex';
            gameRoot.setAttribute('aria-hidden','true');
        }
    }).catch(() => {
        // If status fails, leave start screen visible
        startScreen.style.display = 'flex';
        gameRoot.setAttribute('aria-hidden','true');
    });
}

// run initial check
initFromServer();