import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, loadBestScore, saveBestScore, bestScoreKey } from '../src/storage.js';

function mem() {
  const s = new Map();
  return { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k) };
}

test('STORAGE_KEYS has required keys', () => {
  assert.ok(STORAGE_KEYS.bestScore);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('loadBestScore returns 0 when missing', () => {
  assert.equal(loadBestScore(mem()), 0);
});

test('loadBestScore returns stored value', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestScore, '45');
  assert.equal(loadBestScore(s), 45);
});

test('loadBestScore returns 0 for invalid', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestScore, 'bad');
  assert.equal(loadBestScore(s), 0);
});

test('saveBestScore writes string', () => {
  const s = mem();
  saveBestScore(s, 38);
  assert.equal(s.getItem(STORAGE_KEYS.bestScore), '38');
});

test('bestScoreKey returns per-difficulty key', () => {
  assert.equal(bestScoreKey('easy'), 'game10_reversi_best_easy');
  assert.equal(bestScoreKey('normal'), 'game10_reversi_best_normal');
  assert.equal(bestScoreKey('hard'), 'game10_reversi_best_hard');
  assert.equal(bestScoreKey('oni'), 'game10_reversi_best_oni');
});

test('loadBestScore with difficulty uses per-difficulty key', () => {
  const s = mem();
  s.setItem('game10_reversi_best_hard', '55');
  assert.equal(loadBestScore(s, 'hard'), 55);
  assert.equal(loadBestScore(s, 'easy'), 0);
});

test('saveBestScore with difficulty writes to per-difficulty key', () => {
  const s = mem();
  saveBestScore(s, 42, 'oni');
  assert.equal(s.getItem('game10_reversi_best_oni'), '42');
  assert.equal(s.getItem(STORAGE_KEYS.bestScore), null);
});

test('per-difficulty keys are distinct for all difficulties', () => {
  const keys = ['easy', 'normal', 'hard', 'oni'].map(bestScoreKey);
  const unique = new Set(keys);
  assert.equal(unique.size, 4);
});
