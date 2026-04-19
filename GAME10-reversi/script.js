import {
  BLACK, WHITE, opponent, createBoard, getValidMoves, applyMove,
  countPieces, isGameOver, getWinner, getBestMove, getCpuMove, DIFFICULTIES,
} from './src/gameCore.js';
import { buildGridViewModel } from './src/gridView.js';
import { loadBestScore, saveBestScore, STORAGE_KEYS, loadStats, saveStats } from './src/storage.js';
import { sounds } from './src/audio.js';

const CPU_COLOR = WHITE;

const state = {
  board: createBoard(),
  currentColor: BLACK,
  lastMove: null,
  bestScore: 0,
  status: 'idle',
  cpuThinking: false,
  difficulty: 'normal',
  undoSnapshot: null,
  stats: loadStats(localStorage),
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const gridEl        = getEl('grid');
const blackCountEl  = getEl('black-count');
const whiteCountEl  = getEl('white-count');
const bestScoreEl   = getEl('best-score');
const statusEl      = getEl('status');
const howtoModal    = getEl('howto-modal');
const resultModal   = getEl('result-modal');
const resultTitleEl = getEl('result-title');
const resultTextEl  = getEl('result-text');
const resultBestEl  = getEl('result-best-text');
const difficultyEl  = getEl('difficulty');
const undoBtn       = getEl('undo-btn');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function updateUndoBtn() {
  undoBtn.disabled = !state.undoSnapshot || state.status !== 'playing' || state.cpuThinking;
}

function renderScores() {
  const { black, white } = countPieces(state.board);
  blackCountEl.textContent = String(black);
  whiteCountEl.textContent = String(white);
  bestScoreEl.textContent = String(state.bestScore);
}

function renderStatus() {
  if (state.status === 'idle') { statusEl.textContent = '「新しいゲーム」を押してはじめましょう。'; return; }
  if (state.status === 'over') { statusEl.textContent = 'ゲーム終了！'; return; }
  if (state.cpuThinking) { statusEl.textContent = 'CPUが考え中…'; return; }
  if (state.currentColor === BLACK) {
    const moves = getValidMoves(state.board, BLACK);
    statusEl.textContent = moves.length > 0 ? 'あなたの番です！' : 'あなたは置ける場所がないのでパスです';
  } else {
    statusEl.textContent = 'CPUの番です';
  }
}

function renderGrid() {
  const validMoves = state.currentColor === BLACK && !state.cpuThinking
    ? getValidMoves(state.board, BLACK) : [];
  const vm = buildGridViewModel({ board: state.board, validMoves, lastMove: state.lastMove, color: state.currentColor });

  gridEl.innerHTML = '';
  for (const { index, cell, isValid, isLastMove, ariaLabel } of vm) {
    const div = document.createElement('div');
    div.className = 'cell' + (isValid ? ' valid' : '') + (isLastMove ? ' last-move' : '');
    div.setAttribute('aria-label', ariaLabel);
    div.dataset.index = String(index);

    if (cell) {
      const piece = document.createElement('div');
      piece.className = `piece ${cell}`;
      div.appendChild(piece);
    } else if (isValid) {
      const dot = document.createElement('div');
      dot.className = 'valid-dot';
      div.appendChild(dot);
      div.addEventListener('click', () => handlePlayerMove(index));
    }
    gridEl.appendChild(div);
  }
}

function render() { renderScores(); renderGrid(); renderStatus(); updateUndoBtn(); }

function checkAndEndGame() {
  if (!isGameOver(state.board)) return false;
  state.status = 'over';
  const winner = getWinner(state.board);
  const { black, white } = countPieces(state.board);
  const isBestUpdate = black > state.bestScore;
  if (isBestUpdate) {
    state.bestScore = black;
    saveBestScore(localStorage, state.bestScore, state.difficulty);
  }

  // update stats
  const s = state.stats;
  s.gamesPlayed += 1;
  if (winner === BLACK) {
    s.wins += 1;
    s.winStreak += 1;
    if (s.winStreak > s.bestStreak) s.bestStreak = s.winStreak;
  } else if (winner === WHITE) {
    s.losses += 1;
    s.winStreak = 0;
  } else {
    s.draws += 1;
    s.winStreak = 0;
  }
  saveStats(localStorage, s);

  render();
  if (winner === BLACK) sounds.win();
  else if (winner === WHITE) sounds.lose();
  resultTitleEl.textContent = winner === BLACK ? '🎉 あなたの勝ち！' : winner === WHITE ? '😢 CPUの勝ち' : '🤝 引き分け！';
  resultTextEl.textContent = `黒 ${black} 対 白 ${white}`;
  resultBestEl.hidden = !isBestUpdate;
  getEl('share-btn').hidden = false;
  setTimeout(() => openModal(resultModal), 400);
  return true;
}

function applyAndRender(move) {
  state.board = applyMove(state.board, move, CPU_COLOR);
  state.lastMove = move;
  state.currentColor = BLACK;
  state.cpuThinking = false;

  if (checkAndEndGame()) return;

  const playerMoves = getValidMoves(state.board, BLACK);
  if (playerMoves.length === 0) {
    scheduleCpuMove();
    return;
  }
  render();
}

function handlePlayerMove(index) {
  if (state.status !== 'playing' || state.cpuThinking || state.currentColor !== BLACK) return;

  state.undoSnapshot = { board: [...state.board], currentColor: state.currentColor };

  sounds.place();
  state.board = applyMove(state.board, index, BLACK);
  state.lastMove = index;
  state.currentColor = WHITE;
  sounds.flip();
  render();

  if (checkAndEndGame()) return;
  scheduleCpuMove();
}

function scheduleCpuMove() {
  state.cpuThinking = true;
  renderStatus();
  updateUndoBtn();

  const cpuMoves = getValidMoves(state.board, CPU_COLOR);
  if (cpuMoves.length === 0) {
    state.currentColor = BLACK;
    state.cpuThinking = false;
    const playerMoves = getValidMoves(state.board, BLACK);
    if (playerMoves.length === 0) { checkAndEndGame(); return; }
    render();
    return;
  }

  const { cpu, depth } = DIFFICULTIES[state.difficulty];

  setTimeout(() => {
    const move = getCpuMove(state.board, CPU_COLOR, cpu, depth ?? 3);
    applyAndRender(move);
  }, 0);
}

function undoMove() {
  if (!state.undoSnapshot || state.status !== 'playing' || state.cpuThinking) return;
  state.board = state.undoSnapshot.board;
  state.currentColor = state.undoSnapshot.currentColor;
  state.lastMove = null;
  state.undoSnapshot = null;
  render();
}

function startNewGame() {
  state.board = createBoard();
  state.currentColor = BLACK;
  state.lastMove = null;
  state.status = 'playing';
  state.cpuThinking = false;
  state.undoSnapshot = null;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  getEl('share-btn').hidden = true;
  render();
}

getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
undoBtn.addEventListener('click', undoMove);

// 統計モーダル
const statsModal = getEl('stats-modal');
getEl('stats-btn').addEventListener('click', () => {
  const s = state.stats;
  const winRate = s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;
  getEl('stat-played').textContent = String(s.gamesPlayed);
  getEl('stat-wins').textContent = String(s.wins);
  getEl('stat-losses').textContent = String(s.losses);
  getEl('stat-draws').textContent = String(s.draws);
  getEl('stat-winrate').textContent = `${winRate}%`;
  getEl('stat-streak').textContent = String(s.bestStreak);
  openModal(statsModal);
});
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });

difficultyEl.addEventListener('change', () => {
  state.difficulty = difficultyEl.value;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderScores();
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

// スコアシェア
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  const { black, white } = countPieces(state.board);
  const result = black > white ? '黒（あなた）の勝利！' : black < white ? '白（CPU）の勝利…' : '引き分け';
  return `🎮 リバーシ [${diff}] ${result}\n黒: ${black} 対 白: ${white}`;
}
getEl('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl('share-btn').textContent = '✅ コピーしました';
    setTimeout(() => { getEl('share-btn').textContent = '📋 シェア'; }, 2000);
  });
});
resultModal.addEventListener('click', (e) => { if (e.target === resultModal) closeModal(resultModal); });

// テーマ切替
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// フルスクリーン
getEl('fs-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  getEl('fs-btn').textContent = document.fullscreenElement ? '⊡' : '⛶';
});

const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

function init() {
  state.difficulty = difficultyEl.value || 'normal';
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

init();
