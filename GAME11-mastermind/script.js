import {
  ALL_COLORS, COLOR_HEX, DIFFICULTIES,
  generateSecret, evaluate, isWin, isValidGuess, getColorHex,
} from './src/gameCore.js';
import { buildHistoryViewModel } from './src/historyView.js';
import { loadBestAttempts, saveBestAttempts, STORAGE_KEYS, loadStats, saveStats } from './src/storage.js';
import { sounds } from './src/audio.js';

const state = {
  secret: [],
  currentGuess: [],
  selectedColor: null,
  history: [],
  bestAttempts: null,
  status: 'idle',
  difficulty: 'normal',
  undoSnapshot: null,
  colorblind: localStorage.getItem('global_colorblind') === '1',
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
const slotsEl        = getEl('guess-slots');
const submitBtn      = getEl('submit-guess');
const historyEl      = getEl('history');
const howtoModal     = getEl('howto-modal');
const clearModal     = getEl('clear-modal');
const failModal      = getEl('fail-modal');
const statsModal     = getEl('stats-modal');
const clearTextEl    = getEl('clear-text');
const clearBestEl    = getEl('clear-best-text');
const failAnswerEl   = getEl('fail-answer-text');
const undoBtn        = getEl('undo-btn');
const difficultyEl   = getEl('difficulty');

function openModal(el) { el.hidden = false; const btn = el.querySelector('button'); if (btn) btn.focus(); }
function closeModal(el) { el.hidden = true; }

function currentDiff() { return DIFFICULTIES[state.difficulty]; }

function renderScores() {
  const { maxAttempts } = currentDiff();
  attemptsLeftEl.textContent = String(maxAttempts - state.history.length);
  bestEl.textContent = state.bestAttempts === null ? '-' : String(state.bestAttempts);
}

function renderStatus() {
  const { codeLength } = currentDiff();
  if (state.status === 'idle') { statusEl.textContent = '「新しいゲーム」を押してはじめましょう。'; return; }
  if (state.status === 'won')  { statusEl.textContent = '正解！おめでとうございます！'; return; }
  if (state.status === 'lost') { statusEl.textContent = '残念！次回チャレンジ！'; return; }
  const remaining = codeLength - state.currentGuess.length;
  statusEl.textContent = remaining > 0 ? `あと ${remaining} 色選んでください` : '「送信」ボタンを押してください';
}

function renderSlots() {
  const { codeLength } = currentDiff();
  // Rebuild slots if count changed
  const current = slotsEl.querySelectorAll('.slot');
  if (current.length !== codeLength) {
    slotsEl.innerHTML = '';
    for (let i = 0; i < codeLength; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.pos = String(i);
      slot.setAttribute('aria-label', `${i + 1}番目`);
      slot.addEventListener('click', () => {
        const pos = Number(slot.dataset.pos);
        if (pos < state.currentGuess.length) {
          state.currentGuess = state.currentGuess.filter((_, idx) => idx !== pos);
          render();
        }
      });
      slotsEl.appendChild(slot);
    }
  }
  const slots = slotsEl.querySelectorAll('.slot');
  slots.forEach((slot, i) => {
    const color = state.currentGuess[i];
    if (color) {
      slot.style.background = getColorHex(state.colorblind)[color] ?? '';
      slot.classList.add('filled');
      slot.setAttribute('aria-label', `${i + 1}番目: ${color}`);
    } else {
      slot.style.background = '';
      slot.classList.remove('filled');
      slot.setAttribute('aria-label', `${i + 1}番目: 空き`);
    }
  });
  submitBtn.disabled = !isValidGuess(state.currentGuess, state.difficulty) || state.status !== 'playing';
}

function renderPalette() {
  const { colorCount } = currentDiff();
  const paletteEl = getEl('palette');
  const colors = ALL_COLORS.slice(0, colorCount);
  paletteEl.innerHTML = '';
  const labels = { red: '赤', orange: '橙', yellow: '黄', green: '緑', blue: '青', purple: '紫', pink: '桃', cyan: '水' };
  for (const color of colors) {
    const btn = document.createElement('button');
    btn.className = 'color-pick';
    btn.dataset.color = color;
    btn.type = 'button';
    btn.setAttribute('aria-label', labels[color] ?? color);
    btn.style.background = getColorHex(state.colorblind)[color];
    if (color === state.selectedColor) btn.classList.add('selected');
    btn.addEventListener('click', () => pickColor(color));
    paletteEl.appendChild(btn);
  }
}

function renderUndo() {
  undoBtn.disabled = state.undoSnapshot === null || state.status !== 'playing';
}

function renderHistory() {
  const { codeLength } = currentDiff();
  historyEl.innerHTML = '';
  const vm = buildHistoryViewModel(state.history, getColorHex(state.colorblind));
  for (const row of [...vm].reverse()) {
    const div = document.createElement('div');
    div.className = 'hist-row';

    const numEl = document.createElement('span');
    numEl.className = 'hist-num';
    numEl.textContent = String(row.number);

    const colorsEl = document.createElement('div');
    colorsEl.className = 'hist-colors';
    for (const { hex } of row.colors) {
      const c = document.createElement('div');
      c.className = 'hist-circle';
      c.style.background = hex;
      colorsEl.appendChild(c);
    }

    const pegsEl = document.createElement('div');
    pegsEl.className = 'hist-pegs';
    const total = row.black + row.white;
    for (let i = 0; i < codeLength; i++) {
      const p = document.createElement('div');
      p.className = 'peg ' + (i < row.black ? 'black-peg' : i < total ? 'white-peg' : 'empty-peg');
      pegsEl.appendChild(p);
    }

    const labelEl = document.createElement('span');
    labelEl.className = 'hist-label';
    labelEl.textContent = `⚫${row.black} ⚪${row.white}`;

    div.appendChild(numEl);
    div.appendChild(colorsEl);
    div.appendChild(pegsEl);
    div.appendChild(labelEl);
    historyEl.appendChild(div);
  }
}

function render() { renderScores(); renderSlots(); renderStatus(); renderHistory(); renderUndo(); }

function updateStats(won) {
  const s = state.stats;
  s.gamesPlayed += 1;
  if (won) {
    s.wins += 1;
    s.winStreak += 1;
    if (s.winStreak > s.bestStreak) s.bestStreak = s.winStreak;
  } else {
    s.winStreak = 0;
  }
  saveStats(localStorage, s);
}

function renderStats() {
  const s = state.stats;
  const winRate = s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;
  getEl('stats-played').textContent = String(s.gamesPlayed);
  getEl('stats-wins').textContent = String(s.wins);
  getEl('stats-winrate').textContent = `${winRate}%`;
  getEl('stats-streak').textContent = String(s.winStreak);
  getEl('stats-best-streak').textContent = String(s.bestStreak);
}

function pickColor(color) {
  if (state.status !== 'playing') return;
  const { codeLength } = currentDiff();
  state.selectedColor = color;
  // Highlight selected palette button
  document.querySelectorAll('.color-pick').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.color === color);
  });
  // Auto-fill next empty slot
  if (state.currentGuess.length < codeLength) {
    state.currentGuess = [...state.currentGuess, color];
    sounds.pin();
    render();
  }
}

