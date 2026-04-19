import {
  DIR, isOpposite, createSnake, stepSnake, spawnFood,
  isFoodEaten, isOutOfBounds, isSelfCollision, getInterval,
  DIFFICULTIES,
} from './src/gameCore.js';
import { buildGridViewModel } from './src/gridView.js';
import { loadBestScore, saveBestScore, loadStats, saveStats, STORAGE_KEYS } from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  snake: createSnake(),
  food: null,
  direction: DIR.RIGHT,
  nextDirection: DIR.RIGHT,
  score: 0,
  bestScore: 0,
  foodEaten: 0,
  status: 'idle',
  timerId: null,
  difficulty: 'normal',
  paused: false,
  stats: loadStats(localStorage),
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const gridEl        = getEl('grid');
const scoreEl       = getEl('score');
const bestScoreEl   = getEl('best-score');
const statusEl      = getEl('status');
const howtoModal    = getEl('howto-modal');
const overModal     = getEl('over-modal');
const overScoreEl   = getEl('over-score-text');
const overBestEl    = getEl('over-best-text');
const difficultyEl  = getEl('difficulty');
const pauseBtnEl    = getEl('pause-btn');
const pauseOverlay  = getEl('pause-overlay');
const statsModal    = getEl('stats-modal');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function renderScores() {
  scoreEl.textContent = String(state.score);
  bestScoreEl.textContent = String(state.bestScore);
}

function renderStatus() {
  const map = {
    idle: '「新しいゲーム」を押してはじめましょう。',
    playing: 'エサを食べて成長しよう！',
    over: 'ゲームオーバー！もう一度チャレンジ！',
  };
  statusEl.textContent = map[state.status] ?? '';
}

function renderGrid() {
  const vm = buildGridViewModel({ snake: state.snake, food: state.food, status: state.status });
  const cells = gridEl.children;
  for (const { index, isHead, isSnake, isFood } of vm) {
    const cell = cells[index];
    if (!cell) continue;
    cell.className = 'cell' + (isHead ? ' head' : isSnake ? ' snake' : isFood ? ' food' : '');
  }
}

function render() { renderScores(); renderGrid(); renderStatus(); }

function initGrid() {
  gridEl.innerHTML = '';
  for (let i = 0; i < 400; i++) {
    const div = document.createElement('div');
    div.className = 'cell';
    gridEl.appendChild(div);
  }
}

function stopGame() {
  if (state.timerId) { clearTimeout(state.timerId); state.timerId = null; }
}

function scheduleNextTick() {
  const { initialInterval } = DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.normal;
  const interval = getInterval(state.foodEaten, initialInterval);
  state.timerId = setTimeout(gameTick, interval);
}

function gameTick() {
  state.timerId = null;
  state.direction = state.nextDirection;
  const { wallWrap } = DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.normal;
  const { snake: moved } = stepSnake(state.snake, state.direction, false, wallWrap);
  const newHead = moved[0];

  const oob = !wallWrap && isOutOfBounds(newHead);
  if (oob || isSelfCollision(state.snake, newHead)) {
    sounds.crash();
    state.status = 'over';
    stopGame();
    const isBestUpdate = state.score > state.bestScore;
    if (isBestUpdate) {
      state.bestScore = state.score;
      saveBestScore(localStorage, state.bestScore, state.difficulty);
    }
    state.stats.gamesPlayed++;
    state.stats.totalScore += state.score;
    if (state.score > state.stats.highScore) state.stats.highScore = state.score;
    saveStats(localStorage, state.stats);
    render();
    overScoreEl.textContent = `スコア: ${state.score}`;
    overBestEl.hidden = !isBestUpdate;
    getEl('share-btn').hidden = false;
    setTimeout(() => openModal(overModal), 150);
    return;
  }

  const ate = isFoodEaten(newHead, state.food);
  const { snake: next } = stepSnake(state.snake, state.direction, ate, wallWrap);
  state.snake = next;
  sounds.move();

  if (ate) {
    sounds.eat();
    state.score += 1;
    state.foodEaten += 1;
    state.food = spawnFood(state.snake);
  }

  render();
  scheduleNextTick();
}

