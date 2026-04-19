import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOLE_COUNT, GAME_DURATION, NORMAL_POINTS, BONUS_POINTS, DUMMY_PENALTY,
  createHoles, shouldSpawnBonus, getMoleDuration, getMolePoints,
  getAvailableHoles, spawnMole, hitMole, expireMoles, getSpawnInterval,
  NORMAL_DURATION, BONUS_DURATION, DIFFICULTIES, isEndless,
} from '../src/gameCore.js';

test('createHoles returns 9 nulls', () => {
  const h = createHoles();
  assert.equal(h.length, HOLE_COUNT);
  assert.ok(h.every((v) => v === null));
});

test('shouldSpawnBonus returns boolean', () => {
  assert.equal(typeof shouldSpawnBonus(), 'boolean');
});

test('shouldSpawnBonus uses random correctly', () => {
  assert.equal(shouldSpawnBonus(() => 0.05), true);  // < 0.1
  assert.equal(shouldSpawnBonus(() => 0.5),  false); // >= 0.1
});

test('getMoleDuration returns correct durations', () => {
  assert.equal(getMoleDuration(true),  BONUS_DURATION);
  assert.equal(getMoleDuration(false), NORMAL_DURATION);
});

test('getMolePoints returns correct points', () => {
  assert.equal(getMolePoints(true),  BONUS_POINTS);
  assert.equal(getMolePoints(false), NORMAL_POINTS);
});

test('getAvailableHoles returns all for empty holes', () => {
  const h = createHoles();
  assert.equal(getAvailableHoles(h).length, HOLE_COUNT);
});

test('getAvailableHoles excludes occupied holes', () => {
  const h = createHoles();
  h[3] = { id: 1, type: 'normal', isBonus: false, expiresAt: Date.now() + 1000 };
  assert.ok(!getAvailableHoles(h).includes(3));
  assert.equal(getAvailableHoles(h).length, HOLE_COUNT - 1);
});

test('spawnMole places mole in available hole', () => {
  const h = createHoles();
  const { holes: next, index } = spawnMole(h, 1);
  assert.ok(index >= 0 && index < HOLE_COUNT);
  assert.ok(next[index] !== null);
  assert.equal(next[index].id, 1);
});

test('spawnMole returns index -1 when all holes full', () => {
  const h = createHoles().map((_, i) => ({ id: i, type: 'normal', isBonus: false, expiresAt: Date.now() + 1000 }));
  const { index } = spawnMole(h, 99);
  assert.equal(index, -1);
});

test('spawnMole does not mutate original', () => {
  const h = createHoles();
  const original = [...h];
  spawnMole(h, 1);
  assert.deepEqual(h, original);
});

test('spawnMole produces normal mole type', () => {
  // Force random to avoid bonus range (>= 0.1) and avoid dummy range
  const { holes: next, index } = spawnMole(createHoles(), 1, () => 0.5);
  assert.equal(next[index].type, 'normal');
});

test('spawnMole produces bonus mole type', () => {
  // Force random < 0.1 (bonus chance)
  const { holes: next, index } = spawnMole(createHoles(), 1, () => 0.05);
  assert.equal(next[index].type, 'bonus');
  assert.equal(next[index].isBonus, true);
});

test('spawnMole with hasDummy=true can produce dummy type', () => {
  // With hasDummy, roll in range [0.1, 0.25) produces dummy
  let foundDummy = false;
  // Use sequential counter to deterministically hit the dummy range
  let call = 0;
  const seqRand = () => {
    // First call: hole selection (return 0 to pick index 0)
    // Second call: type roll (return 0.12 to hit dummy range 0.10-0.25)
    const vals = [0, 0.12];
    return vals[call++ % 2];
  };
  const { holes: next, index } = spawnMole(createHoles(), 1, seqRand, true);
  if (next[index] && next[index].type === 'dummy') foundDummy = true;
  assert.ok(foundDummy, 'Expected dummy mole to be spawned');
});

test('spawnMole with hasDummy=true produces dummy over many iterations', () => {
  let foundDummy = false;
  for (let i = 0; i < 200; i++) {
    const { holes: next, index } = spawnMole(createHoles(), i, Math.random, true);
    if (index >= 0 && next[index].type === 'dummy') { foundDummy = true; break; }
  }
  assert.ok(foundDummy, 'Expected at least one dummy mole in 200 spawns');
});

