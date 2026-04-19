import { isValidTiles } from './puzzleCore.js';

export const STORAGE_KEYS = {
  bestMoves: 'game1_15_puzzle_best_moves',
  gameState: 'game1_15_puzzle_state',
  removeAdsPurchased: 'remove_ads_purchased',
  tutorialSeen: 'game1_tutorial_seen',
};

export function loadBestMoves(storage) {
  const raw = storage.getItem(STORAGE_KEYS.bestMoves);
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function saveBestMoves(storage, bestMoves) {
  if (bestMoves === null) {
    storage.removeItem(STORAGE_KEYS.bestMoves);
    return;
  }
  storage.setItem(STORAGE_KEYS.bestMoves, String(bestMoves));
}

export function saveGameState(storage, { tiles, moves }) {
  storage.setItem(
    STORAGE_KEYS.gameState,
    JSON.stringify({ tiles, moves })
  );
}

export function loadGameState(storage) {
  const raw = storage.getItem(STORAGE_KEYS.gameState);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isValidTiles(parsed.tiles)) {
      return null;
    }

    return {
      tiles: parsed.tiles.slice(),
      moves: Number.isInteger(parsed.moves) && parsed.moves >= 0 ? parsed.moves : 0,
    };
  } catch {
    return null;
  }
}

export function isRemoveAdsPurchased(storage) {
  const value = storage.getItem(STORAGE_KEYS.removeAdsPurchased);
  return value === 'true' || value === '1';
}
