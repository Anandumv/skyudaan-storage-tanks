// Procedural soundscape for the film. No audio files: every sound is synthesised
// with WebAudio and driven by the same film clock as the 3D scene.

import { seg } from './film';

type Voice = { gain: GainNode; filter: AudioParam; pitch?: AudioParam };

function noiseBuffer(ctx: AudioContext, seconds = 2, brown = false) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private white!: AudioBuffer;
  private brown!: AudioBuffer;
  private v: Record<string, Voice> = {};
  private lastT = 0;
  private lastFit = -1;
  private landed = false;
  private resolved = false;
  muted = true;

  get started() {
    return !!this.ctx;
  }

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = (this.ctx = new Ctx());
    this.white = noiseBuffer(ctx, 2);
    this.brown = noiseBuffer(ctx, 4, true);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp).connect(ctx.destination);

    // room tone: brown noise, dark and slow
    this.v.room = this.noiseVoice(this.brown, 'lowpass', 180, 0.7);
    // rolling rumble: detuned saws, gain follows rolling speed
    this.v.roll = this.toneVoice([42, 42.7, 84], 'sawtooth', 'lowpass', 160);
    // weld: crackling highpassed noise + 100 Hz mains buzz
    this.v.crackle = this.noiseVoice(this.white, 'highpass', 2400, 1.2);
    this.v.buzz = this.toneVoice([100, 200], 'square', 'lowpass', 600);
    // x-ray: soft drone with a high scanning whine
    this.v.xray = this.toneVoice([60, 180, 1240], 'sine', 'lowpass', 2400);
    // water: lowpassed noise whose filter wobbles like bubbles
    this.v.water = this.noiseVoice(this.white, 'lowpass', 500, 4);
    // pressure: a sine that rises with the gauge
    this.v.press = this.toneVoice([110], 'triangle', 'lowpass', 1200);
    // coat: spray-gun hiss
    this.v.spray = this.noiseVoice(this.white, 'bandpass', 5200, 0.8);
  }

  private noiseVoice(buf: AudioBuffer, type: BiquadFilterType, freq: number, q: number): Voice {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    return { gain, filter: filter.frequency };
  }

  private toneVoice(freqs: number[], type: OscillatorType, ftype: BiquadFilterType, cutoff: number): Voice {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = ftype;
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    filter.connect(gain).connect(this.master);
    const oscs = freqs.map((f) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(filter);
      o.start();
      return o;
    });
    return { gain, filter: filter.frequency, pitch: oscs[0].frequency };
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (!this.ctx) return;
    if (!m && this.ctx.state === 'suspended') this.ctx.resume();
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.25);
  }

  private set(name: string, value: number, tc = 0.08) {
    const v = this.v[name];
    if (v) v.gain.gain.setTargetAtTime(value, this.ctx!.currentTime, tc);
  }

  /** Short inharmonic metal ping (nozzle seating, UI). */
  ping(base = 520, level = 0.18, decay = 0.9) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    g.connect(this.master);
    for (const r of [1, 2.51, 3.87, 5.3]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * r;
      const og = ctx.createGain();
      og.gain.value = 1 / (r * 1.6);
      o.connect(og).connect(g);
      o.start(now);
      o.stop(now + decay);
    }
  }

  /** Heavy landing: pitch-dropping sine + noise burst. */
  thud() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(120, now);
    o.frequency.exponentialRampToValueAtTime(38, now + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    o.connect(g).connect(this.master);
    o.start(now);
    o.stop(now + 1);
    const n = ctx.createBufferSource();
    n.buffer = this.brown;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.5, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    n.connect(ng).connect(this.master);
    n.start(now);
    n.stop(now + 0.4);
  }

  /** Soft major chord when the vessel is complete. */
  chord() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, now = ctx.currentTime;
    [196, 246.94, 293.66, 392].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.07, now + 0.4 + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
      o.connect(g).connect(this.master);
      o.start(now);
      o.stop(now + 4.6);
    });
  }

  tick() {
    this.ping(1800, 0.05, 0.12);
  }

  /** Call every animation frame with the film clock. */
  update(t: number, dt: number) {
    if (!this.ctx || this.muted) {
      this.lastT = t;
      return;
    }
    const speed = Math.min(Math.abs(t - this.lastT) / Math.max(dt, 1e-3), 3);
    this.lastT = t;
    const now = this.ctx.currentTime;

    this.set('room', 0.16);

    // rolling: only while the plate is actually moving
    const rolling = seg(t, 1.05, 1.9) > 0 && seg(t, 1.05, 1.9) < 1;
    this.set('roll', rolling ? Math.min(speed * 0.35, 0.28) : 0, 0.05);

    // weld window with a crackly, gated arc
    const arc = t > 3.05 && t < 3.94;
    this.set('crackle', arc ? 0.1 + Math.random() * 0.22 : 0, 0.01);
    this.set('buzz', arc ? 0.035 : 0);

    const xa = seg(t, 4.02, 4.12) * (1 - seg(t, 4.9, 5.0));
    this.set('xray', xa * 0.06, 0.15);
    this.v.xray.filter.value = 800 + seg(t, 4.08, 4.92) * 2200;

    // nozzles: one ping as each fitting seats
    const fit = Math.floor(seg(t, 5.2, 5.7) * 4 + 1e-6);
    if (fit > this.lastFit && t > 5.2 && t < 5.8) this.ping(420 + fit * 90, 0.16, 1.1);
    this.lastFit = t < 5.2 ? -1 : fit;

    const filling = seg(t, 6.12, 6.7);
    this.set('water', filling > 0 && filling < 1 ? 0.22 : 0, 0.1);
    this.v.water.filter.setValueAtTime(260 + Math.random() * 900, now);
    const press = seg(t, 6.15, 6.6);
    this.set('press', press > 0 && t < 6.95 ? 0.05 : 0, 0.2);
    this.v.press.pitch!.setTargetAtTime(90 + press * 180, now, 0.1);

    const saddles = seg(t, 7.0, 7.35);
    if (saddles >= 1 && !this.landed) this.thud();
    this.landed = saddles >= 1;
    const wipe = seg(t, 7.35, 7.95);
    this.set('spray', wipe > 0 && wipe < 1 ? 0.12 : 0, 0.05);

    const done = t > 8.1;
    if (done && !this.resolved) this.chord();
    this.resolved = done;
  }
}

export const sound = typeof window !== 'undefined' ? new SoundEngine() : (null as unknown as SoundEngine);
