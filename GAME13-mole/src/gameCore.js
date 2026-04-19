export const HOLE_COUNT = 9;
export const GAME_DURATION = 30; // seconds (kept for backward compat)
export const NORMAL_POINTS = 10;
export const BONUS_POINTS  = 30;
export const NORMAL_DURATION = 800; // ms mole stays up
export const BONUS_DURATION  = 500;
export const BONUS_CHANCE   = 0.1; // 10%
export const DUMMY_PENALTY  = -15; // hitting a dummy mole costs 15 points

export const DIFFICULTIES = {
  easy:    { duration: 45,       spawnBase: 1500, spawnMin: 1000, hasDummy: false, label: 'かんたん'   },
  normal:  { duration: 30,       spawnBase: 1200, spawnMin: 700,  hasDummy: false, label: 'ふつう'     },
  hard:    { duration: 30,       spawnBase: 900,  spawnMin: 500,  hasDummy: false, label: 'むずかしい' },
  oni:     { duration: 20,       spawnBase: 700,  spawnMin: 300,  hasDummy: true,  label: '鬼'         },
  endless: { duration: Infinity, spawnBase: 1200, spawnMin: 300,  hasDummy: false, label: 'エンドレス' },
};

export function isEndless(difficulty) {
  return DIFFICULTIES[difficulty]?.duration === Infinity;
}

// Mole state per hole: null | { id, type, isBonus, expiresAt }
export function createHoles() {
  return Array(HOLE_COUNT).fill(null);
}

export function shouldSpawnBonus(random = Math.random) {
  return random() < BONUS_CHANCE;
}

export function getMoleDuration(isBonus) {
  return isBonus ? BONUS_DURATION : NORMAL_DURATION;
}

export function getMolePoints(isBonus) {
  return isBonus ? BONUS_POINTS : NORMAL_POINTS;
}

export function getAvailableHoles(holes) {
  return holes.reduce((acc, m, i) => (m === null ? [...acc, i] : acc), []);
}

export function spawnMole(holes, id, random = Math.random, hasDummy = false) {
  const available = getAvailableHoles(holes);
  if (available.length === 0) return { holes, index: -1 };
  const index = available[Math.floor(random() * available.length)];

  let type = 'normal';
  const roll = random();
  if (roll < BONUS_CHANCE) {
    type = 'bonus';
  } else if (hasDummy && roll < BONUS_CHANCE + 0.15) {
    type = 'dummy';
  }

  const isBonus = type === 'bonus';
  const now = Date.now();
  const next = [...holes];
  next[index] = { id, type, isBonus, expiresAt: now + getMoleDuration(isBonus) };
  return { holes: next, index };
}

export function hitMole(holes, index) {
  const mole = holes[index];
  if (!mole) return { holes, points: 0, hit: false };
  const next = [...holes];
  next[index] = null;
  let points;
  if (mole.type === 'bonus') {
    points = BONUS_POINTS;
  } else if (mole.type === 'dummy') {
    points = DUMMY_PENALTY;
  } else {
    points = NORMAL_POINTS;
  }
  return { holes: next, points, hit: true };
}

export function expireMoles(holes) {
  const now = Date.now();
  return holes.map((m) => (m && now >= m.expiresAt ? null : m));
}

export function getSpawnInterval(timeRemaining, totalDuration = 30, spawnBase = 1200, spawnMin = 700) {
  if (totalDuration === Infinity) {
    // endless: caller handles acceleration separately; return base
    return spawnBase;
  }
  const elapsed = totalDuration - timeRemaining;
  return Math.max(spawnMin, spawnBase - Math.floor(elapsed / 5) * 100);
}
