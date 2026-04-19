import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, loadBestAttempts, saveBestAttempts } from '../src/storage.js';

function mem() {
  const s = new Map();
  return { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k) };
}

test('STORAGE_KEYS has required keys', () => {
  assert.ok(STORAGE_KEYS.bestAttempts);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('loadBestAttempts returns null when missing', () => {
  assert.equal(loadBestAttempts(mem(), 'normal'), null);
});

test('loadBestAttempts returns stored integer', () => {
  const s = mem();
  saveBestAttempts(s, 'normal', 5);
  assert.equal(loadBestAttempts(s, 'normal'), 5);
});

test('loadBestAttempts returns null for invalid', () => {
  const s = mem();
  s.setItem(`${STORAGE_KEYS.bestAttempts}_normal`, '0');
  assert.equal(loadBestAttempts(s, 'normal'), null);
  s.setItem(`${STORAGE_KEYS.bestAttempts}_normal`, 'bad');
  assert.equal(loadBestAttempts(s, 'normal'), null);
});

test('loadBestAttempts is per difficulty', () => {
  const s = mem();
  saveBestAttempts(s, 'easy', 3);
  saveBestAttempts(s, 'hard', 7);
  assert.equal(loadBestAttempts(s, 'easy'), 3);
  assert.equal(loadBestAttempts(s, 'hard'), 7);
  assert.equal(loadBestAttempts(s, 'normal'), null);
});

test('saveBestAttempts writes string', () => {
  const s = mem();
  saveBestAttempts(s, 'normal', 4);
  assert.equal(s.getItem(`${STORAGE_KEYS.bestAttempts}_normal`), '4');
});
