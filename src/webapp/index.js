const livesBox = document.getElementById("lives");
const timerBox = document.getElementById("timer");

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

function fetchStatus() {
    fetch('/api/status')
        .then(res => res.json())
        .then(data => {
            if (data.lives !== undefined) {
                lives = data.lives;
                renderHearts();
            }
        });
    fetch('/api/time')
        .then(res => res.json())
        .then(data => {
            if (data.time_remaining !== undefined) {
                updateTimer(data.time_remaining);
            }
        });
}

setInterval(fetchStatus, 200);

/* Buttons */
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
        fetch('/api/input', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color })
        })
    });
});

renderHearts();