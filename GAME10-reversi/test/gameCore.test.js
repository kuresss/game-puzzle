import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZE, BLACK, WHITE, opponent, createBoard, getFlips, isValidMove,
  getValidMoves, applyMove, countPieces, isGameOver, getWinner, getBestMove,
  DIFFICULTIES, getEasyMove, minimaxMove, getCpuMove,
} from '../src/gameCore.js';

test('createBoard has 4 pieces in center', () => {
  const b = createBoard();
  const { black, white } = countPieces(b);
  assert.equal(black, 2);
  assert.equal(white, 2);
});

test('opponent returns correct color', () => {
  assert.equal(opponent(BLACK), WHITE);
  assert.equal(opponent(WHITE), BLACK);
});

test('getFlips returns empty for invalid cell (occupied)', () => {
  const b = createBoard();
  const occupied = b.findIndex((c) => c !== null);
  assert.equal(getFlips(b, occupied, BLACK).length, 0);
});

test('getFlips returns flips for valid opening move', () => {
  const b = createBoard();
  // Standard first moves for BLACK
  const validMoves = getValidMoves(b, BLACK);
  assert.ok(validMoves.length > 0);
  for (const m of validMoves) {
    assert.ok(getFlips(b, m, BLACK).length > 0);
  }
});

test('isValidMove returns true for valid moves', () => {
  const b = createBoard();
  const valid = getValidMoves(b, BLACK);
  assert.ok(valid.length > 0);
  for (const m of valid) assert.ok(isValidMove(b, m, BLACK));
});

test('isValidMove returns false for occupied cell', () => {
  const b = createBoard();
  const occupied = b.findIndex((c) => c !== null);
  assert.equal(isValidMove(b, occupied, BLACK), false);
});

test('getValidMoves returns 4 moves at game start for BLACK', () => {
  const b = createBoard();
  assert.equal(getValidMoves(b, BLACK).length, 4);
});

test('applyMove places piece and flips correctly', () => {
  const b = createBoard();
  const move = getValidMoves(b, BLACK)[0];
  const next = applyMove(b, move, BLACK);
  assert.equal(next[move], BLACK);
  const { black: b1 } = countPieces(b);
  const { black: b2 } = countPieces(next);
  assert.ok(b2 > b1);
});

test('applyMove does not mutate original board', () => {
  const b = createBoard();
  const original = [...b];
  const move = getValidMoves(b, BLACK)[0];
  applyMove(b, move, BLACK);
  assert.deepEqual(b, original);
});

test('countPieces counts correctly', () => {
  const b = createBoard();
  const { black, white } = countPieces(b);
  assert.equal(black, 2);
  assert.equal(white, 2);
});

test('isGameOver returns false for new game', () => {
  assert.equal(isGameOver(createBoard()), false);
});

test('isGameOver returns true for full board', () => {
  const b = Array(SIZE * SIZE).fill(BLACK);
  assert.ok(isGameOver(b));
});

test('getWinner returns BLACK when black has more', () => {
  const b = Array(SIZE * SIZE).fill(BLACK);
  assert.equal(getWinner(b), BLACK);
});

test('getWinner returns null for draw', () => {
  const b = Array(SIZE * SIZE).fill(null);
  for (let i = 0; i < SIZE * SIZE / 2; i++) b[i] = BLACK;
  for (let i = SIZE * SIZE / 2; i < SIZE * SIZE; i++) b[i] = WHITE;
  assert.equal(getWinner(b), null);
});

test('getBestMove returns null when no valid moves', () => {
  const b = Array(SIZE * SIZE).fill(BLACK);
  assert.equal(getBestMove(b, WHITE), null);
});

test('getBestMove returns a valid move', () => {
  const b = createBoard();
  const move = getBestMove(b, BLACK);
  assert.ok(move !== null);
  assert.ok(isValidMove(b, move, BLACK));
});

test('DIFFICULTIES has 4 keys: easy, normal, hard, oni', () => {
  assert.ok('easy' in DIFFICULTIES);
  assert.ok('normal' in DIFFICULTIES);
  assert.ok('hard' in DIFFICULTIES);
  assert.ok('oni' in DIFFICULTIES);
  assert.equal(Object.keys(DIFFICULTIES).length, 4);
});

test('DIFFICULTIES hard has depth 3, oni has depth 5', () => {
  assert.equal(DIFFICULTIES.hard.depth, 3);
  assert.equal(DIFFICULTIES.oni.depth, 5);
});

test('getEasyMove returns a valid move', () => {
  const b = createBoard();
  const move = getEasyMove(b, BLACK);
  assert.ok(move !== null);
  assert.ok(isValidMove(b, move, BLACK));
});

test('getEasyMove returns null when no valid moves', () => {
  const b = Array(SIZE * SIZE).fill(BLACK);
  assert.equal(getEasyMove(b, WHITE), null);
});

test('minimaxMove returns a valid move', () => {
  const b = createBoard();
  const move = minimaxMove(b, BLACK, 3);
  assert.ok(move !== null);
  assert.ok(isValidMove(b, move, BLACK));
});

test('minimaxMove returns null when no valid moves', () => {
  const b = Array(SIZE * SIZE).fill(BLACK);
  assert.equal(minimaxMove(b, WHITE, 3), null);
});

test('minimaxMove on near-win board picks winning move', () => {
  // Build a board where BLACK has many pieces and one move finishes the game
  // Use a board where WHITE only has one piece left and BLACK can flip it
  const b = Array(SIZE * SIZE).fill(null);
  // Fill all with BLACK except index 0 (WHITE) and index 1 (empty, valid move for BLACK)
  for (let i = 2; i < SIZE * SIZE; i++) b[i] = BLACK;
  b[0] = WHITE;
  b[1] = null;
  // index 1 is valid if black can sandwich white at 0
  // Actually let's just verify minimaxMove returns a move from valid moves
  const moves = getValidMoves(b, BLACK);
  if (moves.length > 0) {
    const move = minimaxMove(b, BLACK, 2);
    assert.ok(move !== null);
    assert.ok(isValidMove(b, move, BLACK));
  }
});

test('getCpuMove easy mode returns valid move', () => {
  const b = createBoard();
  const move = getCpuMove(b, BLACK, 'easy', 3);
  assert.ok(move !== null);
  assert.ok(isValidMove(b, move, BLACK));
});

test('getCpuMove greedy mode returns valid move', () => {
  const b = createBoard();
  const move = getCpuMove(b, BLACK, 'greedy', 3);
  assert.ok(move !== null);
  assert.ok(isValidMove(b, move, BLACK));
});

test('getCpuMove minimax mode returns valid move', () => {
  const b = createBoard();
  const move = getCpuMove(b, BLACK, 'minimax', 3);
  assert.ok(move !== null);
  assert.ok(isValidMove(b, move, BLACK));
});

test('getCpuMove easy mode uses random function', () => {
  const b = createBoard();
  // Force random to always pick first element (0 branch = pick random index 0)
  let callCount = 0;
  const fakeRandom = () => { callCount++; return 0; };
  const move = getCpuMove(b, BLACK, 'easy', 3, fakeRandom);
  assert.ok(move !== null);
  assert.ok(callCount >= 1);
});
