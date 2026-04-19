export const DIFFICULTIES = {
  easy:   { cpu: 'easy',    label: 'かんたん'  },
  normal: { cpu: 'greedy',  label: 'ふつう'    },
  hard:   { cpu: 'minimax', depth: 3, label: 'むずかしい' },
  oni:    { cpu: 'minimax', depth: 5, label: '🔴 鬼'      },
};

export const SIZE = 8;
export const CELL_COUNT = SIZE * SIZE;
export const BLACK = 'black';
export const WHITE = 'white';

export function opponent(color) {
  return color === BLACK ? WHITE : BLACK;
}

// Board: flat array of SIZE*SIZE, values: null | 'black' | 'white'
export function createBoard() {
  const b = Array(CELL_COUNT).fill(null);
  const mid = SIZE / 2;
  b[(mid - 1) * SIZE + (mid - 1)] = WHITE;
  b[(mid - 1) * SIZE + mid]       = BLACK;
  b[mid * SIZE + (mid - 1)]       = BLACK;
  b[mid * SIZE + mid]             = WHITE;
  return b;
}

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
];

export function getFlips(board, index, color) {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  if (board[index] !== null) return [];
  const opp = opponent(color);
  const allFlips = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line = [];
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === opp) {
      line.push(r * SIZE + c);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === color) {
      allFlips.push(...line);
    }
  }
  return allFlips;
}

export function isValidMove(board, index, color) {
  return board[index] === null && getFlips(board, index, color).length > 0;
}

export function getValidMoves(board, color) {
  return board.reduce((acc, _, i) => (isValidMove(board, i, color) ? [...acc, i] : acc), []);
}

export function applyMove(board, index, color) {
  const flips = getFlips(board, index, color);
  if (flips.length === 0) return board;
  const next = [...board];
  next[index] = color;
  for (const f of flips) next[f] = color;
  return next;
}

export function countPieces(board) {
  let black = 0;
  let white = 0;
  for (const c of board) {
    if (c === BLACK) black++;
    else if (c === WHITE) white++;
  }
  return { black, white };
}

export function isGameOver(board) {
  return getValidMoves(board, BLACK).length === 0 && getValidMoves(board, WHITE).length === 0;
}

export function getWinner(board) {
  const { black, white } = countPieces(board);
  if (black > white) return BLACK;
  if (white > black) return WHITE;
  return null; // draw
}

// Simple greedy AI: pick move maximizing flips
export function getBestMove(board, color) {
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestFlips = getFlips(board, moves[0], color).length;
  for (let i = 1; i < moves.length; i++) {
    const flips = getFlips(board, moves[i], color).length;
    if (flips > bestFlips) { bestFlips = flips; best = moves[i]; }
  }
  return best;
}

export function getRandomMove(board, color) {
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

// Easy: 80% random, 20% worst move (fewest flips) — intentionally weak
export function getEasyMove(board, color, random = Math.random) {
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return null;
  if (random() < 0.8) {
    return moves[Math.floor(random() * moves.length)];
  }
  // pick worst move (fewest flips for self)
  let worst = moves[0];
  let minFlips = getFlips(board, moves[0], color).length;
  for (const m of moves.slice(1)) {
    const f = getFlips(board, m, color).length;
    if (f < minFlips) { minFlips = f; worst = m; }
  }
  return worst;
}

function minimax(board, color, depth, alpha, beta, maximizing) {
  const opp = color === 'black' ? 'white' : 'black';
  const current = maximizing ? color : opp;
  const moves = getValidMoves(board, current);

  if (depth === 0 || moves.length === 0) {
    const { black, white } = countPieces(board);
    return color === 'black' ? black - white : white - black;
  }

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move, color);
      const score = minimax(newBoard, color, depth - 1, alpha, beta, false);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move, opp);
      const score = minimax(newBoard, color, depth - 1, alpha, beta, true);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function minimaxMove(board, color, depth = 3) {
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return null;
  let best = -Infinity;
  let bestMove = moves[0];
  for (const move of moves) {
    const newBoard = applyMove(board, move, color);
    const score = minimax(newBoard, color, depth - 1, -Infinity, Infinity, false);
    if (score > best) { best = score; bestMove = move; }
  }
  return bestMove;
}

export function getCpuMove(board, color, cpuMode = 'greedy', depth = 3, random = Math.random) {
  if (cpuMode === 'easy')    return getEasyMove(board, color, random);
  if (cpuMode === 'minimax') return minimaxMove(board, color, depth);
  return getBestMove(board, color);  // greedy
}
