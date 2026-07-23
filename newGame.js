const CV = document.getElementById("c");
const G = CV.getContext("2d");

const W = 760;
const H = 520;
CV.width = W;
CV.height = H;

// ___DOM refs___
const gameoverEl = document.getElementById("gameover-screen");
const goWho = document.getElementById("go-who");
const goFinal = document.getElementById("go-final");
const btnAgain = document.getElementById("btn-again");

const DOM = {
    scoreP: document.getElementById("score-p"),
    scoreCPU: document.getElementById("score-cpu"),
    pStreak: document.getElementById("stat-p-streak"),
    pSpeed: document.getElementById("stat-p-speed"),
    pPower: document.getElementById("stat-p-power"),
};

// ____Audio Engine____
let audioCtx = null;
let muted = false;

function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

// دالة بسيطة لتوليد أصوات اللعبة
function playSound(freq, type = "sine", duration = 0.1) {
    if (muted) return;
    try {
        const ctx = getAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch(e) {}
}

let gameRunning = false;
const paddleWidth = 12, paddleHeight = 90;

const player = { x: 20, y: H / 2 - paddleHeight / 2, score: 0, speed: 7, streak: 0, maxSpeed: 0 };
const cpu = { x: W - 32, y: H / 2 - paddleHeight / 2, score: 0, speed: 5 };
const ball = { x: W / 2, y: H / 2, radius: 8, vx: 5, vy: 3 };

const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

function movePlayer() {
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) player.y -= player.speed;
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) player.y += player.speed;
    player.y = Math.max(0, Math.min(H - paddleHeight, player.y));
}

function moveCPU() {
    const targetY = ball.y - paddleHeight / 2;
    if (cpu.y < targetY) cpu.y += cpu.speed;
    else if (cpu.y > targetY) cpu.y -= cpu.speed;
    cpu.y = Math.max(0, Math.min(H - paddleHeight, cpu.y));
}

function updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // الارتداد من السقف والأرضية
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= H) {
        ball.vy *= -1;
        playSound(300, "square", 0.05);
    }

    function checkCollision(p) {
        return ball.x + ball.radius >= p.x &&
               ball.x - ball.radius <= p.x + paddleWidth &&
               ball.y >= p.y &&
               ball.y <= p.y + paddleHeight;
    }

    // ارتداد من مضرب اللاعب
    if (checkCollision(player)) {
        ball.vx = Math.abs(ball.vx) + 0.5;
        ball.x = player.x + paddleWidth + ball.radius; // لمنع الالتصاق
        player.streak++;
        
        // تحديث السرعة القصوى
        const currentSpeed = Math.round(Math.hypot(ball.vx, ball.vy));
        if (currentSpeed > player.maxSpeed) player.maxSpeed = currentSpeed;
        
        if (DOM.pStreak) DOM.pStreak.innerText = player.streak;
        if (DOM.pSpeed) DOM.pSpeed.innerText = player.maxSpeed;
        
        playSound(440, "sine", 0.08);
    }

    // ارتداد من مضرب الكمبيوتر
    if (checkCollision(cpu)) {
        ball.vx = -Math.abs(ball.vx) - 0.5;
        ball.x = cpu.x - ball.radius; // لمنع الالتصاق
        playSound(380, "sine", 0.08);
    }

    // تسجيل النقاط
    if (ball.x < 0) {
        cpu.score++;
        player.streak = 0;
        if (DOM.pStreak) DOM.pStreak.innerText = 0;
        playSound(150, "sawtooth", 0.3);
        resetBall();
    } else if (ball.x > W) {
        player.score++;
        playSound(600, "sine", 0.3);
        resetBall();
    }
}

function resetBall() {
    ball.x = W / 2;
    ball.y = H / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.vy = (Math.random() > 0.5 ? 1 : -1) * 3;

    if (DOM.scoreP) DOM.scoreP.innerText = player.score;
    if (DOM.scoreCPU) DOM.scoreCPU.innerText = cpu.score;

    if (player.score >= 7 || cpu.score >= 7) {
        endGame();
    }
}

function draw() {
    G.fillStyle = "#0a0a12";
    G.fillRect(0, 0, W, H);

    // رسم الخط المتقطع
    G.strokeStyle = "rgba(255, 255, 255, 0.1)";
    G.setLineDash([6, 6]);
    G.beginPath();
    G.moveTo(W / 2, 0);
    G.lineTo(W / 2, H);
    G.stroke();
    G.setLineDash([]);

    // مضرب اللاعب
    G.fillStyle = "#00d4ff";
    G.fillRect(player.x, player.y, paddleWidth, paddleHeight);

    // مضرب الكمبيوتر
    G.fillStyle = "#ff0055";
    G.fillRect(cpu.x, cpu.y, paddleWidth, paddleHeight);

    // الكرة
    G.beginPath();
    G.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    G.fillStyle = "#ffffff";
    G.fill();
}

function gameLoop() {
    if (!gameRunning) return;

    movePlayer();
    moveCPU();
    updateBall();
    draw();

    requestAnimationFrame(gameLoop);
}

function startGame() {
    player.score = 0;
    cpu.score = 0;
    player.streak = 0;
    player.maxSpeed = 0;
    gameRunning = true;

    if (DOM.pStreak) DOM.pStreak.innerText = 0;
    if (DOM.pSpeed) DOM.pSpeed.innerText = 0;
    if (gameoverEl) gameoverEl.style.display = "none";

    resetBall();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    if (gameoverEl) gameoverEl.style.display = "flex";
    if (goWho) goWho.innerText = player.score >= 7 ? "YOU WIN" : "CPU WINS";
    if (goFinal) goFinal.innerText = `${player.score} - ${cpu.score}`;
}

// ربط زر إعادة اللعب بعد تعريف الدالة
if (btnAgain) {
    btnAgain.onclick = startGame;
}

// بدء اللعبة
startGame();