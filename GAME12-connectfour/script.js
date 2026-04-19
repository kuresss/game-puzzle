import {
  COLS, ROWS, RED, YELLOW, opponent, createBoard,
  dropPiece, checkWin, isBoardFull, getValidColumns, getCpuMove,
  DIFFICULTIES,
} from './src/gameCore.js';
import { buildGridViewModel } from './src/gridView.js';
import { loadWins, saveWins, loadStats, saveStats, STORAGE_KEYS } from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  board: createBoard(),
  currentColor: RED,
  lastDrop: null,
  wins: 0,
  cpuWins: 0,
  draws: 0,
  status: 'idle',
  cpuThinking: false,
  difficulty: 'normal',
  humanFirst: true,
  colorblind: localStorage.getItem('global_colorblind') === '1',
  stats: loadStats(localStorage),
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const boardEl        = getEl('board');
const winsEl         = getEl('wins');
const cpuWinsEl      = getEl('cpu-wins');
const drawsEl        = getEl('draws');
const statusEl       = getEl('status');
const colButtonsEl   = getEl('col-buttons');
const howtoModal     = getEl('howto-modal');
const resultModal    = getEl('result-modal');
const resultTitleEl  = getEl('result-title');
const resultTextEl   = getEl('result-text');
const difficultyEl   = getEl('difficulty');
const goFirstEl      = getEl('go-first');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function setColButtonsDisabled(disabled) {
  colButtonsEl.querySelectorAll('.col-btn').forEach((btn) => { btn.disabled = disabled; });
}

function renderScores() {
  winsEl.textContent = String(state.wins);
  cpuWinsEl.textContent = String(state.cpuWins);
  drawsEl.textContent = String(state.draws);
}

function renderStatus() {
  if (state.status === 'idle') { statusEl.textContent = '「新しいゲーム」を押してはじめましょう。'; return; }
  if (state.status === 'over') return;
  if (state.cpuThinking) { statusEl.textContent = 'CPUが考え中…'; return; }
  const humanColor = state.humanFirst ? RED : YELLOW;
  statusEl.textContent = state.currentColor === humanColor ? 'あなたの番！列を選んでください。' : 'CPUの番です';
}

function renderBoard() {
  const humanColor = state.humanFirst ? RED : YELLOW;
  const valid = (state.status === 'playing' && !state.cpuThinking && state.currentColor === humanColor)
    ? getValidColumns(state.board) : [];
  const { cells } = buildGridViewModel({ board: state.board, validCols: valid, lastDrop: state.lastDrop });

  boardEl.innerHTML = '';
  for (const { cell, isLastDrop } of cells) {
    const div = document.createElement('div');
    div.className = 'cell' + (isLastDrop ? ' last-drop' : '');
    if (cell) {
      const piece = document.createElement('div');
      piece.className = `piece ${cell}`;
      div.appendChild(piece);
    }
    boardEl.appendChild(div);
  }

  // Update column buttons
  const validSet = new Set(valid);
  colButtonsEl.querySelectorAll('.col-btn').forEach((btn) => {
    const col = Number(btn.dataset.col);
    btn.disabled = !validSet.has(col);
  });
}

function render() { renderScores(); renderBoard(); renderStatus(); }

function endGame(winner) {
  state.status = 'over';
  state.winner = winner;
  setColButtonsDisabled(true);
  getEl('share-btn').hidden = false;
  const humanColor = state.humanFirst ? RED : YELLOW;
  const cpuColor   = state.humanFirst ? YELLOW : RED;
  state.stats.gamesPlayed += 1;
  if (winner === humanColor) {
    state.wins += 1;
    saveWins(localStorage, state.wins, state.difficulty);
    state.stats.wins += 1;
    state.stats.winStreak += 1;
    if (state.stats.winStreak > state.stats.bestStreak) state.stats.bestStreak = state.stats.winStreak;
    saveStats(localStorage, state.stats);
    resultTitleEl.textContent = '🎉 あなたの勝ち！';
    resultTextEl.textContent = '4つ並べました！';
    sounds.win();
  } else if (winner === cpuColor) {
    state.cpuWins += 1;
    state.stats.losses += 1;
    state.stats.winStreak = 0;
    saveStats(localStorage, state.stats);
    resultTitleEl.textContent = '😢 CPUの勝ち';
    resultTextEl.textContent = 'もう一度頑張ろう！';
    sounds.lose();
  } else {
    state.draws += 1;
    state.stats.draws += 1;
    state.stats.winStreak = 0;
    saveStats(localStorage, state.stats);
    resultTitleEl.textContent = '🤝 引き分け！';
    resultTextEl.textContent = '盤面がいっぱいになりました。';
    sounds.draw();
  }
  render();
  setTimeout(() => openModal(resultModal), 400);
}

