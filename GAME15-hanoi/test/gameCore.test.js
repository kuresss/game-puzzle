import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DISKS_OPTIONS, DEFAULT_DISKS, PEG_COUNT,
  createState, canMove, moveDisk, isWon,
  getTopDisk, getOptimalMoves, getMoveRating, DIFFICULTIES,
} from '../src/gameCore.js';

// --- createState ---

test('createState: correct diskCount stored', () => {
  const s = createState(4);
  assert.equal(s.diskCount, 4);
});

test('createState: moves starts at 0', () => {
  const s = createState(4);
  assert.equal(s.moves, 0);
});

test('createState: pegs[0] has all disks, pegs[1] and pegs[2] empty', () => {
  const s = createState(3);
  assert.equal(s.pegs[0].length, 3);
  assert.equal(s.pegs[1].length, 0);
  assert.equal(s.pegs[2].length, 0);
});

test('createState: pegs[0] disks largest at index 0, smallest at last', () => {
  const s = createState(4);
  assert.equal(s.pegs[0][0], 4); // largest
  assert.equal(s.pegs[0][3], 1); // smallest (top)
});

test('createState: PEG_COUNT is 3', () => {
  assert.equal(PEG_COUNT, 3);
});

test('createState: DEFAULT_DISKS is in DISKS_OPTIONS', () => {
  assert.ok(DISKS_OPTIONS.includes(DEFAULT_DISKS));
});

// --- getTopDisk ---

test('getTopDisk: returns smallest disk from initial peg 0', () => {
  const s = createState(4);
  assert.equal(getTopDisk(s, 0), 1);
});

test('getTopDisk: returns null for empty peg', () => {
  const s = createState(4);
  assert.equal(getTopDisk(s, 1), null);
  assert.equal(getTopDisk(s, 2), null);
});

// --- canMove ---

test('canMove: false if fromPeg has no disks', () => {
  const s = createState(3);
  assert.equal(canMove(s, 1, 2), false);
});

test('canMove: true if toPeg is empty', () => {
  const s = createState(3);
  assert.equal(canMove(s, 0, 1), true);
});

test('canMove: true if top of toPeg is larger', () => {
  const s = moveDisk(createState(3), 0, 2); // move disk 1 to peg 2
  // peg 0 top = 2, peg 2 top = 1
  assert.equal(canMove(s, 0, 2), false); // can't place 2 on 1
});

test('canMove: false if top of toPeg is smaller', () => {
  let s = createState(3);
  s = moveDisk(s, 0, 1); // peg1=[1], peg0=[3,2]
  // now try to place disk 2 (top of peg0) on disk 1 (top of peg1)
  assert.equal(canMove(s, 0, 1), false);
});

test('canMove: false if fromPeg === toPeg', () => {
  const s = createState(3);
  assert.equal(canMove(s, 0, 0), false);
});

// --- moveDisk ---

test('moveDisk: disk transfers correctly', () => {
  const s0 = createState(3);
  const s1 = moveDisk(s0, 0, 2);
  assert.equal(s1.pegs[0].length, 2);
  assert.equal(s1.pegs[2].length, 1);
  assert.equal(s1.pegs[2][0], 1);
});

test('moveDisk: moves counter increments', () => {
  const s0 = createState(3);
  const s1 = moveDisk(s0, 0, 2);
  assert.equal(s1.moves, 1);
  const s2 = moveDisk(s1, 0, 1);
  assert.equal(s2.moves, 2);
});

test('moveDisk: original state is not mutated', () => {
  const s0 = createState(3);
  const pegs0 = JSON.stringify(s0.pegs);
  moveDisk(s0, 0, 2);
  assert.equal(JSON.stringify(s0.pegs), pegs0);
});

test('moveDisk: throws on invalid move', () => {
  const s = createState(3);
  // peg 1 is empty, cannot move from it
  assert.throws(() => moveDisk(s, 1, 2));
});

// --- isWon ---

test('isWon: false at start', () => {
  const s = createState(3);
  assert.equal(isWon(s), false);
});

test('isWon: true when all disks on peg 2', () => {
  // Build a won state manually
  const diskCount = 3;
  const s = {
    pegs: [[], [], [3, 2, 1]],
    moves: 7,
    diskCount,
  };
  assert.equal(isWon(s), true);
});

test('isWon: false when disks are on peg 2 but not all', () => {
  const s = {
    pegs: [[3], [], [2, 1]],
    moves: 5,
    diskCount: 3,
  };
  assert.equal(isWon(s), false);
});

// --- getOptimalMoves ---

test('getOptimalMoves: 3 disks = 7', () => {
  assert.equal(getOptimalMoves(3), 7);
});

test('getOptimalMoves: 4 disks = 15', () => {
  assert.equal(getOptimalMoves(4), 15);
});

test('getOptimalMoves: 5 disks = 31', () => {
  assert.equal(getOptimalMoves(5), 31);
});

test('getOptimalMoves: 6 disks = 63', () => {
  assert.equal(getOptimalMoves(6), 63);
});

// --- getMoveRating ---

test('getMoveRating: perfect when moves === optimal', () => {
  assert.equal(getMoveRating(7, 3), 'perfect');
  assert.equal(getMoveRating(15, 4), 'perfect');
});

test('getMoveRating: great when moves <= optimal * 1.5', () => {
  // optimal for 4 disks = 15; 15*1.5 = 22.5 → floor = 22
  assert.equal(getMoveRating(22, 4), 'great');
  assert.equal(getMoveRating(16, 4), 'great');
});

test('getMoveRating: good when moves > optimal * 1.5', () => {
  // optimal for 4 = 15; floor(22.5) = 22; 23 should be good
  assert.equal(getMoveRating(23, 4), 'good');
  assert.equal(getMoveRating(100, 4), 'good');
});

test('DIFFICULTIES has 4 keys', () => { assert.strictEqual(Object.keys(DIFFICULTIES).length, 4); });
test('getOptimalMoves(7) === 127', () => { assert.strictEqual(getOptimalMoves(7), 127); });
test('getMoveRating perfect for 7 disks', () => { assert.strictEqual(getMoveRating(127, 7), 'perfect'); });
