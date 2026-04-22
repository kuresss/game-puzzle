import { createPlayer, expNeeded } from './player.js';
import { createEnemy, STAGES } from './enemies.js';
import { Battle } from './battle.js';
import { setScene, updateStatusText, updateEnemyUI, updateStageHeader, updateExpBar } from './ui.js';

// Expose expNeeded for ui.js
window.__rpgUtils = { expNeeded };

// ---- Global state ----
const G = {
  lang: 'en',
  stageIndex: 0,
  player: null,
  totalScore: 0,
  currentBattle: null,
};

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  setupTitleButtons();
  setupLanguageButtons();
  setupGameoverButtons();
  setupRankingButtons();
  showTutorialIfFirst();
  setScene('title');
});

function showTutorialIfFirst() {
  if (!localStorage.getItem('tutorialDone')) {
    document.getElementById('tutorial-banner')?.style.removeProperty('display');
    document.getElementById('tutorial-close')?.addEventListener('click', () => {
      localStorage.setItem('tutorialDone', '1');
      document.getElementById('tutorial-banner').style.display = 'none';
    });
  }
}

// ---- Title ----
function setupTitleButtons() {
  document.getElementById('btn-start')?.addEventListener('click', () => {
    setScene('language');
  });
  document.getElementById('btn-ranking')?.addEventListener('click', () => {
    renderRanking();
    setScene('ranking');
  });
  document.getElementById('btn-mute')?.addEventListener('click', () => {
    const muted = localStorage.getItem('mute') === '1';
    localStorage.setItem('mute', muted ? '0' : '1');
    document.getElementById('btn-mute').textContent = muted ? '🔊' : '🔇';
  });
}

// ---- Language select ----
function setupLanguageButtons() {
  document.getElementById('btn-lang-en')?.addEventListener('click', () => startGame('en'));
  document.getElementById('btn-lang-ja')?.addEventListener('click', () => startGame('ja'));
}

function startGame(lang) {
  G.lang = lang;
  G.stageIndex = 0;
  G.player = createPlayer();
  G.totalScore = 0;
  startBattle();
}

// ---- Battle ----
function startBattle() {
  const enemy = createEnemy(G.stageIndex);
  const stage = STAGES[G.stageIndex];

  updateStageHeader(stage, G.player);
  updateStatusText(G.player);
  updateEnemyUI(enemy);
  updateExpBar(G.player.exp, expNeeded(G.player.lv));

  // Clear log
  const log = document.getElementById('battle-log');
  if (log) log.innerHTML = '';

  setScene('battle');

  if (G.currentBattle) G.currentBattle.destroy();
  G.currentBattle = new Battle(
    G.player, enemy, G.lang,
    (score, leveled) => onVictory(score, leveled),
    () => onDefeat(),
  );
}

function onVictory(score, leveled) {
  G.totalScore += score;
  G.currentBattle = null;

  if (leveled) {
    showLevelUp();
    return;
  }
  advanceStage();
}

function showLevelUp() {
  const el = document.getElementById('levelup-text');
  if (el) el.textContent = `LV.${G.player.lv} にアップ！\nHP/MP が全回復！`;
  const stats = document.getElementById('levelup-stats');
  if (stats) stats.textContent = `HP +10  MP +5  ATK +2  DEF +1`;
  setScene('levelup');
}

document.addEventListener('click', e => {
  if (e.target.id === 'btn-next-stage') advanceStage();
});

function advanceStage() {
  G.stageIndex++;
  if (G.stageIndex >= STAGES.length) {
    showEnding();
    return;
  }
  startBattle();
}

// ---- Game Over ----
function onDefeat() {
  G.currentBattle = null;
  const el = document.getElementById('gameover-score');
  if (el) el.textContent = `スコア: ${G.totalScore.toLocaleString()} pt`;
  setScene('gameover');
}

function setupGameoverButtons() {
  document.getElementById('btn-retry')?.addEventListener('click', () => {
    G.stageIndex = 0;
    G.player = createPlayer();
    G.totalScore = 0;
    startBattle();
  });
  document.getElementById('btn-to-title')?.addEventListener('click', () => setScene('title'));
}

// ---- Ending / Ranking ----
function showEnding() {
  saveScore(G.totalScore);
  document.getElementById('ending-score')?.setAttribute('data-score', G.totalScore);
  const el = document.getElementById('ending-score');
  if (el) el.textContent = `最終スコア: ${G.totalScore.toLocaleString()} pt`;
  renderRanking();
  setScene('ranking');
}

function saveScore(score) {
  let scores = JSON.parse(localStorage.getItem('rpg_scores') || '[]');
  scores.push({ score, date: new Date().toLocaleDateString('ja-JP') });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 5);
  localStorage.setItem('rpg_scores', JSON.stringify(scores));
}

function renderRanking() {
  const scores = JSON.parse(localStorage.getItem('rpg_scores') || '[]');
  const el = document.getElementById('ranking-list');
  if (!el) return;
  if (scores.length === 0) {
    el.innerHTML = '<p class="rank-empty">まだ記録がありません</p>';
    return;
  }
  const medals = ['🥇', '🥈', '🥉', '4位', '5位'];
  el.innerHTML = scores.map((s, i) =>
    `<div class="rank-row"><span class="rank-medal">${medals[i]}</span><span class="rank-score">${s.score.toLocaleString()} pt</span><span class="rank-date">${s.date}</span></div>`
  ).join('');
}

function setupRankingButtons() {
  document.getElementById('btn-ranking-back')?.addEventListener('click', () => setScene('title'));
  document.getElementById('btn-ranking-play')?.addEventListener('click', () => setScene('language'));
}
