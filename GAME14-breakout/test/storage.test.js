import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBestScore, saveBestScore, STORAGE_KEYS } from '../src/storage.js';

function makeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = value; },
    _data: data,
  };
}

test('STORAGE_KEYS.bestScore is defined', () => {
  assert.ok(typeof STORAGE_KEYS.bestScore === 'string');
  assert.ok(STORAGE_KEYS.bestScore.length > 0);
});

test('STORAGE_KEYS.bestScoreForDifficulty returns correct key', () => {
  assert.equal(STORAGE_KEYS.bestScoreForDifficulty('normal'), 'game14_breakout_best_normal');
  assert.equal(STORAGE_KEYS.bestScoreForDifficulty('oni'), 'game14_breakout_best_oni');
});

test('loadBestScore returns 0 when key is missing', () => {
  const storage = makeStorage();
  assert.equal(loadBestScore(storage), 0);
});

test('loadBestScore returns stored integer (no difficulty)', () => {
  const storage = makeStorage({ [STORAGE_KEYS.bestScore]: '420' });
  assert.equal(loadBestScore(storage), 420);
});

test('loadBestScore returns 0 for non-numeric string', () => {
  const storage = makeStorage({ [STORAGE_KEYS.bestScore]: 'abc' });
  assert.equal(loadBestScore(storage), 0);
});

test('loadBestScore returns 0 for negative value', () => {
  const storage = makeStorage({ [STORAGE_KEYS.bestScore]: '-5' });
  assert.equal(loadBestScore(storage), 0);
});

test('saveBestScore stores score as string (no difficulty)', () => {
  const storage = makeStorage();
  saveBestScore(storage, 999);
  assert.equal(storage._data[STORAGE_KEYS.bestScore], '999');
});

test('saveBestScore overwrites existing value (no difficulty)', () => {
  const storage = makeStorage({ [STORAGE_KEYS.bestScore]: '100' });
  saveBestScore(storage, 200);
  assert.equal(loadBestScore(storage), 200);
});

// ── Per-difficulty storage ────────────────────────────────────────────────

test('saveBestScore stores to difficulty-specific key', () => {
  const storage = makeStorage();
  saveBestScore(storage, 500, 'hard');
  assert.equal(storage._data['game14_breakout_best_hard'], '500');
});

test('loadBestScore reads from difficulty-specific key', () => {
  const storage = makeStorage({ 'game14_breakout_best_easy': '1234' });
  assert.equal(loadBestScore(storage, 'easy'), 1234);
});

test('loadBestScore returns 0 for missing difficulty key', () => {
  const storage = makeStorage();
  assert.equal(loadBestScore(storage, 'oni'), 0);
});

test('per-difficulty keys are independent', () => {
  const storage = makeStorage();
  saveBestScore(storage, 100, 'easy');
  saveBestScore(storage, 200, 'normal');
  saveBestScore(storage, 300, 'hard');
  saveBestScore(storage, 400, 'oni');
  assert.equal(loadBestScore(storage, 'easy'), 100);
  assert.equal(loadBestScore(storage, 'normal'), 200);
  assert.equal(loadBestScore(storage, 'hard'), 300);
  assert.equal(loadBestScore(storage, 'oni'), 400);
});
