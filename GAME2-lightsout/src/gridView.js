export function buildGridViewModel({ cells, isSolved }) {
  return cells.map((isOn, index) => ({
    index,
    isOn,
    disabled: isSolved,
    ariaLabel: isOn ? `${index + 1}番 点灯中` : `${index + 1}番 消灯中`,
    ariaPressed: isOn,
  }));
}
