export const DIFFICULTIES = {
  easy:   { digits: 4, pool: '123456',     maxAttempts: 10, label: 'かんたん' },
  normal: { digits: 4, pool: '0123456789', maxAttempts: 8,  label: 'ふつう'   },
  hard:   { digits: 5, pool: '0123456789', maxAttempts: 8,  label: 'むずかしい' },
  oni:    { digits: 5, pool: '0123456789', maxAttempts: 6,  label: '🔴 鬼' },
};

export function generateSecret(difficulty = 'normal', random = Math.random) {
  const { digits, pool } = DIFFICULTIES[difficulty];
  const chars = pool.split('');
  // Fisher-Yates on pool, take first `digits`
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, digits).join('');
}

export function evaluate(secret, guess) {
  let hit = 0;
  let blow = 0;
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      hit += 1;
    } else if (secret.includes(guess[i])) {
      blow += 1;
    }
  }
  return { hit, blow };
}

export function isValidGuess(guess, difficulty = 'normal') {
  const { digits, pool } = DIFFICULTIES[difficulty];
  if (guess.length !== digits) return false;
  if (!guess.split('').every((c) => pool.includes(c))) return false;
  return new Set(guess).size === digits; // all unique
}

export function checkWin(result) {
  return result.hit === 4 || (result.hit === 5);
}

export function isWinResult(result, digits) {
  return result.hit === digits;
}
