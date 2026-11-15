import React, { useEffect, useState } from 'react';
import { Play, Square, X } from 'lucide-react';
import { BUILT_IN_TONES } from '../data/defaultSchedules';
import {
  DEFAULT_INDONESIAN_VOICE_ID,
  INDONESIAN_VOICE_PRESETS,
  getIndonesianVoicePresetById,
  isIndonesianPresetURI,
  resolveIndonesianVoiceLabel,
} from '../data/indonesianVoices';
import {
  ALL_DAYS,
  BellCategory,
  CustomAudioTrack,
  DayOfWeek,
  ScheduleItem,
  SHORT_DAY_LABELS,
} from '../types/bell';

interface ScheduleModalProps {
  isOpen: boolean;
  initialItem: ScheduleItem | null;
  customTracks: CustomAudioTrack[];
  defaultVoiceURI: string;
  defaultDelaySec: number;
  onClose: () => void;
  onSave: (item: Omit<ScheduleItem, 'id'>, existingId?: string) => void;
  onPreviewSound: (params: {
    soundId: string;
    repeat: number;
    ttsEnabled: boolean;
    ttsText: string;
    ttsVoiceURI?: string;
    ttsDelaySec?: number;
  }) => void;
  onPreviewVoice?: (voiceURI: string, sampleText: string) => void;
  isPreviewPlaying: boolean;
  onStopPreview: () => void;
}

const CATEGORIES: BellCategory[] = [
  'Masuk',
  'Pergantian',
  'Istirahat',
  'Pulang',
  'Upacara',
  'Ujian',
];

