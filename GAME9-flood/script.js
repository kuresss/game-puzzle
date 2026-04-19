import {
  COLORS, DIFFICULTIES,
  createBoard, applyColor, isWon, getFloodZone, getFloodSize,
} from './src/gameCore.js';
import { buildGridViewModel, getColorHex } from './src/gridView.js';
import { loadBestMoves, saveBestMoves, loadBestMovesByDifficulty, saveBestMovesByDifficulty, STORAGE_KEYS, loadStats, saveStats } from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  board: [],
  moves: 0,
  bestMoves: null,
  status: 'idle',
  difficulty: 'normal',
  undoSnapshot: null,
  cols: 14,
  rows: 14,
  maxMoves: 25,
  colorblind: localStorage.getItem('global_colorblind') === '1',
  stats: loadStats(localStorage),
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const movesLeftEl  = getEl('moves-left');
const fillPctEl    = getEl('fill-pct');
const bestEl       = getEl('best-moves');
const statusEl     = getEl('status');
const canvas       = getEl('grid-canvas');
const howtoModal   = getEl('howto-modal');
const clearModal   = getEl('clear-modal');
const failModal    = getEl('fail-modal');
const clearTextEl  = getEl('clear-text');
const clearBestEl  = getEl('clear-best-text');
const failTextEl   = getEl('fail-text');
const difficultyEl = getEl('difficulty');
const undoBtn      = getEl('undo-btn');

const ctx = canvas.getContext('2d');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function renderCanvas() {
  const { cols, rows } = state;
  const cellPx = Math.floor(392 / cols);
  const floodZone = getFloodZone(state.board, cols, rows);
  const vm = buildGridViewModel({ board: state.board, floodZone, colorblind: state.colorblind });

  for (const { index, hex, isInZone } of vm) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    ctx.fillStyle = hex;
    ctx.fillRect(col * cellPx, row * cellPx, cellPx, cellPx);
    if (isInZone) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(col * cellPx, row * cellPx, cellPx, cellPx);
    }
  }
}

function renderScores() {
  const { cols, rows, maxMoves } = state;
  const cellCount = cols * rows;
  const remaining = maxMoves - state.moves;
  movesLeftEl.textContent = String(remaining);
  movesLeftEl.style.color = remaining <= 5 ? '#ef5350' : '';
  const pct = Math.round((getFloodSize(state.board, cols, rows) / cellCount) * 100);
  fillPctEl.textContent = `${pct}%`;
  bestEl.textContent = state.bestMoves === null ? '-' : String(state.bestMoves);
}

function renderStatus() {
  const map = {
    idle: '「新しいゲーム」を押してはじめましょう。',
    playing: '色を選んで広げよう！',
    won: 'クリア！全マスを塗りつぶしました！',
    lost: '手数切れ！もう一度チャレンジ！',
  };
  statusEl.textContent = map[state.status] ?? '';
}

function updateUndoBtn() {
  undoBtn.disabled = state.undoSnapshot === null || state.status !== 'playing';
}

function renderColorButtons() {
  const palette = getColorHex(state.colorblind);
  for (const btn of document.querySelectorAll('.color-btn')) {
    const color = btn.dataset.color;
    if (color && palette[color]) btn.style.background = palette[color];
  }
}

function render() { renderCanvas(); renderScores(); renderStatus(); updateUndoBtn(); renderColorButtons(); }

function updateStats(won) {
  const s = state.stats;
  s.gamesPlayed += 1;
  if (won) {
    s.wins += 1;
    s.winStreak += 1;
    if (s.winStreak > s.bestStreak) s.bestStreak = s.winStreak;
  } else {
    s.winStreak = 0;
  }
  saveStats(localStorage, s);
}

function openStatsModal() {
  const s = state.stats;
  const rate = s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;
  getEl('stats-games').textContent = String(s.gamesPlayed);
  getEl('stats-wins').textContent = String(s.wins);
  getEl('stats-rate').textContent = `${rate}%`;
  getEl('stats-streak').textContent = String(s.winStreak);
  getEl('stats-best-streak').textContent = String(s.bestStreak);
  openModal(getEl('stats-modal'));
}

