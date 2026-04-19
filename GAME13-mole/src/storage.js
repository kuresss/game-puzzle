export const STORAGE_KEYS = {
  bestScore: 'game13_mole_best_score',
  tutorialSeen: 'game13_tutorial_seen',
};

export function bestScoreKey(difficulty) {
  return `game13_mole_best_score_${difficulty}`;
}

export function loadBestScore(storage) {
  const raw = storage.getItem(STORAGE_KEYS.bestScore);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function saveBestScore(storage, score) {
  storage.setItem(STORAGE_KEYS.bestScore, String(score));
}

export function loadBestScoreByDifficulty(storage, difficulty) {
  const raw = storage.getItem(bestScoreKey(difficulty));
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function saveBestScoreByDifficulty(storage, difficulty, score) {
  storage.setItem(bestScoreKey(difficulty), String(score));
}

const STATS_KEY = 'game13_mole_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, highScore: 0, totalScore: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
