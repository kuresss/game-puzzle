export const THEMES = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉', '🦋', '🐢', '🐬', '🦄'],
  food:    ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🍉', '🍌', '🍍', '🥝', '🍅', '🥑', '🌽', '🍕', '🍔', '🍣', '🍦', '🍩', '🍫', '🧁', '🍰', '🎂', '🍜'],
  nature:  ['🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌿', '🍁', '🍄', '🌵', '🌴', '🌲', '🌈', '⛅', '🌊', '🔥', '⭐', '🌙', '☀️', '❄️', '🌍', '🏔️', '🌋', '🌾'],
};

export const DIFFICULTIES = {
  easy:   { pairs: 8,  cols: 4, label: 'かんたん' },
  normal: { pairs: 12, cols: 4, label: 'ふつう' },
  hard:   { pairs: 18, cols: 6, label: 'むずかしい' },
  oni:    { pairs: 24, cols: 6, label: '🔴 鬼' },
};

// Card: { id, symbol, isFaceUp, isMatched }
export function createCards(pairs = 8, theme = 'animals', random = Math.random) {
  const symbols = THEMES[theme].slice(0, pairs);
  const deck = [...symbols, ...symbols];
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.map((symbol, id) => ({ id, symbol, isFaceUp: false, isMatched: false }));
}

export function flipCard(cards, index) {
  const card = cards[index];
  if (card.isFaceUp || card.isMatched) return cards;
  const next = [...cards];
  next[index] = { ...card, isFaceUp: true };
  return next;
}

export function getFaceUpUnmatched(cards) {
  return cards.reduce((acc, c, i) => (c.isFaceUp && !c.isMatched ? [...acc, i] : acc), []);
}

export function resolveMatch(cards, indexA, indexB) {
  const a = cards[indexA];
  const b = cards[indexB];
  if (a.symbol !== b.symbol) {
    const next = [...cards];
    next[indexA] = { ...a, isFaceUp: false };
    next[indexB] = { ...b, isFaceUp: false };
    return { cards: next, matched: false };
  }
  const next = [...cards];
  next[indexA] = { ...a, isMatched: true };
  next[indexB] = { ...b, isMatched: true };
  return { cards: next, matched: true };
}

export function checkWin(cards) {
  return cards.every((c) => c.isMatched);
}

export function countMatched(cards) {
  return cards.filter((c) => c.isMatched).length / 2;
}
