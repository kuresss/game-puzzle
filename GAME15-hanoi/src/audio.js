function playTone(freq, duration, type = 'sine', vol = 0.25) {
  if (localStorage.getItem('global_mute') === '1') return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

export const sounds = {
  pick:   () => playTone(440, 0.08, 'sine'),
  place:  () => playTone(330, 0.1, 'triangle'),
  win:    () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'triangle'), i * 120)); },
};
