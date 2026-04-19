export const STORAGE_KEYS = {
  bestScore: 'game10_reversi_best',
  tutorialSeen: 'game10_tutorial_seen',
};

export function bestScoreKey(difficulty) {
  return `game10_reversi_best_${difficulty}`;
}

export function loadBestScore(storage, difficulty) {
  const key = difficulty ? bestScoreKey(difficulty) : STORAGE_KEYS.bestScore;
  const raw = storage.getItem(key);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function saveBestScore(storage, score, difficulty) {
  const key = difficulty ? bestScoreKey(difficulty) : STORAGE_KEYS.bestScore;
  storage.setItem(key, String(score));
}

const STATS_KEY = 'game10_reversi_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, winStreak: 0, bestStreak: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
