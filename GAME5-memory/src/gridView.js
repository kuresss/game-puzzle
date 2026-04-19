export function buildGridViewModel({ cards, isLocked }) {
  return cards.map((card, index) => ({
    index,
    card,
    ariaLabel: card.isMatched ? `${card.symbol} マッチ済み` : card.isFaceUp ? `${card.symbol}` : `カード ${index + 1}`,
    isClickable: !card.isFaceUp && !card.isMatched && !isLocked,
  }));
}
