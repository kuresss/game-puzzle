import {
  DIFFICULTIES,
  createBoard, placeMines, revealCell, toggleFlag,
  checkWin, checkLose, countFlags,
} from './src/gameCore.js';
import { buildGridViewModel, NEIGHBOR_COLORS } from './src/gridView.js';
import {
  loadBestTime, saveBestTime, saveGameState, loadGameState, STORAGE_KEYS,
  loadStats, saveStats,
} from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  difficulty: 'easy',
  board: createBoard(),
  status: 'idle', // idle | playing | won | lost
  elapsedSeconds: 0,
  bestTime: null,
  timerId: null,
  stats: loadStats(localStorage),
};

function getDifficulty() {
  return DIFFICULTIES[state.difficulty] || DIFFICULTIES.easy;
}

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const gridEl       = getEl('grid');
const mineCountEl  = getEl('mine-count');
const timerEl      = getEl('timer');
const bestTimeEl   = getEl('best-time');
const statusEl     = getEl('status');
const howtoModal   = getEl('howto-modal');
const clearModal   = getEl('clear-modal');
const overModal    = getEl('over-modal');
const statsModal   = getEl('stats-modal');
const clearTimeEl  = getEl('clear-time-text');
const clearBestEl  = getEl('clear-best-text');
const difficultyEl = getEl('difficulty');

