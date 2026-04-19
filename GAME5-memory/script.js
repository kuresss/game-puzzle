import { createCards, flipCard, getFaceUpUnmatched, resolveMatch, checkWin, countMatched, DIFFICULTIES } from './src/gameCore.js';
import { buildGridViewModel } from './src/gridView.js';
import { loadBestMoves, saveBestMoves, saveGameState, loadGameState, loadStats, saveStats, STORAGE_KEYS } from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  cards: [],
  moves: 0,
  bestMoves: null,
  isLocked: false,
  status: 'idle',
  difficulty: 'normal',
  theme: 'animals',
  stats: loadStats(localStorage),
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const gridEl       = getEl('grid');
const movesEl      = getEl('moves');
const pairsEl      = getEl('pairs');
const bestEl       = getEl('best-moves');
const statusEl     = getEl('status');
const howtoModal   = getEl('howto-modal');
const clearModal   = getEl('clear-modal');
const statsModal   = getEl('stats-modal');
const clearMovesEl = getEl('clear-moves-text');
const clearBestEl  = getEl('clear-best-text');
const difficultyEl = getEl('difficulty');
const themeEl      = getEl('theme');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function renderScores() {
  const { pairs } = DIFFICULTIES[state.difficulty];
  movesEl.textContent = String(state.moves);
  pairsEl.textContent = `${countMatched(state.cards)} / ${pairs}`;
  bestEl.textContent = state.bestMoves === null ? '-' : String(state.bestMoves);
}

function renderStatus() {
  if (state.status === 'idle') {
    statusEl.textContent = '「新しいゲーム」を押してはじめましょう。';
  } else if (state.status === 'playing') {
    statusEl.textContent = 'カードを2枚めくって同じ絵柄を探そう！';
  } else if (state.status === 'won') {
    statusEl.textContent = '全ペア発見！おめでとう！';
  }
}

function renderGrid() {
  const { cols } = DIFFICULTIES[state.difficulty];
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridEl.innerHTML = '';
  const vm = buildGridViewModel({ cards: state.cards, isLocked: state.isLocked });

  for (const { index, card, ariaLabel, isClickable } of vm) {
    const div = document.createElement('div');
    div.className = 'card' + (card.isFaceUp || card.isMatched ? ' face-up' : '') + (card.isMatched ? ' matched' : '');
    div.setAttribute('aria-label', ariaLabel);
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', isClickable ? '0' : '-1');

    const inner = document.createElement('div');
    inner.className = 'card-inner';
    inner.textContent = card.isFaceUp || card.isMatched ? card.symbol : '';
    div.appendChild(inner);

    if (isClickable) {
      div.addEventListener('click', () => handleCardClick(index));
      div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(index); } });
    }
    gridEl.appendChild(div);
  }
}

function render() { renderScores(); renderGrid(); renderStatus(); }

function updateStats(win) {
  state.stats.gamesPlayed += 1;
  if (win) {
    state.stats.wins += 1;
    state.stats.winStreak += 1;
    if (state.stats.winStreak > state.stats.bestStreak) state.stats.bestStreak = state.stats.winStreak;
  } else {
    state.stats.winStreak = 0;
  }
  saveStats(localStorage, state.stats);
}

function openStatsModal() {
  const { gamesPlayed, wins, winStreak, bestStreak } = state.stats;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  getEl('stats-played').textContent = String(gamesPlayed);
  getEl('stats-wins').textContent = String(wins);
  getEl('stats-winrate').textContent = `${winRate}%`;
  getEl('stats-streak').textContent = String(winStreak);
  getEl('stats-best-streak').textContent = String(bestStreak);
  openModal(statsModal);
}

function handleCardClick(index) {
  if (state.isLocked) return;
  if (state.status === 'idle') state.status = 'playing';

  state.cards = flipCard(state.cards, index);
  sounds.flip();
  render();

  const faceUp = getFaceUpUnmatched(state.cards);
  if (faceUp.length < 2) {
    saveGameState(localStorage, state.difficulty, { cards: state.cards, moves: state.moves });
    return;
  }

  state.moves += 1;

  const [idxA, idxB] = faceUp;
  const { cards: resolved, matched } = resolveMatch(state.cards, idxA, idxB);

  if (matched) {
    sounds.match();
    state.cards = resolved;
    render();
    if (checkWin(state.cards)) {
      state.status = 'won';
      sounds.win();
      updateStats(true);
      const isBestUpdate = state.bestMoves === null || state.moves < state.bestMoves;
      if (isBestUpdate) { state.bestMoves = state.moves; saveBestMoves(localStorage, state.difficulty, state.bestMoves); }
      saveGameState(localStorage, state.difficulty, { cards: state.cards, moves: state.moves });
      render();
      clearMovesEl.textContent = `${state.moves} 手でクリア！`;
      clearBestEl.hidden = !isBestUpdate;
      getEl('share-btn').hidden = false;
      setTimeout(() => openModal(clearModal), 300);
    } else {
      saveGameState(localStorage, state.difficulty, { cards: state.cards, moves: state.moves });
    }
  } else {
    state.isLocked = true;
    render();
    setTimeout(() => {
      sounds.miss();
      state.cards = resolved;
      state.isLocked = false;
      saveGameState(localStorage, state.difficulty, { cards: state.cards, moves: state.moves });
      render();
    }, 800);
  }
}

function startNewGame() {
  const difficulty = difficultyEl.value;
  const theme = themeEl.value;
  const { pairs } = DIFFICULTIES[difficulty];
  state.difficulty = difficulty;
  state.theme = theme;
  state.cards = createCards(pairs, theme);
  state.moves = 0;
  state.isLocked = false;
  state.status = 'idle';
  state.bestMoves = loadBestMoves(localStorage, difficulty);
  saveGameState(localStorage, difficulty, { cards: state.cards, moves: 0 });
  getEl('share-btn').hidden = true;
  render();
}

function init() {
  const difficulty = difficultyEl.value;
  const theme = themeEl.value;
  const { pairs } = DIFFICULTIES[difficulty];
  state.difficulty = difficulty;
  state.theme = theme;
  state.bestMoves = loadBestMoves(localStorage, difficulty);
  const saved = loadGameState(localStorage, difficulty, pairs);
  if (saved) {
    state.cards = saved.cards;
    state.moves = saved.moves;
    state.status = checkWin(saved.cards) ? 'won' : 'playing';
  } else {
    state.cards = createCards(pairs, theme);
  }
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
getEl('stats-btn').addEventListener('click', openStatsModal);
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });

difficultyEl.addEventListener('change', startNewGame);
themeEl.addEventListener('change', startNewGame);

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

// テーマ切替
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// スコアシェア
function formatShareText() {
  const diff = { easy:'かんたん', normal:'ふつう', hard:'むずかしい', oni:'🔴鬼' }[state.difficulty] || state.difficulty;
  const theme = { animals:'動物', food:'食べ物', nature:'自然' }[state.theme] || state.theme;
  return `🎮 神経衰弱 [${diff}/${theme}] ${state.moves}手でクリア！\nベスト: ${state.bestMoves}手`;
}
getEl('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl('share-btn').textContent = '✅ コピーしました';
    setTimeout(() => { getEl('share-btn').textContent = '📋 シェア'; }, 2000);
  });
});

// ミュート
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

// フルスクリーン
getEl('fs-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  getEl('fs-btn').textContent = document.fullscreenElement ? '⊡' : '⛶';
});

init();
