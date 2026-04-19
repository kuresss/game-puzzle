import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, loadBest, saveBest } from '../src/storage.js';

function makeMockStorage() {
  const data = {};
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    _data: data,
  };
}

test('STORAGE_KEYS.bestPrefix is defined', () => {
  assert.ok(typeof STORAGE_KEYS.bestPrefix === 'string');
  assert.ok(STORAGE_KEYS.bestPrefix.length > 0);
});

test('loadBest returns null when no data stored', () => {
  const storage = makeMockStorage();
  assert.equal(loadBest(storage, 4), null);
});

test('saveBest stores value, loadBest retrieves it', () => {
  const storage = makeMockStorage();
  saveBest(storage, 4, 15);
  assert.equal(loadBest(storage, 4), 15);
});

test('loadBest is disk-count-specific', () => {
  const storage = makeMockStorage();
  saveBest(storage, 3, 7);
  saveBest(storage, 4, 20);
  assert.equal(loadBest(storage, 3), 7);
  assert.equal(loadBest(storage, 4), 20);
});

test('loadBest returns null for invalid stored value', () => {
  const storage = makeMockStorage();
  storage.setItem(STORAGE_KEYS.bestPrefix + '4', 'NaN');
  assert.equal(loadBest(storage, 4), null);
});

test('loadBest returns null for zero stored value', () => {
  const storage = makeMockStorage();
  storage.setItem(STORAGE_KEYS.bestPrefix + '4', '0');
  assert.equal(loadBest(storage, 4), null);
});

test('saveBest stores value as string', () => {
  const storage = makeMockStorage();
  saveBest(storage, 5, 31);
  const raw = storage._data[STORAGE_KEYS.bestPrefix + '5'];
  assert.equal(typeof raw, 'string');
  assert.equal(raw, '31');
});

test('loadBest returns null for oni when no data stored', () => {
  const storage = makeMockStorage();
  assert.equal(loadBest(storage, 'oni'), null);
});

test('saveBest/loadBest roundtrip for oni', () => {
  const storage = makeMockStorage();
  saveBest(storage, 'oni', 127);
  assert.equal(loadBest(storage, 'oni'), 127);
});

test('loadBest oni key is separate from numeric keys', () => {
  const storage = makeMockStorage();
  saveBest(storage, 7, 200);
  saveBest(storage, 'oni', 127);
  assert.equal(loadBest(storage, 7), 200);
  assert.equal(loadBest(storage, 'oni'), 127);
});
