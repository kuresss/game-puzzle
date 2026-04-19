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
  reveal: () => playTone(440, 0.06, 'sine'),
  flag:   () => playTone(600, 0.1, 'triangle'),
  win:    () => { playTone(880, 0.15, 'triangle'); setTimeout(() => playTone(1100, 0.3, 'triangle'), 150); },
  boom:   () => { playTone(120, 0.1, 'sawtooth', 0.3); setTimeout(() => playTone(80, 0.3, 'sawtooth', 0.2), 80); },
};
