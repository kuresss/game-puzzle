import test from 'node:test';
import assert from 'node:assert/strict';
import {
  THEMES, DIFFICULTIES, createCards, flipCard,
  getFaceUpUnmatched, resolveMatch, checkWin, countMatched,
} from '../src/gameCore.js';

test('THEMES has animals, food, nature with 24 entries each', () => {
  for (const key of ['animals', 'food', 'nature']) {
    assert.ok(Array.isArray(THEMES[key]), `THEMES.${key} should be array`);
    assert.equal(THEMES[key].length, 24, `THEMES.${key} should have 24 entries`);
  }
});

test('DIFFICULTIES has easy, normal, hard, oni keys', () => {
  for (const key of ['easy', 'normal', 'hard', 'oni']) {
    assert.ok(key in DIFFICULTIES, `DIFFICULTIES should have key: ${key}`);
    assert.ok(typeof DIFFICULTIES[key].pairs === 'number');
    assert.ok(typeof DIFFICULTIES[key].cols === 'number');
    assert.ok(typeof DIFFICULTIES[key].label === 'string');
  }
});

test('DIFFICULTIES pairs values are correct', () => {
  assert.equal(DIFFICULTIES.easy.pairs, 8);
  assert.equal(DIFFICULTIES.normal.pairs, 12);
  assert.equal(DIFFICULTIES.hard.pairs, 18);
  assert.equal(DIFFICULTIES.oni.pairs, 24);
});

test('createCards default returns 16 cards', () => {
  const cards = createCards();
  assert.equal(cards.length, 16);
});

test('createCards contains exactly 2 of each symbol (default)', () => {
  const cards = createCards();
  const symbols = THEMES.animals.slice(0, 8);
  for (const sym of symbols) {
    assert.equal(cards.filter((c) => c.symbol === sym).length, 2);
  }
});

test('createCards(24, food) returns 48 cards with food symbols', () => {
  let call = 0;
  const r = () => { call++; return 0.5; };
  const cards = createCards(24, 'food', r);
  assert.equal(cards.length, 48);
  for (const sym of THEMES.food) {
    assert.equal(cards.filter((c) => c.symbol === sym).length, 2);
  }
});

test('createCards all start face down and unmatched', () => {
  const cards = createCards();
  assert.ok(cards.every((c) => !c.isFaceUp && !c.isMatched));
});

test('createCards shuffles (seeded random produces different order)', () => {
  let call = 0;
  const r1 = createCards(8, 'animals', () => (call++ % 2 === 0 ? 0.1 : 0.9));
  call = 0;
  const r2 = createCards(8, 'animals', () => 0.5);
  assert.ok(r1.some((c, i) => c.symbol !== r2[i].symbol));
});

test('flipCard flips face-down card up', () => {
  const cards = createCards();
  const next = flipCard(cards, 0);
  assert.ok(next[0].isFaceUp);
  assert.ok(!cards[0].isFaceUp); // immutable
});

test('flipCard does not flip already face-up card', () => {
  let cards = createCards();
  cards = flipCard(cards, 0);
  const next = flipCard(cards, 0);
  assert.equal(next, cards); // same reference = no change
});

test('flipCard does not flip matched card', () => {
  const sym = THEMES.animals[0];
  let cards = createCards();
  const idx = cards.findIndex((c) => c.symbol === sym);
  const idx2 = cards.findIndex((c, i) => c.symbol === sym && i !== idx);
  cards = flipCard(cards, idx);
  cards = flipCard(cards, idx2);
  const { cards: matched } = resolveMatch(cards, idx, idx2);
  const result = flipCard(matched, idx);
  assert.equal(result, matched);
});

test('getFaceUpUnmatched returns correct indexes', () => {
  let cards = createCards();
  cards = flipCard(cards, 3);
  assert.deepEqual(getFaceUpUnmatched(cards), [3]);
  cards = flipCard(cards, 5);
  assert.ok(getFaceUpUnmatched(cards).includes(3));
  assert.ok(getFaceUpUnmatched(cards).includes(5));
});

test('resolveMatch marks matched when symbols equal', () => {
  const sym = THEMES.animals[0];
  const cards = createCards();
  const idx = cards.findIndex((c) => c.symbol === sym);
  const idx2 = cards.findIndex((c, i) => c.symbol === sym && i !== idx);
  let flipped = flipCard(flipCard(cards, idx), idx2);
  const { cards: result, matched } = resolveMatch(flipped, idx, idx2);
  assert.ok(matched);
  assert.ok(result[idx].isMatched);
  assert.ok(result[idx2].isMatched);
});

test('resolveMatch flips back when symbols differ', () => {
  const cards = createCards();
  const idx = 0;
  const idx2 = cards.findIndex((c, i) => i !== 0 && c.symbol !== cards[0].symbol);
  let flipped = flipCard(flipCard(cards, idx), idx2);
  const { cards: result, matched } = resolveMatch(flipped, idx, idx2);
  assert.equal(matched, false);
  assert.ok(!result[idx].isFaceUp);
  assert.ok(!result[idx2].isFaceUp);
});

test('checkWin returns false on new game', () => {
  assert.equal(checkWin(createCards()), false);
});

test('checkWin returns true when all matched', () => {
  const cards = createCards().map((c) => ({ ...c, isMatched: true }));
  assert.ok(checkWin(cards));
});

test('countMatched returns correct pair count', () => {
  const sym = THEMES.animals[0];
  const cards = createCards();
  const idx = cards.findIndex((c) => c.symbol === sym);
  const idx2 = cards.findIndex((c, i) => c.symbol === sym && i !== idx);
  let flipped = flipCard(flipCard(cards, idx), idx2);
  const { cards: result } = resolveMatch(flipped, idx, idx2);
  assert.equal(countMatched(result), 1);
});
