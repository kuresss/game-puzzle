export const STORAGE_KEYS = {
  bestAttempts: 'game7_hitblow_best',
  tutorialSeen: 'game7_tutorial_seen',
};

export function loadBestAttempts(storage, difficulty) {
  const raw = storage.getItem(`${STORAGE_KEYS.bestAttempts}_${difficulty}`);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function saveBestAttempts(storage, difficulty, attempts) {
  storage.setItem(`${STORAGE_KEYS.bestAttempts}_${difficulty}`, String(attempts));
}

const STATS_KEY = 'game7_hitblow_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, wins: 0, winStreak: 0, bestStreak: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
