import {
  applyClick,
  countLitCells,
  createShuffledCells,
  isSolvedCells,
} from './src/lightsCore.js';
import {
  loadBestMoves,
  loadGameState,
  saveBestMoves,
  saveGameState,
  STORAGE_KEYS,
} from './src/storage.js';
import { buildGridViewModel } from './src/gridView.js';

const UI_TEXT = {
  start: '「新しい問題」を押してはじめましょう。',
  playing: (n) => `あと ${n} 個消せばクリア！`,
  solved: 'クリア！全セル消灯しました。',
};

const state = {
  cells: [],
  moves: 0,
  bestMoves: null,
  isSolved: false,
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const gridEl      = getEl('grid');
const movesEl     = getEl('moves');
const bestEl      = getEl('best-score');
const litCountEl  = getEl('lit-count');
const statusEl    = getEl('status');
const shuffleBtn  = getEl('shuffle');
const resetBtn    = getEl('reset-best');
const howtoModal  = getEl('howto-modal');
const clearModal  = getEl('clear-modal');
const clearMovesEl = getEl('clear-moves-text');
const clearBestEl  = getEl('clear-best-text');

// ── モーダル ────────────────────────────────────
function openModal(el) {
  el.hidden = false;
  const btn = el.querySelector('button');
  if (btn) btn.focus();
}

function closeModal(el) {
  el.hidden = true;
}

function showClearModal(moves, isBestUpdate) {
  clearMovesEl.textContent = `${moves} 手でクリア！`;
  clearBestEl.hidden = !isBestUpdate;
  openModal(clearModal);
}

// ── レンダリング ──────────────────────────────────
function renderScores() {
  movesEl.textContent = String(state.moves);
  bestEl.textContent = state.bestMoves === null ? '-' : String(state.bestMoves);
}

function renderLitCount() {
  const n = countLitCells(state.cells);
  litCountEl.textContent = state.isSolved
    ? '🌟 全消灯！'
    : n === 0
    ? '読み込み中…'
    : `${n} 個点灯中`;
}

function renderStatus() {
  if (state.isSolved) {
    statusEl.textContent = UI_TEXT.solved;
    return;
  }
  const n = countLitCells(state.cells);
  statusEl.textContent = n > 0 ? UI_TEXT.playing(n) : UI_TEXT.start;
}

function renderGrid() {
  gridEl.innerHTML = '';
  const vm = buildGridViewModel({ cells: state.cells, isSolved: state.isSolved });

  for (const cell of vm) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell' + (cell.isOn ? ' on' : '');
    btn.dataset.index = String(cell.index);
    btn.disabled = cell.disabled;
    btn.setAttribute('aria-label', cell.ariaLabel);
    btn.setAttribute('aria-pressed', String(cell.ariaPressed));
    btn.addEventListener('click', () => handleCellClick(cell.index));
    gridEl.appendChild(btn);
  }
}

function render() {
  renderScores();
  renderGrid();
  renderLitCount();
  renderStatus();
}

// ── ゲームロジック ────────────────────────────────
function handleCellClick(index) {
  if (state.isSolved) return;

  state.cells = applyClick(state.cells, index);
  state.moves += 1;
  state.isSolved = isSolvedCells(state.cells);
  saveGameState(localStorage, { cells: state.cells, moves: state.moves });

  if (state.isSolved) {
    const isBestUpdate =
      state.bestMoves === null || state.moves < state.bestMoves;
    if (isBestUpdate) {
      state.bestMoves = state.moves;
      saveBestMoves(localStorage, state.bestMoves);
    }
    render();
    setTimeout(() => showClearModal(state.moves, isBestUpdate), 250);
    return;
  }

  render();
}

function startNewPuzzle() {
  state.cells = createShuffledCells();
  state.moves = 0;
  state.isSolved = false;
  saveGameState(localStorage, { cells: state.cells, moves: state.moves });
  render();
}

function resetBest() {
  state.bestMoves = null;
  saveBestMoves(localStorage, null);
  render();
}

function init() {
  state.bestMoves = loadBestMoves(localStorage);
  const saved = loadGameState(localStorage);

  if (saved) {
    state.cells = saved.cells;
    state.moves = saved.moves;
    state.isSolved = isSolvedCells(state.cells);
  } else {
    startNewPuzzle();
  }

  render();

  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) {
    openModal(howtoModal);
  }
}

// ── イベント ──────────────────────────────────────
shuffleBtn.addEventListener('click', startNewPuzzle);
resetBtn.addEventListener('click', resetBest);

getEl('help-btn').addEventListener('click', () => openModal(howtoModal));

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
});

getEl('clear-next').addEventListener('click', () => {
  closeModal(clearModal);
  startNewPuzzle();
});

getEl('clear-close').addEventListener('click', () => closeModal(clearModal));

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) {
    localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
    closeModal(howtoModal);
  }
});

clearModal.addEventListener('click', (e) => {
  if (e.target === clearModal) closeModal(clearModal);
});

init();
