import {
  CANVAS_W, CANVAS_H,
  PADDLE_H, PADDLE_Y,
  BALL_RADIUS, BRICK_COLS, BRICK_ROWS,
  BRICK_W, BRICK_H, BRICK_PAD, BRICK_OFFSET_X, BRICK_OFFSET_Y,
  LIVES,
  DIFFICULTIES,
  createBricks, createBall, createPaddle,
  movePaddle, moveBall,
  isBallOutBottom, checkWallCollision, checkPaddleCollision,
  checkBrickCollisions, countAliveBricks, speedUpBall,
} from './src/gameCore.js';
import { loadBestScore, saveBestScore, loadStats, saveStats } from './src/storage.js';
import { sounds } from './src/audio.js';

// ── Brick colors by row ───────────────────────────────────────────────────
const BRICK_COLORS = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d'];
const PADDLE_SPEED = 8;
const BG_COLOR     = '#0d1b2a';
const PADDLE_COLOR = '#edc22e';
const BALL_COLOR   = '#f9f6f2';

// ── DOM refs ──────────────────────────────────────────────────────────────
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const canvas       = /** @type {HTMLCanvasElement} */ (getEl('canvas'));
const ctx          = canvas.getContext('2d');
const scoreEl      = getEl('score');
const bestScoreEl  = getEl('best-score');
const livesEl      = getEl('lives');
const levelEl      = getEl('level-display');
const overModal    = getEl('over-modal');
const overScoreEl  = getEl('over-score-text');
const overBestEl   = getEl('over-best-text');
const clearModal   = getEl('clear-modal');
const clearScoreEl = getEl('clear-score-text');
const pauseBtn     = getEl('pause-btn');
const pauseOverlay = getEl('pause-overlay');
const diffSelect   = getEl('difficulty');
const statsModal   = getEl('stats-modal');

function openModal(el)  { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

// ── Game state ─────────────────────────────────────────────────────────────
const state = {
  balls:      [],
  paddle:     createPaddle(),
  bricks:     createBricks(),
  score:      0,
  bestScore:  0,
  lives:      LIVES,
  level:      1,
  status:     'idle',  // 'idle' | 'playing' | 'over'
  paused:     false,
  rafId:      null,
  difficulty: 'normal',
  stats:      loadStats(localStorage),
};

// ── Input ──────────────────────────────────────────────────────────────────
const keys = { left: false, right: false };

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft')  keys.left  = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft')  keys.left  = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

canvas.addEventListener('mousemove', (e) => {
  if (state.status !== 'playing' || state.paused) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const paddleW = DIFFICULTIES[state.difficulty].paddleW;
  state.paddle = { x: Math.max(0, Math.min(CANVAS_W - paddleW, mouseX - paddleW / 2)) };
});

// ── Touch: relative drag ───────────────────────────────────────────────────
let lastTouchX = null;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  lastTouchX = e.touches[0].clientX;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (lastTouchX === null) return;
  if (state.status !== 'playing' || state.paused) {
    lastTouchX = e.touches[0].clientX;
    return;
  }
  const dx = e.touches[0].clientX - lastTouchX;
  lastTouchX = e.touches[0].clientX;
  const paddleW = DIFFICULTIES[state.difficulty].paddleW;
  state.paddle = movePaddle(state.paddle, dx, CANVAS_W, paddleW);
}, { passive: false });

canvas.addEventListener('touchend', () => { lastTouchX = null; });
canvas.addEventListener('touchcancel', () => { lastTouchX = null; });

// ── Pause ──────────────────────────────────────────────────────────────────
function togglePause() {
  if (state.status !== 'playing') return;
  state.paused = !state.paused;
  if (state.paused) {
    cancelAnimationFrame(state.rafId);
    pauseOverlay.hidden = false;
    pauseBtn.textContent = '▶';
  } else {
    pauseOverlay.hidden = true;
    pauseBtn.textContent = '⏸';
    gameLoop();
  }
}

// ── Render ─────────────────────────────────────────────────────────────────
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

  if (state.status === 'idle') {
    ctx.fillStyle = 'rgba(13,27,42,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#f9f6f2';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('「新しいゲーム」を押してスタート', CANVAS_W / 2, CANVAS_H / 2);
    ctx.textAlign = 'left';
  }
}

function renderHUD() {
  scoreEl.textContent     = String(state.score);
  bestScoreEl.textContent = String(state.bestScore);
  livesEl.textContent     = '●'.repeat(state.lives);
  levelEl.textContent     = `Lv.${state.level}`;
}

// ── Game logic ─────────────────────────────────────────────────────────────
function loseLife() {
  sounds.lose();
  state.lives -= 1;
  if (state.lives <= 0) {
    state.status = 'over';
    cancelAnimationFrame(state.rafId);
    renderHUD();
    draw();
    const isBest = state.score > state.bestScore;
    if (isBest) {
      state.bestScore = state.score;
      saveBestScore(localStorage, state.bestScore, state.difficulty);
    }
    state.stats.gamesPlayed += 1;
    state.stats.totalScore  += state.score;
    if (state.score > state.stats.highScore) state.stats.highScore = state.score;
    saveStats(localStorage, state.stats);
    overScoreEl.textContent = `スコア: ${state.score}点`;
    overBestEl.hidden = !isBest;
    getEl('share-btn').hidden = false;
    renderHUD();
    setTimeout(() => openModal(overModal), 200);
  } else {
    const { ballCount, paddleW, ballSpeed } = DIFFICULTIES[state.difficulty];
    state.balls  = Array.from({ length: ballCount }, () => createBall(PADDLE_Y, CANVAS_W, ballSpeed));
    state.paddle = createPaddle(CANVAS_W, paddleW);
  }
}

