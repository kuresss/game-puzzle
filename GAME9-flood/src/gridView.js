export const COLOR_HEX = {
  red:    '#ef5350',
  orange: '#ff7043',
  yellow: '#ffd54f',
  green:  '#66bb6a',
  blue:   '#42a5f5',
  purple: '#ab47bc',
};

// Deuteranopia-safe palette (distinguishable by red-green colorblind users)
export const COLOR_HEX_BLIND = {
  red:    '#1a78c2',
  orange: '#f28c00',
  yellow: '#b6e5ff',
  green:  '#333333',
  blue:   '#ff6b35',
  purple: '#a855f7',
};
// blue, orange, light-blue, near-black, salmon-orange, purple

export function getColorHex(colorblind) {
  return colorblind ? COLOR_HEX_BLIND : COLOR_HEX;
}

export function buildGridViewModel({ board, floodZone, colorblind = false }) {
  const palette = getColorHex(colorblind);
  return board.map((color, index) => ({
    index,
    color,
    hex: palette[color] ?? '#888',
    isInZone: floodZone.has(index),
  }));
}