function handleColorClick(color) {
  if (state.status !== 'playing') return;
  if (state.board[0] === color) return;

  const { cols, rows, maxMoves } = state;
  const cellCount = cols * rows;

  // Save undo snapshot before applying
  state.undoSnapshot = { board: [...state.board], moves: state.moves };

  state.board = applyColor(state.board, color, cols, rows);
  state.moves += 1;

  if (isWon(state.board)) {
    state.status = 'won';
    const isBestUpdate = state.bestMoves === null || state.moves < state.bestMoves;
    if (isBestUpdate) {
      state.bestMoves = state.moves;
      saveBestMoves(localStorage, state.bestMoves);
      saveBestMovesByDifficulty(localStorage, state.difficulty, state.bestMoves);
    }
    updateStats(true);
    sounds.win();
    render();
    clearTextEl.textContent = `${state.moves} 手でクリア！`;
    clearBestEl.hidden = !isBestUpdate;
    getEl('share-btn').hidden = false;
    setTimeout(() => openModal(clearModal), 200);
    return;
  }

  if (state.moves >= maxMoves) {
    state.status = 'lost';
    const pct = Math.round((getFloodSize(state.board, cols, rows) / cellCount) * 100);
    failTextEl.textContent = `${pct}% 塗れました。あと少し！`;
    updateStats(false);
    sounds.fail();
    render();
    getEl('share-btn').hidden = false;
    setTimeout(() => openModal(failModal), 200);
    return;
  }

  sounds.fill();
  render();
}

function undoMove() {
  if (state.undoSnapshot === null || state.status !== 'playing') return;
  state.board = state.undoSnapshot.board;
  state.moves = state.undoSnapshot.moves;
  state.undoSnapshot = null;
  render();
}

function startNewGame() {
  const difficulty = difficultyEl.value;
  const diff = DIFFICULTIES[difficulty] ?? DIFFICULTIES.normal;
  const { cols, rows, maxMoves } = diff;

  state.difficulty = difficulty;
  state.cols = cols;
  state.rows = rows;
  state.maxMoves = maxMoves;

  const cellPx = Math.floor(392 / cols);
  canvas.width = cellPx * cols;
  canvas.height = cellPx * rows;

  state.board = createBoard(rows, cols);
  state.moves = 0;
  state.status = 'playing';
  state.undoSnapshot = null;
  state.bestMoves = loadBestMovesByDifficulty(localStorage, difficulty);

  getEl('share-btn').hidden = true;

  render();
}

// Wire color buttons
for (const color of COLORS) {
  const btn = document.querySelector(`[data-color="${color}"]`);
  if (btn) btn.addEventListener('click', () => handleColorClick(color));
}

getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
getEl('stats-btn').addEventListener('click', openStatsModal);
getEl('stats-close').addEventListener('click', () => closeModal(getEl('stats-modal')));
getEl('stats-modal').addEventListener('click', (e) => { if (e.target === getEl('stats-modal')) closeModal(getEl('stats-modal')); });
undoBtn.addEventListener('click', undoMove);

difficultyEl.addEventListener('change', () => {
  if (state.status !== 'idle') startNewGame();
});

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
  if (state.status === 'idle') startNewGame();
});

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) { localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1'); closeModal(howtoModal); if (state.status === 'idle') startNewGame(); }
});

getEl('clear-next').addEventListener('click', () => { closeModal(clearModal); startNewGame(); });
getEl('clear-close').addEventListener('click', () => closeModal(clearModal));
clearModal.addEventListener('click', (e) => { if (e.target === clearModal) closeModal(clearModal); });
getEl('fail-new').addEventListener('click', () => { closeModal(failModal); startNewGame(); });
failModal.addEventListener('click', (e) => { if (e.target === failModal) closeModal(failModal); });

// --- Theme toggle ---
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// --- Colorblind toggle ---
document.body.dataset.colorblind = state.colorblind ? '1' : '';
getEl('cb-btn').style.opacity = state.colorblind ? '1' : '0.5';
getEl('cb-btn').addEventListener('click', () => {
  state.colorblind = !state.colorblind;
  localStorage.setItem('global_colorblind', state.colorblind ? '1' : '0');
  document.body.dataset.colorblind = state.colorblind ? '1' : '';
  getEl('cb-btn').style.opacity = state.colorblind ? '1' : '0.5';
  render();
});

// --- Mute toggle ---
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

// --- Score share ---
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  if (state.status === 'won') {
    return `🎮 フラッドフィル [${diff}] ${state.moves}手でクリア！\n最大: ${state.maxMoves}手`;
  }
  return `🎮 フラッドフィル [${diff}] 手数切れ… (${state.moves}/${state.maxMoves}手)`;
}
getEl('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl('share-btn').textContent = '✅ コピーしました';
    setTimeout(() => { getEl('share-btn').textContent = '📋 シェア'; }, 2000);
  });
});

// --- Fullscreen ---
getEl('fs-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  getEl('fs-btn').textContent = document.fullscreenElement ? '⊡' : '⛶';
});

function init() {
  // Set difficulty select to default
  difficultyEl.value = 'normal';
  state.bestMoves = loadBestMoves(localStorage);
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

init();
