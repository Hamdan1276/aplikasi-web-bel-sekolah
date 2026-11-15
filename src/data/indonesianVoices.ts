import type { IndonesianVoicePreset } from '../types/bell.ts';

export const DEFAULT_INDONESIAN_VOICE_ID = 'preset:id-nadia';

export const INDONESIAN_VOICE_PRESETS: IndonesianVoicePreset[] = [
  {
    id: 'preset:id-nadia',
    name: 'Ustadzah Nadia',
    roleLabel: 'Resmi & Santun',
    gender: 'Wanita',
    recommendedFor: 'Bel masuk, KBM & pengumuman harian',
    samplePhrase:
      "Assalamu'alaikum warahmatullahi wabarakatuh. Perhatian, bel masuk jam pelajaran telah berbunyi.",
    geminiVoiceName: 'Kore',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a clear, polite, authoritative yet warm female madrasah announcer voice. Measured pace and crisp Indonesian articulation.',
    fallbackPitch: 1.04,
    fallbackRateMultiplier: 0.98,
    serverPitchScale: 1.0,
    serverTempoScale: 1.0,
    serverEqFilter: 'treble=g=2:f=4000',
  },
  {
    id: 'preset:id-ahmad',
    name: 'Ustadz Ahmad',
    roleLabel: 'Berwibawa & Tenang',
    gender: 'Pria',
    recommendedFor: 'Bel masuk pagi, apel & waktu sholat',
    samplePhrase:
      "Assalamu'alaikum. Kepada seluruh siswa MA Al-Huda, waktu sholat berjamaah telah tiba.",
    geminiVoiceName: 'Charon',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a deep, calm, authoritative male madrasah teacher voice. Steady, dignified, and reassuring.',
    fallbackPitch: 0.82,
    fallbackRateMultiplier: 0.95,
    serverPitchScale: 0.78,
    serverTempoScale: 0.96,
    serverEqFilter: 'bass=g=4:f=140',
  },
  {
    id: 'preset:id-amina',
    name: 'Bu Amina',
    roleLabel: 'Hangat & Keibuan',
    gender: 'Wanita',
    recommendedFor: 'Waktu istirahat, makan siang & kepulangan',
    samplePhrase:
      'Waktu istirahat telah dimulai. Silakan beristirahat dengan tertib dan menjaga kebersihan madrasah.',
    geminiVoiceName: 'Zephyr',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a warm, gentle, nurturing female teacher voice. Friendly, smiling, and welcoming tone.',
    fallbackPitch: 1.08,
    fallbackRateMultiplier: 0.94,
    serverPitchScale: 1.04,
    serverTempoScale: 0.95,
    serverEqFilter: 'bass=g=2:f=180,treble=g=-1:f=5000',
  },
  {
    id: 'preset:id-fajar',
    name: 'Pak Fajar',
    roleLabel: 'Tegas & Protokoler',
    gender: 'Pria',
    recommendedFor: 'Upacara bendera, ujian & siaran darurat',
    samplePhrase:
      'Perhatian, seluruh peserta ujian dimohon memeriksa kelengkapan alat tulis sebelum waktu dimulai.',
    geminiVoiceName: 'Fenrir',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a firm, bold, formal male ceremony announcer voice. Strong projection and crisp pauses.',
    fallbackPitch: 0.86,
    fallbackRateMultiplier: 0.98,
    serverPitchScale: 0.83,
    serverTempoScale: 1.01,
    serverEqFilter: 'bass=g=3:f=160,treble=g=3:f=3200',
  },
  {
    id: 'preset:id-fatimah',
    name: 'Ukhti Fatimah',
    roleLabel: 'Teduh & Lembut',
    gender: 'Wanita',
    recommendedFor: "Tadarus Al-Qur'an, doa pagi & Ramadhan",
    samplePhrase:
      'Mari kita awali hari ini dengan membaca basmalah serta tadarus bersama di ruang kelas masing-masing.',
    geminiVoiceName: 'Kore',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a soft, serene, respectful female voice suitable for morning Quran recitation and prayer reminders. Gentle unhurried pacing.',
    fallbackPitch: 0.98,
    fallbackRateMultiplier: 0.89,
    serverPitchScale: 0.97,
    serverTempoScale: 0.91,
    serverEqFilter: 'treble=g=-2:f=4500',
  },
  {
    id: 'preset:id-hasan',
    name: 'Pak Hasan',
    roleLabel: 'Lantang & Komando',
    gender: 'Pria',
    recommendedFor: 'Baris-berbaris, apel Senin & olahraga',
    samplePhrase:
      'Dimohon perhatian, seluruh peserta didik dan dewan guru harap segera menuju lapangan upacara.',
    geminiVoiceName: 'Charon',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a strong, resonant, commanding male announcer voice for flag ceremonies and morning assemblies.',
    fallbackPitch: 0.78,
    fallbackRateMultiplier: 0.97,
    serverPitchScale: 0.75,
    serverTempoScale: 1.0,
    serverEqFilter: 'bass=g=5:f=130,treble=g=2:f=2800',
  },
  {
    id: 'preset:id-kartini',
    name: 'Ibu Kartini',
    roleLabel: 'Penyiar Resmi',
    gender: 'Wanita',
    recommendedFor: 'Pengumuman tata usaha & informasi resmi',
    samplePhrase:
      'Informasi tata usaha, kepada perwakilan setiap kelas dimohon mengambil edaran di ruang piket.',
    geminiVoiceName: 'Zephyr',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia in the style of a polished, articulate female Indonesian news anchor. Formal, balanced, and crisp diction.',
    fallbackPitch: 0.96,
    fallbackRateMultiplier: 1.01,
    serverPitchScale: 0.94,
    serverTempoScale: 1.01,
    serverEqFilter: 'equalizer=f=2400:t=q:w=1.2:g=3',
  },
  {
    id: 'preset:id-farhan',
    name: 'Kak Hamdan',
    roleLabel: 'Muda & Bersemangat',
    gender: 'Pria',
    recommendedFor: 'Kegiatan OSIM, pramuka & ekstrakurikuler',
    samplePhrase:
      'Pengumuman untuk seluruh anggota OSIM dan pramuka, kegiatan ekstrakurikuler sore segera dimulai.',
    geminiVoiceName: 'Puck',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a bright, upbeat, energetic young male announcer voice. Enthusiastic, modern, and clear.',
    fallbackPitch: 0.92,
    fallbackRateMultiplier: 1.05,
    serverPitchScale: 0.87,
    serverTempoScale: 1.06,
    serverEqFilter: 'bass=g=2:f=170,treble=g=2:f=3500',
  },
  {
    id: 'preset:id-siti',
    name: 'Bu Siti',
    roleLabel: 'Jelas & Disiplin',
    gender: 'Wanita',
    recommendedFor: 'Pengawas ujian & pengingat 5 menit',
    samplePhrase:
      'Peringatan waktu, waktu pengerjaan soal ujian tinggal lima menit lagi. Harap periksa jawaban Anda.',
    geminiVoiceName: 'Kore',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a crisp, steady, disciplined female exam proctor voice. Unmistakably clear and structured.',
    fallbackPitch: 0.93,
    fallbackRateMultiplier: 0.96,
    serverPitchScale: 0.92,
    serverTempoScale: 0.97,
    serverEqFilter: 'equalizer=f=2800:t=q:w=1.4:g=3',
  },
  {
    id: 'preset:id-mansyur',
    name: 'Kyai Mansyur',
    roleLabel: 'Khidmat & Mendalam',
    gender: 'Pria',
    recommendedFor: 'Kultum Dzuhur, Jumat berkah & kajian',
    samplePhrase:
      'Waktu sholat Dzuhur telah tiba. Mari kita laksanakan sholat berjamaah di masjid madrasah dengan khusyuk.',
    geminiVoiceName: 'Charon',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a wise, deep, warm elder male ustadz voice. Slow, solemn, and heartfelt.',
    fallbackPitch: 0.74,
    fallbackRateMultiplier: 0.88,
    serverPitchScale: 0.72,
    serverTempoScale: 0.88,
    serverEqFilter: 'bass=g=6:f=110,treble=g=-2:f=4500',
  },
  {
    id: 'preset:id-zahra',
    name: 'Kak Zahra',
    roleLabel: 'Ceria & Informatif',
    gender: 'Wanita',
    recommendedFor: 'Penyambutan pagi, literasi & prestasi siswa',
    samplePhrase:
      'Selamat pagi siswa-siswi MA Al-Huda! Mari ikuti kegiatan literasi pagi dengan penuh semangat.',
    geminiVoiceName: 'Zephyr',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a cheerful, lively, friendly young female announcer voice. Engaging and positive.',
    fallbackPitch: 1.14,
    fallbackRateMultiplier: 1.04,
    serverPitchScale: 1.09,
    serverTempoScale: 1.05,
    serverEqFilter: 'treble=g=3:f=3800',
  },
  {
    id: 'preset:id-rizky',
    name: 'Ustadz Rizky',
    roleLabel: 'Lugas & Tanggap',
    gender: 'Pria',
    recommendedFor: 'Pergantian jam pelajaran & piket harian',
    samplePhrase:
      'Bel pergantian jam pelajaran telah berbunyi. Silakan bersiap untuk mengikuti mata pelajaran berikutnya.',
    geminiVoiceName: 'Fenrir',
    geminiStyle:
      'Speak fluent, natural Bahasa Indonesia with a brisk, direct, articulate male duty-teacher voice. Clear and efficient over classroom noise.',
    fallbackPitch: 0.89,
    fallbackRateMultiplier: 1.03,
    serverPitchScale: 0.85,
    serverTempoScale: 1.04,
    serverEqFilter: 'bass=g=2:f=150,treble=g=3:f=3000',
  },
];

export function isIndonesianPresetURI(voiceURI?: string): boolean {
  return Boolean(voiceURI && voiceURI.startsWith('preset:'));
}

export function getIndonesianVoicePresetById(
  voiceURI?: string
): IndonesianVoicePreset {
  if (voiceURI) {
    const found = INDONESIAN_VOICE_PRESETS.find((v) => v.id === voiceURI);
    if (found) return found;
  }
  return INDONESIAN_VOICE_PRESETS[0];
}

export function resolveIndonesianVoiceLabel(
  voiceURI?: string,
  browserVoices?: { voiceURI: string; name: string }[]
): string {
  if (!voiceURI) {
    return INDONESIAN_VOICE_PRESETS[0].name;
  }
  if (isIndonesianPresetURI(voiceURI)) {
    return getIndonesianVoicePresetById(voiceURI).name;
  }
  const foundBrowser = browserVoices?.find((v) => v.voiceURI === voiceURI);
  return foundBrowser ? foundBrowser.name : 'Suara Perangkat';
}
