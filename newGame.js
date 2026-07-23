window.addEventListener("DOMContentLoaded", () => {
    const CV = document.getElementById("c");
    if (!CV) return;
    const G = CV.getContext("2d");

    const W = 760;
    const H = 520;
    CV.width = W;
    CV.height = H;

    // ___DOM Elements___
    const modeScreen = document.getElementById("mode-screen");
    const pauseScreen = document.getElementById("pause-screen");
    const gameoverEl = document.getElementById("gameover-screen");
    
    const goWho = document.getElementById("go-who");
    const goFinal = document.getElementById("go-final");
    
    const btn1P = document.getElementById("btn-1p");
    const btn2P = document.getElementById("btn-2p");
    const btnPauseIcon = document.getElementById("btn-pause-icon");
    const btnResume = document.getElementById("btn-resume");
    const btnReplay = document.getElementById("btn-replay");
    const btnAgain = document.getElementById("btn-again");

    const scoreP = document.getElementById("score-p");
    const scoreCPU = document.getElementById("score-cpu");

    // ____Game Variables____
    let gameRunning = false;
    let isPaused = false;
    let isTwoPlayers = false;

    const paddleWidth = 12;
    const paddleHeight = 90;

    const player = { x: 20, y: H / 2 - paddleHeight / 2, score: 0, speed: 8 };
    const cpu = { x: W - 32, y: H / 2 - paddleHeight / 2, score: 0, speed: 6 };
    const ball = { x: W / 2, y: H / 2, radius: 8, vx: 5, vy: 3 };

    const keys = {};

    // ____استجابة الكيبورد والـ ESC____
    window.addEventListener("keydown", (e) => { 
        keys[e.code] = true; 
        keys[e.key] = true; 

        // زر ESC للتحكم بالتوقف المؤقت
        if (e.key === "Escape" || e.code === "Escape") {
            if (gameRunning && !isPaused) {
                pauseGame();
            } else if (isPaused) {
                resumeGame();
            }
        }
    });

    window.addEventListener("keyup", (e) => { 
        keys[e.code] = false; 
        keys[e.key] = false; 
    });

    // تحريك المضرب الأزرق بالماوس
    CV.addEventListener("mousemove", (e) => {
        if (!gameRunning || isPaused) return;
        const rect = CV.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        player.y = mouseY - paddleHeight / 2;
        player.y = Math.max(0, Math.min(H - paddleHeight, player.y));
    });

    // ____ربط الأحداث والأزرار____
    if (btn1P) btn1P.addEventListener("click", () => selectMode(false));
    if (btn2P) btn2P.addEventListener("click", () => selectMode(true));

    if (btnPauseIcon) btnPauseIcon.addEventListener("click", pauseGame);
    if (btnResume) btnResume.addEventListener("click", resumeGame);
    if (btnReplay) btnReplay.addEventListener("click", replayGame);

    if (btnAgain) {
        btnAgain.addEventListener("click", () => {
            if (gameoverEl) gameoverEl.style.display = "none";
            if (modeScreen) modeScreen.style.display = "flex";
        });
    }

    // ____دوال التحكم بالشاشات والنمط____
    function selectMode(twoPlayersMode) {
        isTwoPlayers = twoPlayersMode;
        if (modeScreen) modeScreen.style.display = "none";
        startGame();
    }

    function pauseGame() {
        if (!gameRunning || isPaused) return;
        isPaused = true;
        if (pauseScreen) pauseScreen.style.display = "flex";
    }

    function resumeGame() {
        if (!isPaused) return;
        isPaused = false;
        if (pauseScreen) pauseScreen.style.display = "none";
        requestAnimationFrame(gameLoop); // استكمال الدورة
    }

    function replayGame() {
        isPaused = false;
        gameRunning = false;
        if (pauseScreen) pauseScreen.style.display = "none";
        if (modeScreen) modeScreen.style.display = "flex"; // العودة لشاشة اختيار النمط
    }

    // ____دوال اللعبة الرئيسية____
    function movePaddles() {
        // Player 1 (الازرق)
        if (keys["KeyW"] || keys["w"] || keys["W"] || keys["ص"]) player.y -= player.speed;
        if (keys["KeyS"] || keys["s"] || keys["S"] || keys["س"]) player.y += player.speed;
        player.y = Math.max(0, Math.min(H - paddleHeight, player.y));

        // Player 2 / CPU (الوردي)
        if (isTwoPlayers) {
            if (keys["ArrowUp"]) cpu.y -= cpu.speed;
            if (keys["ArrowDown"]) cpu.y += cpu.speed;
        } else {
            const targetY = ball.y - paddleHeight / 2;
            if (cpu.y < targetY) cpu.y += cpu.speed;
            else if (cpu.y > targetY) cpu.y -= cpu.speed;
        }
        cpu.y = Math.max(0, Math.min(H - paddleHeight, cpu.y));
    }

    function updateBall() {
        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= H) {
            ball.vy *= -1;
        }

        if (ball.x - ball.radius <= player.x + paddleWidth &&
            ball.x + ball.radius >= player.x &&
            ball.y >= player.y && ball.y <= player.y + paddleHeight) {
            ball.vx = Math.abs(ball.vx) + 0.4;
            ball.x = player.x + paddleWidth + ball.radius;
        }

        if (ball.x + ball.radius >= cpu.x &&
            ball.x - ball.radius <= cpu.x + paddleWidth &&
            ball.y >= cpu.y && ball.y <= cpu.y + paddleHeight) {
            ball.vx = -Math.abs(ball.vx) - 0.4;
            ball.x = cpu.x - ball.radius;
        }

        if (ball.x < 0) {
            cpu.score++;
            resetBall();
        } else if (ball.x > W) {
            player.score++;
            resetBall();
        }
    }

    function resetBall() {
        ball.x = W / 2;
        ball.y = H / 2;
        ball.vx = (Math.random() > 0.5 ? 1 : -1) * 5;
        ball.vy = (Math.random() > 0.5 ? 1 : -1) * 3;

        if (scoreP) scoreP.innerText = player.score;
        if (scoreCPU) scoreCPU.innerText = cpu.score;

        if (player.score >= 7 || cpu.score >= 7) {
            endGame();
        }
    }

    function draw() {
        G.fillStyle = "#0a0a12";
        G.fillRect(0, 0, W, H);

        G.strokeStyle = "rgba(255, 255, 255, 0.1)";
        G.setLineDash([6, 6]);
        G.beginPath();
        G.moveTo(W / 2, 0);
        G.lineTo(W / 2, H);
        G.stroke();
        G.setLineDash([]);

        G.fillStyle = "#00d4ff";
        G.fillRect(player.x, player.y, paddleWidth, paddleHeight);

        G.fillStyle = "#ff0055";
        G.fillRect(cpu.x, cpu.y, paddleWidth, paddleHeight);

        G.beginPath();
        G.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        G.fillStyle = "#ffffff";
        G.fill();
    }

    function gameLoop() {
        if (!gameRunning || isPaused) return;

        movePaddles();
        updateBall();
        draw();

        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        player.score = 0;
        cpu.score = 0;
        player.y = H / 2 - paddleHeight / 2;
        cpu.y = H / 2 - paddleHeight / 2;

        if (scoreP) scoreP.innerText = 0;
        if (scoreCPU) scoreCPU.innerText = 0;

        if (gameoverEl) gameoverEl.style.display = "none";
        if (pauseScreen) pauseScreen.style.display = "none";
        if (modeScreen) modeScreen.style.display = "none";

        isPaused = false;
        gameRunning = true;
        resetBall();
        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        gameRunning = false;
        if (gameoverEl) gameoverEl.style.display = "flex";

        if (goWho) {
            if (isTwoPlayers) {
                goWho.innerText = player.score >= 7 ? "PLAYER 1 WINS" : "PLAYER 2 WINS";
            } else {
                goWho.innerText = player.score >= 7 ? "YOU WIN" : "CPU WINS";
            }
        }
        if (goFinal) goFinal.innerText = `${player.score} - ${cpu.score}`;
    }
});