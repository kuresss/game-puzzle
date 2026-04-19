export const STORAGE_KEYS = {
  bestScore: 'game8_simon_best_score',
  tutorialSeen: 'game8_tutorial_seen',
};

function bestScoreKey(difficulty) {
  return `game8_simon_best_score_${difficulty}`;
}

export function loadBestScore(storage, difficulty = 'normal') {
  const raw = storage.getItem(bestScoreKey(difficulty));
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function saveBestScore(storage, score, difficulty = 'normal') {
  storage.setItem(bestScoreKey(difficulty), String(score));
}

const STATS_KEY = 'game8_simon_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, bestRound: 0, totalRounds: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
