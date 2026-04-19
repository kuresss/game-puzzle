export const STORAGE_KEYS = {
  bestMoves: 'game9_flood_best_moves',
  tutorialSeen: 'game9_tutorial_seen',
};

export function loadBestMoves(storage) {
  const raw = storage.getItem(STORAGE_KEYS.bestMoves);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function saveBestMoves(storage, moves) {
  storage.setItem(STORAGE_KEYS.bestMoves, String(moves));
}

export function loadBestMovesByDifficulty(storage, difficulty) {
  const raw = storage.getItem(`game9_flood_best_moves_${difficulty}`);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function saveBestMovesByDifficulty(storage, difficulty, moves) {
  storage.setItem(`game9_flood_best_moves_${difficulty}`, String(moves));
}

const STATS_KEY = 'game9_flood_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, wins: 0, winStreak: 0, bestStreak: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
