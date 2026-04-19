import {
  HOLE_COUNT, createHoles, spawnMole,
  hitMole, expireMoles, getSpawnInterval,
  DIFFICULTIES, isEndless,
} from './src/gameCore.js';
import { buildGridViewModel } from './src/gridView.js';
import {
  loadBestScoreByDifficulty, saveBestScoreByDifficulty,
  STORAGE_KEYS, loadStats, saveStats,
} from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  holes: createHoles(),
  score: 0,
  bestScore: 0,
  timeLeft: DIFFICULTIES.normal.duration,
  elapsed: 0,
  moleId: 0,
  status: 'idle',
  timerId: null,
  spawnId: null,
  expireId: null,
  difficulty: 'normal',
  hasDummy: false,
  paused: false,
  pauseStartedAt: 0,
  stats: loadStats(localStorage),
};

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const scoreEl       = getEl('score');
const timerEl       = getEl('timer');
const timerLabelEl  = getEl('timer-label');
const bestScoreEl   = getEl('best-score');
const statusEl      = getEl('status');
const gridEl        = getEl('grid');
const howtoModal    = getEl('howto-modal');
const resultModal   = getEl('result-modal');
const resultScoreEl = getEl('result-score-text');
const resultBestEl  = getEl('result-best-text');
const pauseOverlay  = getEl('pause-overlay');
const pauseBtn      = getEl('pause-btn');
const difficultyEl  = getEl('difficulty');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

const holeEls = Array.from({ length: HOLE_COUNT }, (_, i) => gridEl.querySelector(`[data-index="${i}"]`));

function renderGrid() {
  const vm = buildGridViewModel({ holes: state.holes });
  for (const { index, hasMole, isBonus, isDummy, ariaLabel } of vm) {
    const el = holeEls[index];
    if (!el) continue;
    el.setAttribute('aria-label', ariaLabel);
    el.classList.toggle('up',    hasMole);
    el.classList.toggle('bonus', hasMole && isBonus);
    el.classList.toggle('dummy', hasMole && isDummy);
  }
}

function renderScores() {
  scoreEl.textContent = String(state.score);
  if (isEndless(state.difficulty)) {
    timerEl.textContent = String(state.elapsed);
    timerEl.style.color = '';
  } else {
    timerEl.textContent = String(state.timeLeft);
    timerEl.style.color = state.timeLeft <= 5 ? '#ef5350' : '';
  }
  bestScoreEl.textContent = String(state.bestScore);
}

function renderStatus() {
  const map = {
    idle: '「新しいゲーム」を押してはじめましょう。',
    playing: 'もぐらを叩け！',
    over: '時間切れ！',
  };
  statusEl.textContent = map[state.status] ?? '';
}

function render() { renderGrid(); renderScores(); renderStatus(); }

function stopAll() {
  if (state.timerId)  { clearInterval(state.timerId);  state.timerId  = null; }
  if (state.spawnId)  { clearTimeout(state.spawnId);   state.spawnId  = null; }
  if (state.expireId) { clearInterval(state.expireId); state.expireId = null; }
}

function scheduleNextSpawn() {
  const cfg = DIFFICULTIES[state.difficulty];
  const interval = isEndless(state.difficulty)
    ? Math.max(cfg.spawnMin, cfg.spawnBase - Math.floor(state.elapsed / 5) * 100)
    : getSpawnInterval(state.timeLeft, cfg.duration, cfg.spawnBase, cfg.spawnMin);
  state.spawnId = setTimeout(() => {
    if (state.status !== 'playing' || state.paused) return;
    const { holes: next } = spawnMole(state.holes, ++state.moleId, Math.random, state.hasDummy);
    state.holes = next;
    renderGrid();
    scheduleNextSpawn();
  }, interval);
}