test('spawnMole without hasDummy never produces dummy', () => {
  for (let i = 0; i < 100; i++) {
    const { holes: next, index } = spawnMole(createHoles(), i, Math.random, false);
    if (index >= 0) assert.notEqual(next[index].type, 'dummy');
  }
});

test('hitMole returns points and removes mole', () => {
  const h = createHoles();
  h[2] = { id: 1, type: 'normal', isBonus: false, expiresAt: Date.now() + 1000 };
  const { holes: next, points, hit } = hitMole(h, 2);
  assert.ok(hit);
  assert.equal(points, NORMAL_POINTS);
  assert.equal(next[2], null);
});

test('hitMole returns 0 points for empty hole', () => {
  const h = createHoles();
  const { points, hit } = hitMole(h, 0);
  assert.equal(hit, false);
  assert.equal(points, 0);
});

test('hitMole returns bonus points for bonus mole', () => {
  const h = createHoles();
  h[5] = { id: 1, type: 'bonus', isBonus: true, expiresAt: Date.now() + 1000 };
  const { points } = hitMole(h, 5);
  assert.equal(points, BONUS_POINTS);
});

test('hitMole returns DUMMY_PENALTY for dummy mole', () => {
  const h = createHoles();
  h[4] = { id: 1, type: 'dummy', isBonus: false, expiresAt: Date.now() + 1000 };
  const { points, hit } = hitMole(h, 4);
  assert.ok(hit);
  assert.equal(points, DUMMY_PENALTY);
  assert.ok(DUMMY_PENALTY < 0, 'DUMMY_PENALTY should be negative');
});

test('expireMoles removes expired moles', () => {
  const h = createHoles();
  h[0] = { id: 1, type: 'normal', isBonus: false, expiresAt: Date.now() - 1 }; // already expired
  h[1] = { id: 2, type: 'normal', isBonus: false, expiresAt: Date.now() + 5000 }; // still alive
  const next = expireMoles(h);
  assert.equal(next[0], null);
  assert.ok(next[1] !== null);
});

test('getSpawnInterval decreases as time runs out (default params)', () => {
  assert.equal(getSpawnInterval(GAME_DURATION), 1200);
  assert.ok(getSpawnInterval(10) < getSpawnInterval(GAME_DURATION));
  assert.ok(getSpawnInterval(0) >= 700);
});

test('getSpawnInterval with custom params (hard difficulty)', () => {
  const cfg = DIFFICULTIES.hard;
  const atStart = getSpawnInterval(cfg.duration, cfg.duration, cfg.spawnBase, cfg.spawnMin);
  const atEnd   = getSpawnInterval(0, cfg.duration, cfg.spawnBase, cfg.spawnMin);
  assert.equal(atStart, cfg.spawnBase);
  assert.ok(atEnd >= cfg.spawnMin);
  assert.ok(atEnd <= atStart);
});

test('getSpawnInterval with Infinity duration returns spawnBase', () => {
  const cfg = DIFFICULTIES.endless;
  const result = getSpawnInterval(0, Infinity, cfg.spawnBase, cfg.spawnMin);
  assert.equal(result, cfg.spawnBase);
});

test('DIFFICULTIES has exactly 5 keys', () => {
  const keys = Object.keys(DIFFICULTIES);
  assert.equal(keys.length, 5);
  assert.ok(keys.includes('easy'));
  assert.ok(keys.includes('normal'));
  assert.ok(keys.includes('hard'));
  assert.ok(keys.includes('oni'));
  assert.ok(keys.includes('endless'));
});

test('DIFFICULTIES.oni has hasDummy=true', () => {
  assert.equal(DIFFICULTIES.oni.hasDummy, true);
});

test('DIFFICULTIES non-oni entries have hasDummy=false', () => {
  for (const [key, cfg] of Object.entries(DIFFICULTIES)) {
    if (key !== 'oni') assert.equal(cfg.hasDummy, false, `${key} should not have hasDummy`);
  }
});

test('isEndless returns true for endless', () => {
  assert.equal(isEndless('endless'), true);
});

test('isEndless returns false for non-endless difficulties', () => {
  assert.equal(isEndless('normal'),  false);
  assert.equal(isEndless('easy'),    false);
  assert.equal(isEndless('hard'),    false);
  assert.equal(isEndless('oni'),     false);
});

test('isEndless returns false for unknown key', () => {
  assert.equal(isEndless('unknown'), false);
});