const DELAY_OPTIONS = [
  { value: 0, label: '0 detik (Langsung)' },
  { value: 0.5, label: '0.5 detik' },
  { value: 1, label: '1 detik (Standar)' },
  { value: 1.5, label: '1.5 detik' },
  { value: 2, label: '2 detik' },
  { value: 2.5, label: '2.5 detik' },
  { value: 3, label: '3 detik' },
  { value: 3.5, label: '3.5 detik' },
  { value: 4, label: '4 detik' },
  { value: 4.5, label: '4.5 detik' },
  { value: 5, label: '5 detik' },
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  initialItem,
  customTracks,
  defaultVoiceURI,
  defaultDelaySec,
  onClose,
  onSave,
  onPreviewSound,
  onPreviewVoice,
  isPreviewPlaying,
  onStopPreview,
}) => {
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<BellCategory>('Masuk');
  const [days, setDays] = useState<DayOfWeek[]>([
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
  ]);
  const [soundId, setSoundId] = useState('chime-masuk');
  const [repeat, setRepeat] = useState(1);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsText, setTtsText] = useState('');
  const [ttsVoiceURI, setTtsVoiceURI] = useState('');
  const [ttsDelaySec, setTtsDelaySec] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      const sorted = [...list].sort((a, b) => {
        const aId = a.lang.toLowerCase().startsWith('id') ? 0 : 1;
        const bId = b.lang.toLowerCase().startsWith('id') ? 0 : 1;
        if (aId !== bId) return aId - bId;
        return a.name.localeCompare(b.name);
      });
      setBrowserVoices(sorted);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (initialItem) {
      setTime(initialItem.time);
      setLabel(initialItem.label);
      setCategory(initialItem.category);
      setDays(initialItem.days);
      setSoundId(initialItem.soundId);
      setRepeat(initialItem.repeat);
      setTtsEnabled(initialItem.ttsEnabled);
      setTtsText(initialItem.ttsText);
      setTtsVoiceURI(initialItem.ttsVoiceURI ?? '');
      setTtsDelaySec(
        typeof initialItem.ttsDelaySec === 'number'
          ? initialItem.ttsDelaySec
          : defaultDelaySec
      );
      setEnabled(initialItem.enabled);
    } else {
      setTime('07:00');
      setLabel('');
      setCategory('Masuk');
      setDays(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
      setSoundId('chime-masuk');
      setRepeat(1);
      setTtsEnabled(true);
      setTtsText('');
      setTtsVoiceURI('');
      setTtsDelaySec(defaultDelaySec);
      setEnabled(true);
    }
    setErrorMsg('');
  }, [isOpen, initialItem, defaultDelaySec]);

  if (!isOpen) return null;

  const activeDefaultVoiceLabel = resolveIndonesianVoiceLabel(
    defaultVoiceURI,
    browserVoices
  );

  const toggleDay = (day: DayOfWeek) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time.match(/^\d{2}:\d{2}$/)) {
      setErrorMsg('Format jam harus JJ:MM.');
      return;
    }
    if (!label.trim()) {
      setErrorMsg('Nama jadwal bel tidak boleh kosong.');
      return;
    }
    if (days.length === 0) {
      setErrorMsg('Pilih minimal satu hari aktif.');
      return;
    }

    onSave(
      {
        time,
        label: label.trim(),
        category,
        days: ALL_DAYS.filter((d) => days.includes(d)),
        soundId,
        repeat,
        ttsEnabled,
        ttsText: ttsText.trim(),
        ttsVoiceURI: ttsVoiceURI || undefined,
        ttsDelaySec,
        enabled,
      },
      initialItem?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#061A13]/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-schedule-title"
    >
      <div className="w-full max-w-xl rounded-xl bg-white border border-[#D4DCD4] shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#07261D] to-[#0F4938] text-[#FAF8F2] border-b border-[#C89B3C]/30">
          <h2 id="modal-schedule-title" className="text-base font-bold">
            {initialItem ? 'Ubah Jadwal Bel' : 'Tambah Jadwal Bel Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B8D4C6] hover:bg-white/15 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="bell-time"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Waktu Bel
              </label>
              <input
                id="bell-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 font-mono text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="bell-label"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Nama Kegiatan / Bel
              </label>
              <input
                id="bell-label"
                type="text"
                required
                placeholder="Contoh: Jam Pelajaran Ke-1"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bell-category"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Kategori
              </label>
              <select
                id="bell-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as BellCategory)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="bell-repeat"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Pengulangan Nada &amp; Suara
              </label>
              <select
                id="bell-repeat"
                value={repeat}
                onChange={(e) => setRepeat(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value={1}>1 Kali Putar</option>
                <option value={2}>2 Kali Putar (Ulang Bel &amp; Suara)</option>
                <option value={3}>3 Kali Putar (Ulang Bel &amp; Suara)</option>
              </select>
              {repeat > 1 && ttsEnabled && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  Bel dan suara pengumuman akan diulang otomatis {repeat} kali.
                </p>
              )}
            </div>
          </div>

          {/* Days Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Hari Aktif
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setDays(['Senin', 'Selasa', 'Rabu', 'Kamis'])
                  }
                  className="text-emerald-700 hover:underline font-medium"
                >
                  Sen–Kam
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() =>
                    setDays(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'])
                  }
                  className="text-emerald-700 hover:underline font-medium"
                >
                  Sen–Jum
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() =>
                    setDays([
                      'Senin',
                      'Selasa',
                      'Rabu',
                      'Kamis',
                      'Jumat',
                      'Sabtu',
                    ])
                  }
                  className="text-emerald-700 hover:underline font-medium"
                >
                  Sen–Sab
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {ALL_DAYS.map((day) => {
                const active = days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`h-10 rounded-lg text-xs font-semibold border transition-colors ${
                      active
                        ? 'bg-[#0B3B2C] text-white border-[#0B3B2C]'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    {SHORT_DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Source */}
          <div>
            <label
              htmlFor="bell-sound"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Suara Bel / Musik
            </label>
            <select
              id="bell-sound"
              value={soundId}
              onChange={(e) => setSoundId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <optgroup label="Nada Bawaan Sistem">
                {BUILT_IN_TONES.map((tone) => (
                  <option key={tone.id} value={tone.id}>
                    {tone.name} ({tone.durationLabel})
                  </option>
                ))}
              </optgroup>
              {customTracks.length > 0 && (
                <optgroup label="Audio Kustom Terunggah">
                  {customTracks.map((track) => (
                    <option key={track.id} value={`custom:${track.id}`}>
                      {track.name} ({track.durationSec} dtk)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* TTS Announcement + Voice + Delay */}
          <div className="pt-3 border-t border-slate-200 space-y-3.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={(e) => setTtsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
              />
              <span className="text-xs font-semibold text-slate-800">
                Tambahkan pengumuman suara otomatis (Bahasa Indonesia) setelah nada bel
              </span>
            </label>

            {ttsEnabled && (
              <div className="space-y-3.5">
                <div>
                  <textarea
                    rows={2}
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="Teks yang akan dibacakan, misal: Jam pelajaran pertama dimulai. Kepada seluruh siswa harap masuk ke ruang kelas."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label
                        htmlFor="bell-tts-voice"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Pilih Suara (Penalaan Suara)
                      </label>
                      {onPreviewVoice && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isPreviewPlaying) {
                              onStopPreview();
                              return;
                            }
                            const resolvedId =
                              ttsVoiceURI ||
                              defaultVoiceURI ||
                              DEFAULT_INDONESIAN_VOICE_ID;
                            const sampleText =
                              ttsText.trim() ||
                              (isIndonesianPresetURI(resolvedId)
                                ? getIndonesianVoicePresetById(resolvedId).samplePhrase
                                : 'Perhatian, ini adalah pengujian suara pengumuman madrasah.');
                            onPreviewVoice(resolvedId, sampleText);
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline whitespace-nowrap"
                        >
                          {isPreviewPlaying ? 'Hentikan' : 'Coba Suara'}
                        </button>
                      )}
                    </div>
                    <select
                      id="bell-tts-voice"
                      value={ttsVoiceURI}
                      onChange={(e) => setTtsVoiceURI(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="">
                        Ikuti Penalaan Suara ({activeDefaultVoiceLabel})
                      </option>
                      <optgroup label="Karakter Suara Indonesia (12 Pilihan)">
                        {INDONESIAN_VOICE_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name} ({preset.gender} · {preset.roleLabel})
                          </option>
                        ))}
                      </optgroup>
                      {browserVoices.length > 0 && (
                        <optgroup label="Suara Perangkat / Browser (Tersedia)">
                          {browserVoices.map((v) => (
                            <option key={v.voiceURI} value={v.voiceURI}>
                              {v.name} ({v.lang})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="bell-tts-delay"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Jeda Bel ke Suara Pengumuman
                    </label>
                    <select
                      id="bell-tts-delay"
                      value={ttsDelaySec}
                      onChange={(e) => setTtsDelaySec(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      {DELAY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div>
              {isPreviewPlaying ? (
                <button
                  type="button"
                  onClick={onStopPreview}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Hentikan Uji</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const previewTtsText =
                      ttsText.trim() ||
                      `Perhatian, bel ${label.trim() || 'kegiatan madrasah'} telah berbunyi.`;
                    onPreviewSound({
                      soundId,
                      repeat,
                      ttsEnabled,
                      ttsText: previewTtsText,
                      ttsVoiceURI: ttsVoiceURI || undefined,
                      ttsDelaySec,
                    });
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Uji Pratinjau</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
