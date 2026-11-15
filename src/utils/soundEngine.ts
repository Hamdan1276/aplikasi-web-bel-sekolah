import { BUILT_IN_TONES } from '../data/defaultSchedules';
import {
  DEFAULT_INDONESIAN_VOICE_ID,
  getIndonesianVoicePresetById,
  isIndonesianPresetURI,
} from '../data/indonesianVoices';
import { BuiltInToneId, CustomAudioTrack } from '../types/bell';
import { getCustomAudioBlob } from './audioDb';

interface NoteSpec {
  freq: number;
  startOffset: number; // seconds from chime start
  duration: number; // seconds
  gain?: number;
}

type TimbreModel =
  | 'bell'
  | 'tubular'
  | 'marimba'
  | 'crystal'
  | 'angklung'
  | 'gamelan'
  | 'gambus'
  | 'brass';

const TONE_MODELS: Record<BuiltInToneId, TimbreModel> = {
  westminster: 'bell',
  'chime-masuk': 'bell',
  'chime-ganti': 'tubular',
  'chime-istirahat': 'marimba',
  'chime-pulang': 'crystal',
  'alert-ujian': 'bell',
  'madrasah-hijaz': 'bell',
  'sholat-dzuhur': 'crystal',
  'upacara-khidmat': 'tubular',
  'bandara-empat': 'crystal',
  'carillon-pagi': 'bell',
  'lonceng-perunggu': 'tubular',
  'peringatan-lima-menit': 'marimba',
  'darurat-sirine': 'bell',
  'angklung-pagi': 'angklung',
  'gamelan-pelog': 'gamelan',
  'gambus-bayati': 'gambus',
  'marimba-kolintang': 'marimba',
  'fanfare-upacara': 'brass',
  'kristal-fajar': 'crystal',
  'genta-menara-agung': 'tubular',
  'sholawat-nahawand': 'gambus',
  'angklung-pulang': 'angklung',
  'gamelan-ujian': 'gamelan',
};

