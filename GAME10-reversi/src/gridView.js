export function buildGridViewModel({ board, validMoves, lastMove, color }) {
  const validSet = new Set(validMoves);
  return board.map((cell, index) => ({
    index,
    cell,
    isValid: validSet.has(index),
    isLastMove: index === lastMove,
    ariaLabel: cell ? `${index + 1}番 ${cell === 'black' ? '黒' : '白'}` : validSet.has(index) ? `${index + 1}番 置ける` : `${index + 1}番 空き`,
  }));
}
