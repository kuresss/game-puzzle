export const SIZE = 4;
export const CELL_COUNT = SIZE * SIZE;
export const WIN_VALUE = 2048;

export const DIFFICULTIES = {
  easy:   { size: 4, winValue: 1024, label: 'かんたん'  },
  normal: { size: 4, winValue: 2048, label: 'ふつう'    },
  hard:   { size: 4, winValue: 4096, label: 'むずかしい' },
  oni:    { size: 5, winValue: 8192, label: '🔴 鬼'      },
};

export function createEmptyBoard(size = 4) {
  return Array(size * size).fill(0);
}

export function getEmptyIndexes(board) {
  return board.reduce((acc, v, i) => (v === 0 ? [...acc, i] : acc), []);
}

export function spawnTile(board, random = Math.random, size = 4) {
  const empty = getEmptyIndexes(board);
  if (empty.length === 0) return board;
  const pos = empty[Math.floor(random() * empty.length)];
  const value = random() < 0.9 ? 2 : 4;
  const next = [...board];
  next[pos] = value;
  return next;
}

function mergeLeft(row) {
  const tiles = row.filter((v) => v !== 0);
  let score = 0;
  const merged = [];
  let i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const val = tiles[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(tiles[i]);
      i += 1;
    }
  }
  while (merged.length < row.length) merged.push(0);
  return { row: merged, score };
}

function mergeRight(row) {
  const { row: merged, score } = mergeLeft([...row].reverse());
  return { row: merged.reverse(), score };
}

function getRow(board, r, size) {
  return board.slice(r * size, r * size + size);
}

function getCol(board, c, size) {
  return Array.from({ length: size }, (_, r) => board[r * size + c]);
}

function setRow(board, r, row, size) {
  const next = [...board];
  for (let c = 0; c < size; c++) next[r * size + c] = row[c];
  return next;
}

function setCol(board, c, col, size) {
  const next = [...board];
  for (let r = 0; r < size; r++) next[r * size + c] = col[r];
  return next;
}

export function applyMove(board, direction, size = 4) {
  let next = [...board];
  let totalScore = 0;
  let moved = false;

  if (direction === 'left' || direction === 'right') {
    for (let r = 0; r < size; r++) {
      const row = getRow(next, r, size);
      const { row: merged, score } =
        direction === 'left' ? mergeLeft(row) : mergeRight(row);
      if (merged.some((v, i) => v !== row[i])) moved = true;
      next = setRow(next, r, merged, size);
      totalScore += score;
    }
  } else {
    for (let c = 0; c < size; c++) {
      const col = getCol(next, c, size);
      const { row: merged, score } =
        direction === 'up' ? mergeLeft(col) : mergeRight(col);
      if (merged.some((v, i) => v !== col[i])) moved = true;
      next = setCol(next, c, merged, size);
      totalScore += score;
    }
  }

  return { board: next, score: totalScore, moved };
}

export function hasValidMove(board, size = 4) {
  if (getEmptyIndexes(board).length > 0) return true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = board[r * size + c];
      if (c + 1 < size && v === board[r * size + c + 1]) return true;
      if (r + 1 < size && v === board[(r + 1) * size + c]) return true;
    }
  }
  return false;
}

export function isGameOver(board, size = 4) {
  return !hasValidMove(board, size);
}

export function isWon(board, winValue = 2048) {
  return board.some((v) => v >= winValue);
}
