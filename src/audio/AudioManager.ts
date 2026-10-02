import { Config } from '../core/Config';

export class AudioManager {
  private context: AudioContext | null = null;
  enabled = true;
  adMuted = false;
  unlock() {
    if (!this.enabled || this.adMuted || document.hidden) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Audio is optional. */ }
  }
  tone(frequency: number, duration = 0.1, delay = 0) {
    if (!this.enabled || this.adMuted || !this.context || this.context.state !== 'running') return;
    const context = this.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const start = context.currentTime + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(Config.effects.volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  pop() {
    if (!this.enabled || this.adMuted || !this.context || this.context.state !== 'running') return;
    const context = this.context;
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.setValueAtTime(620, start);
    oscillator.frequency.exponentialRampToValueAtTime(140, start + 0.09);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(Config.effects.volume * 1.3, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.12);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  win() { [523.25, 659.25, 783.99, 1046.5].forEach((note, i) => this.tone(note, 0.25, i * 0.12)); }
  pause() { if (this.context) void this.context.suspend().catch(() => {}); }
  dispose() { if (this.context) void this.context.close().catch(() => {}); }
}
