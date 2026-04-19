import {
  COLORS, COLOR_LABELS, extendSequence, checkInput,
  isRoundComplete, getFlashDuration, getGapDuration, DIFFICULTIES,
} from './src/gameCore.js';
import { loadBestScore, saveBestScore, STORAGE_KEYS, loadStats, saveStats } from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  sequence: [],
  inputs: [],
  round: 0,
  bestScore: 0,
  status: 'idle', // idle | watching | input | over
  difficulty: 'normal',
  paused: false,
  stats: loadStats(localStorage),
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const roundEl     = getEl('round');
const bestEl      = getEl('best-score');
const statusEl    = getEl('status');
const hintEl      = getEl('hint');
const howtoModal  = getEl('howto-modal');
const overModal   = getEl('over-modal');
const overScoreEl = getEl('over-score-text');
const overBestEl  = getEl('over-best-text');
const statsModal  = getEl('stats-modal');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function setButtonsDisabled(disabled) {
  for (const color of COLORS) {
    const btn = getEl(`btn-${color}`);
    btn.disabled = disabled;
  }
}

function flashButton(color, duration) {
  return new Promise((resolve) => {
    const btn = getEl(`btn-${color}`);
    btn.classList.add('active');
    sounds.button(COLORS.indexOf(color));
    setTimeout(() => { btn.classList.remove('active'); resolve(); }, duration);
  });
}

async function waitWhilePaused() {
  while (state.paused) {
    await new Promise(r => setTimeout(r, 50));
  }
}

async function playSequence(sequence, round) {
  setButtonsDisabled(true);
  statusEl.textContent = 'よく見て！';
  hintEl.textContent = '';
  const multiplier = DIFFICULTIES[state.difficulty].speedMultiplier;
  for (const color of sequence) {
    await waitWhilePaused();
    const flashDur = getFlashDuration(round, multiplier);
    const gap = getGapDuration(round, multiplier);
    await new Promise((r) => setTimeout(r, gap));
    await flashButton(color, flashDur);
  }
  await new Promise((r) => setTimeout(r, getGapDuration(round, multiplier)));
  setButtonsDisabled(false);
  state.status = 'input';
  statusEl.textContent = '同じ順番に押してね！';
  hintEl.textContent = `${sequence.length} 個のボタンを押してください`;
}

function renderScores() {
  roundEl.textContent = String(state.round);
  bestEl.textContent = String(state.bestScore);
}

function togglePause() {
  if (state.status !== 'watching' && state.status !== 'input') return;
  state.paused = !state.paused;
  getEl('pause-btn').textContent = state.paused ? '▶' : '⏸';
  getEl('pause-overlay').hidden = !state.paused;
}

async function startRound() {
  state.sequence = extendSequence(state.sequence);
  state.inputs = [];
  state.round = state.sequence.length;
  state.status = 'watching';
  renderScores();
  await playSequence(state.sequence, state.round);
}

async function handleColorClick(color) {
  if (state.status !== 'input') return;

  const btn = getEl(`btn-${color}`);
  btn.classList.add('active');
  sounds.button(COLORS.indexOf(color));
  setTimeout(() => btn.classList.remove('active'), 200);

  const newInputs = [...state.inputs, color];
  state.inputs = newInputs;

  if (!checkInput(state.sequence, newInputs)) {
    state.status = 'over';
    setButtonsDisabled(true);
    sounds.fail();
    const isBestUpdate = state.round > state.bestScore;
    if (isBestUpdate) {
      state.bestScore = state.round;
      saveBestScore(localStorage, state.bestScore, state.difficulty);
    }
    state.stats.gamesPlayed++;
    state.stats.totalRounds += state.round;
    if (state.round > state.stats.bestRound) state.stats.bestRound = state.round;
    saveStats(localStorage, state.stats);
    renderScores();
    statusEl.textContent = `間違い！正解は ${COLOR_LABELS[state.sequence[newInputs.length - 1]]} でした`;
    overScoreEl.textContent = `ラウンド ${state.round} まで到達！`;
    overBestEl.hidden = !isBestUpdate;
    getEl('pause-btn').hidden = true;
    getEl('share-btn').hidden = false;
    setTimeout(() => openModal(overModal), 400);
    return;
  }

  if (isRoundComplete(state.sequence, newInputs)) {
    sounds.win();
    hintEl.textContent = '正解！次のラウンドへ…';
    statusEl.textContent = '';
    state.status = 'watching';
    setButtonsDisabled(true);
    setTimeout(() => startRound(), 800);
  } else {
    hintEl.textContent = `あと ${state.sequence.length - newInputs.length} 個`;
  }
}

async function startNewGame() {
  state.sequence = [];
  state.inputs = [];
  state.round = 0;
  state.paused = false;
  state.status = 'watching';
  getEl('pause-btn').textContent = '⏸';
  getEl('pause-btn').hidden = false;
  getEl('pause-overlay').hidden = true;
  getEl('share-btn').hidden = true;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderScores();
  await startRound();
}

for (const color of COLORS) {
  getEl(`btn-${color}`).addEventListener('click', () => handleColorClick(color));
}

getEl('new-game').addEventListener('click', () => startNewGame());
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
getEl('pause-btn').addEventListener('click', () => togglePause());
getEl('stats-btn').addEventListener('click', () => {
  const avg = state.stats.gamesPlayed > 0
    ? (state.stats.totalRounds / state.stats.gamesPlayed).toFixed(1)
    : '0.0';
  getEl('stats-played').textContent = state.stats.gamesPlayed;
  getEl('stats-best').textContent = state.stats.bestRound;
  getEl('stats-avg').textContent = avg;
  openModal(statsModal);
});

getEl('difficulty').addEventListener('change', (e) => {
  state.difficulty = e.target.value;
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderScores();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') togglePause();
});

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
  startNewGame();
});

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) { localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1'); closeModal(howtoModal); startNewGame(); }
});

getEl('over-new').addEventListener('click', () => { closeModal(overModal); startNewGame(); });
overModal.addEventListener('click', (e) => { if (e.target === overModal) closeModal(overModal); });
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });

// --- Theme toggle ---
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// --- Score share ---
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  return `🎮 サイモン [${diff}] ラウンド${state.round}到達\nベスト: ${state.bestScore}`;
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
  document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
  state.bestScore = loadBestScore(localStorage, state.difficulty);
  renderScores();
  setButtonsDisabled(true);
  statusEl.textContent = '「新しいゲーム」を押してはじめましょう。';
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
  const initMuted = localStorage.getItem('global_mute') === '1';
  getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
  getEl('mute-btn').addEventListener('click', () => {
    const muted = localStorage.getItem('global_mute') === '1';
    localStorage.setItem('global_mute', muted ? '0' : '1');
    getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
  });
}

init();
