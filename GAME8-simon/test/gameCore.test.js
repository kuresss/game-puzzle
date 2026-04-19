import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLORS, COLOR_LABELS, generateStep, extendSequence,
  checkInput, isRoundComplete, getFlashDuration, getGapDuration,
  DIFFICULTIES,
} from '../src/gameCore.js';

test('COLORS has 4 entries', () => {
  assert.equal(COLORS.length, 4);
});

test('COLOR_LABELS has entry for each color', () => {
  for (const c of COLORS) assert.ok(COLOR_LABELS[c]);
});

test('generateStep returns a valid color', () => {
  for (let i = 0; i < 20; i++) {
    assert.ok(COLORS.includes(generateStep()));
  }
});

test('generateStep uses random', () => {
  const step = generateStep(() => 0);
  assert.equal(step, COLORS[0]);
  const step2 = generateStep(() => 0.99);
  assert.equal(step2, COLORS[COLORS.length - 1]);
});

test('extendSequence adds one step', () => {
  const seq = ['red', 'blue'];
  const next = extendSequence(seq);
  assert.equal(next.length, 3);
  assert.equal(next[0], 'red');
  assert.equal(next[1], 'blue');
  assert.ok(COLORS.includes(next[2]));
});

test('extendSequence does not mutate original', () => {
  const seq = ['red'];
  extendSequence(seq);
  assert.equal(seq.length, 1);
});

test('checkInput returns true for correct partial input', () => {
  assert.ok(checkInput(['red', 'blue', 'green'], ['red']));
  assert.ok(checkInput(['red', 'blue', 'green'], ['red', 'blue']));
  assert.ok(checkInput(['red', 'blue', 'green'], ['red', 'blue', 'green']));
});

test('checkInput returns false for wrong input', () => {
  assert.equal(checkInput(['red', 'blue'], ['blue']), false);
  assert.equal(checkInput(['red', 'blue'], ['red', 'green']), false);
});

test('checkInput returns false when inputs exceed sequence', () => {
  assert.equal(checkInput(['red'], ['red', 'blue']), false);
});

test('isRoundComplete returns true when lengths match', () => {
  assert.ok(isRoundComplete(['red', 'blue'], ['red', 'blue']));
});

test('isRoundComplete returns false when incomplete', () => {
  assert.equal(isRoundComplete(['red', 'blue'], ['red']), false);
});

test('getFlashDuration decreases with higher round', () => {
  assert.equal(getFlashDuration(0), 600);
  assert.ok(getFlashDuration(5) < 600);
  assert.ok(getFlashDuration(100) >= 300);
});

test('getFlashDuration never below 120', () => {
  assert.ok(getFlashDuration(1000) >= 120);
});

test('getGapDuration never below 60', () => {
  assert.ok(getGapDuration(1000) >= 60);
});

test('DIFFICULTIES has 4 keys each with speedMultiplier', () => {
  const keys = Object.keys(DIFFICULTIES);
  assert.equal(keys.length, 4);
  for (const key of keys) {
    assert.ok(typeof DIFFICULTIES[key].speedMultiplier === 'number');
  }
});

test('getFlashDuration(0, 1.0) returns 600', () => {
  assert.equal(getFlashDuration(0, 1.0), 600);
});

test('getFlashDuration faster with higher multiplier', () => {
  assert.ok(getFlashDuration(0, 2.2) < getFlashDuration(0, 1.0));
});
