/**
 * Web Audio sound effects synthesizer for WhatsApp notifications and tones.
 * Completely standalone, no external assets needed.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // WhatsApp sent pop sound
  playSent() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // WhatsApp received chime
  playReceived() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [
      { freq: 880, delay: 0 },
      { freq: 1174.66, delay: 0.1 },
      { freq: 1318.51, delay: 0.2 },
    ].forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.delay);

      gain.gain.setValueAtTime(0.2, now + note.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.delay);
      osc.stop(now + note.delay + 0.25);
    });
  }

  // Dial tone for audio calls
  playDialTone(): () => void {
    const ctx = this.getContext();
    if (!ctx) return () => {};

    let isPlaying = true;
    let timeoutId: number;

    const cycle = () => {
      if (!isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(425, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.setValueAtTime(0.12, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);

      timeoutId = window.setTimeout(cycle, 2500);
    };

    cycle();

    return () => {
      isPlaying = false;
      clearTimeout(timeoutId);
    };
  }
}

export const sounds = new SoundEffects();

/**
 * Helper to record audio via browser MediaRecorder.
 */
export async function startAudioRecording(): Promise<{
  stop: () => Promise<{ blob: Blob; url: string; duration: number }>;
  cancel: () => void;
}> {
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  const chunks: BlobPart[] = [];
  const startTime = Date.now();

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.start();

    return {
      stop: () =>
        new Promise((resolve) => {
          if (!mediaRecorder) {
            resolve({ blob: new Blob(), url: '', duration: 0 });
            return;
          }

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const duration = Math.round((Date.now() - startTime) / 1000);
            stream?.getTracks().forEach((track) => track.stop());
            resolve({ blob, url, duration: Math.max(1, duration) });
          };

          mediaRecorder.stop();
        }),
      cancel: () => {
        stream?.getTracks().forEach((track) => track.stop());
      },
    };
  } catch (err) {
    console.warn('Microphone permission denied or not available, using simulated audio note fallback:', err);
    // Return simulated audio fallback
    const simulatedStartTime = Date.now();
    return {
      stop: async () => {
        const duration = Math.max(1, Math.round((Date.now() - simulatedStartTime) / 1000));
        // Generate a subtle tone blob
        const dummyBlob = new Blob(['simulated-voice-note'], { type: 'audio/webm' });
        return {
          blob: dummyBlob,
          url: '',
          duration: Math.min(duration, 30),
        };
      },
      cancel: () => {},
    };
  }
}
