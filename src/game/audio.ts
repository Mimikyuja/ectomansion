export type MusicTheme = 'none' | 'title' | 'cinematic' | 'mansion' | 'boss';

const TITLE_BASS = [146.83, 0, 220.0, 0, 130.81, 0, 196.0, 0, 116.54, 0, 174.61, 0, 110.0, 0, 164.81, 0];
const TITLE_LEAD = [587.33, 0, 698.46, 659.25, 523.25, 0, 440.0, 0, 466.16, 0, 587.33, 523.25, 440.0, 0, 0, 0];

const MANSION_BASS = [146.83, 146.83, 220.0, 146.83, 174.61, 146.83, 164.81, 130.81, 116.54, 116.54, 174.61, 116.54, 110.0, 130.81, 138.59, 164.81];
const MANSION_LEAD = [587.33, 0, 659.25, 698.46, 880.0, 0, 698.46, 659.25, 587.33, 0, 523.25, 466.16, 440.0, 554.37, 587.33, 0];

const BOSS_BASS = [146.83, 293.66, 146.83, 293.66, 155.56, 311.13, 155.56, 311.13, 130.81, 261.63, 130.81, 261.63, 110.0, 220.0, 138.59, 277.18];
const BOSS_LEAD = [587.33, 698.46, 880.0, 698.46, 622.25, 783.99, 932.33, 783.99, 523.25, 659.25, 783.99, 659.25, 554.37, 659.25, 880.0, 1108.73];

