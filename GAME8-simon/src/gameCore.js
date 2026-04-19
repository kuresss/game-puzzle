export const COLORS = ['red', 'blue', 'yellow', 'green'];

export const DIFFICULTIES = {
  easy:   { speedMultiplier: 0.7, label: 'かんたん'  },
  normal: { speedMultiplier: 1.0, label: 'ふつう'    },
  hard:   { speedMultiplier: 1.4, label: 'むずかしい' },
  oni:    { speedMultiplier: 2.2, label: '🔴 鬼'      },
};

export const COLOR_LABELS = {
  red:    '赤',
  blue:   '青',
  yellow: '黄',
  green:  '緑',
};

export function generateStep(random = Math.random) {
  return COLORS[Math.floor(random() * COLORS.length)];
}

export function extendSequence(sequence, random = Math.random) {
  return [...sequence, generateStep(random)];
}

export function checkInput(sequence, inputs) {
  if (inputs.length > sequence.length) return false;
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i] !== sequence[i]) return false;
  }
  return true;
}

export function isRoundComplete(sequence, inputs) {
  return inputs.length === sequence.length;
}

export function getFlashDuration(round, multiplier = 1.0) {
  const base = Math.max(300, 600 - Math.floor(round / 5) * 60);
  return Math.max(120, Math.round(base / multiplier));
}

export function getGapDuration(round, multiplier = 1.0) {
  const base = Math.max(100, 200 - Math.floor(round / 5) * 20);
  return Math.max(60, Math.round(base / multiplier));
}
