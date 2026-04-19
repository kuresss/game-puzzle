export const DISKS_OPTIONS = [3, 4, 5, 6];
export const DEFAULT_DISKS = 4;
export const PEG_COUNT = 3;

/**
 * State shape: { pegs: number[][], moves: number, diskCount: number }
 * pegs[0] = left, pegs[1] = middle, pegs[2] = right
 * Each peg is an array of disk sizes; largest at index 0, smallest at last (top).
 */

export function createState(diskCount) {
  const disks = Array.from({ length: diskCount }, (_, i) => diskCount - i);
  return {
    pegs: [disks, [], []],
    moves: 0,
    diskCount,
  };
}

export function getTopDisk(state, pegIndex) {
  const peg = state.pegs[pegIndex];
  return peg.length > 0 ? peg[peg.length - 1] : null;
}

export function canMove(state, fromPeg, toPeg) {
  if (fromPeg === toPeg) return false;
  const fromTop = getTopDisk(state, fromPeg);
  if (fromTop === null) return false;
  const toTop = getTopDisk(state, toPeg);
  if (toTop === null) return true;
  return toTop > fromTop;
}

export function moveDisk(state, fromPeg, toPeg) {
  if (!canMove(state, fromPeg, toPeg)) {
    throw new Error(`Invalid move: peg ${fromPeg} -> peg ${toPeg}`);
  }
  const newPegs = state.pegs.map((p) => [...p]);
  const disk = newPegs[fromPeg].pop();
  newPegs[toPeg].push(disk);
  return { pegs: newPegs, moves: state.moves + 1, diskCount: state.diskCount };
}

export function isWon(state) {
  return state.pegs[2].length === state.diskCount;
}

export function getOptimalMoves(diskCount) {
  return Math.pow(2, diskCount) - 1;
}

export function getMoveRating(moves, diskCount) {
  const optimal = getOptimalMoves(diskCount);
  if (moves === optimal) return 'perfect';
  if (moves <= Math.floor(optimal * 1.5)) return 'great';
  return 'good';
}

export const DIFFICULTIES = {
  easy:   { disks: 3, label: 'かんたん'  },
  normal: { disks: 4, label: 'ふつう'    },
  hard:   { disks: 5, label: 'むずかしい' },
  oni:    { disks: 7, label: '🔴 鬼'      },
};
