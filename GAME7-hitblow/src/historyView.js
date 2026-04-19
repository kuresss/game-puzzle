export function buildHistoryViewModel(history) {
  return history.map((entry, i) => ({
    number: i + 1,
    guess: entry.guess,
    hit: entry.result.hit,
    blow: entry.result.blow,
    label: `${i + 1}回目: ${entry.guess} → ${entry.result.hit}HIT ${entry.result.blow}BLOW`,
  }));
}