// テーマ切替
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// ミュート切替
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function startTimer() {
  if (state.timerId) return;
  state.timerId = setInterval(() => {
    state.elapsedSeconds += 1;
    timerEl.textContent = String(state.elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
}

function renderScores() {
  const { mines } = getDifficulty();
  mineCountEl.textContent = String(mines - countFlags(state.board));
  timerEl.textContent = String(state.elapsedSeconds);
  bestTimeEl.textContent = state.bestTime === null ? '-' : `${state.bestTime}s`;
}

function renderStatus() {
  const map = {
    idle: '「新しいゲーム」を押してはじめましょう。',
    playing: 'マスを開いて地雷を避けよう！',
    won: '全マスクリア！おめでとう！',
    lost: '地雷を踏んでしまいました…',
  };
  statusEl.textContent = map[state.status] ?? '';
}

function applyGridLayout() {
  const { cols } = getDifficulty();
  const cellSize = cols <= 9 ? 'min(10vw, 44px)' : cols <= 16 ? 'min(6vw, 32px)' : 'min(4.5vw, 24px)';
  document.documentElement.style.setProperty('--cell-size', cellSize);
  gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
}

function renderGrid() {
  const { rows, cols } = getDifficulty();
  gridEl.innerHTML = '';
  applyGridLayout();
  const vm = buildGridViewModel({ board: state.board, status: state.status });

  for (const { index, cell, ariaLabel } of vm) {
    const div = document.createElement('div');
    div.className = 'cell';
    div.setAttribute('aria-label', ariaLabel);
    div.dataset.index = String(index);

    if (cell.isFlagged) {
      div.classList.add('flagged');
      div.textContent = '🚩';
    } else if (cell.isRevealed) {
      div.classList.add('revealed');
      if (cell.isMine) {
        div.classList.add('mine-hit');
        div.textContent = '💣';
      } else if (cell.neighborCount > 0) {
        div.textContent = String(cell.neighborCount);
        div.style.color = NEIGHBOR_COLORS[cell.neighborCount] ?? '';
      }
    } else if (state.status === 'lost' && cell.isMine) {
      div.classList.add('mine-show');
      div.textContent = '💣';
    }

    div.addEventListener('click', () => handleClick(index));
    div.addEventListener('contextmenu', (e) => { e.preventDefault(); handleRightClick(index); });

    // 長押し for mobile flag
    let longPressTimer = null;
    div.addEventListener('touchstart', () => {
      longPressTimer = setTimeout(() => { handleRightClick(index); longPressTimer = null; }, 500);
    }, { passive: true });
    div.addEventListener('touchend', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });
    div.addEventListener('touchmove', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });

    gridEl.appendChild(div);
  }

  // show all unrevealed mines on game over
  if (state.status === 'lost') {
    state.board.forEach((cell, i) => {
      if (cell.isMine && !cell.isRevealed && !cell.isFlagged) {
        const el = gridEl.children[i];
        if (el) el.dataset.unrevealed = 'true';
      }
    });
  }

  void rows; // rows used implicitly via getDifficulty above
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

function renderStatsModal() {
  const { gamesPlayed, wins, winStreak, bestStreak } = state.stats;
  const winRate = gamesPlayed === 0 ? '0%' : `${Math.round((wins / gamesPlayed) * 100)}%`;
  getEl('stats-played').textContent = String(gamesPlayed);
  getEl('stats-wins').textContent = String(wins);
  getEl('stats-rate').textContent = winRate;
  getEl('stats-streak').textContent = String(winStreak);
  getEl('stats-best').textContent = String(bestStreak);
}

function render() { renderScores(); renderGrid(); renderStatus(); }

function handleClick(index) {
  if (state.status === 'won' || state.status === 'lost') return;
  if (state.board[index].isFlagged) return;

  const { rows, cols, mines } = getDifficulty();

  if (state.status === 'idle') {
    state.board = placeMines(state.board, index, mines, rows, cols);
    state.status = 'playing';
    startTimer();
  }

  state.board = revealCell(state.board, index, rows, cols);

  if (checkLose(state.board, index)) {
    state.status = 'lost';
    stopTimer();
    sounds.boom();
    updateStats(false);
    saveGameState(localStorage, state.difficulty, { board: state.board, elapsedSeconds: state.elapsedSeconds, status: 'lost' });
    render();
    getEl('share-btn').hidden = false;
    setTimeout(() => openModal(overModal), 300);
    return;
  }

  if (checkWin(state.board, mines)) {
    state.status = 'won';
    stopTimer();
    sounds.win();
    updateStats(true);
    const isBestUpdate = state.bestTime === null || state.elapsedSeconds < state.bestTime;
    if (isBestUpdate) { state.bestTime = state.elapsedSeconds; saveBestTime(localStorage, state.difficulty, state.bestTime); }
    saveGameState(localStorage, state.difficulty, { board: state.board, elapsedSeconds: state.elapsedSeconds, status: 'won' });
    render();
    getEl('share-btn').hidden = false;
    clearTimeEl.textContent = `クリアタイム: ${state.elapsedSeconds}秒`;
    clearBestEl.hidden = !isBestUpdate;
    setTimeout(() => openModal(clearModal), 300);
    return;
  }

  sounds.reveal();
  saveGameState(localStorage, state.difficulty, { board: state.board, elapsedSeconds: state.elapsedSeconds, status: state.status });
  render();
}

function handleRightClick(index) {
  if (state.status === 'won' || state.status === 'lost' || state.status === 'idle') return;
  if (state.board[index].isRevealed) return;
  state.board = toggleFlag(state.board, index);
  sounds.flag();
  saveGameState(localStorage, state.difficulty, { board: state.board, elapsedSeconds: state.elapsedSeconds, status: state.status });
  render();
}

function startNewGame() {
  stopTimer();
  const { rows, cols } = getDifficulty();
  state.board = createBoard(rows, cols);
  state.status = 'idle';
  state.elapsedSeconds = 0;
  state.timerId = null;
  saveGameState(localStorage, state.difficulty, { board: state.board, elapsedSeconds: 0, status: 'idle' });
  getEl('share-btn').hidden = true;
  render();
}

function init() {
  state.difficulty = difficultyEl.value;
  state.bestTime = loadBestTime(localStorage, state.difficulty);
  const { rows, cols } = getDifficulty();
  const saved = loadGameState(localStorage, state.difficulty, rows, cols);
  if (saved && saved.status === 'playing') {
    state.board = saved.board;
    state.elapsedSeconds = saved.elapsedSeconds;
    state.status = 'playing';
    startTimer();
  } else {
    state.board = createBoard(rows, cols);
  }
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

difficultyEl.addEventListener('change', () => {
  state.difficulty = difficultyEl.value;
  state.bestTime = loadBestTime(localStorage, state.difficulty);
  startNewGame();
});

getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
getEl('stats-btn').addEventListener('click', () => { renderStatsModal(); openModal(statsModal); });
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
});

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) { localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1'); closeModal(howtoModal); }
});

getEl('clear-next').addEventListener('click', () => { closeModal(clearModal); startNewGame(); });
getEl('clear-close').addEventListener('click', () => closeModal(clearModal));
clearModal.addEventListener('click', (e) => { if (e.target === clearModal) closeModal(clearModal); });

getEl('over-new').addEventListener('click', () => { closeModal(overModal); startNewGame(); });
overModal.addEventListener('click', (e) => { if (e.target === overModal) closeModal(overModal); });

// スコアシェア
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  const result = state.status === 'won' ? '🎉 クリア！' : '💥 ゲームオーバー';
  return `🎮 マインスイーパー [${diff}] ${result}`;
}
getEl('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl('share-btn').textContent = '✅ コピーしました';
    setTimeout(() => { getEl('share-btn').textContent = '📋 シェア'; }, 2000);
  });
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
