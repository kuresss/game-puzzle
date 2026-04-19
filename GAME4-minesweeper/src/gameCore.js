export const DIFFICULTIES = {
  easy:   { rows: 9,  cols: 9,  mines: 10,  label: 'かんたん'  },
  normal: { rows: 16, cols: 16, mines: 40,  label: 'ふつう'    },
  hard:   { rows: 20, cols: 16, mines: 60,  label: 'むずかしい' },
  oni:    { rows: 30, cols: 20, mines: 150, label: '🔴 鬼'      },
};

// Legacy aliases kept for existing tests
export const ROWS = 9;
export const COLS = 9;
export const CELL_COUNT = ROWS * COLS;
export const MINE_COUNT = 10;

// Cell shape: { isMine, isRevealed, isFlagged, neighborCount }
export function createCell() {
  return { isMine: false, isRevealed: false, isFlagged: false, neighborCount: 0 };
}

export function createBoard(rows = 9, cols = 9) {
  return Array(rows * cols).fill(null).map(createCell);
}

function getNeighborIndexes(index, rows, cols) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push(nr * cols + nc);
      }
    }
  }
  return neighbors;
}

export function placeMines(board, safeIndex, mines = 10, rows = 9, cols = 9, random = Math.random) {
  const candidates = board.map((_, i) => i).filter((i) => i !== safeIndex);
  // Fisher-Yates shuffle of candidates, take first mines
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const mineIndexes = new Set(candidates.slice(0, mines));
  const next = board.map((cell, i) => ({ ...cell, isMine: mineIndexes.has(i) }));
  // compute neighbor counts
  return next.map((cell, i) => ({
    ...cell,
    neighborCount: getNeighborIndexes(i, rows, cols).filter((ni) => next[ni].isMine).length,
  }));
}

export function revealCell(board, index, rows = 9, cols = 9) {
  if (board[index].isRevealed || board[index].isFlagged) return board;
  let next = board.map((c) => ({ ...c }));
  const queue = [index];
  while (queue.length > 0) {
    const idx = queue.shift();
    if (next[idx].isRevealed || next[idx].isFlagged) continue;
    next[idx] = { ...next[idx], isRevealed: true };
    if (!next[idx].isMine && next[idx].neighborCount === 0) {
      for (const ni of getNeighborIndexes(idx, rows, cols)) {
        if (!next[ni].isRevealed && !next[ni].isFlagged) queue.push(ni);
      }
    }
  }
  return next;
}

export function toggleFlag(board, index) {
  if (board[index].isRevealed) return board;
  const next = [...board];
  next[index] = { ...next[index], isFlagged: !next[index].isFlagged };
  return next;
}

export function checkWin(board, mines) {
  if (mines !== undefined) {
    return board.filter((c) => c.isRevealed).length === board.length - mines;
  }
  return board.every((cell) => cell.isMine || cell.isRevealed);
}

export function checkLose(board, index) {
  return board[index].isMine && board[index].isRevealed;
}

export function countFlags(board) {
  return board.filter((c) => c.isFlagged).length;
}

export function countRevealed(board) {
  return board.filter((c) => c.isRevealed).length;
}