const CHIME_PATTERNS: Record<BuiltInToneId, NoteSpec[]> = {
  westminster: [
    { freq: 659.25, startOffset: 0.0, duration: 0.95, gain: 0.55 },
    { freq: 587.33, startOffset: 0.65, duration: 0.95, gain: 0.55 },
    { freq: 523.25, startOffset: 1.3, duration: 0.95, gain: 0.55 },
    { freq: 392.0, startOffset: 1.95, duration: 1.5, gain: 0.65 },
    { freq: 523.25, startOffset: 3.45, duration: 0.95, gain: 0.55 },
    { freq: 587.33, startOffset: 4.1, duration: 0.95, gain: 0.55 },
    { freq: 659.25, startOffset: 4.75, duration: 0.95, gain: 0.55 },
    { freq: 523.25, startOffset: 5.4, duration: 2.8, gain: 0.7 },
  ],
  'chime-masuk': [
    { freq: 523.25, startOffset: 0.0, duration: 0.8, gain: 0.55 },
    { freq: 659.25, startOffset: 0.45, duration: 0.8, gain: 0.58 },
    { freq: 783.99, startOffset: 0.9, duration: 1.15, gain: 0.62 },
    { freq: 523.25, startOffset: 2.15, duration: 0.8, gain: 0.55 },
    { freq: 659.25, startOffset: 2.6, duration: 0.8, gain: 0.58 },
    { freq: 783.99, startOffset: 3.05, duration: 1.15, gain: 0.62 },
    { freq: 523.25, startOffset: 4.35, duration: 0.8, gain: 0.58 },
    { freq: 659.25, startOffset: 4.8, duration: 0.8, gain: 0.6 },
    { freq: 783.99, startOffset: 5.25, duration: 0.95, gain: 0.64 },
    { freq: 1046.5, startOffset: 5.75, duration: 2.45, gain: 0.72 },
  ],
  'chime-ganti': [
    { freq: 783.99, startOffset: 0.0, duration: 1.1, gain: 0.62 },
    { freq: 622.25, startOffset: 0.6, duration: 1.8, gain: 0.62 },
    { freq: 783.99, startOffset: 2.6, duration: 1.1, gain: 0.62 },
    { freq: 622.25, startOffset: 3.2, duration: 1.8, gain: 0.62 },
    { freq: 783.99, startOffset: 5.2, duration: 1.1, gain: 0.62 },
    { freq: 622.25, startOffset: 5.8, duration: 2.2, gain: 0.65 },
  ],
  'chime-istirahat': [
    { freq: 587.33, startOffset: 0.0, duration: 0.75, gain: 0.58 },
    { freq: 739.99, startOffset: 0.45, duration: 0.75, gain: 0.58 },
    { freq: 880.0, startOffset: 0.9, duration: 0.9, gain: 0.62 },
    { freq: 1174.66, startOffset: 1.35, duration: 1.25, gain: 0.65 },
    { freq: 880.0, startOffset: 2.65, duration: 0.75, gain: 0.58 },
    { freq: 739.99, startOffset: 3.1, duration: 0.75, gain: 0.58 },
    { freq: 880.0, startOffset: 3.55, duration: 1.0, gain: 0.62 },
    { freq: 587.33, startOffset: 4.65, duration: 0.75, gain: 0.58 },
    { freq: 739.99, startOffset: 5.1, duration: 0.75, gain: 0.58 },
    { freq: 880.0, startOffset: 5.55, duration: 0.85, gain: 0.62 },
    { freq: 1174.66, startOffset: 6.05, duration: 2.15, gain: 0.7 },
  ],
  'chime-pulang': [
    { freq: 1046.5, startOffset: 0.0, duration: 0.95, gain: 0.55 },
    { freq: 987.77, startOffset: 0.6, duration: 0.95, gain: 0.55 },
    { freq: 880.0, startOffset: 1.2, duration: 1.0, gain: 0.58 },
    { freq: 783.99, startOffset: 1.8, duration: 1.4, gain: 0.62 },
    { freq: 880.0, startOffset: 3.3, duration: 0.9, gain: 0.56 },
    { freq: 783.99, startOffset: 3.9, duration: 0.9, gain: 0.58 },
    { freq: 659.25, startOffset: 4.5, duration: 1.1, gain: 0.6 },
    { freq: 587.33, startOffset: 5.3, duration: 1.1, gain: 0.6 },
    { freq: 523.25, startOffset: 6.1, duration: 2.9, gain: 0.7 },
  ],
  'alert-ujian': [
    { freq: 880.0, startOffset: 0.0, duration: 0.5, gain: 0.62 },
    { freq: 880.0, startOffset: 0.6, duration: 0.5, gain: 0.62 },
    { freq: 880.0, startOffset: 1.2, duration: 1.2, gain: 0.68 },
    { freq: 659.25, startOffset: 2.5, duration: 1.2, gain: 0.62 },
    { freq: 880.0, startOffset: 3.95, duration: 0.5, gain: 0.64 },
    { freq: 880.0, startOffset: 4.55, duration: 0.5, gain: 0.64 },
    { freq: 880.0, startOffset: 5.15, duration: 1.1, gain: 0.68 },
    { freq: 659.25, startOffset: 6.15, duration: 1.95, gain: 0.68 },
  ],
  'madrasah-hijaz': [
    { freq: 587.33, startOffset: 0.0, duration: 0.95, gain: 0.58 },
    { freq: 622.25, startOffset: 0.6, duration: 0.9, gain: 0.56 },
    { freq: 739.99, startOffset: 1.2, duration: 1.0, gain: 0.6 },
    { freq: 783.99, startOffset: 1.85, duration: 1.35, gain: 0.65 },
    { freq: 880.0, startOffset: 3.25, duration: 0.9, gain: 0.6 },
    { freq: 783.99, startOffset: 3.85, duration: 0.9, gain: 0.58 },
    { freq: 739.99, startOffset: 4.45, duration: 0.95, gain: 0.6 },
    { freq: 622.25, startOffset: 5.1, duration: 1.0, gain: 0.58 },
    { freq: 587.33, startOffset: 5.85, duration: 3.15, gain: 0.72 },
  ],
  'sholat-dzuhur': [
    { freq: 523.25, startOffset: 0.0, duration: 1.2, gain: 0.55 },
    { freq: 587.33, startOffset: 0.85, duration: 1.15, gain: 0.56 },
    { freq: 659.25, startOffset: 1.7, duration: 1.35, gain: 0.6 },
    { freq: 783.99, startOffset: 2.65, duration: 1.6, gain: 0.64 },
    { freq: 659.25, startOffset: 4.3, duration: 1.15, gain: 0.58 },
    { freq: 587.33, startOffset: 5.15, duration: 1.25, gain: 0.58 },
    { freq: 523.25, startOffset: 6.1, duration: 3.1, gain: 0.7 },
  ],
  'upacara-khidmat': [
    { freq: 392.0, startOffset: 0.0, duration: 1.15, gain: 0.6 },
    { freq: 523.25, startOffset: 0.75, duration: 1.15, gain: 0.6 },
    { freq: 659.25, startOffset: 1.5, duration: 1.15, gain: 0.62 },
    { freq: 783.99, startOffset: 2.25, duration: 1.55, gain: 0.66 },
    { freq: 659.25, startOffset: 3.85, duration: 1.0, gain: 0.6 },
    { freq: 783.99, startOffset: 4.55, duration: 1.0, gain: 0.62 },
    { freq: 1046.5, startOffset: 5.25, duration: 1.35, gain: 0.68 },
    { freq: 783.99, startOffset: 6.3, duration: 2.7, gain: 0.7 },
  ],
  'bandara-empat': [
    { freq: 523.25, startOffset: 0.0, duration: 0.8, gain: 0.58 },
    { freq: 587.33, startOffset: 0.5, duration: 0.8, gain: 0.58 },
    { freq: 659.25, startOffset: 1.0, duration: 0.8, gain: 0.6 },
    { freq: 783.99, startOffset: 1.5, duration: 1.45, gain: 0.65 },
    { freq: 523.25, startOffset: 3.25, duration: 0.8, gain: 0.58 },
    { freq: 587.33, startOffset: 3.75, duration: 0.8, gain: 0.58 },
    { freq: 659.25, startOffset: 4.25, duration: 0.8, gain: 0.6 },
    { freq: 783.99, startOffset: 4.75, duration: 1.0, gain: 0.64 },
    { freq: 1046.5, startOffset: 5.4, duration: 2.8, gain: 0.7 },
  ],
  'carillon-pagi': [
    { freq: 659.25, startOffset: 0.0, duration: 0.75, gain: 0.55 },
    { freq: 783.99, startOffset: 0.45, duration: 0.75, gain: 0.55 },
    { freq: 987.77, startOffset: 0.9, duration: 0.8, gain: 0.58 },
    { freq: 1174.66, startOffset: 1.35, duration: 1.25, gain: 0.62 },
    { freq: 1046.5, startOffset: 2.65, duration: 0.85, gain: 0.58 },
    { freq: 987.77, startOffset: 3.25, duration: 0.85, gain: 0.58 },
    { freq: 783.99, startOffset: 3.85, duration: 0.95, gain: 0.6 },
    { freq: 1046.5, startOffset: 4.55, duration: 0.95, gain: 0.62 },
    { freq: 1318.51, startOffset: 5.3, duration: 2.9, gain: 0.7 },
  ],
  'lonceng-perunggu': [
    { freq: 329.63, startOffset: 0.0, duration: 2.5, gain: 0.7 },
    { freq: 329.63, startOffset: 2.1, duration: 2.5, gain: 0.7 },
    { freq: 329.63, startOffset: 4.2, duration: 2.5, gain: 0.72 },
    { freq: 329.63, startOffset: 6.1, duration: 2.9, gain: 0.75 },
  ],
  'peringatan-lima-menit': [
    { freq: 783.99, startOffset: 0.0, duration: 0.7, gain: 0.56 },
    { freq: 659.25, startOffset: 0.5, duration: 0.95, gain: 0.56 },
    { freq: 587.33, startOffset: 1.1, duration: 1.3, gain: 0.6 },
    { freq: 783.99, startOffset: 2.7, duration: 0.7, gain: 0.56 },
    { freq: 659.25, startOffset: 3.2, duration: 0.95, gain: 0.56 },
    { freq: 587.33, startOffset: 3.8, duration: 1.3, gain: 0.6 },
    { freq: 783.99, startOffset: 5.3, duration: 0.7, gain: 0.58 },
    { freq: 523.25, startOffset: 5.9, duration: 2.2, gain: 0.68 },
  ],
  'darurat-sirine': [
    { freq: 987.77, startOffset: 0.0, duration: 0.42, gain: 0.68 },
    { freq: 783.99, startOffset: 0.45, duration: 0.42, gain: 0.65 },
    { freq: 987.77, startOffset: 0.9, duration: 0.42, gain: 0.68 },
    { freq: 783.99, startOffset: 1.35, duration: 0.42, gain: 0.65 },
    { freq: 987.77, startOffset: 1.8, duration: 0.9, gain: 0.72 },
    { freq: 987.77, startOffset: 3.0, duration: 0.42, gain: 0.68 },
    { freq: 783.99, startOffset: 3.45, duration: 0.42, gain: 0.65 },
    { freq: 987.77, startOffset: 3.9, duration: 0.42, gain: 0.68 },
    { freq: 783.99, startOffset: 4.35, duration: 0.42, gain: 0.65 },
    { freq: 987.77, startOffset: 4.8, duration: 0.9, gain: 0.72 },
    { freq: 987.77, startOffset: 5.95, duration: 0.45, gain: 0.68 },
    { freq: 783.99, startOffset: 6.45, duration: 1.75, gain: 0.72 },
  ],
  'angklung-pagi': [
    { freq: 523.25, startOffset: 0.0, duration: 1.15, gain: 0.62 },
    { freq: 587.33, startOffset: 0.9, duration: 1.05, gain: 0.62 },
    { freq: 659.25, startOffset: 1.75, duration: 1.15, gain: 0.64 },
    { freq: 783.99, startOffset: 2.65, duration: 1.5, gain: 0.66 },
    { freq: 880.0, startOffset: 4.1, duration: 1.15, gain: 0.64 },
    { freq: 783.99, startOffset: 5.05, duration: 1.15, gain: 0.62 },
    { freq: 659.25, startOffset: 6.0, duration: 1.15, gain: 0.62 },
    { freq: 783.99, startOffset: 6.95, duration: 1.1, gain: 0.64 },
    { freq: 1046.5, startOffset: 7.85, duration: 2.15, gain: 0.7 },
  ],
  'gamelan-pelog': [
    { freq: 523.25, startOffset: 0.0, duration: 1.6, gain: 0.6 },
    { freq: 554.37, startOffset: 0.9, duration: 1.5, gain: 0.58 },
    { freq: 659.25, startOffset: 1.85, duration: 1.7, gain: 0.62 },
    { freq: 783.99, startOffset: 2.95, duration: 1.9, gain: 0.64 },
    { freq: 830.61, startOffset: 4.25, duration: 1.6, gain: 0.62 },
    { freq: 783.99, startOffset: 5.4, duration: 1.6, gain: 0.6 },
    { freq: 659.25, startOffset: 6.55, duration: 1.7, gain: 0.62 },
    { freq: 523.25, startOffset: 7.65, duration: 2.35, gain: 0.68 },
  ],
  'gambus-bayati': [
    { freq: 587.33, startOffset: 0.0, duration: 0.9, gain: 0.65 },
    { freq: 640.0, startOffset: 0.55, duration: 0.85, gain: 0.62 },
    { freq: 698.46, startOffset: 1.1, duration: 0.95, gain: 0.65 },
    { freq: 783.99, startOffset: 1.75, duration: 1.25, gain: 0.68 },
    { freq: 880.0, startOffset: 2.85, duration: 1.0, gain: 0.65 },
    { freq: 783.99, startOffset: 3.55, duration: 0.95, gain: 0.64 },
    { freq: 698.46, startOffset: 4.25, duration: 0.95, gain: 0.62 },
    { freq: 640.0, startOffset: 4.95, duration: 0.95, gain: 0.62 },
    { freq: 587.33, startOffset: 5.7, duration: 1.35, gain: 0.68 },
    { freq: 523.25, startOffset: 6.8, duration: 0.95, gain: 0.62 },
    { freq: 587.33, startOffset: 7.55, duration: 2.45, gain: 0.72 },
  ],
  'marimba-kolintang': [
    { freq: 523.25, startOffset: 0.0, duration: 0.6, gain: 0.62 },
    { freq: 659.25, startOffset: 0.35, duration: 0.6, gain: 0.62 },
    { freq: 783.99, startOffset: 0.7, duration: 0.6, gain: 0.65 },
    { freq: 659.25, startOffset: 1.05, duration: 0.6, gain: 0.6 },
    { freq: 880.0, startOffset: 1.45, duration: 0.9, gain: 0.68 },
    { freq: 783.99, startOffset: 2.25, duration: 0.6, gain: 0.62 },
    { freq: 659.25, startOffset: 2.6, duration: 0.6, gain: 0.6 },
    { freq: 587.33, startOffset: 2.95, duration: 0.9, gain: 0.64 },
    { freq: 523.25, startOffset: 3.9, duration: 0.6, gain: 0.62 },
    { freq: 659.25, startOffset: 4.25, duration: 0.6, gain: 0.62 },
    { freq: 783.99, startOffset: 4.6, duration: 0.6, gain: 0.65 },
    { freq: 1046.5, startOffset: 5.05, duration: 1.1, gain: 0.7 },
    { freq: 880.0, startOffset: 5.95, duration: 0.7, gain: 0.65 },
    { freq: 783.99, startOffset: 6.45, duration: 0.7, gain: 0.65 },
    { freq: 1046.5, startOffset: 7.0, duration: 2.0, gain: 0.72 },
  ],
  'fanfare-upacara': [
    { freq: 392.0, startOffset: 0.0, duration: 0.65, gain: 0.58 },
    { freq: 523.25, startOffset: 0.55, duration: 0.65, gain: 0.62 },
    { freq: 523.25, startOffset: 1.15, duration: 0.5, gain: 0.62 },
    { freq: 523.25, startOffset: 1.65, duration: 1.35, gain: 0.66 },
    { freq: 587.33, startOffset: 3.1, duration: 0.8, gain: 0.64 },
    { freq: 659.25, startOffset: 3.8, duration: 1.4, gain: 0.68 },
    { freq: 587.33, startOffset: 5.25, duration: 0.65, gain: 0.64 },
    { freq: 659.25, startOffset: 5.85, duration: 0.75, gain: 0.66 },
    { freq: 783.99, startOffset: 6.55, duration: 2.65, gain: 0.72 },
  ],
  'kristal-fajar': [
    { freq: 659.25, startOffset: 0.0, duration: 1.1, gain: 0.54 },
    { freq: 783.99, startOffset: 0.55, duration: 1.1, gain: 0.56 },
    { freq: 987.77, startOffset: 1.1, duration: 1.1, gain: 0.58 },
    { freq: 1318.51, startOffset: 1.65, duration: 1.5, gain: 0.62 },
    { freq: 1174.66, startOffset: 2.95, duration: 1.1, gain: 0.58 },
    { freq: 987.77, startOffset: 3.65, duration: 1.1, gain: 0.58 },
    { freq: 783.99, startOffset: 4.35, duration: 1.3, gain: 0.6 },
    { freq: 880.0, startOffset: 5.45, duration: 1.1, gain: 0.58 },
    { freq: 1046.5, startOffset: 6.15, duration: 1.2, gain: 0.62 },
    { freq: 1318.51, startOffset: 6.95, duration: 3.05, gain: 0.68 },
  ],
  'genta-menara-agung': [
    { freq: 293.66, startOffset: 0.0, duration: 3.1, gain: 0.72 },
    { freq: 293.66, startOffset: 2.4, duration: 3.1, gain: 0.72 },
    { freq: 293.66, startOffset: 4.8, duration: 3.1, gain: 0.74 },
    { freq: 293.66, startOffset: 7.2, duration: 3.8, gain: 0.78 },
  ],
  'sholawat-nahawand': [
    { freq: 523.25, startOffset: 0.0, duration: 0.95, gain: 0.64 },
    { freq: 587.33, startOffset: 0.6, duration: 0.9, gain: 0.62 },
    { freq: 622.25, startOffset: 1.2, duration: 0.95, gain: 0.64 },
    { freq: 698.46, startOffset: 1.85, duration: 1.1, gain: 0.66 },
    { freq: 783.99, startOffset: 2.7, duration: 1.35, gain: 0.68 },
    { freq: 830.61, startOffset: 3.85, duration: 0.95, gain: 0.64 },
    { freq: 783.99, startOffset: 4.55, duration: 0.95, gain: 0.64 },
    { freq: 698.46, startOffset: 5.25, duration: 0.95, gain: 0.62 },
    { freq: 622.25, startOffset: 5.95, duration: 0.95, gain: 0.62 },
    { freq: 587.33, startOffset: 6.65, duration: 1.0, gain: 0.62 },
    { freq: 523.25, startOffset: 7.45, duration: 2.55, gain: 0.72 },
  ],
  'angklung-pulang': [
    { freq: 1046.5, startOffset: 0.0, duration: 1.2, gain: 0.62 },
    { freq: 880.0, startOffset: 0.95, duration: 1.15, gain: 0.62 },
    { freq: 783.99, startOffset: 1.9, duration: 1.25, gain: 0.64 },
    { freq: 659.25, startOffset: 2.95, duration: 1.35, gain: 0.62 },
    { freq: 587.33, startOffset: 4.15, duration: 1.2, gain: 0.6 },
    { freq: 659.25, startOffset: 5.15, duration: 1.15, gain: 0.62 },
    { freq: 783.99, startOffset: 6.1, duration: 1.25, gain: 0.64 },
    { freq: 523.25, startOffset: 7.3, duration: 2.7, gain: 0.7 },
  ],
  'gamelan-ujian': [
    { freq: 587.33, startOffset: 0.0, duration: 2.0, gain: 0.62 },
    { freq: 659.25, startOffset: 1.6, duration: 2.0, gain: 0.62 },
    { freq: 587.33, startOffset: 3.3, duration: 2.0, gain: 0.62 },
    { freq: 440.0, startOffset: 5.0, duration: 2.1, gain: 0.66 },
    { freq: 587.33, startOffset: 6.7, duration: 2.3, gain: 0.68 },
  ],
};

