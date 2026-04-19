import { isValidCells } from './lightsCore.js';

export const STORAGE_KEYS = {
  bestMoves: 'game2_lightsout_best_moves',
  gameState: 'game2_lightsout_state',
  tutorialSeen: 'game2_tutorial_seen',
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

export function saveGameState(storage, { cells, moves }) {
  storage.setItem(STORAGE_KEYS.gameState, JSON.stringify({ cells, moves }));
}

export function loadGameState(storage) {
  const raw = storage.getItem(STORAGE_KEYS.gameState);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isValidCells(parsed.cells)) return null;
    return {
      cells: parsed.cells.slice(),
      moves: Number.isInteger(parsed.moves) && parsed.moves >= 0 ? parsed.moves : 0,
    };
  } catch {
    return null;
  }
}
