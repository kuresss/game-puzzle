export const STORAGE_KEYS = {
  bestPrefix: 'game15_hanoi_best_',
};

export function loadBest(storage, difficulty) {
  const raw = storage.getItem(`${STORAGE_KEYS.bestPrefix}${difficulty}`);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function saveBest(storage, difficulty, moves) {
  storage.setItem(`${STORAGE_KEYS.bestPrefix}${difficulty}`, String(moves));
}

const STATS_KEY = 'game15_hanoi_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, wins: 0, winStreak: 0, bestStreak: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
