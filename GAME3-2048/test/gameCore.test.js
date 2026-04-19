import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZE,
  CELL_COUNT,
  WIN_VALUE,
  DIFFICULTIES,
  createEmptyBoard,
  getEmptyIndexes,
  spawnTile,
  applyMove,
  hasValidMove,
  isGameOver,
  isWon,
} from '../src/gameCore.js';

test('createEmptyBoard returns 16 zeros', () => {
  const b = createEmptyBoard();
  assert.equal(b.length, CELL_COUNT);
  assert.ok(b.every((v) => v === 0));
});

test('getEmptyIndexes returns all indexes for empty board', () => {
  assert.deepEqual(getEmptyIndexes(createEmptyBoard()), Array.from({ length: CELL_COUNT }, (_, i) => i));
});

test('getEmptyIndexes excludes non-zero indexes', () => {
  const b = createEmptyBoard();
  b[3] = 2;
  b[7] = 4;
  assert.ok(!getEmptyIndexes(b).includes(3));
  assert.ok(!getEmptyIndexes(b).includes(7));
  assert.equal(getEmptyIndexes(b).length, CELL_COUNT - 2);
});

test('spawnTile places a 2 or 4 in empty cell', () => {
  const b = createEmptyBoard();
  const next = spawnTile(b);
  const nonZero = next.filter((v) => v !== 0);
  assert.equal(nonZero.length, 1);
  assert.ok(nonZero[0] === 2 || nonZero[0] === 4);
});

test('spawnTile returns board unchanged when full', () => {
  const b = Array(CELL_COUNT).fill(2);
  assert.deepEqual(spawnTile(b), b);
});

test('spawnTile spawns 90% twos and 10% fours', () => {
  const board = createEmptyBoard();
  let twos = 0;
  let fours = 0;
  for (let i = 0; i < 1000; i++) {
    const next = spawnTile(board, () => (i % 10 === 0 ? 0.95 : 0.5));
    const val = next.find((v) => v !== 0);
    if (val === 2) twos++;
    else fours++;
  }
  assert.ok(fours > 0, 'should spawn some fours');
  assert.ok(twos > fours, 'should spawn more twos than fours');
});

test('applyMove left merges equal tiles', () => {
  const b = createEmptyBoard();
  b[0] = 2; b[1] = 2; b[2] = 0; b[3] = 0;
  const { board, score, moved } = applyMove(b, 'left');
  assert.equal(board[0], 4);
  assert.equal(board[1], 0);
  assert.equal(score, 4);
  assert.ok(moved);
});

test('applyMove left slides tiles to left', () => {
  const b = createEmptyBoard();
  b[0] = 0; b[1] = 0; b[2] = 2; b[3] = 4;
  const { board, moved } = applyMove(b, 'left');
  assert.equal(board[0], 2);
  assert.equal(board[1], 4);
  assert.equal(board[2], 0);
  assert.ok(moved);
});

test('applyMove right merges equal tiles', () => {
  const b = createEmptyBoard();
  b[0] = 2; b[1] = 2; b[2] = 0; b[3] = 0;
  const { board, score, moved } = applyMove(b, 'right');
  assert.equal(board[3], 4);
  assert.equal(board[2], 0);
  assert.equal(score, 4);
  assert.ok(moved);
});

test('applyMove up merges equal tiles in columns', () => {
  const b = createEmptyBoard();
  b[0] = 2; b[SIZE] = 2;
  const { board, score, moved } = applyMove(b, 'up');
  assert.equal(board[0], 4);
  assert.equal(board[SIZE], 0);
  assert.equal(score, 4);
  assert.ok(moved);
});

test('applyMove down merges equal tiles in columns', () => {
  const b = createEmptyBoard();
  b[0] = 2; b[SIZE] = 2;
  const { board, score, moved } = applyMove(b, 'down');
  assert.equal(board[(SIZE - 1) * SIZE], 4);
  assert.equal(score, 4);
  assert.ok(moved);
});

test('applyMove returns moved=false when board unchanged', () => {
  const b = createEmptyBoard();
  b[0] = 2; b[1] = 4;
  const { moved } = applyMove(b, 'left');
  assert.equal(moved, false);
});

test('applyMove does not double-merge in single move', () => {
  const b = createEmptyBoard();
  b[0] = 2; b[1] = 2; b[2] = 2; b[3] = 2;
  const { board, score } = applyMove(b, 'left');
  assert.equal(board[0], 4);
  assert.equal(board[1], 4);
  assert.equal(board[2], 0);
  assert.equal(board[3], 0);
  assert.equal(score, 8);
});

test('hasValidMove returns true when empty cells exist', () => {
  assert.ok(hasValidMove(createEmptyBoard()));
});

test('hasValidMove returns false when board is full with no merges', () => {
  const b = [
    2, 4, 2, 4,
    4, 2, 4, 2,
    2, 4, 2, 4,
    4, 2, 4, 2,
  ];
  assert.equal(hasValidMove(b), false);
});

test('hasValidMove returns true when adjacent equal tiles exist', () => {
  const b = [
    2, 4, 2, 4,
    4, 2, 4, 2,
    2, 4, 2, 4,
    4, 2, 4, 4,
  ];
  assert.ok(hasValidMove(b));
});

test('isGameOver returns true when no valid moves', () => {
  const b = [
    2, 4, 2, 4,
    4, 2, 4, 2,
    2, 4, 2, 4,
    4, 2, 4, 2,
  ];
  assert.ok(isGameOver(b));
});

test('isWon returns false for board without WIN_VALUE', () => {
  const b = createEmptyBoard();
  b[0] = 1024;
  assert.equal(isWon(b), false);
});

test('isWon returns true when WIN_VALUE tile exists', () => {
  const b = createEmptyBoard();
  b[5] = WIN_VALUE;
  assert.ok(isWon(b));
});

// ── DIFFICULTIES tests ──────────────────────────
test('DIFFICULTIES has 4 keys', () => {
  assert.equal(Object.keys(DIFFICULTIES).length, 4);
  assert.ok(DIFFICULTIES.easy);
  assert.ok(DIFFICULTIES.normal);
  assert.ok(DIFFICULTIES.hard);
  assert.ok(DIFFICULTIES.oni);
});

test('createEmptyBoard(5) returns 25 zeros', () => {
  const b = createEmptyBoard(5);
  assert.equal(b.length, 25);
  assert.ok(b.every((v) => v === 0));
});

test('isWon returns true for 8192 target when board has 8192', () => {
  const b = Array(25).fill(0);
  b[0] = 8192;
  assert.ok(isWon(b, 8192));
});
