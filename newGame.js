const CV = document.getElementById("c");
const G = CV.getContext("2d");

const W = 760;
const H = 520;
CV.width = W;
CV.height = H;

// ___DOM refs___
const modeScreen = document.getElementById("mode-screen");
const gameoverEl = document.getElementById("gameover-screen");
const goWho = document.getElementById("go-who");
const goFinal = document.getElementById("go-final");
const btnAgain = document.getElementById("btn-again");
const btn1P = document.getElementById("btn-1p");
const btn2P = document.getElementById("btn-2p");

const DOM = {
    scoreP: document.getElementById("score-p"),
    scoreCPU: document.getElementById("score-cpu"),
    pStreak: document.getElementById("stat-p-streak"),
    pSpeed: document.getElementById("stat-p-speed"),
};

// ____Audio Engine____
let audioCtx = null;
let muted = false;

function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

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
    } catch (e) {}
}

// ____Game Variables____
let gameRunning = false;
let isTwoPlayers = false;

const paddleWidth = 12, paddleHeight = 90;

const player = { x: 20, y: H / 2 - paddleHeight / 2, score: 0, speed: 7, streak: 0, maxSpeed: 0 };
const cpu = { x: W - 32, y: H / 2 - paddleHeight / 2, score: 0, speed: 6 };
const ball = { x: W / 2, y: H / 2, radius: 8, vx: 5, vy: 3 };

const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// ____Modes & Controls____
if (btn1P) btn1P.onclick = () => selectMode(false);
if (btn2P) btn2P.onclick = () => selectMode(true);

function selectMode(twoPlayersMode) {
    isTwoPlayers = twoPlayersMode;
    if (modeScreen) modeScreen.style.display = "none";
    startGame();
}

function movePaddles() {
    // حركة Player 1 (اليسار) - باستخدام أزرار W / S
    if (keys["w"] || keys["W"]) player.y -= player.speed;
    if (keys["s"] || keys["S"]) player.y += player.speed;
    player.y = Math.max(0, Math.min(H - paddleHeight, player.y));

    // حركة الجانب الأيمن (Player 2 أو CPU)
    if (isTwoPlayers) {
        // شخصين: Player 2 يقتاد بأسهم الكيبورد ⬆️ ⬇️
        if (keys["ArrowUp"]) cpu.y -= cpu.speed;
        if (keys["ArrowDown"]) cpu.y += cpu.speed;
    } else {
        // ضد الكمبيوتر: ذكاء اصطناعي يتبع حركة الكرة
        const targetY = ball.y - paddleHeight / 2;
        if (cpu.y < targetY) cpu.y += cpu.speed;
        else if (cpu.y > targetY) cpu.y -= cpu.speed;
    }
    cpu.y = Math.max(0, Math.min(H - paddleHeight, cpu.y));
}

// ____Physics & Updates____
function updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // الارتداد من الجدران العلوية والسفلية
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

    // تصادم مع Player 1
    if (checkCollision(player)) {
        ball.vx = Math.abs(ball.vx) + 0.5;
        ball.x = player.x + paddleWidth + ball.radius; // لمنع التصاق الكرة
        player.streak++;

        const currentSpeed = Math.round(Math.hypot(ball.vx, ball.vy));
        if (currentSpeed > player.maxSpeed) player.maxSpeed = currentSpeed;

        if (DOM.pStreak) DOM.pStreak.innerText = player.streak;
        if (DOM.pSpeed) DOM.pSpeed.innerText = player.maxSpeed;

        playSound(440, "sine", 0.08);
    }

    // تصادم مع الجانب الأيمن (Player 2 / CPU)
    if (checkCollision(cpu)) {
        ball.vx = -Math.abs(ball.vx) - 0.5;
        ball.x = cpu.x - ball.radius; // لمنع التصاق الكرة
        playSound(380, "sine", 0.08);
    }

    // تسجيل الأهداف
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

// ____Drawing Loop____
function draw() {
    G.fillStyle = "#0a0a12";
    G.fillRect(0, 0, W, H);

    // رسم خط المنتصف المتقطع
    G.strokeStyle = "rgba(255, 255, 255, 0.1)";
    G.setLineDash([6, 6]);
    G.beginPath();
    G.moveTo(W / 2, 0);
    G.lineTo(W / 2, H);
    G.stroke();
    G.setLineDash([]);

    // مضرب اللاعب الأول (أزرق)
    G.fillStyle = "#00d4ff";
    G.fillRect(player.x, player.y, paddleWidth, paddleHeight);

    // مضرب اللاعب الثاني / الكمبيوتر (زهري)
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

    movePaddles();
    updateBall();
    draw();

    requestAnimationFrame(gameLoop);
}

// ____State Controls____
function startGame() {
    player.score = 0;
    cpu.score = 0;
    player.streak = 0;
    player.maxSpeed = 0;
    player.y = H / 2 - paddleHeight / 2;
    cpu.y = H / 2 - paddleHeight / 2;
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

    if (goWho) {
        if (isTwoPlayers) {
            goWho.innerText = player.score >= 7 ? "PLAYER 1 WINS" : "PLAYER 2 WINS";
        } else {
            goWho.innerText = player.score >= 7 ? "YOU WIN" : "CPU WINS";
        }
    }
    if (goFinal) goFinal.innerText = `${player.score} - ${cpu.score}`;
}

// إعادة إظهار شاشة اختيار النمط عند الضغط على Play Again
if (btnAgain) {
    btnAgain.onclick = () => {
        if (gameoverEl) gameoverEl.style.display = "none";
        if (modeScreen) modeScreen.style.display = "flex";
    };
}