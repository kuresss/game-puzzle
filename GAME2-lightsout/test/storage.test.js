import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEYS,
  loadBestMoves,
  saveBestMoves,
  saveGameState,
  loadGameState,
} from '../src/storage.js';
import { createSolvedCells, createShuffledCells } from '../src/lightsCore.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

test('STORAGE_KEYS contains all required keys', () => {
  assert.ok(STORAGE_KEYS.bestMoves);
  assert.ok(STORAGE_KEYS.gameState);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('loadBestMoves returns null when missing', () => {
  assert.equal(loadBestMoves(createMemoryStorage()), null);
});

test('loadBestMoves returns positive integer when stored', () => {
  const s = createMemoryStorage();
  s.setItem(STORAGE_KEYS.bestMoves, '12');
  assert.equal(loadBestMoves(s), 12);
});

test('loadBestMoves returns null for invalid values', () => {
  const s = createMemoryStorage();
  s.setItem(STORAGE_KEYS.bestMoves, '0');
  assert.equal(loadBestMoves(s), null);
  s.setItem(STORAGE_KEYS.bestMoves, '-5');
  assert.equal(loadBestMoves(s), null);
  s.setItem(STORAGE_KEYS.bestMoves, 'abc');
  assert.equal(loadBestMoves(s), null);
});

test('saveBestMoves writes string and removes on null', () => {
  const s = createMemoryStorage();
  saveBestMoves(s, 7);
  assert.equal(s.getItem(STORAGE_KEYS.bestMoves), '7');
  saveBestMoves(s, null);
  assert.equal(s.getItem(STORAGE_KEYS.bestMoves), null);
});

test('saveGameState serializes cells and moves', () => {
  const s = createMemoryStorage();
  const cells = createSolvedCells();
  saveGameState(s, { cells, moves: 5 });
  const parsed = JSON.parse(s.getItem(STORAGE_KEYS.gameState));
  assert.deepEqual(parsed.cells, cells);
  assert.equal(parsed.moves, 5);
});

test('loadGameState returns null when missing', () => {
  assert.equal(loadGameState(createMemoryStorage()), null);
});

test('loadGameState returns null for malformed JSON', () => {
  const s = createMemoryStorage();
  s.setItem(STORAGE_KEYS.gameState, '{bad json');
  assert.equal(loadGameState(s), null);
});

test('loadGameState returns null for invalid cells', () => {
  const s = createMemoryStorage();
  s.setItem(STORAGE_KEYS.gameState, JSON.stringify({ cells: [1, 2, 3], moves: 0 }));
  assert.equal(loadGameState(s), null);
});

test('loadGameState restores valid state', () => {
  const s = createMemoryStorage();
  const cells = createShuffledCells();
  saveGameState(s, { cells, moves: 3 });
  const loaded = loadGameState(s);
  assert.deepEqual(loaded.cells, cells);
  assert.equal(loaded.moves, 3);
});

test('loadGameState normalizes invalid moves to 0', () => {
  const s = createMemoryStorage();
  const cells = createSolvedCells();
  s.setItem(STORAGE_KEYS.gameState, JSON.stringify({ cells, moves: -1 }));
  const loaded = loadGameState(s);
  assert.equal(loaded.moves, 0);
});
