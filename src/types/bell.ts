export type DayOfWeek =
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu'
  | 'Minggu';

export const ALL_DAYS: DayOfWeek[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

export const SHORT_DAY_LABELS: Record<DayOfWeek, string> = {
  Senin: 'Sen',
  Selasa: 'Sel',
  Rabu: 'Rab',
  Kamis: 'Kam',
  Jumat: 'Jum',
  Sabtu: 'Sab',
  Minggu: 'Min',
};

export type BuiltInToneId =
  | 'westminster'
  | 'chime-masuk'
  | 'chime-ganti'
  | 'chime-istirahat'
  | 'chime-pulang'
  | 'alert-ujian'
  | 'madrasah-hijaz'
  | 'sholat-dzuhur'
  | 'upacara-khidmat'
  | 'bandara-empat'
  | 'carillon-pagi'
  | 'lonceng-perunggu'
  | 'peringatan-lima-menit'
  | 'darurat-sirine'
  | 'angklung-pagi'
  | 'gamelan-pelog'
  | 'gambus-bayati'
  | 'marimba-kolintang'
  | 'fanfare-upacara'
  | 'kristal-fajar'
  | 'genta-menara-agung'
  | 'sholawat-nahawand'
  | 'angklung-pulang'
  | 'gamelan-ujian';

export type BellCategory =
  | 'Masuk'
  | 'Pergantian'
  | 'Istirahat'
  | 'Pulang'
  | 'Upacara'
  | 'Ujian';

export interface BuiltInToneInfo {
  id: BuiltInToneId;
  name: string;
  description: string;
  durationLabel: string;
  modelName: string;
}

export interface CustomAudioTrack {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  durationSec: number;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  time: string; // HH:mm
  label: string;
  category: BellCategory;
  days: DayOfWeek[];
  soundId: string; // BuiltInToneId or `custom:<id>`
  repeat: number; // 1, 2, or 3
  ttsEnabled: boolean;
  ttsText: string;
  ttsVoiceURI?: string; // Optional per-schedule voice override
  ttsDelaySec?: number; // Delay in seconds between bell chime and TTS announcement
  enabled: boolean;
}

export interface ScheduleProfile {
  id: string;
  name: string;
  description: string;
  items: ScheduleItem[];
}

export interface BellLogEntry {
  id: string;
  timestamp: string;
  timeStr: string;
  dayName: DayOfWeek;
  label: string;
  profileName: string;
  triggerType: 'Otomatis' | 'Manual';
  soundName: string;
  ttsSpoken: boolean;
}

export type VoiceGender = 'Pria' | 'Wanita';

export interface IndonesianVoicePreset {
  id: string;
  name: string;
  roleLabel: string;
  gender: VoiceGender;
  recommendedFor: string;
  samplePhrase: string;
  geminiVoiceName: 'Kore' | 'Zephyr' | 'Charon' | 'Fenrir' | 'Puck';
  geminiStyle: string;
  fallbackPitch: number;
  fallbackRateMultiplier: number;
  serverPitchScale?: number;
  serverTempoScale?: number;
  serverEqFilter?: string;
}

export interface AppSettings {
  schoolName: string;
  autoBellEnabled: boolean;
  volume: number; // 0 to 1
  ttsRate: number; // 0.7 to 1.3
  ttsPitch: number; // 0.8 to 1.2
  ttsDelaySec: number; // 0 to 5
  ttsVoiceURI: string;
  activeProfileId: string;
}

export type ActiveTab = 'schedule' | 'manual' | 'audio' | 'settings';
