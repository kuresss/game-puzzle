const KEY = 'chromaflow_stats';

export interface ChromaFlowStats {
  gamesPlayed: number;
  wins: number;
  bestScore: number;
  bestTime: number;
  favoriteColor: string;
  colorCounts: Record<string, number>;
  totalPaintArea: number;
  winStreak: number;
  bestStreak: number;
}

function defaultStats(): ChromaFlowStats {
  return {
    gamesPlayed: 0, wins: 0, bestScore: 0,
    bestTime: Infinity, favoriteColor: 'flame',
    colorCounts: {}, totalPaintArea: 0,
    winStreak: 0, bestStreak: 0,
  };
}

export function loadStats(): ChromaFlowStats {
  try {
    return { ...defaultStats(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return defaultStats();
  }
}

export function saveStats(s: ChromaFlowStats) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function recordGame(won: boolean, score: number, time: number, color: string) {
  const s = loadStats();
  s.gamesPlayed++;
  s.colorCounts[color] = (s.colorCounts[color] ?? 0) + 1;
  s.favoriteColor = Object.entries(s.colorCounts).sort((a, b) => b[1] - a[1])[0][0];
  if (won) {
    s.wins++;
    s.winStreak++;
    s.bestStreak = Math.max(s.bestStreak, s.winStreak);
    s.bestScore = Math.max(s.bestScore, score);
    s.bestTime = Math.min(s.bestTime, time);
  } else {
    s.winStreak = 0;
  }
  saveStats(s);
  return s;
}
