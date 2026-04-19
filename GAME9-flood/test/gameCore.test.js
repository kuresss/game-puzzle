import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS, ROWS, CELL_COUNT, COLOR_COUNT, MAX_MOVES, COLORS, DIFFICULTIES,
  createBoard, getFloodZone, applyColor, isWon, getFloodSize,
} from '../src/gameCore.js';

test('createBoard returns correct size', () => {
  const b = createBoard(14, 14, COLOR_COUNT);
  assert.equal(b.length, CELL_COUNT);
});

test('createBoard uses only valid colors', () => {
  const b = createBoard(14, 14, COLOR_COUNT);
  assert.ok(b.every((c) => COLORS.includes(c)));
});

test('createBoard uses random (deterministic with seed)', () => {
  let i = 0;
  const vals = [0, 0.5, 0.9, 0.1, 0.7, 0.3];
  const b = createBoard(14, 14, COLOR_COUNT, () => vals[i++ % vals.length]);
  assert.equal(b.length, CELL_COUNT);
});

test('createBoard(20,20) returns 400 cells', () => {
  const b = createBoard(20, 20, COLOR_COUNT);
  assert.equal(b.length, 400);
});

test('getFloodZone returns at least index 0', () => {
  const b = createBoard(14, 14, COLOR_COUNT);
  const zone = getFloodZone(b);
  assert.ok(zone.has(0));
});

test('getFloodZone cells all have same color as board[0]', () => {
  const b = createBoard(14, 14, COLOR_COUNT);
  const zone = getFloodZone(b);
  for (const idx of zone) assert.equal(b[idx], b[0]);
});

test('applyColor returns same board when same color chosen', () => {
  const b = createBoard(14, 14, COLOR_COUNT);
  const result = applyColor(b, b[0]);
  assert.deepEqual(result, b);
});

test('applyColor changes flood zone to new color', () => {
  // Create board where all cells are 'red', pick 'blue'
  const b = Array(CELL_COUNT).fill('red');
  const result = applyColor(b, 'blue');
  assert.ok(result.every((c) => c === 'blue'));
});

test('applyColor expands flood zone to adjacent same-color cells', () => {
  // board: all 'red' except cell 1 which is 'blue'
  // After applyColor('blue'): zone expands to include cell 1
  const b = Array(CELL_COUNT).fill('red');
  b[1] = 'blue';
  const result = applyColor(b, 'blue');
  assert.equal(result[0], 'blue');
  assert.equal(result[1], 'blue');
});

test('applyColor does not mutate original board', () => {
  const b = createBoard(14, 14, COLOR_COUNT);
  const original = [...b];
  const diff = COLORS.find((c) => c !== b[0]);
  applyColor(b, diff);
  assert.deepEqual(b, original);
});

test('isWon returns true for single-color board', () => {
  const b = Array(CELL_COUNT).fill('red');
  assert.ok(isWon(b));
});

test('isWon returns false for mixed board', () => {
  const b = Array(CELL_COUNT).fill('red');
  b[CELL_COUNT - 1] = 'blue';
  assert.equal(isWon(b), false);
});

test('getFloodSize returns size of flood zone', () => {
  const b = Array(CELL_COUNT).fill('red');
  assert.equal(getFloodSize(b), CELL_COUNT);
});

test('getFloodSize is 1 when surrounded by different colors', () => {
  // Cell 0 = 'red', all others = 'blue'
  const b = Array(CELL_COUNT).fill('blue');
  b[0] = 'red';
  assert.equal(getFloodSize(b), 1);
});

test('MAX_MOVES is defined and positive', () => {
  assert.ok(MAX_MOVES > 0);
});

test('COLOR_COUNT matches COLORS array length', () => {
  assert.equal(COLORS.length, COLOR_COUNT);
});

test('DIFFICULTIES has 4 entries', () => {
  assert.equal(Object.keys(DIFFICULTIES).length, 4);
});

test('DIFFICULTIES easy has correct values', () => {
  assert.equal(DIFFICULTIES.easy.rows, 12);
  assert.equal(DIFFICULTIES.easy.cols, 12);
  assert.equal(DIFFICULTIES.easy.maxMoves, 30);
});

test('DIFFICULTIES normal has correct values', () => {
  assert.equal(DIFFICULTIES.normal.rows, 14);
  assert.equal(DIFFICULTIES.normal.cols, 14);
  assert.equal(DIFFICULTIES.normal.maxMoves, 25);
});

test('DIFFICULTIES hard has correct values', () => {
  assert.equal(DIFFICULTIES.hard.rows, 16);
  assert.equal(DIFFICULTIES.hard.cols, 16);
  assert.equal(DIFFICULTIES.hard.maxMoves, 20);
});

test('DIFFICULTIES oni has correct values', () => {
  assert.equal(DIFFICULTIES.oni.rows, 20);
  assert.equal(DIFFICULTIES.oni.cols, 20);
  assert.equal(DIFFICULTIES.oni.maxMoves, 18);
});
