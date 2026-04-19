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
  flip:  () => playTone(520, 0.1, 'sine'),
  match: () => { playTone(660, 0.1, 'triangle'); setTimeout(() => playTone(880, 0.15, 'triangle'), 100); },
  miss:  () => playTone(300, 0.2, 'sine', 0.15),
  win:   () => { playTone(880, 0.1, 'triangle'); setTimeout(() => playTone(1100, 0.1, 'triangle'), 100); setTimeout(() => playTone(1320, 0.3, 'triangle'), 200); },
};
