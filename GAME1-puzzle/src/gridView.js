import { areAdjacent } from './puzzleCore.js';

export const GRID_VIEW_LABELS = {
  blank: '空きマス',
  tileSuffix: 'のタイル',
};

export function buildGridViewModel({ tiles, isSolved }, labels = GRID_VIEW_LABELS) {
  const emptyIndex = tiles.indexOf(0);

  return tiles.map((tile, index) => {
    const isEmpty = tile === 0;
    const canMove = !isEmpty && !isSolved && areAdjacent(index, emptyIndex);
    const className = [
      'tile',
      isEmpty ? 'empty' : '',
      canMove ? 'can-move' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      index,
      number: isEmpty ? null : tile,
      text: isEmpty ? '' : String(tile),
      className,
      ariaLabel: isEmpty ? labels.blank : `${tile} ${labels.tileSuffix}`,
      disabled: !canMove,
      canMove,
    };
  });
}
