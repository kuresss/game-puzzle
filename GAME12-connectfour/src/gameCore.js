export const COLS = 7;
export const ROWS = 6;
export const CELL_COUNT = COLS * ROWS;
export const RED = 'red';
export const YELLOW = 'yellow';

export const DIFFICULTIES = {
  easy:   { cpu: 'random',    depth: 0, label: 'かんたん'   },
  normal: { cpu: 'heuristic', depth: 0, label: 'ふつう'     },
  hard:   { cpu: 'minimax',   depth: 4, label: 'むずかしい' },
  oni:    { cpu: 'minimax',   depth: 6, label: '🔴 鬼'       },
};

export function opponent(color) {
  return color === RED ? YELLOW : RED;
}

// Board: flat array [row * COLS + col], null | 'red' | 'yellow'
// Row 0 = top, Row ROWS-1 = bottom
export function createBoard() {
  return Array(CELL_COUNT).fill(null);
}

export function getLowestRow(board, col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row * COLS + col] === null) return row;
  }
  return -1; // column full
}

export function isColumnFull(board, col) {
  return getLowestRow(board, col) === -1;
}

export function dropPiece(board, col, color) {
  const row = getLowestRow(board, col);
  if (row === -1) return null; // invalid
  const next = [...board];
  next[row * COLS + col] = color;
  return next;
}

export function checkWin(board, lastRow, lastCol) {
  const color = board[lastRow * COLS + lastCol];
  if (!color) return false;

  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of directions) {
    let count = 1;
    // forward
    for (let i = 1; i < 4; i++) {
      const r = lastRow + dr * i;
      const c = lastCol + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r * COLS + c] !== color) break;
      count++;
    }
    // backward
    for (let i = 1; i < 4; i++) {
      const r = lastRow - dr * i;
      const c = lastCol - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r * COLS + c] !== color) break;
      count++;
    }
    if (count >= 4) return true;
  }
  return false;
}

export function isBoardFull(board) {
  return board.every((c) => c !== null);
}

export function getValidColumns(board) {
  return Array.from({ length: COLS }, (_, c) => c).filter((c) => !isColumnFull(board, c));
}

// ── Random CPU ────────────────────────────────────────────────────────────────
export function getRandomCpuMove(board) {
  const cols = getValidColumns(board);
  if (cols.length === 0) return null;
  return cols[Math.floor(Math.random() * cols.length)];
}

// ── Heuristic CPU (original logic) ───────────────────────────────────────────
function scoreColumn(board, col, color) {
  const row = getLowestRow(board, col);
  if (row === -1) return -Infinity;
  const next = [...board];
  next[row * COLS + col] = color;

  // Win immediately
  if (checkWin(next, row, col)) return 1000;
  // Block opponent win
  const opp = opponent(color);
  const oppNext = [...board];
  oppNext[row * COLS + col] = opp;
  if (checkWin(oppNext, row, col)) return 500;
  // Prefer center columns
  const centerBonus = 3 - Math.abs(col - 3);
  const score = centerBonus * 3;
  return score;
}

function getHeuristicMove(board, color) {
  const valid = getValidColumns(board);
  if (valid.length === 0) return -1;
  let best = valid[0];
  let bestScore = -Infinity;
  for (const col of valid) {
    const s = scoreColumn(board, col, color);
    if (s > bestScore) { bestScore = s; best = col; }
  }
  return best;
}

// ── Minimax with alpha-beta pruning ──────────────────────────────────────────
function scoreWindow(window, color) {
  const opp = color === 'red' ? 'yellow' : 'red';
  const mine   = window.filter(c => c === color).length;
  const empty  = window.filter(c => c === null).length;
  const theirs = window.filter(c => c === opp).length;
  if (mine === 4) return 100;
  if (mine === 3 && empty === 1) return 5;
  if (mine === 2 && empty === 2) return 2;
  if (theirs === 3 && empty === 1) return -4;
  return 0;
}

function scoreBoard(board, color) {
  let score = 0;

  // Center column preference
  const centerCol = Math.floor(COLS / 2);
  const centerArray = Array.from({ length: ROWS }, (_, r) => board[r * COLS + centerCol]);
  score += centerArray.filter(c => c === color).length * 3;

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r * COLS + c], board[r * COLS + c + 1], board[r * COLS + c + 2], board[r * COLS + c + 3]];
      score += scoreWindow(window, color);
    }
  }

  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const window = [board[r * COLS + c], board[(r+1) * COLS + c], board[(r+2) * COLS + c], board[(r+3) * COLS + c]];
      score += scoreWindow(window, color);
    }
  }

  // Diagonal down-right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r * COLS + c], board[(r+1) * COLS + c+1], board[(r+2) * COLS + c+2], board[(r+3) * COLS + c+3]];
      score += scoreWindow(window, color);
    }
  }

  // Diagonal up-right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r * COLS + c], board[(r-1) * COLS + c+1], board[(r-2) * COLS + c+2], board[(r-3) * COLS + c+3]];
      score += scoreWindow(window, color);
    }
  }

  return score;
}

function minimaxCF(board, depth, alpha, beta, maximizing, color) {
  const opp = color === 'red' ? 'yellow' : 'red';
  const cols = getValidColumns(board);

  if (depth === 0 || cols.length === 0 || isBoardFull(board)) {
    return scoreBoard(board, color);
  }

  if (maximizing) {
    let best = -Infinity;
    for (const col of cols) {
      const row = getLowestRow(board, col);
      const newBoard = dropPiece(board, col, color);
      if (checkWin(newBoard, row, col)) return 1000 + depth;
      const score = minimaxCF(newBoard, depth - 1, alpha, beta, false, color);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const col of cols) {
      const row = getLowestRow(board, col);
      const newBoard = dropPiece(board, col, opp);
      if (checkWin(newBoard, row, col)) return -1000 - depth;
      const score = minimaxCF(newBoard, depth - 1, alpha, beta, true, color);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function minimaxCpuMove(board, color, depth = 4) {
  const cols = getValidColumns(board);
  if (cols.length === 0) return null;
  let best = -Infinity;
  let bestCol = cols[0];
  for (const col of cols) {
    const row = getLowestRow(board, col);
    const newBoard = dropPiece(board, col, color);
    if (checkWin(newBoard, row, col)) return col; // immediate win
    const score = minimaxCF(newBoard, depth - 1, -Infinity, Infinity, false, color);
    if (score > best) { best = score; bestCol = col; }
  }
  return bestCol;
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export function getCpuMove(board, color, cpuMode = 'heuristic', depth = 4) {
  if (cpuMode === 'random')  return getRandomCpuMove(board);
  if (cpuMode === 'minimax') return minimaxCpuMove(board, color, depth);
  return getHeuristicMove(board, color);
}
