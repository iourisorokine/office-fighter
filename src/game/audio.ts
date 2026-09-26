/**
 * Chiptune sound, generated in code with the Web Audio API (no audio files),
 * in the spirit of a 90s console: square-wave leads, triangle bass, noise
 * drums. Two parts:
 *  - `play(sfx)`: one-shot sound effects (hits, blocks, KO, specials, menus)
 *  - `music(tune)`: a small step sequencer looping one of the tunes below
 * Browsers only start audio after a user gesture, so `unlock()` is called on
 * the first tap / key press. The mute choice is remembered in this browser.
 */

export type Sfx =
  | "select"
  | "confirm"
  | "deny"
  | "pause"
  | "hit"
  | "heavy"
  | "block"
  | "whoosh"
  | "jump"
  | "land"
  | "ko"
  | "special"
  | "shoot"
  | "coin"
  | "alarm"
  | "whistle"
  | "crash"
  | "jackpot"
  | "round"
  | "fight"
  | "timeover"
  | "bossIntro"
  | "win"
  | "lose"
  | "unlock"
  | "squeak";

export type Tune = "menu" | "floor1" | "floor2" | "boss" | null;

// ---------------------------------------------------------------- notes

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** 'A4' -> 440, 'C#5', 'Bb3'... */
export function noteFreq(note: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  if (!m) return 0;
  const semi = NOTE_INDEX[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ---------------------------------------------------------------- tunes
// One token per 16th note. A note starts a sound, '-' holds the previous
// note, '.' is silence. Drums: k = kick, s = snare, h = hi-hat.

interface TuneDef {
  bpm: number;
  lead: string;
  bass: string;
  drums: string;
  leadVol: number;
  bassVol: number;
}

const bar = (root: string, pattern: string) => pattern.replace(/R/g, root);

const TUNES: Record<Exclude<Tune, null>, TuneDef> = {
  // "Elevator Pitch": laid-back office muzak, Cmaj7 - Am7 - Dm7 - G7
  menu: {
    bpm: 112,
    lead: [
      "E5 - - - G5 - B5 - A5 - G5 - E5 - - -",
      "C5 - - - E5 - G5 - E5 - D5 - C5 - - -",
      "D5 - F5 - A5 - - - C6 - A5 - F5 - - -",
      "B4 - D5 - F5 - G5 - - - . . . . . .",
      "E5 - - - G5 - B5 - C6 - B5 - G5 - - -",
      "A5 - - - G5 - E5 - C5 - D5 - E5 - - -",
      "F5 - - - E5 - D5 - C5 - A4 - C5 - - -",
      "D5 - - - B4 - G4 - - - . . . . . .",
    ].join(" "),
    bass: [
      bar("C", "R2 . R3 . G2 . R3 . R2 . R3 . G2 . R3 ."),
      bar("A", "R1 . R2 . E2 . R2 . R1 . R2 . E2 . R2 ."),
      bar("D", "R2 . R3 . A2 . R3 . R2 . R3 . A2 . R3 ."),
      bar("G", "R1 . R2 . D2 . R2 . R1 . R2 . D2 . R2 ."),
    ].join(" "),
    drums: "k . h . s . h . k . h k s . h .",
    leadVol: 0.11,
    bassVol: 0.2,
  },
  // "Open Space Showdown": driving A minor, Am - F - G - E
  floor1: {
    bpm: 140,
    lead: [
      "A4 . C5 . E5 - D5 . C5 . D5 . E5 - - -",
      "F5 - E5 . D5 . C5 - . . A4 . C5 . D5 .",
      "D5 - - . B4 . G4 . D5 . E5 . F5 - E5 .",
      "E5 - - - G#5 - - - B5 - - - A5 . G#5 .",
      "A5 - - . E5 . C5 . A5 . B5 . C6 - B5 .",
      "A5 - - . F5 . C5 . F5 . G5 . A5 - - -",
      "G5 - - . D5 . B4 . G5 . F5 . E5 - D5 .",
      "E5 - - - - - - - B4 - - - E5 - - -",
    ].join(" "),
    bass: ["A", "F", "G", "E"]
      .map((r) => bar(r, "R2 . R3 . R2 . R3 . R2 . R3 . R2 . R3 ."))
      .join(" "),
    drums: "k . h . s . h . k k h . s . h h",
    leadVol: 0.1,
    bassVol: 0.2,
  },
  // "Middle Management Funk": D dorian, Dm7 - G7 - Dm7 - C
  floor2: {
    bpm: 124,
    lead: [
      "D5 . F5 . A5 . G5 . F5 . D5 . . . C5 .",
      "B4 - - . D5 . G5 - F5 . D5 . B4 . . .",
      "D5 . F5 . A5 . C6 - - . A5 . G5 . F5 .",
      "E5 - - - C5 - - - G5 - F5 - E5 - C5 -",
      "A5 - - . G5 . F5 . D5 - - . F5 . G5 .",
      "B5 - - . A5 . G5 . F5 . D5 . B4 . D5 .",
      "D5 . F5 . A5 . D6 - - . C6 . A5 . G5 .",
      "E5 - - - G5 - - - C5 - - - . . . .",
    ].join(" "),
    bass: ["D", "G", "D", "C"]
      .map((r) => bar(r, "R2 . . R3 . . R2 . R2 . R3 . R2 . R3 ."))
      .join(" "),
    drums: "k . h s . h k . k . h s . h k h",
    leadVol: 0.1,
    bassVol: 0.22,
  },
  // "Series A": tense E phrygian, Em - Em - C - B
  boss: {
    bpm: 150,
    lead: [
      "E5 - - - F5 - - - E5 - - - B4 - - -",
      "E5 - G5 - F5 - E5 - D#5 - - - B4 - - -",
      "C5 - - - E5 - G5 - F#5 - - - E5 - - -",
      "D#5 - - - F#5 - - - B5 - - - A5 - G5 -",
      "E6 - - - D6 - - - C6 - - - B5 - - -",
      "C6 - B5 - A5 - G5 - F5 - - - E5 - - -",
      "C5 - E5 - G5 - C6 - B5 - G5 - E5 - C5 -",
      "B4 - D#5 - F#5 - B5 - - - - - . . . .",
    ].join(" "),
    bass: [
      bar("E", "R2 R2 R3 R2 R2 R2 R3 R2 R2 R2 R3 R2 R2 R2 R3 R2"),
      bar("E", "R2 R2 R3 R2 R2 R2 R3 R2 R2 R2 R3 R2 F2 F2 F3 F2"),
      bar("C", "R2 R2 R3 R2 R2 R2 R3 R2 R2 R2 R3 R2 R2 R2 R3 R2"),
      bar("B", "R1 R1 R2 R1 R1 R1 R2 R1 R1 R1 R2 R1 R1 R1 R2 R1"),
    ].join(" "),
    drums: "k . h k s . h . k . h k s . s s",
    leadVol: 0.1,
    bassVol: 0.18,
  },
};

// ---------------------------------------------------------------- engine

const MUTE_KEY = "office-fighter:muted";
const MUSIC_VOL = 0.2;
/** Octaves to shift every melody (lead) note by: -1 = one octave lower, 0 = as written. */
const LEAD_OCTAVE_SHIFT = -1;
const SFX_VOL = 0.7;

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

type Wave = OscillatorType;

class ChipAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = readMuted();
  private tune: Tune = null;
  private seq: {
    def: TuneDef;
    lead: string[];
    bass: string[];
    drums: string[];
    step: number;
    next: number;
  } | null = null;
  private timer: number | null = null;

  /** create / resume the audio context; must run inside a user gesture */
  unlock() {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        // a gentle limiter so a heavy hit on top of a drum beat never clips
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -10;
        limiter.knee.value = 6;
        limiter.ratio.value = 8;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.15;
        this.master.connect(limiter);
        limiter.connect(ctx.destination);
        this.sfxBus = ctx.createGain();
        this.sfxBus.gain.value = SFX_VOL;
        this.sfxBus.connect(this.master);
        this.musicBus = ctx.createGain();
        this.musicBus.gain.value = MUSIC_VOL;
        this.musicBus.connect(this.master);
        const len = ctx.sampleRate;
        this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        if (this.tune) this.startSeq(this.tune);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      // no audio on this device: the game still works silently
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      window.localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      // fine
    }
    if (this.ctx && this.master)
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02);
  }

  /** quieter music (pause menu) */
  duck(on: boolean) {
    if (this.ctx && this.musicBus)
      this.musicBus.gain.setTargetAtTime(
        on ? MUSIC_VOL * 0.3 : MUSIC_VOL,
        this.ctx.currentTime,
        0.05,
      );
  }

  music(tune: Tune) {
    if (tune === this.tune) return;
    this.tune = tune;
    this.stopSeq();
    if (tune && this.ctx) this.startSeq(tune);
  }

  // ----- sequencer (look-ahead scheduling, so timing stays tight) -----

  private startSeq(tune: Exclude<Tune, null>) {
    const ctx = this.ctx;
    if (!ctx) return;
    const def = TUNES[tune];
    this.seq = {
      def,
      lead: def.lead.split(/\s+/),
      bass: def.bass.split(/\s+/),
      drums: def.drums.split(/\s+/),
      step: 0,
      next: ctx.currentTime + 0.08,
    };
    this.timer = window.setInterval(() => this.pump(), 25);
    this.pump();
  }

  private stopSeq() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.seq = null;
  }

  private pump() {
    const ctx = this.ctx;
    const s = this.seq;
    if (!ctx || !s) return;
    const stepDur = 60 / s.def.bpm / 4;
    // after a long stall (tab in background) don't try to catch up
    if (s.next < ctx.currentTime - 0.2) s.next = ctx.currentTime + 0.05;
    while (s.next < ctx.currentTime + 0.12) {
      this.voice(
        s.lead,
        s.step,
        s.next,
        stepDur,
        "square",
        s.def.leadVol,
        LEAD_OCTAVE_SHIFT,
      );
      this.voice(s.bass, s.step, s.next, stepDur, "triangle", s.def.bassVol);
      const d = s.drums[s.step % s.drums.length];
      if (d === "k") this.kick(s.next);
      else if (d === "s")
        this.noise(s.next, 0.09, 0.12, "bandpass", 1800, this.musicBus);
      else if (d === "h")
        this.noise(s.next, 0.03, 0.05, "highpass", 7000, this.musicBus);
      s.step++;
      s.next += stepDur;
    }
  }

  private voice(
    track: string[],
    step: number,
    t: number,
    stepDur: number,
    wave: Wave,
    vol: number,
    octaveShift = 0,
  ) {
    const i = step % track.length;
    const tok = track[i];
    if (tok === "." || tok === "-" || !tok) return;
    let len = 1;
    while (track[(i + len) % track.length] === "-" && len < track.length) len++;
    this.tone(
      noteFreq(tok) * Math.pow(2, octaveShift),
      t,
      len * stepDur * 0.92,
      wave,
      vol,
      this.musicBus,
    );
  }

  private kick(t: number) {
    this.tone(150, t, 0.12, "sine", 0.5, this.musicBus, 40);
  }

  // ----- primitives -----

  private tone(
    freq: number,
    t: number,
    dur: number,
    wave: Wave,
    vol: number,
    bus: GainNode | null,
    slideTo?: number,
  ) {
    const ctx = this.ctx;
    if (!ctx || !bus || !freq) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo)
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, slideTo),
        t + dur,
      );
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + Math.max(0.006, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(
    t: number,
    dur: number,
    vol: number,
    filter: BiquadFilterType,
    freq: number,
    bus: GainNode | null,
    freqTo?: number,
  ) {
    const ctx = this.ctx;
    if (!ctx || !bus || !this.noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  /** a quick run of notes */
  private arp(
    notes: string[],
    t: number,
    each: number,
    wave: Wave,
    vol: number,
    lastHold = 1,
  ) {
    notes.forEach((n, i) => {
      const hold = i === notes.length - 1 ? each * lastHold : each;
      this.tone(noteFreq(n), t + i * each, hold * 0.95, wave, vol, this.sfxBus);
    });
  }

  // ----- sound effects -----

  play(name: Sfx) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t = ctx.currentTime + 0.005;
    const bus = this.sfxBus;
    switch (name) {
      case "select":
        this.tone(1320, t, 0.04, "square", 0.12, bus);
        break;
      case "confirm":
        this.arp(["E5", "B5"], t, 0.06, "square", 0.14, 2);
        break;
      case "deny":
        this.tone(160, t, 0.18, "square", 0.16, bus, 90);
        break;
      case "pause":
        this.arp(["A5", "E5"], t, 0.07, "square", 0.12);
        break;
      case "hit":
        this.noise(t, 0.07, 0.5, "highpass", 1400, bus);
        this.tone(260, t, 0.07, "square", 0.18, bus, 110);
        break;
      case "heavy":
        this.noise(t, 0.16, 0.7, "lowpass", 2400, bus, 300);
        this.tone(140, t, 0.18, "triangle", 0.55, bus, 45);
        break;
      case "block":
        this.noise(t, 0.05, 0.35, "bandpass", 3200, bus);
        this.tone(1100, t, 0.05, "square", 0.1, bus, 900);
        break;
      case "whoosh":
        this.noise(t, 0.09, 0.14, "bandpass", 700, bus, 2600);
        break;
      case "jump":
        this.tone(280, t, 0.1, "square", 0.07, bus, 560);
        break;
      case "land":
        this.noise(t, 0.05, 0.18, "lowpass", 500, bus);
        break;
      case "ko":
        this.noise(t, 0.5, 0.8, "lowpass", 3000, bus, 120);
        this.tone(440, t, 0.7, "square", 0.2, bus, 55);
        this.tone(220, t + 0.05, 0.7, "triangle", 0.4, bus, 40);
        break;
      case "special":
        this.arp(["C5", "E5", "G5", "C6", "E6"], t, 0.035, "square", 0.12);
        break;
      case "shoot":
        this.tone(900, t, 0.14, "square", 0.12, bus, 260);
        break;
      case "coin":
        this.tone(988, t, 0.06, "square", 0.1, bus);
        this.tone(1319, t + 0.06, 0.14, "square", 0.1, bus);
        break;
      case "alarm":
        for (let i = 0; i < 4; i++) {
          this.tone(620, t + i * 0.24, 0.12, "square", 0.13, bus);
          this.tone(820, t + i * 0.24 + 0.12, 0.12, "square", 0.13, bus);
        }
        break;
      case "whistle":
        this.tone(1800, t, 0.6, "sine", 0.14, bus, 400);
        break;
      case "crash":
        this.noise(t, 0.45, 0.9, "lowpass", 1800, bus, 100);
        this.tone(90, t, 0.35, "triangle", 0.6, bus, 35);
        break;
      case "jackpot":
        for (let i = 0; i < 6; i++)
          this.tone(
            i % 2 ? 1319 : 1568,
            t + i * 0.06,
            0.06,
            "square",
            0.09,
            bus,
          );
        break;
      case "round":
        this.arp(["G4", "C5"], t, 0.08, "square", 0.14, 3);
        break;
      case "fight":
        this.noise(t, 0.25, 0.4, "bandpass", 1200, bus);
        this.arp(["C5", "G5", "C6"], t, 0.05, "square", 0.16, 4);
        break;
      case "timeover":
        this.arp(["G5", "E5", "C5", "G4"], t, 0.12, "square", 0.14, 2);
        break;
      case "bossIntro":
        this.tone(noteFreq("E2"), t, 1.6, "sawtooth", 0.16, bus);
        this.tone(noteFreq("F2"), t + 0.05, 1.6, "sawtooth", 0.1, bus);
        this.noise(t, 1.2, 0.25, "lowpass", 400, bus, 80);
        break;
      case "win":
        this.arp(
          ["C5", "E5", "G5", "C6", "G5", "C6"],
          t,
          0.11,
          "square",
          0.15,
          4,
        );
        this.arp(
          ["C3", "G3", "C4", "E4", "G3", "C4"],
          t,
          0.11,
          "triangle",
          0.3,
          4,
        );
        break;
      case "lose":
        this.arp(["G4", "F#4", "F4", "E4"], t, 0.28, "triangle", 0.35, 3);
        this.arp(["C4", "B3", "Bb3", "A3"], t, 0.28, "square", 0.08, 3);
        break;
      case "squeak":
        // rubber duck: a quick rising then falling squeal
        this.tone(900, t, 0.06, "square", 0.1, bus, 1500);
        this.tone(1500, t + 0.06, 0.1, "square", 0.1, bus, 800);
        break;
      case "unlock":
        this.arp(
          ["C5", "G5", "C6", "E6", "G6", "C7"],
          t,
          0.07,
          "square",
          0.12,
          5,
        );
        break;
    }
  }
}

export const audio = new ChipAudio();
