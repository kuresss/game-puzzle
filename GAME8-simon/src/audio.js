function playTone(freq, duration, type = 'sine', vol = 0.3) {
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

// Classic Simon tones: E4=330, C#4=277, A3=220, E3=165
export const sounds = {
  button: (index) => {
    const freqs = [330, 277, 220, 165]; // green, red, yellow, blue
    playTone(freqs[index % freqs.length], 0.3, 'sine');
  },
  win:    () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'triangle'), i * 150)); },
  fail:   () => playTone(200, 0.5, 'sawtooth', 0.2),
};
