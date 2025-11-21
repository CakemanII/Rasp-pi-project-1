class HeartVisualHandler {
    constructor() {
        this.livesBox = document.getElementById("lives");
        this._prev_lives = 3;
    }

    renderHearts() {
        this.livesBox.innerHTML = "";
        for (let i = 0; i < this._prev_lives; i++) {
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

        this._prev_lives = livesCount;

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
        fetch('/api/time_remaining').then(r => r.ok ? r.json() : null)
        .then((timeReq) => {
            const time_remaining = timeReq.time_remaining;
            this.timerBox.textContent = `Time: ${Math.max(0, time_remaining).toFixed(1)}s`;
        })
        .catch(() => null);
    }
}

class ProgressVisualHandler {
    constructor() 
    {
        this.progressBox = document.getElementById('progress');
    }

    update(colorData) {
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
    constructor() 
    {
        this.initializeButtons();
    }

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
                fetch('/api/input', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ color })
                })
                .then(async (response) => {
                    const results = await response.json();
                    // --- Add 50ms threshold ---
                    await new Promise(resolve => setTimeout(resolve, 50));

                    const feedback = results["feedback"];
                    console.log("Feedback:", feedback);

                    if (feedback === "success") {
                        button.classList.add('btn-correct');
                        button.classList.remove('flash');
                        void button.offsetWidth;
                        button.classList.add('flash');
                        setTimeout(() => { button.classList.remove('btn-correct'); }, 500);

                    } else if (feedback === "wrong") {
                        button.classList.add('btn-wrong');
                        button.classList.remove('flash');
                        void button.offsetWidth;
                        button.classList.add('flash');
                        setTimeout(() => { button.classList.remove('btn-wrong'); }, 500);

                    } else if (feedback === "input_disabled") {
                        // Do nothing
                    }
                })
                .catch(() => { 
                    console.log("Input request failed"); 
                });
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
    constructor(progressVisualHandler) 
    {
        this.progressVisualHandler = progressVisualHandler

        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.gameRoot = document.getElementById('game-root');

        /* START BUTTON */
        this.startBtn.addEventListener('click', () => {
            fetch('/api/start', { method: 'POST' })
            .then(res => res.json())
            .then(() => {
                // hide start screen
                this.startScreen.style.display = 'none';
                this.gameRoot.setAttribute('aria-hidden','false');
            })
            .catch(() => {
                this.startScreen.style.display = 'none';
                this.gameRoot.setAttribute('aria-hidden','false');
            });
        });
    }

    showRestartScreen() {
        this.startScreen.style.display = 'flex';
        this.gameRoot.setAttribute('aria-hidden','true');
        this.startScreen.querySelector('#start-btn').textContent = 'Restart';
        this.progressVisualHandler.update();
    }

    showStartScreen()
    {
        this.startScreen.style.display = 'flex';
        this.gameRoot.setAttribute('aria-hidden','true');
        this.startScreen.querySelector('#start-btn').textContent = 'Start';
        this.progressVisualHandler.update();
    }

    showGameScreen()
    {
        this.startScreen.style.display = 'none';
        this.gameRoot.setAttribute('aria-hidden','false');
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
        this.gameScreenHandler = new GameScreenHandler(this.progressHandler);

        setInterval(() => this.updateVisuals(), 100);
    }

    updateVisuals() {
        fetch('/api/status').then(r => r.ok ? r.json() : null)
        .then((results) => {
            const lives = results["lives"];
            this.heartHandler.update(lives);
            this.celebrationHandler.update(results);
            this.gameScreenHandler.update(results);
        })
        .catch(() => null);
        
        fetch('/api/inputted_colors').then(r => r.ok ? r.json() : null)
        .then((colorData) => {
            this.timerHandler.updateTimer();
            this.progressHandler.update(colorData);
        })
        .catch(() => null);
    }
}

new VisualManager();