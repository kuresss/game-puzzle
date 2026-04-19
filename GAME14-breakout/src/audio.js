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
  paddle: () => playTone(440, 0.06, 'sine'),
  brick:  () => playTone(660, 0.08, 'triangle'),
  wall:   () => playTone(330, 0.05, 'sine', 0.15),
  lose:   () => { playTone(200, 0.15, 'sawtooth'); setTimeout(() => playTone(150, 0.3, 'sawtooth'), 120); },
  win:    () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'triangle'), i * 100)); },
};
