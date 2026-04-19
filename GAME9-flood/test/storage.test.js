import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, loadBestMoves, saveBestMoves, loadBestMovesByDifficulty, saveBestMovesByDifficulty } from '../src/storage.js';

function mem() {
  const s = new Map();
  return { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k) };
}

test('STORAGE_KEYS has required keys', () => {
  assert.ok(STORAGE_KEYS.bestMoves);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('loadBestMoves returns null when missing', () => {
  assert.equal(loadBestMoves(mem()), null);
});

test('loadBestMoves returns stored integer', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestMoves, '18');
  assert.equal(loadBestMoves(s), 18);
});

test('loadBestMoves returns null for invalid', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestMoves, '0');
  assert.equal(loadBestMoves(s), null);
  s.setItem(STORAGE_KEYS.bestMoves, 'bad');
  assert.equal(loadBestMoves(s), null);
});

test('saveBestMoves writes string', () => {
  const s = mem();
  saveBestMoves(s, 20);
  assert.equal(s.getItem(STORAGE_KEYS.bestMoves), '20');
});

test('loadBestMovesByDifficulty returns null when missing', () => {
  assert.equal(loadBestMovesByDifficulty(mem(), 'normal'), null);
});

test('loadBestMovesByDifficulty returns stored integer', () => {
  const s = mem();
  saveBestMovesByDifficulty(s, 'normal', 15);
  assert.equal(loadBestMovesByDifficulty(s, 'normal'), 15);
});

test('saveBestMovesByDifficulty uses difficulty-specific key', () => {
  const s = mem();
  saveBestMovesByDifficulty(s, 'easy', 22);
  assert.equal(s.getItem('game9_flood_best_moves_easy'), '22');
  saveBestMovesByDifficulty(s, 'oni', 10);
  assert.equal(s.getItem('game9_flood_best_moves_oni'), '10');
});

test('loadBestMovesByDifficulty isolates per difficulty', () => {
  const s = mem();
  saveBestMovesByDifficulty(s, 'easy', 22);
  saveBestMovesByDifficulty(s, 'hard', 14);
  assert.equal(loadBestMovesByDifficulty(s, 'easy'), 22);
  assert.equal(loadBestMovesByDifficulty(s, 'hard'), 14);
  assert.equal(loadBestMovesByDifficulty(s, 'normal'), null);
});

test('loadBestMovesByDifficulty returns null for invalid value', () => {
  const s = mem();
  s.setItem('game9_flood_best_moves_hard', '0');
  assert.equal(loadBestMovesByDifficulty(s, 'hard'), null);
  s.setItem('game9_flood_best_moves_hard', 'abc');
  assert.equal(loadBestMovesByDifficulty(s, 'hard'), null);
});
