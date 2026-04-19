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

test('loadBestScore returns 0 when missing', () => {
  assert.equal(loadBestScore(mem(), 'normal'), 0);
});

test('loadBestScore returns stored integer', () => {
  const s = mem();
  s.setItem('game8_simon_best_score_normal', '15');
  assert.equal(loadBestScore(s, 'normal'), 15);
});

test('loadBestScore returns 0 for invalid', () => {
  const s = mem();
  s.setItem('game8_simon_best_score_normal', 'bad');
  assert.equal(loadBestScore(s, 'normal'), 0);
  s.setItem('game8_simon_best_score_normal', '-3');
  assert.equal(loadBestScore(s, 'normal'), 0);
});

test('saveBestScore writes string', () => {
  const s = mem();
  saveBestScore(s, 20, 'normal');
  assert.equal(s.getItem('game8_simon_best_score_normal'), '20');
});

test('per-difficulty storage keys are independent', () => {
  const s = mem();
  saveBestScore(s, 5, 'easy');
  saveBestScore(s, 10, 'normal');
  saveBestScore(s, 15, 'hard');
  saveBestScore(s, 3, 'oni');
  assert.equal(loadBestScore(s, 'easy'), 5);
  assert.equal(loadBestScore(s, 'normal'), 10);
  assert.equal(loadBestScore(s, 'hard'), 15);
  assert.equal(loadBestScore(s, 'oni'), 3);
});

test('loadBestScore defaults to normal difficulty', () => {
  const s = mem();
  s.setItem('game8_simon_best_score_normal', '7');
  assert.equal(loadBestScore(s), 7);
});
