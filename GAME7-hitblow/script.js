import {
  DIFFICULTIES, generateSecret, evaluate, isValidGuess, isWinResult,
} from './src/gameCore.js';
import { buildHistoryViewModel } from './src/historyView.js';
import { loadBestAttempts, saveBestAttempts, STORAGE_KEYS, loadStats, saveStats } from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  secret: '',
  difficulty: 'normal',
  history: [],
  status: 'idle',
  bestAttempts: null,
  stats: loadStats(localStorage),
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const attemptsLeftEl = getEl('attempts-left');
const bestEl         = getEl('best-attempts');
const statusEl       = getEl('status');
const inputArea      = getEl('input-area');
const guessInput     = getEl('guess-input');
const historyEl      = getEl('history');
const howtoModal     = getEl('howto-modal');
const clearModal     = getEl('clear-modal');
const failModal      = getEl('fail-modal');
const statsModal     = getEl('stats-modal');
const clearTextEl    = getEl('clear-text');
const clearBestEl    = getEl('clear-best-text');
const failAnswerEl   = getEl('fail-answer-text');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function getDifficulty() {
  return getEl('difficulty').value;
}

function renderScores() {
  const { maxAttempts } = DIFFICULTIES[state.difficulty];
  attemptsLeftEl.textContent = String(maxAttempts - state.history.length);
  bestEl.textContent = state.bestAttempts === null ? '-' : String(state.bestAttempts);
}

function renderStatus() {
  const { digits } = DIFFICULTIES[state.difficulty];
  const map = {
    idle: '難易度を選んで「新しいゲーム」を押してください。',
    playing: `${digits}桁の数字を入力して送信！`,
    won: '正解！おめでとうございます！',
    lost: `答えは ${state.secret} でした。`,
  };
  statusEl.textContent = map[state.status] ?? '';
}

function renderInputArea() {
  inputArea.hidden = state.status !== 'playing';
  if (state.status === 'playing') {
    const { digits } = DIFFICULTIES[state.difficulty];
    guessInput.maxLength = digits;
    guessInput.placeholder = '0'.repeat(digits);
    guessInput.value = '';
    guessInput.focus();
  }
}

function renderHistory() {
  historyEl.innerHTML = '';
  const vm = buildHistoryViewModel(state.history);
  for (const row of vm) {
    const div = document.createElement('div');
    div.className = 'history-row';
    div.setAttribute('aria-label', row.label);

    const numEl = document.createElement('span');
    numEl.className = 'history-num';
    numEl.textContent = String(row.number);

    const guessEl = document.createElement('span');
    guessEl.className = 'history-guess';
    guessEl.textContent = row.guess;

    const resultEl = document.createElement('div');
    resultEl.className = 'history-result';

    const hitTag = document.createElement('span');
    hitTag.className = `tag ${row.hit > 0 ? 'hit' : 'none'}`;
    hitTag.textContent = `${row.hit}HIT`;

    const blowTag = document.createElement('span');
    blowTag.className = `tag ${row.blow > 0 ? 'blow' : 'none'}`;
    blowTag.textContent = `${row.blow}BLOW`;

    resultEl.appendChild(hitTag);
    resultEl.appendChild(blowTag);
    div.appendChild(numEl);
    div.appendChild(guessEl);
    div.appendChild(resultEl);
    historyEl.appendChild(div);
  }
  // scroll to bottom
  historyEl.scrollTop = historyEl.scrollHeight;
}

function render() { renderScores(); renderStatus(); renderInputArea(); renderHistory(); }

function updateStats(won) {
  state.stats.gamesPlayed += 1;
  if (won) {
    state.stats.wins += 1;
    state.stats.winStreak += 1;
    if (state.stats.winStreak > state.stats.bestStreak) state.stats.bestStreak = state.stats.winStreak;
  } else {
    state.stats.winStreak = 0;
  }
  saveStats(localStorage, state.stats);
}

function renderStatsModal() {
  const { gamesPlayed, wins, winStreak, bestStreak } = state.stats;
  const rate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  getEl('stats-played').textContent = String(gamesPlayed);
  getEl('stats-wins').textContent = String(wins);
  getEl('stats-rate').textContent = `${rate}%`;
  getEl('stats-streak').textContent = String(winStreak);
  getEl('stats-best-streak').textContent = String(bestStreak);
}

function submitGuess() {
  const guess = guessInput.value.trim();
  if (!isValidGuess(guess, state.difficulty)) {
    guessInput.classList.add('shake');
    setTimeout(() => guessInput.classList.remove('shake'), 400);
    guessInput.select();
    return;
  }

  sounds.input();
  const result = evaluate(state.secret, guess);
  state.history.push({ guess, result });

  const { maxAttempts, digits } = DIFFICULTIES[state.difficulty];

  if (isWinResult(result, digits)) {
    state.status = 'won';
    sounds.win();
    const attempts = state.history.length;
    const isBestUpdate = state.bestAttempts === null || attempts < state.bestAttempts;
    if (isBestUpdate) { state.bestAttempts = attempts; saveBestAttempts(localStorage, state.difficulty, attempts); }
    updateStats(true);
    render();
    getEl('share-btn').hidden = false;
    clearTextEl.textContent = `${attempts} 回でクリア！答えは ${state.secret}`;
    clearBestEl.hidden = !isBestUpdate;
    setTimeout(() => openModal(clearModal), 200);
    return;
  }

  if (state.history.length >= maxAttempts) {
    state.status = 'lost';
    sounds.fail();
    updateStats(false);
    render();
    getEl('share-btn').hidden = false;
    failAnswerEl.textContent = `答えは ${state.secret} でした！`;
    setTimeout(() => openModal(failModal), 200);
    return;
  }

  if (result.hit > 0) {
    sounds.hit();
  } else if (result.blow > 0) {
    sounds.blow();
  }

  guessInput.value = '';
  guessInput.focus();
  render();
}

function startNewGame() {
  state.difficulty = getDifficulty();
  state.secret = generateSecret(state.difficulty);
  state.history = [];
  state.status = 'playing';
  state.bestAttempts = loadBestAttempts(localStorage, state.difficulty);
  getEl('share-btn').hidden = true;
  render();
}

getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
getEl('stats-btn').addEventListener('click', () => { renderStatsModal(); openModal(statsModal); });
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });
getEl('submit-btn').addEventListener('click', submitGuess);
getEl('difficulty').addEventListener('change', () => {
  state.difficulty = getDifficulty();
  state.bestAttempts = loadBestAttempts(localStorage, state.difficulty);
  renderScores();
});

guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitGuess();
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

// --- ミュート切替 ---
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

// --- テーマ切替 ---
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// --- スコアシェア ---
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  if (state.status === 'won') {
    return `🎮 ヒットアンドブロー [${diff}] ${state.history.length}回目で正解！`;
  }
  return `🎮 ヒットアンドブロー [${diff}] 挑戦失敗…`;
}
getEl('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl('share-btn').textContent = '✅ コピーしました';
    setTimeout(() => { getEl('share-btn').textContent = '📋 シェア'; }, 2000);
  });
});

// --- フルスクリーン ---
getEl('fs-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  getEl('fs-btn').textContent = document.fullscreenElement ? '⊡' : '⛶';
});

function init() {
  state.difficulty = getDifficulty();
  state.bestAttempts = loadBestAttempts(localStorage, state.difficulty);
  inputArea.hidden = true;
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

init();
