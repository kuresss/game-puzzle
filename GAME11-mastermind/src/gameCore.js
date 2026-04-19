export const DIFFICULTIES = {
  easy:   { colorCount: 4, codeLength: 4, maxAttempts: 12, label: 'かんたん'   },
  normal: { colorCount: 6, codeLength: 4, maxAttempts: 10, label: 'ふつう'     },
  hard:   { colorCount: 8, codeLength: 5, maxAttempts: 8,  label: 'むずかしい' },
  oni:    { colorCount: 8, codeLength: 6, maxAttempts: 6,  label: '🔴 鬼'       },
};

export const ALL_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'cyan'];
// Keep COLORS as alias for backward compat (6 colors)
export const COLORS = ALL_COLORS.slice(0, 6);

// Deprecated single constants – kept for backward compat
export const CODE_LENGTH = 4;
export const MAX_ATTEMPTS = 10;

export const COLOR_HEX = {
  red:    '#e63946',
  orange: '#f4a261',
  yellow: '#e9c46a',
  green:  '#2a9d8f',
  blue:   '#457b9d',
  purple: '#9b5de5',
  pink:   '#f72585',
  cyan:   '#4cc9f0',
};

export const COLOR_HEX_BLIND = {
  red:    '#0077bb',  // blue
  orange: '#ee7733',  // orange
  yellow: '#ffffff',  // white
  green:  '#333333',  // black
  blue:   '#009988',  // teal
  purple: '#cc3311',  // red (deuteranopia-safe red)
  pink:   '#ee3377',  // magenta
  cyan:   '#bbbbbb',  // light-grey
};

export function getColorHex(colorblind) {
  return colorblind ? COLOR_HEX_BLIND : COLOR_HEX;
}

// Generate secret: array of codeLength colors, repetition allowed
export function generateSecret(difficulty = 'normal', random = Math.random) {
  const { colorCount, codeLength } = DIFFICULTIES[difficulty];
  const pool = ALL_COLORS.slice(0, colorCount);
  const result = [];
  for (let i = 0; i < codeLength; i++) {
    result.push(pool[Math.floor(random() * colorCount)]);
  }
  return result;
}

// Evaluate guess against secret
// Returns { black: number, white: number }
// black = right color right position
// white = right color wrong position
export function evaluate(secret, guess) {
  let black = 0;
  const secretLeft = [];
  const guessLeft = [];

  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      black++;
    } else {
      secretLeft.push(secret[i]);
      guessLeft.push(guess[i]);
    }
  }

  let white = 0;
  for (const g of guessLeft) {
    const idx = secretLeft.indexOf(g);
    if (idx >= 0) {
      white++;
      secretLeft.splice(idx, 1);
    }
  }

  return { black, white };
}

export function isWin(result, codeLength) {
  return result.black === codeLength;
}

export function isValidGuess(guess, difficulty = 'normal') {
  const { colorCount, codeLength } = DIFFICULTIES[difficulty];
  const validColors = ALL_COLORS.slice(0, colorCount);
  return Array.isArray(guess) && guess.length === codeLength && guess.every((c) => validColors.includes(c));
}
