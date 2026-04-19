import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS, ROWS, RED, YELLOW, opponent, createBoard, getLowestRow,
  isColumnFull, dropPiece, checkWin, isBoardFull, getValidColumns,
  getCpuMove, DIFFICULTIES, getRandomCpuMove, minimaxCpuMove,
} from '../src/gameCore.js';

test('createBoard returns empty board', () => {
  const b = createBoard();
  assert.equal(b.length, COLS * ROWS);
  assert.ok(b.every((c) => c === null));
});

test('opponent returns correct color', () => {
  assert.equal(opponent(RED), YELLOW);
  assert.equal(opponent(YELLOW), RED);
});

test('getLowestRow returns bottom row for empty column', () => {
  const b = createBoard();
  assert.equal(getLowestRow(b, 0), ROWS - 1);
});

test('getLowestRow returns -1 for full column', () => {
  let b = createBoard();
  for (let r = 0; r < ROWS; r++) b[r * COLS + 0] = RED;
  assert.equal(getLowestRow(b, 0), -1);
});

test('isColumnFull returns false for empty column', () => {
  assert.equal(isColumnFull(createBoard(), 3), false);
});

test('isColumnFull returns true for full column', () => {
  let b = createBoard();
  for (let r = 0; r < ROWS; r++) b[r * COLS + 0] = RED;
  assert.ok(isColumnFull(b, 0));
});

test('dropPiece places piece in lowest row', () => {
  const b = createBoard();
  const next = dropPiece(b, 3, RED);
  assert.equal(next[(ROWS - 1) * COLS + 3], RED);
});

test('dropPiece stacks pieces', () => {
  let b = createBoard();
  b = dropPiece(b, 0, RED);
  b = dropPiece(b, 0, YELLOW);
  assert.equal(b[(ROWS - 1) * COLS + 0], RED);
  assert.equal(b[(ROWS - 2) * COLS + 0], YELLOW);
});

test('dropPiece returns null for full column', () => {
  let b = createBoard();
  for (let r = 0; r < ROWS; r++) b[r * COLS + 0] = RED;
  assert.equal(dropPiece(b, 0, RED), null);
});

test('dropPiece does not mutate original', () => {
  const b = createBoard();
  const original = [...b];
  dropPiece(b, 0, RED);
  assert.deepEqual(b, original);
});

test('checkWin detects horizontal 4', () => {
  let b = createBoard();
  for (let c = 0; c < 4; c++) b[(ROWS - 1) * COLS + c] = RED;
  assert.ok(checkWin(b, ROWS - 1, 0));
  assert.ok(checkWin(b, ROWS - 1, 3));
});

test('checkWin detects vertical 4', () => {
  let b = createBoard();
  for (let r = ROWS - 4; r < ROWS; r++) b[r * COLS + 0] = RED;
  assert.ok(checkWin(b, ROWS - 1, 0));
});

test('checkWin detects diagonal 4', () => {
  let b = createBoard();
  for (let i = 0; i < 4; i++) b[(ROWS - 1 - i) * COLS + i] = RED;
  assert.ok(checkWin(b, ROWS - 1, 0));
});

test('checkWin returns false for 3 in a row', () => {
  let b = createBoard();
  for (let c = 0; c < 3; c++) b[(ROWS - 1) * COLS + c] = RED;
  assert.equal(checkWin(b, ROWS - 1, 0), false);
});

test('isBoardFull returns false for new board', () => {
  assert.equal(isBoardFull(createBoard()), false);
});

test('isBoardFull returns true for full board', () => {
  const b = Array(COLS * ROWS).fill(RED);
  assert.ok(isBoardFull(b));
});

test('getValidColumns returns all cols for empty board', () => {
  assert.equal(getValidColumns(createBoard()).length, COLS);
});

test('getCpuMove returns valid column', () => {
  const b = createBoard();
  const col = getCpuMove(b, YELLOW);
  assert.ok(col >= 0 && col < COLS);
  assert.ok(!isColumnFull(b, col));
});

test('getCpuMove blocks opponent win', () => {
  let b = createBoard();
  // Place 3 RED in bottom row cols 0-2
  for (let c = 0; c < 3; c++) b = dropPiece(b, c, RED);
  // CPU should play col 3 to block
  const move = getCpuMove(b, YELLOW);
  assert.equal(move, 3);
});

// ── DIFFICULTIES ──────────────────────────────────────────────────────────────
test('DIFFICULTIES has 4 keys', () => {
  const keys = Object.keys(DIFFICULTIES);
  assert.equal(keys.length, 4);
  assert.ok(keys.includes('easy'));
  assert.ok(keys.includes('normal'));
  assert.ok(keys.includes('hard'));
  assert.ok(keys.includes('oni'));
});

test('DIFFICULTIES easy uses random cpu', () => {
  assert.equal(DIFFICULTIES.easy.cpu, 'random');
});

test('DIFFICULTIES oni uses minimax with depth 6', () => {
  assert.equal(DIFFICULTIES.oni.cpu, 'minimax');
  assert.equal(DIFFICULTIES.oni.depth, 6);
});

// ── getRandomCpuMove ─────────────────────────────────────────────────────────
test('getRandomCpuMove returns a valid column', () => {
  const b = createBoard();
  const col = getRandomCpuMove(b);
  assert.ok(col !== null);
  assert.ok(col >= 0 && col < COLS);
  assert.ok(!isColumnFull(b, col));
});

test('getRandomCpuMove returns null for full board', () => {
  const b = Array(COLS * ROWS).fill(RED);
  assert.equal(getRandomCpuMove(b), null);
});

// ── minimaxCpuMove ────────────────────────────────────────────────────────────
test('minimaxCpuMove takes immediate win', () => {
  // YELLOW has 3 in a row at bottom cols 0-2; col 3 wins
  let b = createBoard();
  for (let c = 0; c < 3; c++) b = dropPiece(b, c, YELLOW);
  const move = minimaxCpuMove(b, YELLOW, 4);
  assert.equal(move, 3);
});

test('minimaxCpuMove blocks opponent immediate win', () => {
  // RED has 3 in a row at bottom cols 0-2; YELLOW must block col 3
  let b = createBoard();
  for (let c = 0; c < 3; c++) b = dropPiece(b, c, RED);
  const move = minimaxCpuMove(b, YELLOW, 4);
  assert.equal(move, 3);
});
