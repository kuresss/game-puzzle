import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, loadBestScore, saveBestScore } from '../src/storage.js';

function mem() {
  const s = new Map();
  return { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k) };
}

test('STORAGE_KEYS has required keys', () => {
  assert.ok(STORAGE_KEYS.bestScore);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('loadBestScore returns 0 when missing (no difficulty)', () => {
  assert.equal(loadBestScore(mem()), 0);
});

test('loadBestScore returns stored integer (no difficulty)', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestScore, '250');
  assert.equal(loadBestScore(s), 250);
});

test('loadBestScore returns 0 for invalid', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestScore, 'abc');
  assert.equal(loadBestScore(s), 0);
  s.setItem(STORAGE_KEYS.bestScore, '-5');
  assert.equal(loadBestScore(s), 0);
});

test('saveBestScore writes string (no difficulty)', () => {
  const s = mem();
  saveBestScore(s, 300);
  assert.equal(s.getItem(STORAGE_KEYS.bestScore), '300');
});

test('loadBestScore with difficulty uses per-difficulty key', () => {
  const s = mem();
  s.setItem('game6_snake_best_score_easy', '42');
  assert.equal(loadBestScore(s, 'easy'), 42);
  assert.equal(loadBestScore(s, 'normal'), 0);
});

test('saveBestScore with difficulty writes to per-difficulty key', () => {
  const s = mem();
  saveBestScore(s, 100, 'hard');
  assert.equal(s.getItem('game6_snake_best_score_hard'), '100');
  assert.equal(s.getItem(STORAGE_KEYS.bestScore), null);
});

test('per-difficulty scores are isolated from each other', () => {
  const s = mem();
  saveBestScore(s, 10, 'easy');
  saveBestScore(s, 20, 'normal');
  saveBestScore(s, 30, 'hard');
  saveBestScore(s, 40, 'oni');
  assert.equal(loadBestScore(s, 'easy'), 10);
  assert.equal(loadBestScore(s, 'normal'), 20);
  assert.equal(loadBestScore(s, 'hard'), 30);
  assert.equal(loadBestScore(s, 'oni'), 40);
});

test('loadBestScore with difficulty returns 0 for invalid value', () => {
  const s = mem();
  s.setItem('game6_snake_best_score_oni', 'NaN');
  assert.equal(loadBestScore(s, 'oni'), 0);
});
