export function buildGridViewModel({ board, status }) {
  return board.map((cell, index) => {
    let label = '未開封';
    if (cell.isFlagged) label = '旗';
    else if (cell.isRevealed && cell.isMine) label = '地雷';
    else if (cell.isRevealed) label = cell.neighborCount === 0 ? '空き' : `${cell.neighborCount}`;

    return {
      index,
      cell,
      label,
      ariaLabel: `${index + 1}番 ${label}`,
      isDisabled: status === 'won' || status === 'lost',
    };
  });
}

export const NEIGHBOR_COLORS = ['', '#1a73e8', '#2e7d32', '#c62828', '#1565c0', '#b71c1c', '#00838f', '#333', '#757575'];
