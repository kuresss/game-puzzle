// src/gameCore.js
var CANVAS_W = 400;
var CANVAS_H = 500;
var PADDLE_H = 12;
var PADDLE_Y = 460;
var BALL_RADIUS = 8;
var BRICK_COLS = 8;
var BRICK_ROWS = 5;
var BRICK_W = 44;
var BRICK_H = 18;
var BRICK_PAD = 4;
var BRICK_OFFSET_X = 12;
var BRICK_OFFSET_Y = 48;
var LIVES = 3;
var DIFFICULTIES = {
  easy: { ballCount: 1, paddleW: 100, ballSpeed: 3.5, label: "\u304B\u3093\u305F\u3093" },
  normal: { ballCount: 1, paddleW: 80, ballSpeed: 4, label: "\u3075\u3064\u3046" },
  hard: { ballCount: 1, paddleW: 60, ballSpeed: 5, label: "\u3080\u305A\u304B\u3057\u3044" },
  oni: { ballCount: 2, paddleW: 40, ballSpeed: 5, label: "\u{1F534} \u9B3C" }
};
function createBricks() {
  const bricks = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({ row, col, alive: true });
    }
  }
  return bricks;
}
function createBall(paddleY = 460, canvasW = 400, speed = 4) {
  return { x: canvasW / 2, y: paddleY - 20, vx: 2, vy: -speed };
}
function createPaddle(canvasW = 400, paddleW = 80) {
  return { x: (canvasW - paddleW) / 2 };
}
function movePaddle(paddle, dx, canvasW, paddleW) {
  const nx = Math.max(0, Math.min(canvasW - paddleW, paddle.x + dx));
  return { ...paddle, x: nx };
}
function moveBall(ball) {
  return { ...ball, x: ball.x + ball.vx, y: ball.y + ball.vy };
}
function reflectBallX(ball) {
  return { ...ball, vx: -ball.vx };
}
function reflectBallY(ball) {
  return { ...ball, vy: -ball.vy };
}
function isBallOutBottom(ball, canvasH) {
  return ball.y > canvasH;
}
function checkWallCollision(ball, canvasW) {
  let b = ball;
  let reflected = false;
  if (b.x - BALL_RADIUS <= 0) {
    b = { ...b, x: BALL_RADIUS, vx: Math.abs(b.vx) };
    reflected = true;
  } else if (b.x + BALL_RADIUS >= canvasW) {
    b = { ...b, x: canvasW - BALL_RADIUS, vx: -Math.abs(b.vx) };
    reflected = true;
  }
  if (b.y - BALL_RADIUS <= 0) {
    b = { ...b, y: BALL_RADIUS, vy: Math.abs(b.vy) };
    reflected = true;
  }
  return { ball: b, reflected };
}
function checkPaddleCollision(ball, paddle, paddleW, paddleH, paddleY) {
  const ballBottom = ball.y + BALL_RADIUS;
  const ballLeft = ball.x - BALL_RADIUS;
  const ballRight = ball.x + BALL_RADIUS;
  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + paddleW;
  const paddleTop = paddleY;
  const paddleBot = paddleY + paddleH;
  const overlapsX = ballRight >= paddleLeft && ballLeft <= paddleRight;
  const overlapsY = ballBottom >= paddleTop && ball.y <= paddleBot;
  if (!overlapsX || !overlapsY || ball.vy <= 0) {
    return { ball, hit: false };
  }
  const hitPos = (ball.x - paddleLeft) / paddleW * 2 - 1;
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  const newVx = hitPos * speed * 0.8;
  const newVy = -Math.abs(ball.vy);
  const newBall = {
    ...ball,
    y: paddleTop - BALL_RADIUS,
    vx: newVx,
    vy: newVy
  };
  return { ball: newBall, hit: true };
}
function checkBrickCollisions(ball, bricks, brickW, brickH, brickOffsetX, brickOffsetY, brickCols, brickPad) {
  let b = ball;
  let pts = 0;
  const newBricks = bricks.map((brick) => {
    if (!brick.alive) return brick;
    const bx = brickOffsetX + brick.col * (brickW + brickPad);
    const by = brickOffsetY + brick.row * (brickH + brickPad);
    const ballLeft = b.x - BALL_RADIUS;
    const ballRight = b.x + BALL_RADIUS;
    const ballTop = b.y - BALL_RADIUS;
    const ballBottom = b.y + BALL_RADIUS;
    const overlapX = ballRight >= bx && ballLeft <= bx + brickW;
    const overlapY = ballBottom >= by && ballTop <= by + brickH;
    if (!overlapX || !overlapY) return brick;
    const overlapLeft = ballRight - bx;
    const overlapRight = bx + brickW - ballLeft;
    const overlapTop = ballBottom - by;
    const overlapBottom = by + brickH - ballTop;
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);
    if (minOverlapX < minOverlapY) {
      b = reflectBallX(b);
    } else {
      b = reflectBallY(b);
    }
    pts += (BRICK_ROWS - brick.row) * 10 + 10;
    return { ...brick, alive: false };
  });
  return { ball: b, bricks: newBricks, points: pts };
}
function countAliveBricks(bricks) {
  return bricks.filter((b) => b.alive).length;
}
function speedUpBall(ball, factor) {
  const cap = (v) => {
    const scaled = v * factor;
    const sign = scaled >= 0 ? 1 : -1;
    return sign * Math.min(Math.abs(scaled), 12);
  };
  return { ...ball, vx: cap(ball.vx), vy: cap(ball.vy) };
}

