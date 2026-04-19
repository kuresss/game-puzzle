import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, loadWins, saveWins, winsKey } from '../src/storage.js';

function mem() {
  const s = new Map();
  return { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k) };
}

test('STORAGE_KEYS has required keys', () => {
  assert.ok(STORAGE_KEYS.wins);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('loadWins returns 0 when missing', () => {
  assert.equal(loadWins(mem()), 0);
});

test('loadWins returns stored value', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.wins, '7');
  assert.equal(loadWins(s), 7);
});

test('loadWins returns 0 for invalid', () => {
  const s = mem();
  s.setItem(STORAGE_KEYS.wins, 'bad');
  assert.equal(loadWins(s), 0);
});

test('saveWins writes string', () => {
  const s = mem();
  saveWins(s, 3);
  assert.equal(s.getItem(STORAGE_KEYS.wins), '3');
});

// ── Per-difficulty storage keys ───────────────────────────────────────────────
test('winsKey returns difficulty-scoped key', () => {
  assert.equal(winsKey('easy'),   'game12_connectfour_wins_easy');
  assert.equal(winsKey('normal'), 'game12_connectfour_wins_normal');
  assert.equal(winsKey('hard'),   'game12_connectfour_wins_hard');
  assert.equal(winsKey('oni'),    'game12_connectfour_wins_oni');
});

test('loadWins with difficulty reads per-difficulty key', () => {
  const s = mem();
  s.setItem('game12_connectfour_wins_hard', '5');
  assert.equal(loadWins(s, 'hard'), 5);
  assert.equal(loadWins(s, 'easy'), 0);
});

test('saveWins with difficulty writes per-difficulty key', () => {
  const s = mem();
  saveWins(s, 9, 'oni');
  assert.equal(s.getItem('game12_connectfour_wins_oni'), '9');
  assert.equal(s.getItem(STORAGE_KEYS.wins), null);
});
