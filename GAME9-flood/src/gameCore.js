export const COLS = 14;
export const ROWS = 14;
export const CELL_COUNT = COLS * ROWS;
export const COLOR_COUNT = 6;
export const MAX_MOVES = 25;

export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

export const DIFFICULTIES = {
  easy:   { rows: 12, cols: 12, maxMoves: 30, label: 'かんたん'  },
  normal: { rows: 14, cols: 14, maxMoves: 25, label: 'ふつう'    },
  hard:   { rows: 16, cols: 16, maxMoves: 20, label: 'むずかしい' },
  oni:    { rows: 20, cols: 20, maxMoves: 18, label: '🔴 鬼'      },
};

export function createBoard(rows = 14, cols = 14, colorCount = COLOR_COUNT, random = Math.random) {
  const cellCount = rows * cols;
  return Array.from({ length: cellCount }, () => COLORS[Math.floor(random() * colorCount)]);
}

function getNeighbors(index, cols = 14, rows = 14) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const neighbors = [];
  if (row > 0)        neighbors.push((row - 1) * cols + col);
  if (row < rows - 1) neighbors.push((row + 1) * cols + col);
  if (col > 0)        neighbors.push(row * cols + (col - 1));
  if (col < cols - 1) neighbors.push(row * cols + (col + 1));
  return neighbors;
}

// Returns Set of indexes that belong to the flood zone (connected from index 0)
export function getFloodZone(board, cols = 14, rows = 14) {
  const targetColor = board[0];
  const zone = new Set();
  const queue = [0];
  while (queue.length > 0) {
    const idx = queue.shift();
    if (zone.has(idx)) continue;
    if (board[idx] !== targetColor) continue;
    zone.add(idx);
    for (const n of getNeighbors(idx, cols, rows)) {
      if (!zone.has(n)) queue.push(n);
    }
  }
  return zone;
}

export function applyColor(board, color, cols = 14, rows = 14) {
  if (board[0] === color) return board;
  const zone = getFloodZone(board, cols, rows);
  const next = [...board];
  // Paint all zone cells with new color
  for (const idx of zone) next[idx] = color;
  // Expand: BFS from zone boundary to absorb neighbors of new color
  const frontier = [];
  for (const idx of zone) {
    for (const n of getNeighbors(idx, cols, rows)) {
      if (!zone.has(n) && next[n] === color) frontier.push(n);
    }
  }
  const expanded = new Set(zone);
  const queue = [...frontier];
  while (queue.length > 0) {
    const idx = queue.shift();
    if (expanded.has(idx)) continue;
    if (next[idx] !== color) continue;
    expanded.add(idx);
    for (const n of getNeighbors(idx, cols, rows)) {
      if (!expanded.has(n)) queue.push(n);
    }
  }
  return next;
}

export function isWon(board) {
  return board.every((c) => c === board[0]);
}

export function getFloodSize(board, cols = 14, rows = 14) {
  return getFloodZone(board, cols, rows).size;
}
