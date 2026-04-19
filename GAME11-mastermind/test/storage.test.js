import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, bestKey, loadBestAttempts, saveBestAttempts } from '../src/storage.js';

function mem() {
  const s = new Map();
  return { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k) };
}

test('STORAGE_KEYS has required keys', () => {
  assert.ok(STORAGE_KEYS.bestAttempts);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('bestKey returns per-difficulty key', () => {
  assert.equal(bestKey('normal'), 'game11_mastermind_best_normal');
  assert.equal(bestKey('oni'), 'game11_mastermind_best_oni');
  assert.equal(bestKey('easy'), 'game11_mastermind_best_easy');
  assert.equal(bestKey('hard'), 'game11_mastermind_best_hard');
});

test('loadBestAttempts returns null when missing', () => {
  assert.equal(loadBestAttempts(mem()), null);
});

test('loadBestAttempts returns stored value (legacy key)', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestAttempts, '5');
  assert.equal(loadBestAttempts(s), 5);
});

test('loadBestAttempts returns null for invalid', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.bestAttempts, '0');
  assert.equal(loadBestAttempts(s), null);
  s.setItem(STORAGE_KEYS.bestAttempts, 'bad');
  assert.equal(loadBestAttempts(s), null);
});

test('saveBestAttempts writes string (legacy key)', () => {
  const s = mem();
  saveBestAttempts(s, 4);
  assert.equal(s.getItem(STORAGE_KEYS.bestAttempts), '4');
});

test('loadBestAttempts with difficulty uses per-difficulty key', () => {
  const s = mem();
  s.setItem('game11_mastermind_best_normal', '7');
  assert.equal(loadBestAttempts(s, 'normal'), 7);
});

test('saveBestAttempts with difficulty writes per-difficulty key', () => {
  const s = mem();
  saveBestAttempts(s, 3, 'oni');
  assert.equal(s.getItem('game11_mastermind_best_oni'), '3');
});

test('per-difficulty keys are independent', () => {
  const s = mem();
  saveBestAttempts(s, 5, 'normal');
  saveBestAttempts(s, 3, 'oni');
  assert.equal(loadBestAttempts(s, 'normal'), 5);
  assert.equal(loadBestAttempts(s, 'oni'), 3);
  assert.equal(loadBestAttempts(s, 'easy'), null);
});