function doCpuMove() {
  const { cpu, depth } = DIFFICULTIES[state.difficulty];
  const cpuColor = state.humanFirst ? YELLOW : RED;

  const doMove = () => {
    const cpuCol = getCpuMove(state.board, cpuColor, cpu, depth);
    if (cpuCol === null || cpuCol < 0) return;
    const cpuRow = getLowestRow(state.board, cpuCol);
    state.board = dropPiece(state.board, cpuCol, cpuColor);
    state.lastDrop = cpuRow * COLS + cpuCol;
    sounds.drop();
    state.cpuThinking = false;
    state.currentColor = state.humanFirst ? RED : YELLOW;

    if (checkWin(state.board, cpuRow, cpuCol)) { render(); endGame(cpuColor); return; }
    if (isBoardFull(state.board)) { render(); endGame(null); return; }
    render();
  };

  if (state.difficulty === 'oni') {
    setTimeout(doMove, 0);
  } else {
    setTimeout(doMove, 500);
  }
}

function getLowestRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) { if (board[r * COLS + col] === null) return r; }
  return -1;
}

function handleDrop(col) {
  const humanColor = state.humanFirst ? RED : YELLOW;
  if (state.status !== 'playing' || state.cpuThinking || state.currentColor !== humanColor) return;

  const actualRow = getLowestRow(state.board, col);
  const next = dropPiece(state.board, col, humanColor);
  if (!next) return;

  state.board = next;
  state.lastDrop = actualRow * COLS + col;
  sounds.drop();

  if (checkWin(state.board, actualRow, col)) { render(); endGame(humanColor); return; }
  if (isBoardFull(state.board)) { render(); endGame(null); return; }

  state.currentColor = opponent(humanColor);
  state.cpuThinking = true;
  render();
  doCpuMove();
}

function startNewGame() {
  state.difficulty = difficultyEl.value;
  state.humanFirst = goFirstEl.checked;
  state.board = createBoard();
  state.currentColor = RED;
  state.lastDrop = null;
  state.status = 'playing';
  state.cpuThinking = false;
  state.winner = undefined;
  state.wins = loadWins(localStorage, state.difficulty);
  getEl('share-btn').hidden = true;
  render();

  // If CPU goes first (human chose to go second), trigger CPU move immediately
  if (!state.humanFirst) {
    state.currentColor = RED; // RED always goes first in Connect Four order
    state.cpuThinking = true;
    render();
    doCpuMove();
  }
}

colButtonsEl.querySelectorAll('.col-btn').forEach((btn) => {
  btn.addEventListener('click', () => handleDrop(Number(btn.dataset.col)));
});

const statsModal = getEl('stats-modal');

function openStatsModal() {
  const s = state.stats;
  const rate = s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;
  getEl('stats-played').textContent  = String(s.gamesPlayed);
  getEl('stats-wins').textContent    = String(s.wins);
  getEl('stats-losses').textContent  = String(s.losses);
  getEl('stats-draws').textContent   = String(s.draws);
  getEl('stats-rate').textContent    = rate + '%';
  getEl('stats-streak').textContent  = String(s.bestStreak);
  openModal(statsModal);
}

getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
getEl('stats-btn').addEventListener('click', openStatsModal);
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });

difficultyEl.addEventListener('change', () => {
  state.difficulty = difficultyEl.value;
});

goFirstEl.addEventListener('change', () => {
  state.humanFirst = goFirstEl.checked;
});

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
  if (state.status === 'idle') startNewGame();
});

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) { localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1'); closeModal(howtoModal); if (state.status === 'idle') startNewGame(); }
});

getEl('result-new').addEventListener('click', () => { closeModal(resultModal); startNewGame(); });
getEl('result-close').addEventListener('click', () => closeModal(resultModal));
resultModal.addEventListener('click', (e) => { if (e.target === resultModal) closeModal(resultModal); });

// テーマ切替
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// 色覚サポートトグル
getEl('cb-btn').style.opacity = state.colorblind ? '1' : '0.5';
getEl('cb-btn').addEventListener('click', () => {
  state.colorblind = !state.colorblind;
  localStorage.setItem('global_colorblind', state.colorblind ? '1' : '0');
  getEl('cb-btn').style.opacity = state.colorblind ? '1' : '0.5';
  document.body.dataset.colorblind = state.colorblind ? '1' : '';
  render();
});

// スコアシェア
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  const humanColor = state.humanFirst ? RED : YELLOW;
  const cpuColor   = state.humanFirst ? YELLOW : RED;
  if (state.winner === humanColor) {
    return `🎮 コネクトフォー [${diff}] 🎉 勝利！`;
  } else if (state.winner === cpuColor) {
    return `🎮 コネクトフォー [${diff}] 敗北…`;
  }
  return `🎮 コネクトフォー [${diff}] 引き分け`;
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

// ミュートトグル
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

function init() {
  document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
  document.body.dataset.colorblind = state.colorblind ? '1' : '';
  state.difficulty = difficultyEl.value;
  state.humanFirst = goFirstEl.checked;
  state.wins = loadWins(localStorage, state.difficulty);
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

init();
