export const STORAGE_KEYS = {
  bestScore: 'game14_breakout_best',
  bestScoreForDifficulty: (difficulty) => `game14_breakout_best_${difficulty}`,
};

export function loadBestScore(storage, difficulty) {
  const key = difficulty
    ? STORAGE_KEYS.bestScoreForDifficulty(difficulty)
    : STORAGE_KEYS.bestScore;
  const raw = storage.getItem(key);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function saveBestScore(storage, score, difficulty) {
  const key = difficulty
    ? STORAGE_KEYS.bestScoreForDifficulty(difficulty)
    : STORAGE_KEYS.bestScore;
  storage.setItem(key, String(score));
}

const STATS_KEY = 'game14_breakout_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, wins: 0, highScore: 0, totalScore: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