class SchoolBellSoundEngine {
  private ctx: AudioContext | null = null;
  private activePlaybackId = 0;
  private activeAudioEl: HTMLAudioElement | null = null;
  private activeObjectUrl: string | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeTimers: number[] = [];
  private cancelCallbacks: Array<() => void> = [];
  private activeTtsAbort: AbortController | null = null;
  private ttsAudioCache = new Map<string, string>();
  private inflightTtsFetches = new Map<string, Promise<string | null>>();

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  public getAudioState(): 'running' | 'suspended' | 'uninitialized' {
    if (!this.ctx) return 'uninitialized';
    return this.ctx.state === 'running' ? 'running' : 'suspended';
  }

  public async unlockAudio(): Promise<boolean> {
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      return ctx.state === 'running';
    } catch {
      return false;
    }
  }

  public stopAll(): void {
    this.activePlaybackId += 1;

    for (const timerId of this.activeTimers) {
      window.clearTimeout(timerId);
    }
    this.activeTimers = [];

    const callbacks = this.cancelCallbacks;
    this.cancelCallbacks = [];
    for (const cb of callbacks) {
      try {
        cb();
      } catch {
        // Ignore cleanup callback failures
      }
    }

    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    }
    this.activeOscillators = [];

    if (this.activeAudioEl) {
      try {
        this.activeAudioEl.pause();
        this.activeAudioEl.currentTime = 0;
      } catch {
        // Ignore
      }
      this.activeAudioEl = null;
    }

    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }

    if (this.activeTtsAbort) {
      try {
        this.activeTtsAbort.abort();
      } catch {
        // Ignore abort errors
      }
      this.activeTtsAbort = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  public resolveSoundName(
    soundId: string,
    customTracks: CustomAudioTrack[]
  ): string {
    if (soundId.startsWith('custom:')) {
      const id = soundId.slice('custom:'.length);
      const found = customTracks.find((t) => t.id === id);
      return found ? found.name : 'Audio Kustom';
    }
    const builtIn = BUILT_IN_TONES.find((t) => t.id === soundId);
    return builtIn ? builtIn.name : 'Bel Standar';
  }

  private waitMs(ms: number, playbackId: number): Promise<void> {
    if (ms <= 0 || playbackId !== this.activePlaybackId) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const t = window.setTimeout(done, ms);
      this.activeTimers.push(t);
      this.cancelCallbacks.push(done);
    });
  }

  private async playBuiltInChimeOnce(
    toneId: BuiltInToneId,
    volume: number,
    playbackId: number
  ): Promise<void> {
    if (playbackId !== this.activePlaybackId) return;
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const pattern = CHIME_PATTERNS[toneId] ?? CHIME_PATTERNS['chime-masuk'];
    const model: TimbreModel = TONE_MODELS[toneId] ?? 'bell';
    const masterGain = ctx.createGain();
    masterGain.gain.value = Math.max(0.05, Math.min(1, volume));
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime + 0.03;
    let maxEnd = 0;

    for (const note of pattern) {
      const noteStart = now + note.startOffset;
      const dur = note.duration;
      if (note.startOffset + dur > maxEnd) {
        maxEnd = note.startOffset + dur;
      }

      const level = (note.gain ?? 0.6) * 0.44;
      this.triggerModelNote(ctx, masterGain, model, note.freq, noteStart, dur, level);
    }

    // Resolve slightly before the ultra-quiet exponential tail hits zero so the
    // configured bell-to-TTS delay (especially 0s / 0.5s / 1s) feels crisp and exact.
    const waitSeconds = Math.max(0.5, maxEnd - 0.25);
    await this.waitMs(Math.round(waitSeconds * 1000), playbackId);
  }

  private triggerModelNote(
    ctx: AudioContext,
    destination: AudioNode,
    model: TimbreModel,
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number
  ): void {
    switch (model) {
      case 'tubular': {
        this.scheduleBellVoice(ctx, destination, freq, startTime, startTime + duration, peakGain, 'sine');
        this.scheduleBellVoice(ctx, destination, freq * 2.0, startTime, startTime + duration * 0.85, peakGain * 0.4, 'sine');
        this.scheduleBellVoice(ctx, destination, freq * 2.756, startTime, startTime + duration * 0.55, peakGain * 0.22, 'triangle');
        this.scheduleBellVoice(ctx, destination, freq * 4.07, startTime, startTime + duration * 0.35, peakGain * 0.12, 'sine');
        break;
      }
      case 'marimba': {
        this.scheduleBellVoice(ctx, destination, freq, startTime, startTime + duration * 0.75, peakGain * 1.05, 'sine', 0.006);
        this.scheduleBellVoice(ctx, destination, freq * 4.0, startTime, startTime + Math.min(0.18, duration * 0.22), peakGain * 0.32, 'sine', 0.004);
        this.scheduleBellVoice(ctx, destination, freq * 2.0, startTime, startTime + duration * 0.35, peakGain * 0.15, 'triangle', 0.006);
        break;
      }
      case 'crystal': {
        this.scheduleBellVoice(ctx, destination, freq, startTime, startTime + duration, peakGain * 0.9, 'sine', 0.012);
        this.scheduleBellVoice(ctx, destination, freq * 2.0, startTime, startTime + duration * 0.9, peakGain * 0.35, 'sine', 0.015);
        this.scheduleBellVoice(ctx, destination, freq * 3.01, startTime, startTime + duration * 0.65, peakGain * 0.18, 'sine', 0.02);
        this.scheduleBellVoice(ctx, destination, freq * 4.02, startTime, startTime + duration * 0.45, peakGain * 0.1, 'sine', 0.02);
        break;
      }
      case 'angklung': {
        const voiceGain = ctx.createGain();
        voiceGain.gain.setValueAtTime(0.0001, startTime);
        voiceGain.gain.linearRampToValueAtTime(peakGain * 0.85, startTime + 0.04);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        const tremoloGain = ctx.createGain();
        tremoloGain.gain.setValueAtTime(0.72, startTime);

        const lfo = ctx.createOscillator();
        const lfoDepth = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(7.5, startTime);
        lfoDepth.gain.setValueAtTime(0.28, startTime);
        lfo.connect(lfoDepth);
        lfoDepth.connect(tremoloGain.gain);

        const mainOsc = ctx.createOscillator();
        mainOsc.type = 'triangle';
        mainOsc.frequency.setValueAtTime(freq, startTime);

        const octOsc = ctx.createOscillator();
        const octGain = ctx.createGain();
        octOsc.type = 'sine';
        octOsc.frequency.setValueAtTime(freq * 2.0, startTime);
        octGain.gain.setValueAtTime(0.4, startTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3.5, startTime);

        mainOsc.connect(filter);
        octOsc.connect(octGain);
        octGain.connect(filter);
        filter.connect(tremoloGain);
        tremoloGain.connect(voiceGain);
        voiceGain.connect(destination);

        lfo.start(startTime);
        mainOsc.start(startTime);
        octOsc.start(startTime);
        lfo.stop(startTime + duration + 0.03);
        mainOsc.stop(startTime + duration + 0.03);
        octOsc.stop(startTime + duration + 0.03);
        this.activeOscillators.push(lfo, mainOsc, octOsc);
        break;
      }
      case 'gamelan': {
        this.scheduleBellVoice(ctx, destination, freq, startTime, startTime + duration, peakGain * 0.65, 'sine', 0.008);
        this.scheduleBellVoice(ctx, destination, freq * 1.007, startTime, startTime + duration, peakGain * 0.6, 'sine', 0.008);
        this.scheduleBellVoice(ctx, destination, freq * 2.48, startTime, startTime + duration * 0.45, peakGain * 0.22, 'triangle', 0.006);
        break;
      }
      case 'gambus': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, startTime);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 0.5, startTime);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.28, startTime);

        filter.type = 'lowpass';
        filter.Q.setValueAtTime(2.5, startTime);
        filter.frequency.setValueAtTime(Math.min(7000, freq * 6.5), startTime);
        filter.frequency.exponentialRampToValueAtTime(Math.max(300, freq * 1.3), startTime + Math.min(0.8, duration * 0.7));

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(peakGain * 0.95, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc1.connect(filter);
        osc2.connect(osc2Gain);
        osc2Gain.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration + 0.03);
        osc2.stop(startTime + duration + 0.03);
        this.activeOscillators.push(osc1, osc2);
        break;
      }
      case 'brass': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, startTime);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 1.003, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 1.5, startTime);
        filter.frequency.linearRampToValueAtTime(Math.min(5500, freq * 4.2), startTime + 0.08);
        filter.frequency.exponentialRampToValueAtTime(freq * 2.1, startTime + duration);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(peakGain * 0.72, startTime + 0.065);
        gainNode.gain.setValueAtTime(peakGain * 0.62, startTime + duration * 0.72);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration + 0.03);
        osc2.stop(startTime + duration + 0.03);
        this.activeOscillators.push(osc1, osc2);
        break;
      }
      case 'bell':
      default: {
        this.scheduleBellVoice(ctx, destination, freq, startTime, startTime + duration, peakGain, 'sine');
        this.scheduleBellVoice(ctx, destination, freq * 2, startTime, startTime + duration * 0.85, peakGain * 0.25, 'triangle');
        this.scheduleBellVoice(ctx, destination, freq * 3, startTime, startTime + duration * 0.45, peakGain * 0.09, 'sine');
        break;
      }
    }
  }

  private scheduleBellVoice(
    ctx: AudioContext,
    destination: AudioNode,
    freq: number,
    startTime: number,
    endTime: number,
    peakGain: number,
    type: OscillatorType,
    attackSec = 0.015
  ): void {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attackSec);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      Math.max(startTime + attackSec + 0.04, endTime)
    );

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime);
    osc.stop(endTime + 0.03);
    this.activeOscillators.push(osc);
  }

  private async playCustomAudioOnce(
    trackId: string,
    volume: number,
    playbackId: number
  ): Promise<boolean> {
    if (playbackId !== this.activePlaybackId) return false;
    const blob = await getCustomAudioBlob(trackId);
    if (!blob || playbackId !== this.activePlaybackId) {
      return false;
    }

    const url = URL.createObjectURL(blob);
    this.activeObjectUrl = url;
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    this.activeAudioEl = audio;

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (this.activeObjectUrl === url) {
          URL.revokeObjectURL(url);
          this.activeObjectUrl = null;
        }
        if (this.activeAudioEl === audio) {
          this.activeAudioEl = null;
        }
        resolve();
      };
      audio.onended = finish;
      audio.onerror = finish;
      audio.onpause = () => {
        if (playbackId !== this.activePlaybackId) {
          finish();
        }
      };
      this.cancelCallbacks.push(finish);
      audio.play().catch(finish);
    });

    return true;
  }

  private async fetchPresetTtsDataUrl(
    text: string,
    presetId: string
  ): Promise<string | null> {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const cacheKey = `${presetId}::${trimmed}`;
    const cached = this.ttsAudioCache.get(cacheKey);
    if (cached) return cached;

    const existing = this.inflightTtsFetches.get(cacheKey);
    if (existing) return existing;

    const task = (async () => {
      try {
        const controller = new AbortController();
        this.activeTtsAbort = controller;
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, voiceId: presetId }),
          signal: controller.signal,
        });
        if (this.activeTtsAbort === controller) {
          this.activeTtsAbort = null;
        }
        if (!res.ok) return null;

        const payload = (await res.json()) as {
          audioBase64?: string;
          mimeType?: string;
        };
        if (!payload.audioBase64) return null;

        const mime = payload.mimeType || 'audio/wav';
        const dataUrl = `data:${mime};base64,${payload.audioBase64}`;
        if (this.ttsAudioCache.size >= 80) {
          const oldestKey = this.ttsAudioCache.keys().next().value;
          if (oldestKey !== undefined) {
            this.ttsAudioCache.delete(oldestKey);
          }
        }
        this.ttsAudioCache.set(cacheKey, dataUrl);
        return dataUrl;
      } catch {
        return null;
      } finally {
        this.inflightTtsFetches.delete(cacheKey);
      }
    })();

    this.inflightTtsFetches.set(cacheKey, task);
    return task;
  }

  private async playBase64Wav(
    dataUrl: string,
    volume: number,
    rate: number,
    playbackId?: number
  ): Promise<boolean> {
    if (playbackId !== undefined && playbackId !== this.activePlaybackId) {
      return false;
    }
    const audio = new Audio(dataUrl);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.playbackRate = Math.max(0.75, Math.min(1.3, rate));
    this.activeAudioEl = audio;

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (this.activeAudioEl === audio) {
          this.activeAudioEl = null;
        }
        resolve(ok);
      };
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.onpause = () => {
        if (playbackId !== undefined && playbackId !== this.activePlaybackId) {
          finish(true);
        }
      };
      this.cancelCallbacks.push(() => finish(true));
      audio.play().catch(() => finish(false));
    });
  }

  private async getLoadedBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    const initial = window.speechSynthesis.getVoices();
    if (initial.length > 0) return initial;

    return await new Promise<SpeechSynthesisVoice[]>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
        resolve(window.speechSynthesis.getVoices());
      };
      const onVoices = () => finish();
      window.speechSynthesis.addEventListener('voiceschanged', onVoices);
      window.setTimeout(finish, 350);
    });
  }

  public async speakIndonesian(
    text: string,
    options: {
      volume: number;
      rate?: number;
      pitch?: number;
      voiceURI?: string;
    },
    playbackId?: number
  ): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (playbackId !== undefined && playbackId !== this.activePlaybackId) return;

    const requestedVoice = (options.voiceURI ?? '').trim();
    const isPreset = !requestedVoice || isIndonesianPresetURI(requestedVoice);
    const preset = isPreset
      ? getIndonesianVoicePresetById(requestedVoice || DEFAULT_INDONESIAN_VOICE_ID)
      : null;

    if (preset) {
      const dataUrl = await this.fetchPresetTtsDataUrl(trimmed, preset.id);
      if (playbackId !== undefined && playbackId !== this.activePlaybackId) {
        return;
      }

      if (dataUrl) {
        const played = await this.playBase64Wav(
          dataUrl,
          options.volume,
          options.rate ?? 0.98,
          playbackId
        );
        if (played) return;
      }
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (playbackId !== undefined && playbackId !== this.activePlaybackId) return;

    const voices = await this.getLoadedBrowserVoices();
    if (playbackId !== undefined && playbackId !== this.activePlaybackId) return;

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancel failures
      }
      await new Promise<void>((r) => window.setTimeout(r, 60));
      if (playbackId !== undefined && playbackId !== this.activePlaybackId) return;
    }

    await new Promise<void>((resolve) => {
      let safetyTimer = 0;
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        if (safetyTimer) window.clearTimeout(safetyTimer);
        resolve();
      };

      try {
        const utterance = new SpeechSynthesisUtterance(trimmed);
        utterance.volume = Math.max(0, Math.min(1, options.volume));

        const baseRate = options.rate ?? 0.98;
        const basePitch = options.pitch ?? 1.0;

        if (!isPreset && requestedVoice) {
          const preferred = voices.find((v) => v.voiceURI === requestedVoice);
          if (preferred) {
            utterance.voice = preferred;
            utterance.lang = preferred.lang || 'id-ID';
          } else {
            utterance.lang = 'id-ID';
          }
          utterance.rate = baseRate;
          utterance.pitch = basePitch;
        } else {
          utterance.lang = 'id-ID';
          if (preset) {
            utterance.rate = Math.max(
              0.7,
              Math.min(1.35, baseRate * preset.fallbackRateMultiplier)
            );
            utterance.pitch = Math.max(
              0.68,
              Math.min(1.35, basePitch * preset.fallbackPitch)
            );
          } else {
            utterance.rate = baseRate;
            utterance.pitch = basePitch;
          }

          const idVoices = voices.filter((v) =>
            v.lang.toLowerCase().startsWith('id')
          );
          if (idVoices.length > 0) {
            if (preset && idVoices.length > 1) {
              const wantMale = preset.gender === 'Pria';
              const genderMatched = idVoices.find((v) => {
                const n = v.name.toLowerCase();
                return wantMale
                  ? n.includes('ardi') ||
                      n.includes('andika') ||
                      n.includes('male') ||
                      n.includes('pria')
                  : n.includes('gadis') ||
                      n.includes('damayanti') ||
                      n.includes('female') ||
                      n.includes('wanita');
              });
              utterance.voice = genderMatched ?? idVoices[0];
            } else {
              utterance.voice = idVoices[0];
            }
          }
        }

        utterance.onend = done;
        utterance.onerror = done;

        safetyTimer = window.setTimeout(done, 25000);
        this.activeTimers.push(safetyTimer);
        this.cancelCallbacks.push(done);

        window.speechSynthesis.speak(utterance);
      } catch {
        done();
      }
    });
  }

  public async previewIndonesianVoice(params: {
    text: string;
    volume: number;
    rate?: number;
    pitch?: number;
    voiceURI?: string;
    onStateChange?: (playing: boolean) => void;
  }): Promise<void> {
    this.stopAll();
    const myPlaybackId = this.activePlaybackId;
    params.onStateChange?.(true);
    try {
      await this.speakIndonesian(
        params.text,
        {
          volume: params.volume,
          rate: params.rate,
          pitch: params.pitch,
          voiceURI: params.voiceURI,
        },
        myPlaybackId
      );
    } finally {
      if (myPlaybackId === this.activePlaybackId) {
        params.onStateChange?.(false);
      }
    }
  }

  public async playBellSequence(params: {
    soundId: string;
    repeat?: number;
    ttsEnabled?: boolean;
    ttsText?: string;
    ttsDelaySec?: number;
    volume: number;
    ttsRate?: number;
    ttsPitch?: number;
    ttsVoiceURI?: string;
    onStateChange?: (playing: boolean) => void;
  }): Promise<void> {
    this.stopAll();
    const myPlaybackId = this.activePlaybackId;
    params.onStateChange?.(true);

    try {
      const repeatCount = Math.max(0, Math.min(3, params.repeat ?? 1));
      const hasSpeech = Boolean(
        params.ttsEnabled && params.ttsText && params.ttsText.trim().length > 0
      );
      const bellToTtsDelayMs = Math.max(
        0,
        Math.min(10000, Math.round((params.ttsDelaySec ?? 1) * 1000))
      );

      // Warm/pre-fetch preset TTS in parallel while the bell chime plays so the
      // configured delay between bell end and spoken announcement is accurate!
      const requestedVoice = (params.ttsVoiceURI ?? '').trim();
      const isPreset = !requestedVoice || isIndonesianPresetURI(requestedVoice);
      if (hasSpeech && isPreset && repeatCount > 0) {
        const preset = getIndonesianVoicePresetById(
          requestedVoice || DEFAULT_INDONESIAN_VOICE_ID
        );
        void this.fetchPresetTtsDataUrl(params.ttsText!, preset.id);
      }

      if (repeatCount === 0) {
        if (hasSpeech && myPlaybackId === this.activePlaybackId) {
          await this.speakIndonesian(
            params.ttsText!,
            {
              volume: params.volume,
              rate: params.ttsRate,
              pitch: params.ttsPitch,
              voiceURI: params.ttsVoiceURI,
            },
            myPlaybackId
          );
        }
        return;
      }

      for (let i = 0; i < repeatCount; i++) {
        if (myPlaybackId !== this.activePlaybackId) break;

        if (params.soundId.startsWith('custom:')) {
          const customId = params.soundId.slice('custom:'.length);
          const played = await this.playCustomAudioOnce(
            customId,
            params.volume,
            myPlaybackId
          );
          if (!played && myPlaybackId === this.activePlaybackId) {
            await this.playBuiltInChimeOnce(
              'chime-masuk',
              params.volume,
              myPlaybackId
            );
          }
        } else {
          await this.playBuiltInChimeOnce(
            params.soundId as BuiltInToneId,
            params.volume,
            myPlaybackId
          );
        }

        if (hasSpeech && myPlaybackId === this.activePlaybackId) {
          if (bellToTtsDelayMs > 0) {
            await this.waitMs(bellToTtsDelayMs, myPlaybackId);
          }
          if (myPlaybackId !== this.activePlaybackId) break;

          await this.speakIndonesian(
            params.ttsText!,
            {
              volume: params.volume,
              rate: params.ttsRate,
              pitch: params.ttsPitch,
              voiceURI: params.ttsVoiceURI,
            },
            myPlaybackId
          );
        }

        if (i < repeatCount - 1 && myPlaybackId === this.activePlaybackId) {
          await this.waitMs(850, myPlaybackId);
        }
      }
    } finally {
      if (myPlaybackId === this.activePlaybackId) {
        params.onStateChange?.(false);
      }
    }
  }
}

export const soundEngine = new SchoolBellSoundEngine();
