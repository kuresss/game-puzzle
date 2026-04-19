export const STORAGE_KEYS = {
  bestMoves: 'game5_memory_best_moves',
  gameState: 'game5_memory_state',
  tutorialSeen: 'game5_tutorial_seen',
};

export function loadBestMoves(storage, difficulty = 'normal') {
  const key = `game5_memory_best_moves_${difficulty}`;
  const raw = storage.getItem(key);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function saveBestMoves(storage, difficulty, moves) {
  const key = `game5_memory_best_moves_${difficulty}`;
  if (moves === null) { storage.removeItem(key); return; }
  storage.setItem(key, String(moves));
}

export function saveGameState(storage, difficulty, { cards, moves }) {
  const key = `game5_memory_state_${difficulty}`;
  storage.setItem(key, JSON.stringify({ cards, moves }));
}

export function loadGameState(storage, difficulty, pairs) {
  const key = `game5_memory_state_${difficulty}`;
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.cards) || parsed.cards.length !== pairs * 2) return null;
    if (!parsed.cards.every((c) => typeof c === 'object' && c !== null && 'symbol' in c)) return null;
    return {
      cards: parsed.cards,
      moves: typeof parsed.moves === 'number' && parsed.moves >= 0 ? parsed.moves : 0,
    };
  } catch {
    return null;
  }
}

const STATS_KEY = 'game5_memory_stats';
export function loadStats(storage) {
  try { const s = JSON.parse(storage.getItem(STATS_KEY)); if (s && typeof s === 'object') return s; } catch (_) {}
  return { gamesPlayed: 0, wins: 0, winStreak: 0, bestStreak: 0 };
}
export function saveStats(storage, stats) { storage.setItem(STATS_KEY, JSON.stringify(stats)); }
