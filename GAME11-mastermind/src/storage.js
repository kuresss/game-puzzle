export const STORAGE_KEYS = {
  bestAttempts: 'game11_mastermind_best',
  tutorialSeen: 'game11_tutorial_seen',
};

export function bestKey(difficulty) {
  return `game11_mastermind_best_${difficulty}`;
}

export function loadBestAttempts(storage, difficulty) {
  const key = difficulty ? bestKey(difficulty) : STORAGE_KEYS.bestAttempts;
  const raw = storage.getItem(key);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function saveBestAttempts(storage, attempts, difficulty) {
  const key = difficulty ? bestKey(difficulty) : STORAGE_KEYS.bestAttempts;
  storage.setItem(key, String(attempts));
}

const STATS_KEY = 'game11_mastermind_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, wins: 0, winStreak: 0, bestStreak: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
