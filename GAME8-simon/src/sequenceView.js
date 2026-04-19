export function buildSequenceViewModel(sequence, currentRound) {
  return {
    round: currentRound,
    length: sequence.length,
    progress: `ラウンド ${currentRound}（${sequence.length}ステップ）`,
  };
}
