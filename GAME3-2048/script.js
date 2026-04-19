import { applyMove, createEmptyBoard, isGameOver, isWon, spawnTile, DIFFICULTIES } from './src/gameCore.js';
import { buildGridViewModel } from './src/gridView.js';
import {
  loadBestScore,
  loadGameState,
  saveBestScore,
  saveGameState,
  loadStats,
  saveStats,
  STORAGE_KEYS,
} from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  board: createEmptyBoard(),
  score: 0,
  bestScore: 0,
  status: 'idle',
  difficulty: 'normal',
  undoSnapshot: null,
  stats: loadStats(localStorage),
};

function getDifficulty() {
  return DIFFICULTIES[state.difficulty];
}

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
const clearModal    = getEl('clear-modal');
const overModal     = getEl('over-modal');
const clearScoreEl  = getEl('clear-score-text');
const clearBestEl   = getEl('clear-best-text');
const overScoreEl   = getEl('over-score-text');
const overBestEl    = getEl('over-best-text');
const undoBtn       = getEl('undo-btn');
const targetTileEl  = getEl('target-tile');
const difficultyEl  = getEl('difficulty');

// ── モーダル ────────────────────────────────────
function openModal(el) {
  el.hidden = false;
  const btn = el.querySelector('button');
  if (btn) btn.focus();
}

function closeModal(el) {
  el.hidden = true;
}

function showClearModal(score, isBestUpdate) {
  clearScoreEl.textContent = `スコア: ${score}`;
  clearBestEl.hidden = !isBestUpdate;
  openModal(clearModal);
}

function showOverModal(score, isBestUpdate) {
  overScoreEl.textContent = `スコア: ${score}`;
  overBestEl.hidden = !isBestUpdate;
  openModal(overModal);
}

// ── レンダリング ──────────────────────────────────
function renderScores() {
  scoreEl.textContent = String(state.score);
  bestScoreEl.textContent = String(state.bestScore);
}

function renderShareBtn() {
  const shareBtnEl = document.getElementById('share-btn');
  if (!shareBtnEl) return;
  shareBtnEl.hidden = !(state.status === 'won' || state.status === 'over');
}

function renderStatus() {
  const { winValue } = getDifficulty();
  renderShareBtn();
  if (state.status === 'idle') {
    statusEl.textContent = '「新しいゲーム」を押してはじめましょう。';
  } else if (state.status === 'playing') {
    statusEl.textContent = '矢印キーまたはスワイプで動かそう！';
  } else if (state.status === 'won') {
    statusEl.textContent = `${winValue}達成！このまま続けられます。`;
  } else if (state.status === 'over') {
    statusEl.textContent = 'ゲームオーバー！';
  }
}

function renderGrid() {
  gridEl.innerHTML = '';
  const { size } = getDifficulty();
  gridEl.style.gridTemplateColumns = `repeat(${size}, var(--cell-size))`;
  gridEl.style.gridTemplateRows = `repeat(${size}, var(--cell-size))`;
  const vm = buildGridViewModel({ board: state.board });

  for (const cell of vm) {
    const div = document.createElement('div');
    div.className = 'tile';
    div.dataset.value = String(cell.value);
    div.setAttribute('aria-label', cell.ariaLabel);
    div.textContent = cell.value === 0 ? '' : String(cell.value);
    gridEl.appendChild(div);
  }
}

function render() {
  const { winValue } = getDifficulty();
  targetTileEl.textContent = `目標: ${winValue}`;
  undoBtn.disabled = state.undoSnapshot === null;
  renderScores();
  renderGrid();
  renderStatus();
}

// ── 統計 ─────────────────────────────────────────
function updateStats(won) {
  state.stats.gamesPlayed++;
  if (won) {
    state.stats.wins++;
    state.stats.winStreak++;
    if (state.stats.winStreak > state.stats.bestStreak) state.stats.bestStreak = state.stats.winStreak;
  } else {
    state.stats.winStreak = 0;
  }
  saveStats(localStorage, state.stats);
}

// ── ゲームロジック ────────────────────────────────
function handleMove(direction) {
  if (state.status === 'over') return;
  if (state.status === 'idle') return;

  const { size, winValue } = getDifficulty();

  const { board, score, moved } = applyMove(state.board, direction, size);
  if (!moved) return;

  sounds.move();
  if (score > 0) sounds.merge();

  state.undoSnapshot = { board: [...state.board], score: state.score };

  state.board = spawnTile(board, Math.random, size);
  state.score += score;

  const prevBest = state.bestScore;
  const isBestUpdate = state.score > prevBest;
  if (isBestUpdate) {
    state.bestScore = state.score;
    saveBestScore(localStorage, state.bestScore, state.difficulty);
  }

  const won = isWon(state.board, winValue);
  const over = isGameOver(state.board, size);

  const prevStatus = state.status;

  if (over) {
    state.status = 'over';
    sounds.fail();
    updateStats(false);
  } else if (won && prevStatus !== 'won') {
    state.status = 'won';
    sounds.win();
    updateStats(true);
  }

  saveGameState(localStorage, { board: state.board, score: state.score }, state.difficulty);
  render();

  if (over) {
    setTimeout(() => showOverModal(state.score, isBestUpdate), 250);
  } else if (won && prevStatus !== 'won') {
    setTimeout(() => showClearModal(state.score, isBestUpdate), 250);
  }
}

