import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEYS,
  isRemoveAdsPurchased,
  loadBestMoves,
  loadGameState,
  saveBestMoves,
  saveGameState,
} from '../src/storage.js';
import { SOLVED_TILES } from '../src/puzzleCore.js';

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    _dump() {
      return Object.fromEntries(store);
    },
    _size() {
      return store.size;
    },
  };
}

test('loadBestMoves returns null when key is missing', () => {
  const storage = createMemoryStorage();
  assert.equal(loadBestMoves(storage), null);
});

test('loadBestMoves returns a positive integer when stored', () => {
  const storage = createMemoryStorage({ [STORAGE_KEYS.bestMoves]: '42' });
  assert.equal(loadBestMoves(storage), 42);
});

test('loadBestMoves returns null for non-numeric, zero, or negative values', () => {
  for (const raw of ['abc', '0', '-5', '']) {
    const storage = createMemoryStorage({ [STORAGE_KEYS.bestMoves]: raw });
    assert.equal(loadBestMoves(storage), null, `raw=${raw}`);
  }
});

test('saveBestMoves writes string representation', () => {
  const storage = createMemoryStorage();
  saveBestMoves(storage, 17);
  assert.equal(storage.getItem(STORAGE_KEYS.bestMoves), '17');
});

test('saveBestMoves removes the key when value is null', () => {
  const storage = createMemoryStorage({ [STORAGE_KEYS.bestMoves]: '17' });
  saveBestMoves(storage, null);
  assert.equal(storage.getItem(STORAGE_KEYS.bestMoves), null);
  assert.equal(storage._size(), 0);
});

test('saveGameState serializes tiles and moves (isSolved is derived, not stored)', () => {
  const storage = createMemoryStorage();
  saveGameState(storage, { tiles: SOLVED_TILES, moves: 3 });
  const raw = storage.getItem(STORAGE_KEYS.gameState);
  assert.deepEqual(JSON.parse(raw), {
    tiles: SOLVED_TILES,
    moves: 3,
  });
});

test('loadGameState returns null when missing', () => {
  const storage = createMemoryStorage();
  assert.equal(loadGameState(storage), null);
});

test('loadGameState returns null for malformed JSON', () => {
  const storage = createMemoryStorage({ [STORAGE_KEYS.gameState]: '{invalid json' });
  assert.equal(loadGameState(storage), null);
});

test('loadGameState returns null when tiles are invalid', () => {
  const storage = createMemoryStorage({
    [STORAGE_KEYS.gameState]: JSON.stringify({ tiles: [1, 2, 3], moves: 0 }),
  });
  assert.equal(loadGameState(storage), null);
});

test('loadGameState restores valid tiles and normalizes moves', () => {
  const storage = createMemoryStorage({
    [STORAGE_KEYS.gameState]: JSON.stringify({ tiles: SOLVED_TILES, moves: 5 }),
  });
  const result = loadGameState(storage);
  assert.deepEqual(result.tiles, SOLVED_TILES);
  assert.equal(result.moves, 5);
});

test('loadGameState normalizes negative or non-integer moves to 0', () => {
  for (const badMoves of [-1, 1.5, 'x', null]) {
    const storage = createMemoryStorage({
      [STORAGE_KEYS.gameState]: JSON.stringify({ tiles: SOLVED_TILES, moves: badMoves }),
    });
    assert.equal(loadGameState(storage).moves, 0, `moves=${badMoves}`);
  }
});

test('isRemoveAdsPurchased accepts "true" and "1", rejects everything else', () => {
  assert.equal(isRemoveAdsPurchased(createMemoryStorage()), false);
  assert.equal(
    isRemoveAdsPurchased(createMemoryStorage({ [STORAGE_KEYS.removeAdsPurchased]: 'true' })),
    true
  );
  assert.equal(
    isRemoveAdsPurchased(createMemoryStorage({ [STORAGE_KEYS.removeAdsPurchased]: '1' })),
    true
  );
  assert.equal(
    isRemoveAdsPurchased(createMemoryStorage({ [STORAGE_KEYS.removeAdsPurchased]: 'false' })),
    false
  );
  assert.equal(
    isRemoveAdsPurchased(createMemoryStorage({ [STORAGE_KEYS.removeAdsPurchased]: '' })),
    false
  );
});
