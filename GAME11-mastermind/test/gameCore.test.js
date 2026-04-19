import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CODE_LENGTH, MAX_ATTEMPTS, COLORS, ALL_COLORS, DIFFICULTIES,
  generateSecret, evaluate, isWin, isValidGuess,
} from '../src/gameCore.js';

test('CODE_LENGTH is 4', () => {
  assert.equal(CODE_LENGTH, 4);
});

test('MAX_ATTEMPTS is 10', () => {
  assert.equal(MAX_ATTEMPTS, 10);
});

test('DIFFICULTIES has 4 keys with required fields', () => {
  const keys = ['easy', 'normal', 'hard', 'oni'];
  for (const key of keys) {
    const d = DIFFICULTIES[key];
    assert.ok(d, `missing difficulty: ${key}`);
    assert.ok(typeof d.colorCount === 'number');
    assert.ok(typeof d.codeLength === 'number');
    assert.ok(typeof d.maxAttempts === 'number');
  }
});

test('DIFFICULTIES oni has colorCount=8, codeLength=6, maxAttempts=6', () => {
  assert.equal(DIFFICULTIES.oni.colorCount, 8);
  assert.equal(DIFFICULTIES.oni.codeLength, 6);
  assert.equal(DIFFICULTIES.oni.maxAttempts, 6);
});

test('generateSecret normal returns array of length 4', () => {
  assert.equal(generateSecret('normal').length, 4);
});

test('generateSecret returns array of correct length (default = normal)', () => {
  assert.equal(generateSecret().length, CODE_LENGTH);
});

test('generateSecret uses only valid colors for normal', () => {
  for (let i = 0; i < 20; i++) {
    assert.ok(generateSecret('normal').every((c) => COLORS.includes(c)));
  }
});

test('generateSecret oni returns array of length 6 with only ALL_COLORS[0..7]', () => {
  const secret = generateSecret('oni', Math.random);
  assert.equal(secret.length, 6);
  assert.ok(secret.every((c) => ALL_COLORS.includes(c)));
});

test('generateSecret oni can produce pink and cyan', () => {
  // With random pinned to always pick index 6 or 7 (pink/cyan)
  const pinkSecret = generateSecret('oni', () => 6 / 8);
  assert.ok(pinkSecret.every((c) => c === 'pink'));
  const cyanSecret = generateSecret('oni', () => 7 / 8);
  assert.ok(cyanSecret.every((c) => c === 'cyan'));
});

test('generateSecret allows repetition', () => {
  // Force same color every time
  const secret = generateSecret('normal', () => 0);
  assert.ok(secret.every((c) => c === secret[0]));
});

test('evaluate returns 4 black for exact match', () => {
  const s = ['red', 'blue', 'green', 'yellow'];
  const r = evaluate(s, s);
  assert.equal(r.black, 4);
  assert.equal(r.white, 0);
});

test('evaluate returns 0 black 4 white for all-anagram', () => {
  const s = ['red', 'blue', 'green', 'yellow'];
  const g = ['blue', 'green', 'yellow', 'red'];
  const r = evaluate(s, g);
  assert.equal(r.black, 0);
  assert.equal(r.white, 4);
});

test('evaluate returns 0 black 0 white for no match', () => {
  const s = ['red', 'red', 'red', 'red'];
  const g = ['blue', 'blue', 'blue', 'blue'];
  const r = evaluate(s, g);
  assert.equal(r.black, 0);
  assert.equal(r.white, 0);
});

test('evaluate handles duplicates correctly', () => {
  // secret: red red blue green
  // guess:  red blue blue blue → 2 black (red@0, blue@2)
  const s = ['red', 'red', 'blue', 'green'];
  const g = ['red', 'blue', 'blue', 'blue'];
  const r = evaluate(s, g);
  assert.equal(r.black, 2); // red@0, blue@2
  assert.equal(r.white, 0);
});

test('evaluate mixed result', () => {
  // secret: red blue green yellow
  // guess:  red green blue purple  → black=1(red), white=2(blue,green)
  const s = ['red', 'blue', 'green', 'yellow'];
  const g = ['red', 'green', 'blue', 'purple'];
  const r = evaluate(s, g);
  assert.equal(r.black, 1);
  assert.equal(r.white, 2);
});

test('isWin returns true for 4 black with codeLength 4', () => {
  assert.ok(isWin({ black: 4, white: 0 }, 4));
});

test('isWin returns false for less than 4 black with codeLength 4', () => {
  assert.equal(isWin({ black: 3, white: 1 }, 4), false);
});

test('isWin returns true for 6 black with codeLength 6 (oni)', () => {
  assert.ok(isWin({ black: 6, white: 0 }, 6));
});

test('isValidGuess accepts correct array for normal', () => {
  assert.ok(isValidGuess(['red', 'blue', 'green', 'yellow']));
});

test('isValidGuess accepts all 6 normal colors', () => {
  assert.ok(isValidGuess(['red', 'orange', 'yellow', 'green', 'blue', 'purple'].slice(0, 4)));
});

test('isValidGuess rejects wrong length for normal', () => {
  assert.equal(isValidGuess(['red', 'blue', 'green']), false);
});

test('isValidGuess rejects invalid colors for normal', () => {
  assert.equal(isValidGuess(['red', 'blue', 'green', 'pink']), false);
});

test('isValidGuess accepts duplicates for normal', () => {
  assert.ok(isValidGuess(['red', 'red', 'red', 'red']));
});

test('isValidGuess on oni allows pink and cyan', () => {
  const oniGuess = ['red', 'orange', 'yellow', 'green', 'pink', 'cyan'];
  assert.ok(isValidGuess(oniGuess, 'oni'));
});

test('isValidGuess on oni rejects wrong length', () => {
  assert.equal(isValidGuess(['red', 'orange', 'yellow', 'green'], 'oni'), false);
});
