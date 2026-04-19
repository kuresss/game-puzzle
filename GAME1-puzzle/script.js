import { Capacitor } from '@capacitor/core';
import { AdManager } from './src/ads/AdManager.js';
import { setupAdvertising } from './src/ads/setupAdvertising.js';
import { createInputController } from './src/inputControls.js';
import {
  SIZE,
  SOLVED_TILES,
  createShuffledTiles,
  indexToPosition,
  isSolvedTiles,
  moveTile,
} from './src/puzzleCore.js';
import {
  isRemoveAdsPurchased,
  loadBestMoves as loadBestMovesFromStorage,
  loadGameState as loadGameStateFromStorage,
  saveBestMoves as saveBestMovesToStorage,
  saveGameState as saveGameStateToStorage,
  STORAGE_KEYS,
} from './src/storage.js';
import { dispatchInterstitialRequested } from './src/adEvents.js';
import { buildGridViewModel } from './src/gridView.js';

const UI_TEXT = {
  start: '「まぜる」を押して始めましょう。',
  solvedPrefix: 'クリア！',
  solvedSuffix: '手で完成しました。',
  playing: '空きマスの隣にあるタイルを動かして、1から15まで並べましょう。',
};


const state = {
  tiles: [...SOLVED_TILES],
  moves: 0,
  bestMoves: null,
  isSolved: true,
};

const gridEl = getRequiredElement('grid');
const howtoModal = getRequiredElement('howto-modal');
const clearModal = getRequiredElement('clear-modal');
const clearMovesTextEl = getRequiredElement('clear-moves-text');
const clearBestTextEl = getRequiredElement('clear-best-text');
const movesEl = getRequiredElement('moves');
const bestScoreEl = getRequiredElement('best-score');
const statusEl = getRequiredElement('status');
const shuffleBtn = getRequiredElement('shuffle');
const resetBestBtn = getRequiredElement('reset-best');
const bannerAdEl = document.getElementById('banner-ad');

function getRequiredElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element;
}

function openModal(modalEl) {
  modalEl.hidden = false;
  const firstBtn = modalEl.querySelector('button');
  if (firstBtn) firstBtn.focus();
}

function closeModal(modalEl) {
  modalEl.hidden = true;
}

function openHowToPlay() {
  openModal(howtoModal);
}

function showClearModal(moves, isBestUpdate) {
  clearMovesTextEl.textContent = `${moves} 手で完成！`;
  clearBestTextEl.hidden = !isBestUpdate;
  openModal(clearModal);
}

function loadBestMoves() {
  state.bestMoves = loadBestMovesFromStorage(localStorage);
}

function saveBestMoves() {
  saveBestMovesToStorage(localStorage, state.bestMoves);
}

function saveGameState() {
  saveGameStateToStorage(localStorage, {
    tiles: state.tiles,
    moves: state.moves,
  });
}

function loadGameState() {
  const loaded = loadGameStateFromStorage(localStorage);
  if (loaded === null) {
    return false;
  }

  state.tiles = loaded.tiles;
  state.moves = loaded.moves;
  state.isSolved = isSolved();
  return true;
}

function adsRemoved() {
  return isRemoveAdsPurchased(localStorage);
}

function updateAdPlaceholder() {
  if (!bannerAdEl) {
    return;
  }

  const showDebugPlaceholder = document.body.dataset.showAdPlaceholder === 'true';
  bannerAdEl.hidden = adsRemoved() || !showDebugPlaceholder;
  document.body.classList.toggle('ad-placeholder-hidden', bannerAdEl.hidden);
}

function isSolved() {
  return isSolvedTiles(state.tiles);
}

function renderScores() {
  movesEl.textContent = String(state.moves);
  bestScoreEl.textContent = state.bestMoves === null ? '-' : String(state.bestMoves);
}

function renderStatus() {
  if (state.isSolved) {
    statusEl.textContent =
      state.moves === 0
        ? UI_TEXT.start
        : `${UI_TEXT.solvedPrefix} ${state.moves} ${UI_TEXT.solvedSuffix}`;
    return;
  }

  statusEl.textContent = UI_TEXT.playing;
}

function renderGrid() {
  gridEl.innerHTML = '';

  const viewModel = buildGridViewModel(state);

  for (const tileView of viewModel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = tileView.className;
    button.textContent = tileView.text;
    button.dataset.index = String(tileView.index);
    button.disabled = tileView.disabled;
    button.setAttribute('aria-label', tileView.ariaLabel);
    button.addEventListener('click', () => moveTileAt(tileView.index));
    gridEl.appendChild(button);
  }
}

function render() {
  renderScores();
  renderGrid();
  renderStatus();
  updateAdPlaceholder();
}

function completePuzzleIfSolved() {
  state.isSolved = isSolved();
  if (!state.isSolved) {
    return;
  }

  const isBestUpdate =
    state.moves > 0 && (state.bestMoves === null || state.moves < state.bestMoves);
  if (isBestUpdate) {
    state.bestMoves = state.moves;
    saveBestMoves();
  }

  saveGameState();

  if (!adsRemoved()) {
    dispatchInterstitialRequested(window);
  }

  const moves = state.moves;
  setTimeout(() => showClearModal(moves, isBestUpdate), 250);
}

function moveTileAt(index) {
  if (state.isSolved) {
    return false;
  }

  const result = moveTile(state.tiles, index);
  if (!result.moved) {
    return false;
  }

  state.tiles = result.tiles;
  state.moves += 1;
  completePuzzleIfSolved();
  saveGameState();
  render();
  return true;
}

function moveEmpty(direction) {
  if (state.isSolved) {
    return false;
  }

  const emptyIndex = state.tiles.indexOf(0);
  const { row, col } = indexToPosition(emptyIndex);
  let targetIndex = null;

  if (direction === 'up' && row > 0) targetIndex = emptyIndex - SIZE;
  if (direction === 'down' && row < SIZE - 1) targetIndex = emptyIndex + SIZE;
  if (direction === 'left' && col > 0) targetIndex = emptyIndex - 1;
  if (direction === 'right' && col < SIZE - 1) targetIndex = emptyIndex + 1;

  return targetIndex === null ? false : moveTileAt(targetIndex);
}

function startNewPuzzle() {
  state.tiles = createShuffledTiles();
  state.moves = 0;
  state.isSolved = false;
  saveGameState();
  render();
}

function resetBestMoves() {
  state.bestMoves = null;
  saveBestMoves();
  render();
}

function init() {
  loadBestMoves();

  if (!loadGameState()) {
    startNewPuzzle();
  } else {
    render();
  }

  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) {
    openHowToPlay();
  }
}

const inputController = createInputController({
  onMove: (direction) => moveEmpty(direction),
  canAcceptInput: () => !state.isSolved,
  touchTarget: gridEl,
  keyTarget: window,
  minSwipeDistance: 28,
});

shuffleBtn.addEventListener('click', startNewPuzzle);
resetBestBtn.addEventListener('click', resetBestMoves);

getRequiredElement('help-btn').addEventListener('click', openHowToPlay);

getRequiredElement('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
});

getRequiredElement('clear-next').addEventListener('click', () => {
  closeModal(clearModal);
  startNewPuzzle();
});

getRequiredElement('clear-close').addEventListener('click', () => {
  closeModal(clearModal);
});

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

(async () => {
  try {
    const adManager = new AdManager();
    await setupAdvertising({
      adManager,
      storage: localStorage,
      eventTarget: window,
      isNative: () => Capacitor.isNativePlatform(),
      onError: (error) => console.warn('[ads]', error),
    });
  } catch (error) {
    console.warn('[ads] setup skipped:', error);
  }
})();
