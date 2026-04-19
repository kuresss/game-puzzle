export const STORAGE_KEYS = {
  wins: 'game12_connectfour_wins',
  tutorialSeen: 'game12_tutorial_seen',
};

export function winsKey(difficulty) {
  return `game12_connectfour_wins_${difficulty}`;
}

export function loadWins(storage, difficulty) {
  const key = difficulty ? winsKey(difficulty) : STORAGE_KEYS.wins;
  const raw = storage.getItem(key);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function saveWins(storage, wins, difficulty) {
  const key = difficulty ? winsKey(difficulty) : STORAGE_KEYS.wins;
  storage.setItem(key, String(wins));
}

const STATS_KEY = 'game12_connectfour_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, winStreak: 0, bestStreak: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