function submitGuess() {
  if (!isValidGuess(state.currentGuess, state.difficulty) || state.status !== 'playing') return;
  const { codeLength, maxAttempts } = currentDiff();

  // Save undo snapshot before pushing history
  state.undoSnapshot = { history: state.history.map((h) => ({ ...h })), currentGuess: [...state.currentGuess] };

  const result = evaluate(state.secret, state.currentGuess);
  state.history.push({ guess: [...state.currentGuess], result });
  state.currentGuess = [];
  state.selectedColor = null;
  document.querySelectorAll('.color-pick').forEach((btn) => btn.classList.remove('selected'));

  if (isWin(result, codeLength)) {
    state.status = 'won';
    const attempts = state.history.length;
    const isBestUpdate = state.bestAttempts === null || attempts < state.bestAttempts;
    if (isBestUpdate) {
      state.bestAttempts = attempts;
      saveBestAttempts(localStorage, attempts, state.difficulty);
    }
    updateStats(true);
    sounds.win();
    render();
    getEl('share-btn').hidden = false;
    clearTextEl.textContent = `${attempts} 回でクリア！`;
    clearBestEl.hidden = !isBestUpdate;
    setTimeout(() => openModal(clearModal), 200);
    return;
  }

  if (state.history.length >= maxAttempts) {
    state.status = 'lost';
    updateStats(false);
    sounds.fail();
    render();
    getEl('share-btn').hidden = false;
    const answerHtml = state.secret.map((c) => `<div class="answer-circle" style="background:${getColorHex(state.colorblind)[c]}"></div>`).join('');
    failAnswerEl.innerHTML = `答えは: <div class="answer-reveal">${answerHtml}</div>`;
    setTimeout(() => openModal(failModal), 200);
    return;
  }

  if (result.black > 0) sounds.black();
  else if (result.white > 0) sounds.white();
  render();
}

