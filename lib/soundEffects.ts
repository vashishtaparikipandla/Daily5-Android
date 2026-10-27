import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Wet glue squish + tactile pop sound when tucking a photo or placing a sticker
 */
export function playStickyGlueSound() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

  if (Platform.OS !== 'web') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.38);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const grain = Math.sin(i * 0.045) * Math.cos(i * 0.013);
      output[i] = (Math.random() * 2 - 1) * 0.65 + grain * 0.35;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(320, now);
    bandpass.frequency.exponentialRampToValueAtTime(980, now + 0.14);
    bandpass.frequency.exponentialRampToValueAtTime(260, now + 0.35);
    bandpass.Q.setValueAtTime(4.5, now);

    const squishGain = ctx.createGain();
    squishGain.gain.setValueAtTime(0.01, now);
    squishGain.gain.linearRampToValueAtTime(0.34, now + 0.05);
    squishGain.gain.exponentialRampToValueAtTime(0.08, now + 0.18);
    squishGain.gain.linearRampToValueAtTime(0.26, now + 0.24);
    squishGain.gain.exponentialRampToValueAtTime(0.001, now + 0.37);

    whiteNoise.connect(bandpass);
    bandpass.connect(squishGain);
    squishGain.connect(ctx.destination);
    whiteNoise.start(now);

    [0.06, 0.13, 0.21, 0.27].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const popGain = ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 190 + idx * 55;
      osc.frequency.setValueAtTime(baseFreq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(75, now + offset + 0.045);

      popGain.gain.setValueAtTime(0.18, now + offset);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.048);

      osc.connect(popGain);
      popGain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.05);
    });
  } catch {
    // Audio autoplay restrictions
  }
}

/**
 * Realistic paper rustle sound when flipping pages or teasing corner curl
 */
export function playPaperRustleSound(pitch = 1.0) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  if (Platform.OS !== 'web') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.16;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800 * pitch, now);
    filter.frequency.exponentialRampToValueAtTime(1600 * pitch, now + dur);
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } catch {
    // Audio autoplay restrictions
  }
}
