import { COLOR_HEX } from './gameCore.js';

export function buildHistoryViewModel(history, colorHex = COLOR_HEX) {
  return history.map((entry, i) => ({
    number: i + 1,
    guess: entry.guess,
    black: entry.result.black,
    white: entry.result.white,
    colors: entry.guess.map((c) => ({ color: c, hex: colorHex[c] ?? '#888' })),
  }));
}
