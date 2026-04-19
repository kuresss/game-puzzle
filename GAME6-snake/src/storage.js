export const STORAGE_KEYS = {
  bestScore: 'game6_snake_best_score',
  tutorialSeen: 'game6_tutorial_seen',
};

function bestScoreKey(difficulty) {
  return difficulty ? `game6_snake_best_score_${difficulty}` : STORAGE_KEYS.bestScore;
}

export function loadBestScore(storage, difficulty) {
  const raw = storage.getItem(bestScoreKey(difficulty));
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function saveBestScore(storage, score, difficulty) {
  storage.setItem(bestScoreKey(difficulty), String(score));
}

const STATS_KEY = 'game6_snake_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, highScore: 0, totalScore: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
