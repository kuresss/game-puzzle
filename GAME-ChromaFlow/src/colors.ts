export interface ColorDef {
  pH: number;
  temp: number;
  label: string;
  cssColor: string;
}

export type ColorKey = 'flame' | 'coral' | 'gold' | 'aqua' | 'indigo' | 'blizzard';

export const COLORS: Record<ColorKey, ColorDef> = {
  flame:    { pH: 0.1, temp: 0.9, label: 'フレイム',   cssColor: '#f53010' },
  coral:    { pH: 0.2, temp: 0.5, label: 'コーラル',   cssColor: '#f08060' },
  gold:     { pH: 0.3, temp: 0.8, label: 'ゴールド',   cssColor: '#f0b800' },
  aqua:     { pH: 0.7, temp: 0.3, label: 'アクア',     cssColor: '#30c8d0' },
  indigo:   { pH: 0.9, temp: 0.2, label: 'インディゴ', cssColor: '#3030d8' },
  blizzard: { pH: 0.8, temp: 0.0, label: 'ブリザード', cssColor: '#c0d8f8' },
};

export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];
