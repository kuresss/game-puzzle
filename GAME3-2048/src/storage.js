export const STORAGE_KEYS = {
  bestScore: 'game3_2048_best_score_normal',
  gameState: 'game3_2048_state_normal',
  tutorialSeen: 'game3_tutorial_seen',
};

export function loadBestScore(storage, difficulty = 'normal') {
  const key = `game3_2048_best_score_${difficulty}`;
  const raw = storage.getItem(key);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function saveBestScore(storage, score, difficulty = 'normal') {
  const key = `game3_2048_best_score_${difficulty}`;
  storage.setItem(key, String(score));
}

export function saveGameState(storage, { board, score }, difficulty = 'normal') {
  const key = `game3_2048_state_${difficulty}`;
  storage.setItem(key, JSON.stringify({ board, score }));
}

export function loadGameState(storage, difficulty = 'normal', size = 4) {
  const key = `game3_2048_state_${difficulty}`;
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !Array.isArray(parsed.board) ||
      parsed.board.length !== size * size ||
      !parsed.board.every((v) => typeof v === 'number' && v >= 0)
    ) return null;
    return {
      board: parsed.board,
      score: typeof parsed.score === 'number' && parsed.score >= 0 ? parsed.score : 0,
    };
  } catch {
    return null;
  }
}

const STATS_KEY = 'game3_2048_stats';
export function loadStats(storage) {
  try {
    const s = JSON.parse(storage.getItem(STATS_KEY));
    if (s && typeof s === 'object') return s;
  } catch (_) {}
  return { gamesPlayed: 0, wins: 0, winStreak: 0, bestStreak: 0 };
}
export function saveStats(storage, stats) {
  storage.setItem(STATS_KEY, JSON.stringify(stats));
}
