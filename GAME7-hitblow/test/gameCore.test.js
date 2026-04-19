import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTIES, generateSecret, evaluate, isValidGuess, isWinResult,
} from '../src/gameCore.js';

test('DIFFICULTIES has easy, normal, hard', () => {
  assert.ok(DIFFICULTIES.easy);
  assert.ok(DIFFICULTIES.normal);
  assert.ok(DIFFICULTIES.hard);
});

test('generateSecret returns correct digit count', () => {
  assert.equal(generateSecret('easy').length, 4);
  assert.equal(generateSecret('normal').length, 4);
  assert.equal(generateSecret('hard').length, 5);
});

test('generateSecret has all unique digits', () => {
  for (let i = 0; i < 20; i++) {
    const s = generateSecret('normal');
    assert.equal(new Set(s).size, 4);
  }
});

test('generateSecret uses only pool digits', () => {
  for (let i = 0; i < 20; i++) {
    const s = generateSecret('easy');
    assert.ok(s.split('').every((c) => '123456'.includes(c)));
  }
});

test('evaluate returns 4 hit for correct guess', () => {
  const r = evaluate('1234', '1234');
  assert.equal(r.hit, 4);
  assert.equal(r.blow, 0);
});

test('evaluate returns 0 hit 4 blow for all-anagram', () => {
  const r = evaluate('1234', '2341');
  assert.equal(r.hit, 0);
  assert.equal(r.blow, 4);
});

test('evaluate returns 0 hit 0 blow for no match', () => {
  const r = evaluate('1234', '5678');
  assert.equal(r.hit, 0);
  assert.equal(r.blow, 0);
});

test('evaluate mixed hit and blow', () => {
  const r = evaluate('1234', '1342');
  assert.equal(r.hit, 1); // '1' at pos 0
  assert.equal(r.blow, 3); // '3','4','2' are in secret but wrong pos
});

test('isValidGuess accepts correct input', () => {
  assert.ok(isValidGuess('1234', 'normal'));
});

test('isValidGuess rejects wrong length', () => {
  assert.equal(isValidGuess('123', 'normal'), false);
  assert.equal(isValidGuess('12345', 'normal'), false);
});

test('isValidGuess rejects digits outside pool', () => {
  assert.equal(isValidGuess('789a', 'easy'), false);
});

test('isValidGuess rejects duplicate digits', () => {
  assert.equal(isValidGuess('1123', 'normal'), false);
});

test('isWinResult true when all hit', () => {
  assert.ok(isWinResult({ hit: 4, blow: 0 }, 4));
  assert.ok(isWinResult({ hit: 5, blow: 0 }, 5));
});

test('isWinResult false when not all hit', () => {
  assert.equal(isWinResult({ hit: 3, blow: 1 }, 4), false);
});

test('DIFFICULTIES.oni exists with correct params', () => {
  assert.strictEqual(DIFFICULTIES.oni.digits, 5);
  assert.strictEqual(DIFFICULTIES.oni.maxAttempts, 6);
  assert.strictEqual(DIFFICULTIES.oni.pool, '0123456789');
});
