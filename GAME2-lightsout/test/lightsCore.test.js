import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZE,
  CELL_COUNT,
  indexToPosition,
  getToggleIndexes,
  isValidCells,
  isSolvedCells,
  countLitCells,
  applyClick,
  createSolvedCells,
  createShuffledCells,
} from '../src/lightsCore.js';

test('SIZE is 5 and CELL_COUNT is 25', () => {
  assert.equal(SIZE, 5);
  assert.equal(CELL_COUNT, 25);
});

test('indexToPosition converts flat index to row/col', () => {
  assert.deepEqual(indexToPosition(0), { row: 0, col: 0 });
  assert.deepEqual(indexToPosition(4), { row: 0, col: 4 });
  assert.deepEqual(indexToPosition(5), { row: 1, col: 0 });
  assert.deepEqual(indexToPosition(12), { row: 2, col: 2 });
  assert.deepEqual(indexToPosition(24), { row: 4, col: 4 });
});

test('getToggleIndexes includes self and orthogonal neighbors only', () => {
  // Center cell (12) has 4 neighbors + self
  const center = getToggleIndexes(12).sort((a, b) => a - b);
  assert.deepEqual(center, [7, 11, 12, 13, 17]);

  // Corner cell (0) has 2 neighbors + self
  const corner = getToggleIndexes(0).sort((a, b) => a - b);
  assert.deepEqual(corner, [0, 1, 5]);

  // Edge cell (2) has 3 neighbors + self
  const edge = getToggleIndexes(2).sort((a, b) => a - b);
  assert.deepEqual(edge, [1, 2, 3, 7]);
});

test('isValidCells accepts 25 booleans', () => {
  assert.equal(isValidCells(createSolvedCells()), true);
  assert.equal(isValidCells([]), false);
  assert.equal(isValidCells(Array(25).fill(1)), false);
  assert.equal(isValidCells(null), false);
});

test('isSolvedCells returns true only when all false', () => {
  assert.equal(isSolvedCells(createSolvedCells()), true);
  const one = createSolvedCells();
  one[0] = true;
  assert.equal(isSolvedCells(one), false);
});

test('countLitCells counts true values', () => {
  assert.equal(countLitCells(createSolvedCells()), 0);
  const cells = createSolvedCells();
  cells[0] = true;
  cells[5] = true;
  assert.equal(countLitCells(cells), 2);
});

test('applyClick toggles cell and neighbors', () => {
  const initial = createSolvedCells();
  const after = applyClick(initial, 0);
  assert.equal(after[0], true);
  assert.equal(after[1], true);
  assert.equal(after[5], true);
  assert.equal(after[2], false);
  assert.equal(after[6], false);
});

test('applyClick is its own inverse', () => {
  const initial = createSolvedCells();
  initial[3] = true;
  initial[10] = true;
  const after = applyClick(initial, 12);
  const restored = applyClick(after, 12);
  assert.deepEqual(restored, initial);
});

test('applyClick does not mutate input', () => {
  const cells = createSolvedCells();
  const copy = cells.slice();
  applyClick(cells, 7);
  assert.deepEqual(cells, copy);
});

test('createSolvedCells returns 25 false values', () => {
  const cells = createSolvedCells();
  assert.equal(cells.length, CELL_COUNT);
  assert.equal(cells.every((c) => c === false), true);
});

test('createShuffledCells returns a valid non-solved board', () => {
  for (let i = 0; i < 20; i += 1) {
    const cells = createShuffledCells();
    assert.equal(isValidCells(cells), true);
    assert.equal(isSolvedCells(cells), false);
  }
});

test('createShuffledCells accepts custom random for determinism', () => {
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const a = createShuffledCells(20, seededRandom);

  seed = 42;
  const b = createShuffledCells(20, seededRandom);
  assert.deepEqual(a, b);
});

test('createShuffledCells fallback: never returns solved', () => {
  const alwaysFirst = () => 0;
  const cells = createShuffledCells(25, alwaysFirst);
  assert.equal(isSolvedCells(cells), false);
});
