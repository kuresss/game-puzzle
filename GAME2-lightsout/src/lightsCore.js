export const SIZE = 5;
export const CELL_COUNT = SIZE * SIZE;

export function indexToPosition(index) {
  return { row: Math.floor(index / SIZE), col: index % SIZE };
}

export function getToggleIndexes(index) {
  const { row, col } = indexToPosition(index);
  const result = [index];
  if (row > 0) result.push(index - SIZE);
  if (row < SIZE - 1) result.push(index + SIZE);
  if (col > 0) result.push(index - 1);
  if (col < SIZE - 1) result.push(index + 1);
  return result;
}

export function isValidCells(cells) {
  return (
    Array.isArray(cells) &&
    cells.length === CELL_COUNT &&
    cells.every((c) => typeof c === 'boolean')
  );
}

export function isSolvedCells(cells) {
  return isValidCells(cells) && cells.every((c) => !c);
}

export function countLitCells(cells) {
  return cells.reduce((sum, c) => sum + (c ? 1 : 0), 0);
}

export function applyClick(cells, index) {
  const next = cells.slice();
  for (const i of getToggleIndexes(index)) {
    next[i] = !next[i];
  }
  return next;
}

export function createSolvedCells() {
  return Array(CELL_COUNT).fill(false);
}

export function createShuffledCells(clickCount = 20, random = Math.random) {
  const MAX_RETRIES = 10;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    let cells = createSolvedCells();
    for (let i = 0; i < clickCount; i += 1) {
      cells = applyClick(cells, Math.floor(random() * CELL_COUNT));
    }
    if (!isSolvedCells(cells)) {
      return cells;
    }
  }

  return applyClick(createSolvedCells(), 0);
}
