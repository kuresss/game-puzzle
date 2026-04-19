import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEYS,
  loadBestScore,
  saveBestScore,
  saveGameState,
  loadGameState,
} from '../src/storage.js';
import { createEmptyBoard, spawnTile } from '../src/gameCore.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

test('STORAGE_KEYS contains all required keys', () => {
  assert.ok(STORAGE_KEYS.bestScore);
  assert.ok(STORAGE_KEYS.gameState);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('STORAGE_KEYS.bestScore uses normal difficulty suffix', () => {
  assert.equal(STORAGE_KEYS.bestScore, 'game3_2048_best_score_normal');
});

test('STORAGE_KEYS.gameState uses normal difficulty suffix', () => {
  assert.equal(STORAGE_KEYS.gameState, 'game3_2048_state_normal');
});

test('loadBestScore returns 0 when missing', () => {
  assert.equal(loadBestScore(createMemoryStorage()), 0);
});

test('loadBestScore returns stored integer', () => {
  const s = createMemoryStorage();
  s.setItem('game3_2048_best_score_normal', '512');
  assert.equal(loadBestScore(s, 'normal'), 512);
});

test('loadBestScore returns 0 for invalid values', () => {
  const s = createMemoryStorage();
  s.setItem('game3_2048_best_score_normal', 'abc');
  assert.equal(loadBestScore(s, 'normal'), 0);
  s.setItem('game3_2048_best_score_normal', '-1');
  assert.equal(loadBestScore(s, 'normal'), 0);
});

test('saveBestScore writes string', () => {
  const s = createMemoryStorage();
  saveBestScore(s, 1024, 'normal');
  assert.equal(s.getItem('game3_2048_best_score_normal'), '1024');
});

test('saveGameState serializes board and score', () => {
  const s = createMemoryStorage();
  const board = createEmptyBoard();
  saveGameState(s, { board, score: 100 }, 'normal');
  const parsed = JSON.parse(s.getItem('game3_2048_state_normal'));
  assert.deepEqual(parsed.board, board);
  assert.equal(parsed.score, 100);
});

test('loadGameState returns null when missing', () => {
  assert.equal(loadGameState(createMemoryStorage()), null);
});

test('loadGameState returns null for malformed JSON', () => {
  const s = createMemoryStorage();
  s.setItem('game3_2048_state_normal', '{bad json');
  assert.equal(loadGameState(s, 'normal'), null);
});

test('loadGameState returns null for invalid board', () => {
  const s = createMemoryStorage();
  s.setItem('game3_2048_state_normal', JSON.stringify({ board: [1, 2, 3], score: 0 }));
  assert.equal(loadGameState(s, 'normal'), null);
});

test('loadGameState restores valid state', () => {
  const s = createMemoryStorage();
  const board = spawnTile(createEmptyBoard());
  saveGameState(s, { board, score: 42 }, 'normal');
  const loaded = loadGameState(s, 'normal');
  assert.deepEqual(loaded.board, board);
  assert.equal(loaded.score, 42);
});

test('loadGameState normalizes negative score to 0', () => {
  const s = createMemoryStorage();
  const board = createEmptyBoard();
  s.setItem('game3_2048_state_normal', JSON.stringify({ board, score: -99 }));
  const loaded = loadGameState(s, 'normal');
  assert.equal(loaded.score, 0);
});

// ── per-difficulty key tests ──────────────────────
test('loadBestScore uses per-difficulty key for easy', () => {
  const s = createMemoryStorage();
  s.setItem('game3_2048_best_score_easy', '256');
  assert.equal(loadBestScore(s, 'easy'), 256);
  assert.equal(loadBestScore(s, 'normal'), 0);
});

test('saveBestScore uses per-difficulty key for hard', () => {
  const s = createMemoryStorage();
  saveBestScore(s, 9999, 'hard');
  assert.equal(s.getItem('game3_2048_best_score_hard'), '9999');
  assert.equal(s.getItem('game3_2048_best_score_normal'), null);
});

test('loadGameState validates board size for oni (5x5)', () => {
  const s = createMemoryStorage();
  const board5 = createEmptyBoard(5);
  saveGameState(s, { board: board5, score: 0 }, 'oni');
  const loaded = loadGameState(s, 'oni', 5);
  assert.equal(loaded.board.length, 25);
});

test('loadGameState returns null when board size mismatches difficulty', () => {
  const s = createMemoryStorage();
  const board4 = createEmptyBoard(4);
  saveGameState(s, { board: board4, score: 0 }, 'oni');
  assert.equal(loadGameState(s, 'oni', 5), null);
});
