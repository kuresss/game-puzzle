import { DIFFICULTIES, createState, moveDisk, isWon, getOptimalMoves, getMoveRating } from './src/gameCore.js';
import { loadBest, saveBest, STORAGE_KEYS, loadStats, saveStats } from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  difficulty: 'normal',
  game: null,
  selected: null,
  undoSnapshot: null,
  stats: loadStats(localStorage),
};

function getDiskCount() {
  return DIFFICULTIES[state.difficulty].disks;
}

function getEl(id) {
  return document.getElementById(id);
}

function init() {
  state.game = createState(getDiskCount());
  state.selected = null;
  state.undoSnapshot = null;
  renderGame();
  updateUndoBtn();
  updateMoves();
  updateBest();
  const shareBtn = getEl('share-btn');
  if (shareBtn) shareBtn.hidden = true;
}

function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  const disks = getDiskCount();
  const optimal = (1 << disks) - 1;
  return `🎮 ハノイの塔 [${diff}] ${state.game.moves}手でクリア！\n最適手数: ${optimal}手`;
}

function renderGame() {
  const container = document.getElementById('pegs');
  if (!container) return;
  container.innerHTML = '';
  const diskCount = getDiskCount();
  const step = diskCount <= 6 ? 20 : 14;

  state.game.pegs.forEach((peg, pegIdx) => {
    const pegEl = document.createElement('div');
    pegEl.className = 'peg';
    pegEl.dataset.peg = pegIdx;
    if (state.selected === pegIdx) pegEl.classList.add('selected');

    const rod = document.createElement('div');
    rod.className = 'rod';
    pegEl.appendChild(rod);

    const disksEl = document.createElement('div');
    disksEl.className = 'disks';
    const disksInPeg = [...peg].reverse();
    disksInPeg.forEach((disk) => {
      const diskEl = document.createElement('div');
      diskEl.className = 'disk';
      const width = 30 + disk * step;
      diskEl.style.width = `${width}px`;
      diskEl.textContent = disk;
      disksEl.appendChild(diskEl);
    });
    pegEl.appendChild(disksEl);

    pegEl.addEventListener('click', () => onPegClick(pegIdx));
    container.appendChild(pegEl);
  });
}

function onPegClick(pegIdx) {
  if (isWon(state.game)) return;

  if (state.selected === null) {
    if (state.game.pegs[pegIdx].length === 0) return;
    state.selected = pegIdx;
    sounds.pick();
    renderGame();
    return;
  }

  if (state.selected === pegIdx) {
    state.selected = null;
    renderGame();
    return;
  }

  const from = state.selected;
  state.selected = null;

  const fromPeg = state.game.pegs[from];
  const toPeg = state.game.pegs[pegIdx];
  if (fromPeg.length === 0) { renderGame(); return; }
  const topFrom = fromPeg[fromPeg.length - 1];
  const topTo = toPeg.length > 0 ? toPeg[toPeg.length - 1] : Infinity;
  if (topTo <= topFrom) { renderGame(); return; }

  state.undoSnapshot = state.game;
  state.game = moveDisk(state.game, from, pegIdx);
  renderGame();
  updateUndoBtn();
  updateMoves();
  sounds.place();

  if (isWon(state.game)) {
    const diskCount = getDiskCount();
    const best = loadBest(localStorage, state.difficulty);
    if (best === null || state.game.moves < best) {
      saveBest(localStorage, state.difficulty, state.game.moves);
    }
    const rating = getMoveRating(state.game.moves, diskCount);
    const optimal = getOptimalMoves(diskCount);
    const shareBtn = getEl('share-btn');
    if (shareBtn) shareBtn.hidden = false;
    updateStats(true);
    sounds.win();
    setTimeout(() => {
      alert(`クリア! ${state.game.moves}手 (最適: ${optimal}手) [${rating}]`);
      updateBest();
    }, 100);
  }
}

function undoMove() {
  if (!state.undoSnapshot) return;
  state.game = state.undoSnapshot;
  state.undoSnapshot = null;
  state.selected = null;
  renderGame();
  updateUndoBtn();
  updateMoves();
}

function updateMoves() {
  const el = document.getElementById('moves');
  if (el) el.textContent = state.game ? state.game.moves : 0;
}

function updateBest() {
  const el = document.getElementById('best');
  if (!el) return;
  const best = loadBest(localStorage, state.difficulty);
  el.textContent = best !== null ? best : '-';
}

function updateUndoBtn() {
  const btn = document.getElementById('undo-btn');
  if (btn) btn.disabled = !state.undoSnapshot;
}

function updateStats(won) {
  state.stats.gamesPlayed += 1;
  if (won) {
    state.stats.wins += 1;
    state.stats.winStreak += 1;
    if (state.stats.winStreak > state.stats.bestStreak) {
      state.stats.bestStreak = state.stats.winStreak;
    }
  } else {
    state.stats.winStreak = 0;
  }
  saveStats(localStorage, state.stats);
}

function openStatsModal() {
  const modal = getEl('stats-modal');
  if (!modal) return;
  const s = state.stats;
  const rate = s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;
  getEl('stat-played').textContent = s.gamesPlayed;
  getEl('stat-wins').textContent = s.wins;
  getEl('stat-rate').textContent = `${rate}%`;
  getEl('stat-streak').textContent = s.winStreak;
  getEl('stat-best-streak').textContent = s.bestStreak;
  modal.hidden = false;
}

function closeStatsModal() {
  const modal = getEl('stats-modal');
  if (modal) modal.hidden = true;
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';

  const diffSelect = getEl('difficulty');
  if (diffSelect) {
    diffSelect.value = state.difficulty;
    diffSelect.addEventListener('change', () => {
      state.difficulty = diffSelect.value;
      init();
    });
  }

  const undoBtn = getEl('undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', undoMove);
  }

  const resetBtn = getEl('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', init);
  }

  const themeBtn = getEl('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = t;
      localStorage.setItem('global_theme', t);
    });
  }

  const shareBtn = getEl('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(formatShareText()).then(() => {
        shareBtn.textContent = '✅ コピーしました';
        setTimeout(() => { shareBtn.textContent = '📋 シェア'; }, 2000);
      });
    });
  }

  const statsBtn = getEl('stats-btn');
  if (statsBtn) statsBtn.addEventListener('click', openStatsModal);

  const statsClose = getEl('stats-close');
  if (statsClose) statsClose.addEventListener('click', closeStatsModal);

  const statsModal = getEl('stats-modal');
  if (statsModal) {
    statsModal.addEventListener('click', (e) => {
      if (e.target === statsModal) closeStatsModal();
    });
  }

  const initMuted = localStorage.getItem('global_mute') === '1';
  getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
  getEl('mute-btn').addEventListener('click', () => {
    const muted = localStorage.getItem('global_mute') === '1';
    localStorage.setItem('global_mute', muted ? '0' : '1');
    getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
  });

  const fsBtn = getEl('fs-btn');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    });
  }

  document.addEventListener('fullscreenchange', () => {
    const btn = getEl('fs-btn');
    if (btn) btn.textContent = document.fullscreenElement ? '⊡' : '⛶';
  });

  init();
});
