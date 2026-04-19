import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, loadBestMoves, saveBestMoves, saveGameState, loadGameState } from '../src/storage.js';
import { createCards } from '../src/gameCore.js';

function mem() {
  const s = new Map();
  return { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k) };
}

test('STORAGE_KEYS has required keys', () => {
  assert.ok(STORAGE_KEYS.bestMoves);
  assert.ok(STORAGE_KEYS.gameState);
  assert.ok(STORAGE_KEYS.tutorialSeen);
});

test('loadBestMoves returns null when missing', () => {
  assert.equal(loadBestMoves(mem(), 'normal'), null);
});

test('loadBestMoves returns stored integer', () => {
  const s = mem();
  s.setItem('game5_memory_best_moves_normal', '15');
  assert.equal(loadBestMoves(s, 'normal'), 15);
});

test('loadBestMoves returns null for invalid', () => {
  const s = mem();
  s.setItem('game5_memory_best_moves_normal', '0');
  assert.equal(loadBestMoves(s, 'normal'), null);
  s.setItem('game5_memory_best_moves_normal', 'bad');
  assert.equal(loadBestMoves(s, 'normal'), null);
});

test('loadBestMoves uses per-difficulty keys', () => {
  const s = mem();
  s.setItem('game5_memory_best_moves_easy', '10');
  s.setItem('game5_memory_best_moves_hard', '30');
  assert.equal(loadBestMoves(s, 'easy'), 10);
  assert.equal(loadBestMoves(s, 'hard'), 30);
  assert.equal(loadBestMoves(s, 'normal'), null);
});

test('saveBestMoves writes and removes on null', () => {
  const s = mem();
  saveBestMoves(s, 'normal', 12);
  assert.equal(s.getItem('game5_memory_best_moves_normal'), '12');
  saveBestMoves(s, 'normal', null);
  assert.equal(s.getItem('game5_memory_best_moves_normal'), null);
});

test('saveGameState serializes cards and moves with difficulty key', () => {
  const s = mem();
  saveGameState(s, 'normal', { cards: createCards(12), moves: 4 });
  const parsed = JSON.parse(s.getItem('game5_memory_state_normal'));
  assert.equal(parsed.cards.length, 24);
  assert.equal(parsed.moves, 4);
});

test('saveGameState uses separate keys per difficulty', () => {
  const s = mem();
  saveGameState(s, 'easy', { cards: createCards(8), moves: 2 });
  saveGameState(s, 'hard', { cards: createCards(18), moves: 9 });
  const easy = JSON.parse(s.getItem('game5_memory_state_easy'));
  const hard = JSON.parse(s.getItem('game5_memory_state_hard'));
  assert.equal(easy.cards.length, 16);
  assert.equal(hard.cards.length, 36);
});

test('loadGameState returns null when missing', () => {
  assert.equal(loadGameState(mem(), 'normal', 12), null);
});

test('loadGameState returns null for bad JSON', () => {
  const s = mem();
  s.setItem('game5_memory_state_normal', '{bad');
  assert.equal(loadGameState(s, 'normal', 12), null);
});

test('loadGameState returns null for wrong card count', () => {
  const s = mem();
  s.setItem('game5_memory_state_normal', JSON.stringify({ cards: [{symbol:'a'}], moves: 0 }));
  assert.equal(loadGameState(s, 'normal', 12), null);
});

test('loadGameState restores valid state', () => {
  const s = mem();
  const cards = createCards(12);
  saveGameState(s, 'normal', { cards, moves: 7 });
  const loaded = loadGameState(s, 'normal', 12);
  assert.equal(loaded.cards.length, 24);
  assert.equal(loaded.moves, 7);
});

test('loadGameState normalizes negative moves to 0', () => {
  const s = mem();
  const cards = createCards(12);
  s.setItem('game5_memory_state_normal', JSON.stringify({ cards, moves: -3 }));
  const loaded = loadGameState(s, 'normal', 12);
  assert.equal(loaded.moves, 0);
});

test('loadGameState for easy difficulty validates 16 cards', () => {
  const s = mem();
  const cards = createCards(8);
  saveGameState(s, 'easy', { cards, moves: 3 });
  const loaded = loadGameState(s, 'easy', 8);
  assert.equal(loaded.cards.length, 16);
  assert.equal(loaded.moves, 3);
  // wrong pairs count should fail
  assert.equal(loadGameState(s, 'easy', 12), null);
});
