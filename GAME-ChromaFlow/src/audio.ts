let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.2) {
  if (localStorage.getItem('global_mute') === '1') return;
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.frequency.value = freq;
    osc.type = type;
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch { /* ignore */ }
}

function playChord(freqs: number[], duration: number) {
  freqs.forEach(f => playTone(f, duration, 'sine', 0.12));
}

export const sounds = {
  splat:    () => playTone(880, 0.08, 'sine', 0.15),
  swirl:    () => playTone(440, 0.15, 'triangle', 0.10),
  nearGoal: () => playTone(660, 0.20, 'sine', 0.20),
  clear:    () => playChord([523, 659, 784], 0.8),
  tick:     () => playTone(200, 0.05, 'square', 0.05),
};