function startCountdown() {
  const endless = isEndless(state.difficulty);
  state.timerId = setInterval(() => {
    if (state.paused) return;
    if (endless) {
      state.elapsed += 1;
    } else {
      state.timeLeft -= 1;
    }
    timerEl.textContent = String(endless ? state.elapsed : state.timeLeft);
    if (!endless) timerEl.style.color = state.timeLeft <= 5 ? '#ef5350' : '';

    if (!endless && state.timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  stopAll();
  state.holes = createHoles();
  state.status = 'over';
  sounds.end();
  render();
  const isBestUpdate = state.score > state.bestScore;
  if (isBestUpdate) {
    state.bestScore = state.score;
    saveBestScoreByDifficulty(localStorage, state.difficulty, state.bestScore);
  }
  state.stats.gamesPlayed++;
  state.stats.totalScore += state.score;
  if (state.score > state.stats.highScore) state.stats.highScore = state.score;
  saveStats(localStorage, state.stats);
  resultScoreEl.textContent = `スコア: ${state.score}点`;
  resultBestEl.hidden = !isBestUpdate;
  getEl('share-btn').hidden = false;
  getEl('share-btn').textContent = '📋 シェア';
  setTimeout(() => openModal(resultModal), 200);
}

function pauseGame() {
  state.paused = true;
  state.pauseStartedAt = Date.now();
  clearTimeout(state.spawnId);
  state.spawnId = null;
  pauseOverlay.hidden = false;
  pauseBtn.textContent = '▶';
}

function resumeGame() {
  state.paused = false;
  pauseOverlay.hidden = true;
  pauseBtn.textContent = '⏸';
  scheduleNextSpawn();
}

function togglePause() {
  if (state.status !== 'playing') return;
  if (state.paused) {
    resumeGame();
  } else {
    pauseGame();
  }
}

function startNewGame() {
  stopAll();
  state.difficulty = difficultyEl.value;
  const cfg = DIFFICULTIES[state.difficulty];
  state.holes = createHoles();
  state.score = 0;
  state.timeLeft = isEndless(state.difficulty) ? 0 : cfg.duration;
  state.elapsed = 0;
  state.moleId = 0;
  state.status = 'playing';
  state.hasDummy = cfg.hasDummy;
  state.paused = false;
  state.bestScore = loadBestScoreByDifficulty(localStorage, state.difficulty);
  pauseOverlay.hidden = true;
  pauseBtn.hidden = false;
  pauseBtn.textContent = '⏸';
  getEl('share-btn').hidden = true;
  timerLabelEl.textContent = isEndless(state.difficulty) ? '経過' : '時間';
  render();

  state.expireId = setInterval(() => {
    state.holes = expireMoles(state.holes);
    renderGrid();
  }, 100);

  scheduleNextSpawn();
  startCountdown();
}

function handleHoleClick(index) {
  if (state.status !== 'playing' || state.paused) return;
  const mole = state.holes[index];
  const { holes: next, points, hit } = hitMole(state.holes, index);
  if (!hit) return;
  state.holes = next;
  state.score += points;

  if (mole && mole.type === 'dummy') {
    sounds.dummy();
  } else {
    sounds.hit();
  }

  const el = holeEls[index];
  if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 300); }

  render();
}

for (let i = 0; i < HOLE_COUNT; i++) {
  holeEls[i].addEventListener('click', () => handleHoleClick(i));
}

getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
pauseBtn.addEventListener('click', togglePause);
getEl('pause-resume').addEventListener('click', togglePause);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') togglePause();
});

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
  startNewGame();
});

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) {
    localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
    closeModal(howtoModal);
    startNewGame();
  }
});

getEl('result-new').addEventListener('click', () => { closeModal(resultModal); startNewGame(); });
getEl('result-close').addEventListener('click', () => closeModal(resultModal));
resultModal.addEventListener('click', (e) => { if (e.target === resultModal) closeModal(resultModal); });

function init() {
  state.bestScore = loadBestScoreByDifficulty(localStorage, state.difficulty);
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

// --- テーマ切替 ---
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// --- ミュート切替 ---
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

// --- スコアシェア ---
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼', endless: 'エンドレス' }[state.difficulty] || state.difficulty;
  return `🎮 モグラたたき [${diff}] スコア: ${state.score}\nベスト: ${state.bestScore}`;
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

// --- 統計 ---
const statsModal = getEl('stats-modal');
getEl('stats-btn').addEventListener('click', () => {
  const s = state.stats;
  const avg = s.gamesPlayed > 0 ? Math.round(s.totalScore / s.gamesPlayed) : 0;
  getEl('stats-played').textContent = String(s.gamesPlayed);
  getEl('stats-high').textContent = String(s.highScore);
  getEl('stats-avg').textContent = String(avg);
  openModal(statsModal);
});
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });

// --- Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

init();
