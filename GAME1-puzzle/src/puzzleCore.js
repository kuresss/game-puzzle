export const SIZE = 4;
export const TILE_COUNT = SIZE * SIZE;
export const SOLVED_TILES = Array.from({ length: TILE_COUNT - 1 }, (_, index) => index + 1).concat(0);

export function isValidTiles(tiles) {
  if (!Array.isArray(tiles) || tiles.length !== TILE_COUNT) {
    return false;
  }

  const seen = new Set(tiles);
  if (seen.size !== TILE_COUNT) {
    return false;
  }

  return SOLVED_TILES.every((tile) => seen.has(tile));
}

export function indexToPosition(index) {
  return {
    row: Math.floor(index / SIZE),
    col: index % SIZE,
  };
}

export function areAdjacent(firstIndex, secondIndex) {
  const first = indexToPosition(firstIndex);
  const second = indexToPosition(secondIndex);
  return Math.abs(first.row - second.row) + Math.abs(first.col - second.col) === 1;
}

export function getNeighborIndexes(index) {
  const { row, col } = indexToPosition(index);
  const neighbors = [];

  if (row > 0) neighbors.push(index - SIZE);
  if (row < SIZE - 1) neighbors.push(index + SIZE);
  if (col > 0) neighbors.push(index - 1);
  if (col < SIZE - 1) neighbors.push(index + 1);

  return neighbors;
}

export function isSolvedTiles(tiles) {
  return isValidTiles(tiles) && tiles.every((tile, index) => tile === SOLVED_TILES[index]);
}

export function moveTile(tiles, index) {
  if (!isValidTiles(tiles)) {
    return { moved: false, tiles: Array.isArray(tiles) ? tiles.slice() : [] };
  }

  const nextTiles = tiles.slice();
  const emptyIndex = nextTiles.indexOf(0);

  if (index === emptyIndex || !areAdjacent(index, emptyIndex)) {
    return { moved: false, tiles: nextTiles };
  }

  [nextTiles[index], nextTiles[emptyIndex]] = [nextTiles[emptyIndex], nextTiles[index]];
  return { moved: true, tiles: nextTiles };
}

export function createShuffledTiles(moveCount = 180, random = Math.random) {
  const MAX_RETRIES = 10;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const tiles = [...SOLVED_TILES];
    let emptyIndex = tiles.indexOf(0);
    let previousEmptyIndex = null;

    for (let step = 0; step < moveCount; step += 1) {
      const candidates = getNeighborIndexes(emptyIndex).filter(
        (index) => index !== previousEmptyIndex
      );
      const nextIndex = candidates[Math.floor(random() * candidates.length)];
      [tiles[emptyIndex], tiles[nextIndex]] = [tiles[nextIndex], tiles[emptyIndex]];
      previousEmptyIndex = emptyIndex;
      emptyIndex = nextIndex;
    }

    if (!isSolvedTiles(tiles)) {
      return tiles;
    }
  }

  // Fallback: force one extra move from the solved state to guarantee non-solved
  const tiles = [...SOLVED_TILES];
  [tiles[14], tiles[15]] = [tiles[15], tiles[14]];
  return tiles;
}
