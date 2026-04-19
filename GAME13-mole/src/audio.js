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
  hit:    () => playTone(660, 0.1, 'triangle'),
  dummy:  () => playTone(200, 0.2, 'sawtooth', 0.2),   // penalty for hitting dummy mole
  miss:   () => playTone(330, 0.08, 'sine', 0.1),
  end:    () => { playTone(440, 0.1, 'sine'); setTimeout(() => playTone(330, 0.3, 'sine'), 100); },
};
