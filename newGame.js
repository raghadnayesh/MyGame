const CV = document.getElementById("c");
const G = CV.getContext("2d");

const W = 760;
const H = 520;
CV.width = W;
CV.height = H;

// ___DOM Elements___
const modeScreen = document.getElementById("mode-screen");
const gameoverEl = document.getElementById("gameover-screen");
const goWho = document.getElementById("go-who");
const goFinal = document.getElementById("go-final");
const btnAgain = document.getElementById("btn-again");
const btn1P = document.getElementById("btn-1p");
const btn2P = document.getElementById("btn-2p");

const scoreP = document.getElementById("score-p");
const scoreCPU = document.getElementById("score-cpu");

// ____Game Variables____
let gameRunning = false;
let isTwoPlayers = false;

const paddleWidth = 12, paddleHeight = 90;

const player = { x: 20, y: H / 2 - paddleHeight / 2, score: 0, speed: 7 };
const cpu = { x: W - 32, y: H / 2 - paddleHeight / 2, score: 0, speed: 6 };
const ball = { x: W / 2, y: H / 2, radius: 8, vx: 5, vy: 3 };

const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// ____Mode Selection____
if (btn1P) btn1P.onclick = () => selectMode(false);
if (btn2P) btn2P.onclick = () => selectMode(true);

function selectMode(twoPlayersMode) {
    isTwoPlayers = twoPlayersMode;
    if (modeScreen) modeScreen.style.display = "none";
    startGame();
}

function movePaddles() {
    // Player 1 (اليسار): أزرار W و S
    if (keys["w"] || keys["W"]) player.y -= player.speed;
    if (keys["s"] || keys["S"]) player.y += player.speed;
    player.y = Math.max(0, Math.min(H - paddleHeight, player.y));

    // Player 2 / CPU (اليمين)
    if (isTwoPlayers) {
        // شخصين: أسهم الكيبورد ⬆️ ⬇️
        if (keys["ArrowUp"]) cpu.y -= cpu.speed;
        if (keys["ArrowDown"]) cpu.y += cpu.speed;
    } else {
        // الكمبيوتر
        const targetY = ball.y - paddleHeight / 2;
        if (cpu.y < targetY) cpu.y += cpu.speed;
        else if (cpu.y > targetY) cpu.y -= cpu.speed;
    }
    cpu.y = Math.max(0, Math.min(H - paddleHeight, cpu.y));
}

function updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // ارتداد من السقف والأرض
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= H) {
        ball.vy *= -1;
    }

    // تصادم مع Player 1
    if (ball.x - ball.radius <= player.x + paddleWidth &&
        ball.x + ball.radius >= player.x &&
        ball.y >= player.y && ball.y <= player.y + paddleHeight) {
        ball.vx = Math.abs(ball.vx) + 0.4;
        ball.x = player.x + paddleWidth + ball.radius;
    }

    // تصادم مع Player 2 / CPU
    if (ball.x + ball.radius >= cpu.x &&
        ball.x - ball.radius <= cpu.x + paddleWidth &&
        ball.y >= cpu.y && ball.y <= cpu.y + paddleHeight) {
        ball.vx = -Math.abs(ball.vx) - 0.4;
        ball.x = cpu.x - ball.radius;
    }

    // نقاط
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

    // خط المنتصف
    G.strokeStyle = "rgba(255, 255, 255, 0.1)";
    G.setLineDash([6, 6]);
    G.beginPath();
    G.moveTo(W / 2, 0);
    G.lineTo(W / 2, H);
    G.stroke();
    G.setLineDash([]);

    // اللاعب الأول
    G.fillStyle = "#00d4ff";
    G.fillRect(player.x, player.y, paddleWidth, paddleHeight);

    // اللاعب الثاني / الكمبيوتر
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

function startGame() {
    player.score = 0;
    cpu.score = 0;
    player.y = H / 2 - paddleHeight / 2;
    cpu.y = H / 2 - paddleHeight / 2;

    if (scoreP) scoreP.innerText = 0;
    if (scoreCPU) scoreCPU.innerText = 0;

    if (gameoverEl) gameoverEl.style.display = "none";
    if (modeScreen) modeScreen.style.display = "none";

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

// زر Play Again يعيدك لتحديد النمط من جديد
if (btnAgain) {
    btnAgain.onclick = () => {
        if (gameoverEl) gameoverEl.style.display = "none";
        if (modeScreen) modeScreen.style.display = "flex";
    };
}