/**
 * Interactive In-App Sound & Audio Haptics Engine for Remnoten
 * Synthesizes organic tactile sound effects via Web Audio API with zero external asset dependencies.
 */
import { useState, useEffect, useCallback } from 'react';

let audioCtx = null;

/**
 * Returns or creates the singleton AudioContext.
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    // Ignore audio initialization errors
  }
  return audioCtx;
}

// Auto-unlock Web Audio on first user interaction (browser autoplay policy)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (e) {}
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
}

export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem('remnoten_sound_enabled') !== 'false';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('remnoten_sound_enabled', String(enabled));
    window.dispatchEvent(new CustomEvent('remnoten_audio_change', { detail: { sound: enabled } }));
  } catch {}
}

export function isHapticsEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem('remnoten_haptics_enabled') !== 'false';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('remnoten_haptics_enabled', String(enabled));
    window.dispatchEvent(new CustomEvent('remnoten_audio_change', { detail: { haptics: enabled } }));
  } catch {}
}

/**
 * 1. Check-in Chime: Uplifting two-tone harmonic chime (G5 -> C6).
 */
export function playCheckSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;

    // First note: G5 (784Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, t0);
    gain1.gain.setValueAtTime(0.001, t0);
    gain1.gain.linearRampToValueAtTime(0.18, t0 + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t0);
    osc1.stop(t0 + 0.15);

    // Second note: C6 (1046.5Hz) with rich harmonic shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, t0 + 0.045);
    gain2.gain.setValueAtTime(0.001, t0 + 0.045);
    gain2.gain.linearRampToValueAtTime(0.22, t0 + 0.055);
    gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t0 + 0.045);
    osc2.stop(t0 + 0.30);
  } catch (e) {}
}

/**
 * 2. Uncheck / Undo: Gentle descending pop.
 */
export function playUncheckSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, t0);
    osc.frequency.exponentialRampToValueAtTime(260, t0 + 0.07);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.14, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.08);
  } catch (e) {}
}

/**
 * 3. Tactile Tap / Click: Crisp high-frequency micro acoustic tick.
 */
export function playTapSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, t0);
    osc.frequency.exponentialRampToValueAtTime(450, t0 + 0.022);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.12, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.025);
  } catch (e) {}
}

/**
 * 4. Switch Toggle: Mechanical tactile click.
 */
export function playToggleSound(checked = true) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    if (checked) {
      osc.frequency.setValueAtTime(620, t0);
      osc.frequency.exponentialRampToValueAtTime(980, t0 + 0.035);
    } else {
      osc.frequency.setValueAtTime(850, t0);
      osc.frequency.exponentialRampToValueAtTime(420, t0 + 0.035);
    }

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.14, t0 + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.04);
  } catch (e) {}
}

/**
 * 5. Success Fanfare: Inspiring major arpeggio chime (C5 -> E5 -> G5 -> C6).
 */
export function playSuccessSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const notes = [
      { f: 523.25, time: 0, dur: 0.12 },     // C5
      { f: 659.25, time: 0.055, dur: 0.12 }, // E5
      { f: 783.99, time: 0.11, dur: 0.14 },  // G5
      { f: 1046.5, time: 0.165, dur: 0.28 }, // C6
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, t0 + n.time);

      gain.gain.setValueAtTime(0.001, t0 + n.time);
      gain.gain.linearRampToValueAtTime(0.16, t0 + n.time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + n.time);
      osc.stop(t0 + n.time + n.dur + 0.02);
    });
  } catch (e) {}
}

/**
 * 6. Delete / Pop: Gentle bubble pop.
 */
export function playDeleteSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, t0);
    osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.065);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.075);
  } catch (e) {}
}

/**
 * 7. Error / Warning: Double muffled thud.
 */
export function playErrorSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    [0, 0.08].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(170, t0 + offset);

      gain.gain.setValueAtTime(0.001, t0 + offset);
      gain.gain.linearRampToValueAtTime(0.15, t0 + offset + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + offset + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.06);
    });
  } catch (e) {}
}

/**
 * 8. Tab Switch: Soft acoustic pop.
 */
export function playTabSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t0);
    osc.frequency.exponentialRampToValueAtTime(420, t0 + 0.025);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.10, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.03);
  } catch (e) {}
}

/**
 * 9. Wheel Picker Tick: Ultra-short tactile tick (throttled).
 */
let lastWheelSoundTime = 0;
export function playWheelSound() {
  if (!isSoundEnabled()) return;
  const now = Date.now();
  if (now - lastWheelSoundTime < 45) return; // prevent audio spam on fast flick
  lastWheelSoundTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1350, t0);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.07, t0 + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.012);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.015);
  } catch (e) {}
}

/**
 * React Hook for Sounds & Haptics settings.
 */
export function useAudioHaptics() {
  const [sound, setSound] = useState(() => isSoundEnabled());
  const [haptics, setHaptics] = useState(() => isHapticsEnabled());

  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.sound !== undefined) setSound(e.detail.sound);
      if (e?.detail?.haptics !== undefined) setHaptics(e.detail.haptics);
    };
    window.addEventListener('remnoten_audio_change', handler);
    return () => window.removeEventListener('remnoten_audio_change', handler);
  }, []);

  const updateSound = useCallback((val) => {
    setSound(val);
    setSoundEnabled(val);
    if (val) playCheckSound();
  }, []);

  const updateHaptics = useCallback((val) => {
    setHaptics(val);
    setHapticsEnabled(val);
  }, []);

  return {
    soundEnabled: sound,
    setSoundEnabled: updateSound,
    hapticsEnabled: haptics,
    setHapticsEnabled: updateHaptics,
    playCheck: playCheckSound,
    playUncheck: playUncheckSound,
    playTap: playTapSound,
    playSuccess: playSuccessSound,
    playDelete: playDeleteSound,
    playToggle: playToggleSound,
    playTab: playTabSound,
    playError: playErrorSound,
    playWheel: playWheelSound,
  };
}
