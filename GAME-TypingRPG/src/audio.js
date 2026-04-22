let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.15) {
  if (localStorage.getItem('mute') === '1') return;
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + dur);
  } catch { /* ignore */ }
}

function chord(freqs, dur, type = 'sine', vol = 0.1) {
  freqs.forEach(f => tone(f, dur, type, vol));
}

export const sounds = {
  type:    () => tone(880, 0.04, 'square', 0.06),
  miss:    () => tone(150, 0.12, 'sawtooth', 0.15),
  attack:  () => tone(440, 0.12, 'triangle', 0.18),
  magic:   () => chord([523, 659, 784], 0.4, 'sine', 0.12),
  heal:    () => chord([440, 554, 659], 0.5, 'triangle', 0.12),
  hit:     () => tone(220, 0.15, 'sawtooth', 0.20),
  combo:   () => tone(660, 0.08, 'sine', 0.12),
  levelup: () => chord([262, 330, 392, 523], 0.8, 'triangle', 0.14),
  clear:   () => chord([523, 659, 784, 1047], 1.0, 'sine', 0.14),
  gameover:() => chord([220, 196, 165], 1.2, 'sawtooth', 0.15),
  phase2:  () => chord([110, 147, 196], 0.6, 'sawtooth', 0.18),
};
