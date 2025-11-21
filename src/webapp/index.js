class HeartVisualHandler {
    constructor() {
        this.livesBox = document.getElementById("lives");
        this._prev_lives = 3;
    }

    renderHearts() {
        this.livesBox.innerHTML = "";
        for (let i = 0; i < _prev_lives; i++) {
            const heartVisual = document.createElement("div");
            heartVisual.classList.add("heart");
            heartVisual.textContent = "❤️";
            this.livesBox.appendChild(heartVisual);
        }
    }

    explodeHeart() {
        const hearts = this.livesBox.querySelectorAll(".heart");
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

    update(livesCount) {
        // Fetch current lives from server
        if (livesCount === this._prev_lives) return;
        
        // Explode hearts for lost lives
        while (lives < this._prev_lives) {
            this.explodeHeart();
            this._prev_lives--;
        }

        // Update prev lives
        this.renderHearts();
    }
}

class TimerVisualHandler {
    constructor() {
        setInterval(() => this.updateTimer(), 50);
        this.timerBox = document.getElementById("timer");
    }

    updateTimer() {
        const timeReq = fetch('/api/time_remaining').then(r => r.ok ? r.json() : null).catch(() => null);
        const time_remaining = timeReq.time_remaining;
        this.timerBox.textContent = `Time: ${Math.max(0, time_remaining).toFixed(1)}s`;
    }
}

class ProgressVisualHandler {
    constructor() 
    {
        this.progressBox = document.getElementById('progress');
    }

    update(colorData) {
        if (!progressBox) return;

        // Clear existing
        this.progressBox.innerHTML = '';
        // Determine total slots
        const totalSlots = colorData ? colorData["total"] : 0;
        const inputtedColors = colorData ? colorData["correctly_inputted_colors"] : [];

        for (let i = 0; i < totalSlots; i++) {
            const chip = document.createElement('div');
            chip.classList.add('chip');

            if (i < inputtedColors.length) {
                // fill with the correct color if available
                const color = inputtedColors[i];
                if (color) chip.classList.add(color);
                chip.classList.add('correct');
            } else {
                // empty placeholder slot
                chip.classList.add('placeholder');
            }

            this.progressBox.appendChild(chip);
        }
    }
}

class ButtonVisualHandler {
    constructor() {}

    initializeButtons()
    {
        // Get the buttons
        const buttons = document.querySelectorAll('.circle');

        // Add event listeners for visual feedback
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.remove('flash');
                void button.offsetWidth; // Trigger reflow for restart animation
                button.classList.add('flash');
            });
        });

        // Add click listeners to circles for color input
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const color = button.dataset.color;
                // Send the color input to the server
                const results = fetch('/api/input', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ color })
                }).catch(() => {});

                // Visual feedback handled in the click listener above
                const feedback = results["feedback"];
                if (feedback === "success") {
                    button.classList.add('btn-correct');
                    button.classList.remove('flash');
                    void button.offsetWidth;
                    button.classList.add('flash');
                    setTimeout(() => { button.classList.remove('btn-correct'); }, 500);

                } else if (feedback === "wrong") {
                    // Mark button as wrong
                    button.classList.add('btn-wrong');
                    button.classList.remove('flash');
                    void button.offsetWidth;
                    button.classList.add('flash');
                    setTimeout(() => { button.classList.remove('btn-wrong'); }, 500);

                } else if (feedback === "input_disabled") {
                    // Don't provide feedback if input is disabled
                }
            });
        });
    }
}

class CelebrationVisualHandler {
    constructor() 
    {
        this._animationPlaying = false;
    }

    playRoundCompleteAnimation() {
        if (this._animationPlaying) return;
        this._animationPlaying = true;
        
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
            setTimeout(() => { conf.remove(); this._animationPlaying = true; }, 2200);
        }

        // remove overlay after animations complete
        setTimeout(() => {
            overlay.remove();
        }, 1400);
    }

    update(statusData) {
        const is_round_over = statusData["is_round_complete"];
        const is_gameover = statusData["is_gameover"];
        const is_running = statusData["game_started"];

        if (is_round_over && !is_gameover && is_running) {
            this.playRoundCompleteAnimation();
        }
    }
}

class GameScreenHandler {
    constructor() 
    {
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.gameRoot = document.getElementById('game-root');

        /* START BUTTON */
        this.startBtn.addEventListener('click', () => {
            fetch('/api/start', { method: 'POST' })
            .then(res => res.json())
            .then(() => {
                // hide start screen
                startScreen.style.display = 'none';
                gameRoot.setAttribute('aria-hidden','false');
            })
            .catch(() => {
                // still hide and start polling for local dev
                startScreen.style.display = 'none';
                gameRoot.setAttribute('aria-hidden','false');
            });
        });
    }

    showRestartScreen() {
        startScreen.style.display = 'flex';
        gameRoot.setAttribute('aria-hidden','true');
        startScreen.querySelector('#start-btn').textContent = 'Restart';
        clearInterval(pollInterval);
        pollInterval = null;
        renderProgress([], 0);
    }

    showStartScreen()
    {
        startScreen.style.display = 'flex';
        gameRoot.setAttribute('aria-hidden','true');
        startScreen.querySelector('#start-btn').textContent = 'Start';
        clearInterval(pollInterval);
        pollInterval = null;
        renderProgress([], 0);
    }

    showGameScreen()
    {
        startScreen.style.display = 'none';
        gameRoot.setAttribute('aria-hidden','false');
    }

    update(statusData)
    {
        const gameover = statusData["is_gameover"];
        const is_running = statusData["game_started"];

        if (gameover) {
            this.showRestartScreen();
        } else if (!is_running) {
            this.showStartScreen();
        } else {
            this.showGameScreen();
        }
    }
}

class VisualManager {
    constructor() {
        this.heartHandler = new HeartVisualHandler();
        this.timerHandler = new TimerVisualHandler();
        this.progressHandler = new ProgressVisualHandler();
        this.buttonHandler = new ButtonVisualHandler();
        this.celebrationHandler = new CelebrationVisualHandler();
        this.gameScreenHandler = new GameScreenHandler();

        setInterval(() => this.updateVisuals(), 100);
    }

    updateVisuals() {
        const statusResults = fetch('/api/status').then(r => r.ok ? r.json() : null).catch(() => null);
        const lives = statusResults["lives"];
        const colorData = fetch('/api/inputted_colors').then(r => r.ok ? r.json() : null).catch(() => null);

        // Update each visual component as needed
        this.heartHandler.update(lives);
        this.timerHandler.updateTimer();
        this.progressHandler.update(colorData);
        this.celebrationHandler.update(statusResults);
        this.gameScreenHandler.update(statusResults);
    }
}

new VisualManager();