function startNewGame() {
  stopGame();
  state.snake = createSnake();
  state.direction = DIR.RIGHT;
  state.nextDirection = DIR.RIGHT;
  state.score = 0;
  state.foodEaten = 0;
  state.status = 'playing';
  state.paused = false;
  state.food = spawnFood(state.snake);
  pauseOverlay.hidden = true;
  pauseBtnEl.hidden = false;
  getEl('share-btn').hidden = true;
  render();
  scheduleNextTick();
}

function togglePause() {
  if (state.status !== 'playing') return;
  state.paused = !state.paused;
  if (state.paused) {
    stopGame();
    pauseOverlay.hidden = false;
    pauseBtnEl.textContent = '▶';
  } else {
    pauseOverlay.hidden = true;
    pauseBtnEl.textContent = '⏸';
    scheduleNextTick();
  }
}

function changeDirection(dir) {
  if (state.status !== 'playing') return;
  if (!isOpposite(state.direction, dir)) state.nextDirection = dir;
}

// Keyboard
const KEY_DIR = { ArrowUp: DIR.UP, ArrowDown: DIR.DOWN, ArrowLeft: DIR.LEFT, ArrowRight: DIR.RIGHT, w: DIR.UP, s: DIR.DOWN, a: DIR.LEFT, d: DIR.RIGHT, W: DIR.UP, S: DIR.DOWN, A: DIR.LEFT, D: DIR.RIGHT };

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { togglePause(); return; }
  const dir = KEY_DIR[e.key];
  if (dir) {
    e.preventDefault();
    if (state.paused) return;
    changeDirection(dir);
  }
});

// D-Pad buttons
getEl('btn-up').addEventListener('click',    () => changeDirection(DIR.UP));
getEl('btn-down').addEventListener('click',  () => changeDirection(DIR.DOWN));
getEl('btn-left').addEventListener('click',  () => changeDirection(DIR.LEFT));
getEl('btn-right').addEventListener('click', () => changeDirection(DIR.RIGHT));

// Pause button
pauseBtnEl.addEventListener('click', togglePause);

// Difficulty selector
difficultyEl.addEventListener('change', () => {
  state.difficulty = difficultyEl.value;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderScores();
});

// Swipe
const touch = { startX: null, startY: null };
document.addEventListener('touchstart', (e) => { touch.startX = e.touches[0].clientX; touch.startY = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (touch.startX === null) return;
  const dx = e.changedTouches[0].clientX - touch.startX;
  const dy = e.changedTouches[0].clientY - touch.startY;
  touch.startX = null; touch.startY = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) changeDirection(dx > 0 ? DIR.RIGHT : DIR.LEFT);
  else changeDirection(dy > 0 ? DIR.DOWN : DIR.UP);
});

getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
  startNewGame();
});

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) { localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1'); closeModal(howtoModal); startNewGame(); }
});

getEl('over-new').addEventListener('click', () => { closeModal(overModal); startNewGame(); });
overModal.addEventListener('click', (e) => { if (e.target === overModal) closeModal(overModal); });

// Mute toggle
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

// Theme toggle
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// Score share
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  return `🎮 スネーク [${diff}] スコア: ${state.score}\nベスト: ${state.bestScore}`;
}
getEl('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl('share-btn').textContent = '✅ コピーしました';
    setTimeout(() => { getEl('share-btn').textContent = '📋 シェア'; }, 2000);
  });
});

// Stats
getEl('stats-btn').addEventListener('click', () => {
  const avg = state.stats.gamesPlayed > 0 ? Math.round(state.stats.totalScore / state.stats.gamesPlayed) : 0;
  getEl('stats-played').textContent = state.stats.gamesPlayed;
  getEl('stats-high').textContent = state.stats.highScore;
  getEl('stats-avg').textContent = avg;
  openModal(statsModal);
});
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });

// Fullscreen
getEl('fs-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  getEl('fs-btn').textContent = document.fullscreenElement ? '⊡' : '⛶';
});

function init() {
  state.difficulty = difficultyEl.value || 'normal';
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  initGrid();
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

init();