function nextLevel() {
  state.stats.wins += 1;
  saveStats(localStorage, state.stats);
  state.level  += 1;
  state.bricks  = createBricks();
  const { ballCount, paddleW, ballSpeed } = DIFFICULTIES[state.difficulty];
  const speedFactor = Math.pow(1.05, state.level - 1);
  state.balls  = Array.from({ length: ballCount }, () => speedUpBall(createBall(PADDLE_Y, CANVAS_W, ballSpeed), speedFactor));
  state.paddle = createPaddle(CANVAS_W, paddleW);
  clearScoreEl.textContent = `スコア: ${state.score}点`;
  openModal(clearModal);
  state.status = 'paused';
}

function gameLoop() {
  if (state.status !== 'playing' || state.paused) return;

  const { paddleW } = DIFFICULTIES[state.difficulty];

  // Keyboard paddle movement
  if (keys.left)  state.paddle = movePaddle(state.paddle, -PADDLE_SPEED, CANVAS_W, paddleW);
  if (keys.right) state.paddle = movePaddle(state.paddle, PADDLE_SPEED, CANVAS_W, paddleW);

  // Process each ball
  const survivingBalls = [];
  let totalPoints = 0;

  for (let ball of state.balls) {
    // Move ball
    ball = moveBall(ball);

    // Wall collisions
    const wallResult = checkWallCollision(ball, CANVAS_W);
    ball = wallResult.ball;
    if (wallResult.reflected) sounds.wall();

    // Paddle collision
    const paddleResult = checkPaddleCollision(ball, state.paddle, paddleW, PADDLE_H, PADDLE_Y);
    ball = paddleResult.ball;
    if (paddleResult.hit) sounds.paddle();

    // Brick collisions
    const brickResult = checkBrickCollisions(
      ball, state.bricks, BRICK_W, BRICK_H,
      BRICK_OFFSET_X, BRICK_OFFSET_Y, BRICK_COLS, BRICK_PAD
    );
    ball = brickResult.ball;
    state.bricks = brickResult.bricks;
    if (brickResult.points > 0) sounds.brick();
    totalPoints += brickResult.points;

    // Ball out bottom → discard this ball
    if (!isBallOutBottom(ball, CANVAS_H)) {
      survivingBalls.push(ball);
    }
  }

  state.score += totalPoints;
  state.balls = survivingBalls;

  // All balls gone → lose a life, respawn
  if (state.balls.length === 0) {
    loseLife();
  }

  // All bricks cleared → level up
  if (state.status === 'playing' && countAliveBricks(state.bricks) === 0) {
    sounds.win();
    nextLevel();
  }

  renderHUD();
  draw();

  state.rafId = requestAnimationFrame(gameLoop);
}

// ── New game / restart ─────────────────────────────────────────────────────
function startNewGame() {
  cancelAnimationFrame(state.rafId);
  state.difficulty = diffSelect.value;
  const { ballCount, paddleW, ballSpeed } = DIFFICULTIES[state.difficulty];
  state.balls   = Array.from({ length: ballCount }, () => createBall(PADDLE_Y, CANVAS_W, ballSpeed));
  state.paddle  = createPaddle(CANVAS_W, paddleW);
  state.bricks  = createBricks();
  state.score   = 0;
  state.lives   = LIVES;
  state.level   = 1;
  state.paused  = false;
  state.status  = 'playing';
  getEl('share-btn').hidden = true;
  pauseOverlay.hidden = true;
  pauseBtn.textContent = '⏸';
  pauseBtn.hidden = false;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderHUD();
  state.rafId   = requestAnimationFrame(gameLoop);
}

// ── Event listeners ────────────────────────────────────────────────────────
getEl('new-game').addEventListener('click', startNewGame);

pauseBtn.addEventListener('click', togglePause);

getEl('over-new').addEventListener('click', () => {
  closeModal(overModal);
  startNewGame();
});

getEl('clear-next').addEventListener('click', () => {
  closeModal(clearModal);
  state.status = 'playing';
  state.rafId  = requestAnimationFrame(gameLoop);
});

// ── Stats modal ────────────────────────────────────────────────────────────
getEl('stats-btn').addEventListener('click', () => {
  const s = state.stats;
  const avg = s.gamesPlayed > 0 ? Math.round(s.totalScore / s.gamesPlayed) : 0;
  getEl('stats-played').textContent  = String(s.gamesPlayed);
  getEl('stats-wins').textContent    = String(s.wins);
  getEl('stats-high').textContent    = String(s.highScore);
  getEl('stats-avg').textContent     = String(avg);
  openModal(statsModal);
});
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));

// ── Mute toggle ────────────────────────────────────────────────────────────
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

// ── Theme toggle ───────────────────────────────────────────────────────────
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// ── Score share ────────────────────────────────────────────────────────────
function formatShareText() {
  const diff = { easy:'かんたん', normal:'ふつう', hard:'むずかしい', oni:'🔴鬼' }[state.difficulty] || state.difficulty;
  const result = state.status === 'won' ? '🎉 クリア！' : 'ゲームオーバー';
  return `🎮 ブロック崩し [${diff}] ${result} スコア: ${state.score}\nベスト: ${state.bestScore}`;
}
getEl('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl('share-btn').textContent = '✅ コピーしました';
    setTimeout(() => { getEl('share-btn').textContent = '📋 シェア'; }, 2000);
  });
});

// ── Fullscreen ─────────────────────────────────────────────────────────────
getEl('fs-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  getEl('fs-btn').textContent = document.fullscreenElement ? '⊡' : '⛶';
});

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
  state.difficulty = diffSelect.value;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderHUD();
  draw();
}

init();
