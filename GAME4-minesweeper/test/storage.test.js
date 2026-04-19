import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEYS, loadBestTime, saveBestTime, saveGameState, loadGameState,
} from '../src/storage.js';
import { createBoard, placeMines } from '../src/gameCore.js';

function mem() {
  const s = new Map();
  return { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k) };
}

test('STORAGE_KEYS has required keys', () => {
  assert.ok(STORAGE_KEYS.bestTime);
  assert.ok(STORAGE_KEYS.gameState);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('loadBestTime returns null when missing', () => {
  assert.equal(loadBestTime(mem(), 'easy'), null);
});

test('loadBestTime returns stored integer', () => {
  const s = mem();
  s.setItem(`${STORAGE_KEYS.bestTime}_easy`, '42');
  assert.equal(loadBestTime(s, 'easy'), 42);
});

test('loadBestTime returns null for invalid', () => {
  const s = mem();
  s.setItem(`${STORAGE_KEYS.bestTime}_easy`, '0');
  assert.equal(loadBestTime(s, 'easy'), null);
  s.setItem(`${STORAGE_KEYS.bestTime}_easy`, 'abc');
  assert.equal(loadBestTime(s, 'easy'), null);
});

test('saveBestTime writes string with difficulty key', () => {
  const s = mem();
  saveBestTime(s, 'easy', 99);
  assert.equal(s.getItem(`${STORAGE_KEYS.bestTime}_easy`), '99');
});

test('saveBestTime uses correct key per difficulty', () => {
  const s = mem();
  saveBestTime(s, 'oni', 999);
  assert.equal(s.getItem(`${STORAGE_KEYS.bestTime}_oni`), '999');
  assert.equal(s.getItem(`${STORAGE_KEYS.bestTime}_easy`), null);
});

test('saveGameState serializes state with difficulty key', () => {
  const s = mem();
  const board = placeMines(createBoard(), 0);
  saveGameState(s, 'easy', { board, elapsedSeconds: 10, status: 'playing' });
  const parsed = JSON.parse(s.getItem(`${STORAGE_KEYS.gameState}_easy`));
  assert.equal(parsed.board.length, 81);
  assert.equal(parsed.elapsedSeconds, 10);
  assert.equal(parsed.status, 'playing');
});

test('saveGameState uses separate key for normal difficulty', () => {
  const s = mem();
  const board16 = createBoard(16, 16);
  saveGameState(s, 'normal', { board: board16, elapsedSeconds: 5, status: 'playing' });
  const parsed = JSON.parse(s.getItem(`${STORAGE_KEYS.gameState}_normal`));
  assert.equal(parsed.board.length, 256);
});

test('loadGameState returns null when missing', () => {
  assert.equal(loadGameState(mem(), 'easy', 9, 9), null);
});

test('loadGameState returns null for bad JSON', () => {
  const s = mem();
  s.setItem(`${STORAGE_KEYS.gameState}_easy`, '{bad');
  assert.equal(loadGameState(s, 'easy', 9, 9), null);
});

test('loadGameState returns null for wrong board length', () => {
  const s = mem();
  s.setItem(`${STORAGE_KEYS.gameState}_easy`, JSON.stringify({ board: [1, 2], elapsedSeconds: 0, status: 'idle' }));
  assert.equal(loadGameState(s, 'easy', 9, 9), null);
});

test('loadGameState restores valid state for easy', () => {
  const s = mem();
  const board = placeMines(createBoard(), 0);
  saveGameState(s, 'easy', { board, elapsedSeconds: 5, status: 'won' });
  const loaded = loadGameState(s, 'easy', 9, 9);
  assert.equal(loaded.board.length, 81);
  assert.equal(loaded.elapsedSeconds, 5);
  assert.equal(loaded.status, 'won');
});

test('loadGameState restores valid state for normal 16x16', () => {
  const s = mem();
  const board = placeMines(createBoard(16, 16), 0, 40, 16, 16);
  saveGameState(s, 'normal', { board, elapsedSeconds: 20, status: 'playing' });
  const loaded = loadGameState(s, 'normal', 16, 16);
  assert.equal(loaded.board.length, 256);
  assert.equal(loaded.elapsedSeconds, 20);
});

test('loadGameState normalizes unknown status to idle', () => {
  const s = mem();
  const board = createBoard();
  s.setItem(`${STORAGE_KEYS.gameState}_easy`, JSON.stringify({ board, elapsedSeconds: 0, status: 'unknown' }));
  const loaded = loadGameState(s, 'easy', 9, 9);
  assert.equal(loaded.status, 'idle');
});