// src/storage.js
var STORAGE_KEYS = {
  bestScore: "game14_breakout_best",
  bestScoreForDifficulty: (difficulty) => `game14_breakout_best_${difficulty}`
};
function loadBestScore(storage, difficulty) {
  const key = difficulty ? STORAGE_KEYS.bestScoreForDifficulty(difficulty) : STORAGE_KEYS.bestScore;
  const raw = storage.getItem(key);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}
function saveBestScore(storage, score, difficulty) {
  const key = difficulty ? STORAGE_KEYS.bestScoreForDifficulty(difficulty) : STORAGE_KEYS.bestScore;
  storage.setItem(key, String(score));
}
var STATS_KEY = "game14_breakout_stats";
function loadStats(storage) {
  try {
    const s = JSON.parse(storage.getItem(STATS_KEY));
    if (s && typeof s === "object") return s;
  } catch (_) {
  }
  return { gamesPlayed: 0, wins: 0, highScore: 0, totalScore: 0 };
}
function saveStats(storage, stats) {
  storage.setItem(STATS_KEY, JSON.stringify(stats));
}

// src/audio.js
function playTone(freq, duration, type = "sine", vol = 0.25) {
  if (localStorage.getItem("global_mute") === "1") return;
  try {
    const ctx2 = new AudioContext();
    const osc = ctx2.createOscillator();
    const gain = ctx2.createGain();
    osc.connect(gain);
    gain.connect(ctx2.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx2.currentTime);
    gain.gain.exponentialRampToValueAtTime(1e-3, ctx2.currentTime + duration);
    osc.start();
    osc.stop(ctx2.currentTime + duration);
  } catch (_) {
  }
}
var sounds = {
  paddle: () => playTone(440, 0.06, "sine"),
  brick: () => playTone(660, 0.08, "triangle"),
  wall: () => playTone(330, 0.05, "sine", 0.15),
  lose: () => {
    playTone(200, 0.15, "sawtooth");
    setTimeout(() => playTone(150, 0.3, "sawtooth"), 120);
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.15, "triangle"), i * 100));
  }
};

