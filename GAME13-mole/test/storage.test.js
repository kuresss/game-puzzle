import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEYS, loadBestScore, saveBestScore,
  bestScoreKey, loadBestScoreByDifficulty, saveBestScoreByDifficulty,
} from '../src/storage.js';

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
  s.setItem(STORAGE_KEYS.bestScore, '120');
  assert.equal(loadBestScore(s), 120);
});

test('loadBestScore returns 0 for invalid', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestScore, 'bad');
  assert.equal(loadBestScore(s), 0);
});

test('saveBestScore writes string', () => {
  const s = mem();
  saveBestScore(s, 250);
  assert.equal(s.getItem(STORAGE_KEYS.bestScore), '250');
});

test('bestScoreKey returns per-difficulty key', () => {
  assert.equal(bestScoreKey('normal'),  'game13_mole_best_score_normal');
  assert.equal(bestScoreKey('easy'),    'game13_mole_best_score_easy');
  assert.equal(bestScoreKey('hard'),    'game13_mole_best_score_hard');
  assert.equal(bestScoreKey('oni'),     'game13_mole_best_score_oni');
  assert.equal(bestScoreKey('endless'), 'game13_mole_best_score_endless');
});

test('per-difficulty keys are distinct from each other', () => {
  const keys = ['easy', 'normal', 'hard', 'oni', 'endless'].map(bestScoreKey);
  const unique = new Set(keys);
  assert.equal(unique.size, keys.length);
});

test('loadBestScoreByDifficulty returns 0 when missing', () => {
  assert.equal(loadBestScoreByDifficulty(mem(), 'normal'), 0);
});

test('loadBestScoreByDifficulty returns stored value', () => {
  const s = mem();
  s.setItem(bestScoreKey('hard'), '300');
  assert.equal(loadBestScoreByDifficulty(s, 'hard'), 300);
});

test('loadBestScoreByDifficulty returns 0 for invalid', () => {
  const s = mem();
  s.setItem(bestScoreKey('easy'), 'nan');
  assert.equal(loadBestScoreByDifficulty(s, 'easy'), 0);
});

test('saveBestScoreByDifficulty writes to difficulty-specific key', () => {
  const s = mem();
  saveBestScoreByDifficulty(s, 'oni', 999);
  assert.equal(s.getItem(bestScoreKey('oni')), '999');
  assert.equal(s.getItem(STORAGE_KEYS.bestScore), null);
});

test('per-difficulty scores are independent', () => {
  const s = mem();
  saveBestScoreByDifficulty(s, 'easy',    100);
  saveBestScoreByDifficulty(s, 'normal',  200);
  saveBestScoreByDifficulty(s, 'hard',    300);
  saveBestScoreByDifficulty(s, 'oni',     400);
  saveBestScoreByDifficulty(s, 'endless', 500);
  assert.equal(loadBestScoreByDifficulty(s, 'easy'),    100);
  assert.equal(loadBestScoreByDifficulty(s, 'normal'),  200);
  assert.equal(loadBestScoreByDifficulty(s, 'hard'),    300);
  assert.equal(loadBestScoreByDifficulty(s, 'oni'),     400);
  assert.equal(loadBestScoreByDifficulty(s, 'endless'), 500);
});
