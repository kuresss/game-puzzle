import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZE,
  SOLVED_TILES,
  areAdjacent,
  createShuffledTiles,
  isSolvedTiles,
  isValidTiles,
  moveTile,
} from '../src/puzzleCore.js';

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
}

function countInversions(tiles) {
  const numbers = tiles.filter((tile) => tile !== 0);
  let inversions = 0;

  for (let i = 0; i < numbers.length; i += 1) {
    for (let j = i + 1; j < numbers.length; j += 1) {
      if (numbers[i] > numbers[j]) {
        inversions += 1;
      }
    }
  }

  return inversions;
}

function isSolvable15Puzzle(tiles) {
  const inversions = countInversions(tiles);
  const blankIndex = tiles.indexOf(0);
  const blankRowFromBottom = SIZE - Math.floor(blankIndex / SIZE);

  return blankRowFromBottom % 2 === 0
    ? inversions % 2 === 1
    : inversions % 2 === 0;
}

test('solved tile set is a valid 4x4 15 puzzle board', () => {
  assert.equal(SOLVED_TILES.length, 16);
  assert.deepEqual(SOLVED_TILES.slice(0, 4), [1, 2, 3, 4]);
  assert.deepEqual(SOLVED_TILES.slice(-4), [13, 14, 15, 0]);
  assert.equal(isValidTiles(SOLVED_TILES), true);
  assert.equal(isSolvedTiles(SOLVED_TILES), true);
});

test('tile validation rejects duplicates, missing values, and wrong sizes', () => {
  assert.equal(isValidTiles([1, 2, 3]), false);
  assert.equal(isValidTiles([...SOLVED_TILES.slice(0, 15), 15]), false);
  assert.equal(isValidTiles([...SOLVED_TILES.slice(0, 15), 16]), false);
});

test('adjacency allows orthogonal neighbors only', () => {
  assert.equal(areAdjacent(0, 1), true);
  assert.equal(areAdjacent(0, 4), true);
  assert.equal(areAdjacent(0, 5), false);
  assert.equal(areAdjacent(3, 4), false);
});

test('moveTile only moves a tile next to the blank space', () => {
  const board = [...SOLVED_TILES];

  const invalidMove = moveTile(board, 0);
  assert.equal(invalidMove.moved, false);
  assert.deepEqual(invalidMove.tiles, board);

  const validMove = moveTile(board, 14);
  assert.equal(validMove.moved, true);
  assert.deepEqual(validMove.tiles.slice(-4), [13, 14, 0, 15]);
  assert.deepEqual(board, SOLVED_TILES);
});

test('created shuffles are valid, unsolved, and solvable', () => {
  const shuffled = createShuffledTiles(80, createSeededRandom(1234));

  assert.equal(isValidTiles(shuffled), true);
  assert.equal(isSolvedTiles(shuffled), false);
  assert.equal(isSolvable15Puzzle(shuffled), true);
});
