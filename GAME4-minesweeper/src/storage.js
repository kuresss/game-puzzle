export const STORAGE_KEYS = {
  bestTime: 'game4_minesweeper_best_time',
  gameState: 'game4_minesweeper_state',
  tutorialSeen: 'game4_tutorial_seen',
};

export function loadBestTime(storage, difficulty = 'easy') {
  const raw = storage.getItem(`${STORAGE_KEYS.bestTime}_${difficulty}`);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function saveBestTime(storage, difficulty, seconds) {
  storage.setItem(`${STORAGE_KEYS.bestTime}_${difficulty}`, String(seconds));
}

export function saveGameState(storage, difficulty, data) {
  const { board, elapsedSeconds, status } = data;
  storage.setItem(`${STORAGE_KEYS.gameState}_${difficulty}`, JSON.stringify({ board, elapsedSeconds, status }));
}

export function loadGameState(storage, difficulty, rows, cols) {
  const expectedLength = rows !== undefined && cols !== undefined ? rows * cols : 81;
  const key = difficulty !== undefined ? `${STORAGE_KEYS.gameState}_${difficulty}` : STORAGE_KEYS.gameState;
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !Array.isArray(parsed.board) ||
      parsed.board.length !== expectedLength ||
      !parsed.board.every((c) => typeof c === 'object' && c !== null)
    ) return null;
    return {
      board: parsed.board,
      elapsedSeconds: typeof parsed.elapsedSeconds === 'number' ? parsed.elapsedSeconds : 0,
      status: ['idle', 'playing', 'won', 'lost'].includes(parsed.status) ? parsed.status : 'idle',
    };
  } catch {
    return null;
  }
}

const STATS_KEY = 'game4_minesweeper_stats';
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