// script.js
var BRICK_COLORS = ["#e63946", "#f4a261", "#e9c46a", "#2a9d8f", "#457b9d"];
var PADDLE_SPEED = 8;
var BG_COLOR = "#0d1b2a";
var PADDLE_COLOR = "#edc22e";
var BALL_COLOR = "#f9f6f2";
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}
var canvas = (
  /** @type {HTMLCanvasElement} */
  getEl("canvas")
);
var ctx = canvas.getContext("2d");
var scoreEl = getEl("score");
var bestScoreEl = getEl("best-score");
var livesEl = getEl("lives");
var levelEl = getEl("level-display");
var overModal = getEl("over-modal");
var overScoreEl = getEl("over-score-text");
var overBestEl = getEl("over-best-text");
var clearModal = getEl("clear-modal");
var clearScoreEl = getEl("clear-score-text");
var pauseBtn = getEl("pause-btn");
var pauseOverlay = getEl("pause-overlay");
var diffSelect = getEl("difficulty");
var statsModal = getEl("stats-modal");
function openModal(el) {
  el.hidden = false;
  const btn = el.querySelector("button");
  if (btn) btn.focus();
}
function closeModal(el) {
  el.hidden = true;
}
var state = {
  balls: [],
  paddle: createPaddle(),
  bricks: createBricks(),
  score: 0,
  bestScore: 0,
  lives: LIVES,
  level: 1,
  status: "idle",
  // 'idle' | 'playing' | 'over'
  paused: false,
  rafId: null,
  difficulty: "normal",
  stats: loadStats(localStorage)
};
var keys = { left: false, right: false };
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === "Escape" || e.key === "p" || e.key === "P") togglePause();
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
});
canvas.addEventListener("mousemove", (e) => {
  if (state.status !== "playing" || state.paused) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const paddleW = DIFFICULTIES[state.difficulty].paddleW;
  state.paddle = { x: Math.max(0, Math.min(CANVAS_W - paddleW, mouseX - paddleW / 2)) };
});
var lastTouchX = null;
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  lastTouchX = e.touches[0].clientX;
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (lastTouchX === null) return;
  if (state.status !== "playing" || state.paused) {
    lastTouchX = e.touches[0].clientX;
    return;
  }
  const dx = e.touches[0].clientX - lastTouchX;
  lastTouchX = e.touches[0].clientX;
  const paddleW = DIFFICULTIES[state.difficulty].paddleW;
  state.paddle = movePaddle(state.paddle, dx, CANVAS_W, paddleW);
}, { passive: false });
canvas.addEventListener("touchend", () => {
  lastTouchX = null;
});
canvas.addEventListener("touchcancel", () => {
  lastTouchX = null;
});
function togglePause() {
  if (state.status !== "playing") return;
  state.paused = !state.paused;
  if (state.paused) {
    cancelAnimationFrame(state.rafId);
    pauseOverlay.hidden = false;
    pauseBtn.textContent = "\u25B6";
  } else {
    pauseOverlay.hidden = true;
    pauseBtn.textContent = "\u23F8";
    gameLoop();
  }
}
function drawBricks() {
  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    const x = BRICK_OFFSET_X + brick.col * (BRICK_W + BRICK_PAD);
    const y = BRICK_OFFSET_Y + brick.row * (BRICK_H + BRICK_PAD);
    ctx.fillStyle = BRICK_COLORS[brick.row % BRICK_COLORS.length];
    ctx.beginPath();
    ctx.roundRect(x, y, BRICK_W, BRICK_H, 3);
    ctx.fill();
  }
}
function drawPaddle() {
  const paddleW = DIFFICULTIES[state.difficulty].paddleW;
  ctx.fillStyle = PADDLE_COLOR;
  ctx.beginPath();
  ctx.roundRect(state.paddle.x, PADDLE_Y, paddleW, PADDLE_H, 5);
  ctx.fill();
}
function drawBalls() {
  ctx.fillStyle = BALL_COLOR;
  for (const ball of state.balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}
function draw() {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawBricks();
  drawPaddle();
  drawBalls();
  if (state.status === "idle") {
    ctx.fillStyle = "rgba(13,27,42,0.7)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#f9f6f2";
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("\u300C\u65B0\u3057\u3044\u30B2\u30FC\u30E0\u300D\u3092\u62BC\u3057\u3066\u30B9\u30BF\u30FC\u30C8", CANVAS_W / 2, CANVAS_H / 2);
    ctx.textAlign = "left";
  }
}
function renderHUD() {
  scoreEl.textContent = String(state.score);
  bestScoreEl.textContent = String(state.bestScore);
  livesEl.textContent = "\u25CF".repeat(state.lives);
  levelEl.textContent = `Lv.${state.level}`;
}
function loseLife() {
  sounds.lose();
  state.lives -= 1;
  if (state.lives <= 0) {
    state.status = "over";
    cancelAnimationFrame(state.rafId);
    renderHUD();
    draw();
    const isBest = state.score > state.bestScore;
    if (isBest) {
      state.bestScore = state.score;
      saveBestScore(localStorage, state.bestScore, state.difficulty);
    }
    state.stats.gamesPlayed += 1;
    state.stats.totalScore += state.score;
    if (state.score > state.stats.highScore) state.stats.highScore = state.score;
    saveStats(localStorage, state.stats);
    overScoreEl.textContent = `\u30B9\u30B3\u30A2: ${state.score}\u70B9`;
    overBestEl.hidden = !isBest;
    getEl("share-btn").hidden = false;
    renderHUD();
    setTimeout(() => openModal(overModal), 200);
  } else {
    const { ballCount, paddleW, ballSpeed } = DIFFICULTIES[state.difficulty];
    state.balls = Array.from({ length: ballCount }, () => createBall(PADDLE_Y, CANVAS_W, ballSpeed));
    state.paddle = createPaddle(CANVAS_W, paddleW);
  }
}
function nextLevel() {
  state.stats.wins += 1;
  saveStats(localStorage, state.stats);
  state.level += 1;
  state.bricks = createBricks();
  const { ballCount, paddleW, ballSpeed } = DIFFICULTIES[state.difficulty];
  const speedFactor = Math.pow(1.05, state.level - 1);
  state.balls = Array.from({ length: ballCount }, () => speedUpBall(createBall(PADDLE_Y, CANVAS_W, ballSpeed), speedFactor));
  state.paddle = createPaddle(CANVAS_W, paddleW);
  clearScoreEl.textContent = `\u30B9\u30B3\u30A2: ${state.score}\u70B9`;
  openModal(clearModal);
  state.status = "paused";
}
function gameLoop() {
  if (state.status !== "playing" || state.paused) return;
  const { paddleW } = DIFFICULTIES[state.difficulty];
  if (keys.left) state.paddle = movePaddle(state.paddle, -PADDLE_SPEED, CANVAS_W, paddleW);
  if (keys.right) state.paddle = movePaddle(state.paddle, PADDLE_SPEED, CANVAS_W, paddleW);
  const survivingBalls = [];
  let totalPoints = 0;
  for (let ball of state.balls) {
    ball = moveBall(ball);
    const wallResult = checkWallCollision(ball, CANVAS_W);
    ball = wallResult.ball;
    if (wallResult.reflected) sounds.wall();
    const paddleResult = checkPaddleCollision(ball, state.paddle, paddleW, PADDLE_H, PADDLE_Y);
    ball = paddleResult.ball;
    if (paddleResult.hit) sounds.paddle();
    const brickResult = checkBrickCollisions(
      ball,
      state.bricks,
      BRICK_W,
      BRICK_H,
      BRICK_OFFSET_X,
      BRICK_OFFSET_Y,
      BRICK_COLS,
      BRICK_PAD
    );
    ball = brickResult.ball;
    state.bricks = brickResult.bricks;
    if (brickResult.points > 0) sounds.brick();
    totalPoints += brickResult.points;
    if (!isBallOutBottom(ball, CANVAS_H)) {
      survivingBalls.push(ball);
    }
  }
  state.score += totalPoints;
  state.balls = survivingBalls;
  if (state.balls.length === 0) {
    loseLife();
  }
  if (state.status === "playing" && countAliveBricks(state.bricks) === 0) {
    sounds.win();
    nextLevel();
  }
  renderHUD();
  draw();
  state.rafId = requestAnimationFrame(gameLoop);
}
function startNewGame() {
  cancelAnimationFrame(state.rafId);
  state.difficulty = diffSelect.value;
  const { ballCount, paddleW, ballSpeed } = DIFFICULTIES[state.difficulty];
  state.balls = Array.from({ length: ballCount }, () => createBall(PADDLE_Y, CANVAS_W, ballSpeed));
  state.paddle = createPaddle(CANVAS_W, paddleW);
  state.bricks = createBricks();
  state.score = 0;
  state.lives = LIVES;
  state.level = 1;
  state.paused = false;
  state.status = "playing";
  getEl("share-btn").hidden = true;
  pauseOverlay.hidden = true;
  pauseBtn.textContent = "\u23F8";
  pauseBtn.hidden = false;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderHUD();
  state.rafId = requestAnimationFrame(gameLoop);
}
getEl("new-game").addEventListener("click", startNewGame);
pauseBtn.addEventListener("click", togglePause);
getEl("over-new").addEventListener("click", () => {
  closeModal(overModal);
  startNewGame();
});
getEl("clear-next").addEventListener("click", () => {
  closeModal(clearModal);
  state.status = "playing";
  state.rafId = requestAnimationFrame(gameLoop);
});
getEl("stats-btn").addEventListener("click", () => {
  const s = state.stats;
  const avg = s.gamesPlayed > 0 ? Math.round(s.totalScore / s.gamesPlayed) : 0;
  getEl("stats-played").textContent = String(s.gamesPlayed);
  getEl("stats-wins").textContent = String(s.wins);
  getEl("stats-high").textContent = String(s.highScore);
  getEl("stats-avg").textContent = String(avg);
  openModal(statsModal);
});
getEl("stats-close").addEventListener("click", () => closeModal(statsModal));
var initMuted = localStorage.getItem("global_mute") === "1";
getEl("mute-btn").textContent = initMuted ? "\u{1F507}" : "\u{1F50A}";
getEl("mute-btn").addEventListener("click", () => {
  const muted = localStorage.getItem("global_mute") === "1";
  localStorage.setItem("global_mute", muted ? "0" : "1");
  getEl("mute-btn").textContent = muted ? "\u{1F50A}" : "\u{1F507}";
});
document.body.dataset.theme = localStorage.getItem("global_theme") || "dark";
getEl("theme-btn").addEventListener("click", () => {
  const t = document.body.dataset.theme === "dark" ? "light" : "dark";
  document.body.dataset.theme = t;
  localStorage.setItem("global_theme", t);
});
function formatShareText() {
  const diff = { easy: "\u304B\u3093\u305F\u3093", normal: "\u3075\u3064\u3046", hard: "\u3080\u305A\u304B\u3057\u3044", oni: "\u{1F534}\u9B3C" }[state.difficulty] || state.difficulty;
  const result = state.status === "won" ? "\u{1F389} \u30AF\u30EA\u30A2\uFF01" : "\u30B2\u30FC\u30E0\u30AA\u30FC\u30D0\u30FC";
  return `\u{1F3AE} \u30D6\u30ED\u30C3\u30AF\u5D29\u3057 [${diff}] ${result} \u30B9\u30B3\u30A2: ${state.score}
\u30D9\u30B9\u30C8: ${state.bestScore}`;
}
getEl("share-btn").addEventListener("click", () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl("share-btn").textContent = "\u2705 \u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F";
    setTimeout(() => {
      getEl("share-btn").textContent = "\u{1F4CB} \u30B7\u30A7\u30A2";
    }, 2e3);
  });
});
getEl("fs-btn").addEventListener("click", () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener("fullscreenchange", () => {
  getEl("fs-btn").textContent = document.fullscreenElement ? "\u22A1" : "\u26F6";
});
function init() {
  state.difficulty = diffSelect.value;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderHUD();
  draw();
}
init();
