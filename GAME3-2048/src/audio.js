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
  move:  () => playTone(440, 0.08, 'sine'),
  merge: () => playTone(660, 0.15, 'sine'),
  win:   () => { playTone(880, 0.15, 'triangle'); setTimeout(() => playTone(1100, 0.3, 'triangle'), 150); },
  fail:  () => playTone(200, 0.4, 'sawtooth', 0.15),
};
