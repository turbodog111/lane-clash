// Tiny synthesized sound set (no audio files). Starts on the first click, as browsers require.
(function (RA) {
  let ac = null, master = null, muted = false;
  function ensure() {
    if (ac) return ac;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
    } catch (e) { ac = null; }
    return ac;
  }
  function tone(freq, dur, { type = 'triangle', gain = 0.25, at = 0, slide = 0 } = {}) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + at;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, { gain = 0.3, at = 0, freq = 400 } = {}) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + at;
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
  }
  // A plucked lyre string: a quick triangle with a fifth above it.
  const pluck = (f, at = 0, gain = 0.22) => { tone(f, 0.9, { type: 'triangle', gain, at }); tone(f * 1.5, 0.6, { type: 'sine', gain: gain * 0.35, at }); };
  // Dorian-ish scale on D.
  const SCALE = [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];

  RA.Audio = {
    unlock() { ensure(); if (ac && ac.state === 'suspended') ac.resume(); },
    setMuted(m) { muted = !!m; },
    get muted() { return muted; },
    hit(tier) {
      const base = SCALE[Math.min(SCALE.length - 1, tier + 1)];
      pluck(base, 0, 0.18 + tier * 0.02);
      if (tier >= 3) pluck(base * 1.26, 0.07, 0.15);
      if (tier >= 4) pluck(base * 1.5, 0.14, 0.15);
      if (tier >= 5) { pluck(base * 2, 0.21, 0.16); tone(base * 3, 1.6, { type: 'sine', gain: 0.06, at: 0.25 }); }
      noise(0.08, { gain: 0.12, freq: 1800 });
    },
    reject() { tone(110, 0.22, { type: 'sawtooth', gain: 0.08, slide: 0.7 }); },
    strike() { noise(0.35, { gain: 0.5, freq: 220 }); tone(70, 0.4, { type: 'sine', gain: 0.4, slide: 0.5 }); },
    blocked() { tone(880, 0.3, { type: 'square', gain: 0.05 }); noise(0.1, { gain: 0.15, freq: 3000 }); },
    partDown() { tone(196, 0.6, { type: 'sine', gain: 0.25, slide: 0.5 }); },
    clear() { [0, 2, 4, 7].forEach((i, k) => pluck(SCALE[i % 8] * (i >= 7 ? 1 : 1), k * 0.09, 0.2)); },
    boon() { pluck(587.33, 0, 0.2); pluck(880, 0.08, 0.15); },
    hint() { tone(1174, 0.5, { type: 'sine', gain: 0.07 }); tone(1568, 0.5, { type: 'sine', gain: 0.05, at: 0.06 }); },
    muta() { tone(330, 0.25, { type: 'triangle', gain: 0.1, slide: 1.5 }); },
    dead() { [7, 5, 3, 0].forEach((i, k) => pluck(SCALE[i] / 2, k * 0.25, 0.2)); },
    revive() { [0, 4, 7].forEach((i, k) => pluck(SCALE[i], k * 0.12, 0.2)); tone(1174, 1.4, { type: 'sine', gain: 0.06, at: 0.36 }); },
    floor() { tone(98, 1.2, { type: 'sine', gain: 0.2 }); noise(0.6, { gain: 0.08, freq: 300 }); },
  };
})(window.RA = window.RA || {});