function clearGuess() {
  state.currentGuess = [];
  render();
}

function undoMove() {
  if (state.undoSnapshot === null || state.status !== 'playing') return;
  state.history = state.undoSnapshot.history;
  state.currentGuess = state.undoSnapshot.currentGuess;
  state.undoSnapshot = null;
  render();
}

submitBtn.addEventListener('click', submitGuess);
getEl('clear-guess').addEventListener('click', clearGuess);
getEl('new-game').addEventListener('click', startNewGame);
getEl('help-btn').addEventListener('click', () => openModal(howtoModal));
getEl('stats-btn').addEventListener('click', () => { renderStats(); openModal(statsModal); });
getEl('stats-close').addEventListener('click', () => closeModal(statsModal));
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(statsModal); });
undoBtn.addEventListener('click', undoMove);

difficultyEl.addEventListener('change', () => {
  state.difficulty = difficultyEl.value;
  startNewGame();
});

getEl('howto-close').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
  closeModal(howtoModal);
  if (state.status === 'idle') startNewGame();
});

howtoModal.addEventListener('click', (e) => {
  if (e.target === howtoModal) {
    localStorage.setItem(STORAGE_KEYS.tutorialSeen, '1');
    closeModal(howtoModal);
    if (state.status === 'idle') startNewGame();
  }
});

getEl('clear-next').addEventListener('click', () => { closeModal(clearModal); startNewGame(); });
getEl('clear-close').addEventListener('click', () => closeModal(clearModal));
clearModal.addEventListener('click', (e) => { if (e.target === clearModal) closeModal(clearModal); });
getEl('fail-new').addEventListener('click', () => { closeModal(failModal); startNewGame(); });
failModal.addEventListener('click', (e) => { if (e.target === failModal) closeModal(failModal); });

function startNewGame() {
  state.secret = generateSecret(state.difficulty);
  state.currentGuess = [];
  state.selectedColor = null;
  state.history = [];
  state.undoSnapshot = null;
  state.status = 'playing';
  state.bestAttempts = loadBestAttempts(localStorage, state.difficulty);
  getEl('share-btn').hidden = true;
  renderPalette();
  render();
}

// ── Theme toggle ──────────────────────────────────────────────
document.body.dataset.theme = localStorage.getItem('global_theme') || 'dark';
getEl('theme-btn').addEventListener('click', () => {
  const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = t;
  localStorage.setItem('global_theme', t);
});

// ── Mute toggle ───────────────────────────────────────────────
const initMuted = localStorage.getItem('global_mute') === '1';
getEl('mute-btn').textContent = initMuted ? '🔇' : '🔊';
getEl('mute-btn').addEventListener('click', () => {
  const muted = localStorage.getItem('global_mute') === '1';
  localStorage.setItem('global_mute', muted ? '0' : '1');
  getEl('mute-btn').textContent = muted ? '🔊' : '🔇';
});

// ── Colorblind toggle ─────────────────────────────────────────
getEl('cb-btn').style.opacity = state.colorblind ? '1' : '0.5';
getEl('cb-btn').addEventListener('click', () => {
  state.colorblind = !state.colorblind;
  localStorage.setItem('global_colorblind', state.colorblind ? '1' : '0');
  getEl('cb-btn').style.opacity = state.colorblind ? '1' : '0.5';
  renderPalette();
  render();
});

// ── Fullscreen ────────────────────────────────────────────────
getEl('fs-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  getEl('fs-btn').textContent = document.fullscreenElement ? '⊡' : '⛶';
});

// ── Score share ───────────────────────────────────────────────
function formatShareText() {
  const diff = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: '🔴鬼' }[state.difficulty] || state.difficulty;
  if (state.status === 'won') {
    const maxAtt = currentDiff().maxAttempts || 10;
    return `🎮 マスターマインド [${diff}] ${state.history.length}/${maxAtt}回で正解！`;
  }
  return `🎮 マスターマインド [${diff}] 解読失敗…`;
}

getEl('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(formatShareText()).then(() => {
    getEl('share-btn').textContent = '✅ コピーしました';
    setTimeout(() => { getEl('share-btn').textContent = '📋 シェア'; }, 2000);
  });
});

function init() {
  state.difficulty = difficultyEl.value || 'normal';
  state.bestAttempts = loadBestAttempts(localStorage, state.difficulty);
  renderPalette();
  render();
  if (!localStorage.getItem(STORAGE_KEYS.tutorialSeen)) openModal(howtoModal);
}

init();