const CINEMATIC_BASS = [110.0, 0, 0, 110.0, 116.54, 0, 0, 116.54, 98.0, 0, 0, 98.0, 103.83, 0, 138.59, 0];
const CINEMATIC_LEAD = [440.0, 0, 523.25, 0, 466.16, 0, 587.33, 0, 392.0, 0, 466.16, 0, 415.3, 554.37, 659.25, 0];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private vacGain: GainNode | null = null;
  private vacOsc: OscillatorNode | null = null;
  private vacSubOsc: OscillatorNode | null = null;
  private vacFilter: BiquadFilterNode | null = null;
  private isVacRunning = false;

  // Procedural Music Sequencer
  private musicGain: GainNode | null = null;
  private musicTheme: MusicTheme = 'none';
  private musicTimer: number | null = null;
  private musicStep = 0;

  public unlock() {
    this.ensureContext();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (muted && this.vacGain) {
        this.vacGain.gain.setTargetAtTime(0, now, 0.03);
      }
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(muted ? 0 : 0.16, now, 0.05);
      }
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.musicGain && this.ctx) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.muted ? 0 : 0.16;
      this.musicGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setMusicTheme(theme: MusicTheme) {
    if (this.musicTheme === theme && this.musicTimer !== null) return;
    this.musicTheme = theme;
    this.musicStep = 0;

    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    if (theme === 'none') return;

    const stepMs =
      theme === 'boss' ? 145 : theme === 'mansion' ? 185 : theme === 'cinematic' ? 230 : 220;

    this.musicTimer = window.setInterval(() => {
      this.tickMusicStep();
    }, stepMs);
  }

  private tickMusicStep() {
    if (this.muted || this.musicTheme === 'none') return;
    if (!this.ctx || this.ctx.state !== 'running' || !this.musicGain) return;

    const now = this.ctx.currentTime;
    const step = this.musicStep % 16;
    this.musicStep++;

    let bassArr = TITLE_BASS;
    let leadArr = TITLE_LEAD;
    let leadWave: OscillatorType = 'triangle';
    let bassWave: OscillatorType = 'triangle';

    if (this.musicTheme === 'mansion') {
      bassArr = MANSION_BASS;
      leadArr = MANSION_LEAD;
      leadWave = 'sine';
      bassWave = 'triangle';
    } else if (this.musicTheme === 'boss') {
      bassArr = BOSS_BASS;
      leadArr = BOSS_LEAD;
      leadWave = 'sawtooth';
      bassWave = 'sawtooth';
    } else if (this.musicTheme === 'cinematic') {
      bassArr = CINEMATIC_BASS;
      leadArr = CINEMATIC_LEAD;
      leadWave = 'sine';
      bassWave = 'triangle';
    }

    const bassFreq = bassArr[step];
    if (bassFreq > 0) {
      const osc = this.ctx.createOscillator();
      const filt = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = bassWave;
      osc.frequency.setValueAtTime(bassFreq, now);
      filt.type = 'lowpass';
      filt.frequency.value = this.musicTheme === 'boss' ? 580 : 380;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(filt);
      filt.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    const leadFreq = leadArr[step];
    if (leadFreq > 0) {
      const osc = this.ctx.createOscillator();
      const filt = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = leadWave;
      osc.frequency.setValueAtTime(leadFreq, now);
      // Slight spooky vibrato on mansion/title lead
      if (this.musicTheme === 'title' || this.musicTheme === 'mansion') {
        osc.frequency.linearRampToValueAtTime(leadFreq * 1.008, now + 0.12);
      }

      filt.type = 'lowpass';
      filt.frequency.value = this.musicTheme === 'boss' ? 1400 : 1100;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(this.musicTheme === 'boss' ? 0.14 : 0.19, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(filt);
      filt.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.26);
    }

    // Subtle hi-hat / spook tick on off-beats for mansion & boss
    if ((this.musicTheme === 'mansion' || this.musicTheme === 'boss') && step % 2 === 1) {
      const tick = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      tick.type = 'square';
      tick.frequency.setValueAtTime(this.musicTheme === 'boss' ? 1800 : 1200, now);
      tGain.gain.setValueAtTime(0.025, now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
      tick.connect(tGain);
      tGain.connect(this.musicGain);
      tick.start(now);
      tick.stop(now + 0.032);
    }
  }

  public setVacuumActive(active: boolean, pullingGhost: boolean) {
    if (this.muted) active = false;
    if (active && !this.isVacRunning) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      if (!this.vacOsc) {
        this.vacFilter = ctx.createBiquadFilter();
        this.vacFilter.type = 'lowpass';
        this.vacFilter.frequency.value = 340;
        this.vacFilter.Q.value = 2.5;

        this.vacGain = ctx.createGain();
        this.vacGain.gain.value = 0;

        this.vacOsc = ctx.createOscillator();
        this.vacOsc.type = 'sawtooth';
        this.vacOsc.frequency.value = 92;

        this.vacSubOsc = ctx.createOscillator();
        this.vacSubOsc.type = 'triangle';
        this.vacSubOsc.frequency.value = 184;

        this.vacOsc.connect(this.vacFilter);
        this.vacSubOsc.connect(this.vacFilter);
        this.vacFilter.connect(this.vacGain);
        this.vacGain.connect(ctx.destination);

        this.vacOsc.start();
        this.vacSubOsc.start();
      }
      this.isVacRunning = true;
    }

    if (!this.ctx || !this.vacGain || !this.vacOsc || !this.vacSubOsc || !this.vacFilter) return;
    const now = this.ctx.currentTime;
    if (active) {
      const targetVol = pullingGhost ? 0.11 : 0.065;
      const targetFreq = pullingGhost ? 132 : 95;
      const targetCutoff = pullingGhost ? 680 : 380;
      this.vacGain.gain.setTargetAtTime(targetVol, now, 0.05);
      this.vacOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
      this.vacSubOsc.frequency.setTargetAtTime(targetFreq * 2.02, now, 0.08);
      this.vacFilter.frequency.setTargetAtTime(targetCutoff, now, 0.08);
    } else if (this.isVacRunning) {
      this.vacGain.gain.setTargetAtTime(0, now, 0.04);
      this.isVacRunning = false;
    }
  }

  public playMeteorCrash() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const boom = ctx.createOscillator();
    const gain = ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(140, now);
    boom.frequency.exponentialRampToValueAtTime(32, now + 0.75);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
    boom.connect(gain);
    gain.connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.8);

    // Crystal shatter shimmer
    [880, 1174, 1567].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + 0.08 + idx * 0.05);
      g.gain.setValueAtTime(0.1, now + 0.08 + idx * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.05);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + 0.08 + idx * 0.05);
      osc.stop(now + 0.5 + idx * 0.05);
    });
  }

  public playTeleportBeam() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(1280, now + 0.42);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playStrobeFlash() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1150, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.18);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);

    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snap.type = 'triangle';
    snap.frequency.setValueAtTime(1900, now);
    snap.frequency.exponentialRampToValueAtTime(640, now + 0.09);
    snapGain.gain.setValueAtTime(0.1, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    snap.connect(snapGain);
    snapGain.connect(ctx.destination);
    snap.start(now);
    snap.stop(now + 0.11);
  }

  public playPowerSlam() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);

    const chime = ctx.createOscillator();
    const cGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(520, now);
    chime.frequency.exponentialRampToValueAtTime(140, now + 0.22);
    cGain.gain.setValueAtTime(0.14, now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    chime.connect(cGain);
    cGain.connect(ctx.destination);
    chime.start(now);
    chime.stop(now + 0.24);
  }

  public playCapture(isBoss = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isBoss ? [440, 554, 659, 880, 1108] : [523.25, 659.25, 880];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playPickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playPlayerHurt() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.24);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  public playTrapDeploy() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.11);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playDash() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.11);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playRadioBeep() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [660, 880].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.045, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.055);
    });
  }

  public playBossTelegraph() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(165, now + 0.32);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public dispose() {
    this.setMusicTheme('none');
    this.setVacuumActive(false, false);
    if (this.vacOsc) {
      try {
        this.vacOsc.stop();
      } catch {
        // ignore
      }
      this.vacOsc.disconnect();
      this.vacOsc = null;
    }
    if (this.vacSubOsc) {
      try {
        this.vacSubOsc.stop();
      } catch {
        // ignore
      }
      this.vacSubOsc.disconnect();
      this.vacSubOsc = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
