export function buildGridViewModel({ board, validCols, lastDrop }) {
  const validSet = new Set(validCols);
  return {
    cells: board.map((cell, index) => ({
      index,
      cell,
      row: Math.floor(index / 7),
      col: index % 7,
      isLastDrop: lastDrop !== null && index === lastDrop,
    })),
    columnHints: Array.from({ length: 7 }, (_, c) => ({
      col: c,
      isValid: validSet.has(c),
    })),
  };
}