function undoMove() {
  if (!state.undoSnapshot) return;
  state.board = state.undoSnapshot.board;
  state.score = state.undoSnapshot.score;
  state.undoSnapshot = null;
  state.status = 'playing';
  saveGameState(localStorage, { board: state.board, score: state.score }, state.difficulty);
  render();
}

function startNewGame() {
  const { size } = getDifficulty();
  state.board = spawnTile(spawnTile(createEmptyBoard(size), Math.random, size), Math.random, size);
  state.score = 0;
  state.status = 'playing';
  state.undoSnapshot = null;
  saveGameState(localStorage, { board: state.board, score: state.score }, state.difficulty);
  render();
}

function init() {
  const { size } = getDifficulty();
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  const saved = loadGameState(localStorage, state.difficulty, size);

  if (saved) {
    state.board = saved.board;
    state.score = saved.score;
    const { winValue } = getDifficulty();
    state.status = isGameOver(saved.board, size) ? 'over' : isWon(saved.board, winValue) ? 'won' : 'playing';
  }

  render();

  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) {
    openModal(howtoModal);
  }
}

// ── キーボード操作 ──────────────────────────────
const KEY_DIRECTION = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

document.addEventListener('keydown', (e) => {
  const dir = KEY_DIRECTION[e.key];
  if (!dir) return;
  e.preventDefault();
  handleMove(dir);
});

// ── スワイプ操作 ───────────────────────────────
const touch = { startX: null, startY: null };
const SWIPE_THRESHOLD = 30;

gridEl.addEventListener('touchstart', (e) => {
  touch.startX = e.touches[0].clientX;
  touch.startY = e.touches[0].clientY;
}, { passive: true });

gridEl.addEventListener('touchend', (e) => {
  if (touch.startX === null) return;
  const dx = e.changedTouches[0].clientX - touch.startX;
  const dy = e.changedTouches[0].clientY - touch.startY;
  touch.startX = null;
  touch.startY = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    handleMove(dx > 0 ? 'right' : 'left');
  } else {
    handleMove(dy > 0 ? 'down' : 'up');
  }
});

// ── イベント ──────────────────────────────────────
getEl('new-game').addEventListener('click', startNewGame);

getEl('help-btn').addEventListener('click', () => openModal(howtoModal));

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
  if (state.status === 'idle') startNewGame();
});

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) {
    localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
    closeModal(howtoModal);
    if (state.status === 'idle') startNewGame();
  }
});

getEl('clear-next').addEventListener('click', () => {
  closeModal(clearModal);
  startNewGame();
});

getEl('clear-close').addEventListener('click', () => closeModal(clearModal));

clearModal.addEventListener('click', (e) => {
  if (e.target === clearModal) closeModal(clearModal);
});

getEl('over-new').addEventListener('click', () => {
  closeModal(overModal);
  startNewGame();
});

overModal.addEventListener('click', (e) => {
  if (e.target === overModal) closeModal(overModal);
});

difficultyEl.addEventListener('change', () => {
  state.difficulty = difficultyEl.value;
  state.undoSnapshot = null;
  const { size } = getDifficulty();
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  const saved = loadGameState(localStorage, state.difficulty, size);
  if (saved) {
    state.board = saved.board;
    state.score = saved.score;
    const { winValue } = getDifficulty();
    state.status = isGameOver(saved.board, size) ? 'over' : isWon(saved.board, winValue) ? 'won' : 'playing';
  } else {
    startNewGame();
    return;
  }
  render();
});

undoBtn.addEventListener('click', undoMove);

// ── ミュート切替 ──────────────────────────────────
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

// ── テーマ切替 ────────────────────────────────────
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// ── スコアシェア ──────────────────────────────────
const shareBtn = getEl('share-btn');

function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  return `🎮 2048 [${diff}] スコア: ${state.score}\nベスト: ${state.bestScore}`;
}

shareBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    shareBtn.textContent = '✅ コピーしました';
    setTimeout(() => { shareBtn.textContent = '📋 シェア'; }, 2000);
  });
});

// ── フルスクリーン ────────────────────────────────
getEl('fs-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  getEl('fs-btn').textContent = document.fullscreenElement ? '⊡' : '⛶';
});

// ── 統計モーダル ──────────────────────────────────
getEl('stats-btn').addEventListener('click', () => {
  renderStatsModal();
  getEl('stats-modal').removeAttribute('hidden');
});
getEl('stats-close').addEventListener('click', () => {
  getEl('stats-modal').setAttribute('hidden', '');
});

function renderStatsModal() {
  const s = state.stats;
  const rate = s.gamesPlayed ? Math.round(s.wins / s.gamesPlayed * 100) : 0;
  getEl('stats-played').textContent = s.gamesPlayed;
  getEl('stats-wins').textContent = s.wins;
  getEl('stats-rate').textContent = rate + '%';
  getEl('stats-streak').textContent = s.winStreak;
  getEl('stats-best').textContent = s.bestStreak;
}

init();
