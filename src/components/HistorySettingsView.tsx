import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Download,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  DEFAULT_INDONESIAN_VOICE_ID,
  INDONESIAN_VOICE_PRESETS,
  isIndonesianPresetURI,
} from '../data/indonesianVoices';
import { AppSettings, BellLogEntry, VoiceGender } from '../types/bell';

interface HistorySettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  logs: BellLogEntry[];
  onClearLogs: () => void;
  onTestSpeech: () => void;
  previewVoiceId: string | null;
  onPreviewVoice: (voiceURI: string, sampleText: string) => void;
  onStopPreview: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
  onResetDefaults: () => void;
}

type VoiceFilter = 'Semua' | VoiceGender;

export const HistorySettingsView: React.FC<HistorySettingsViewProps> = ({
  settings,
  onUpdateSettings,
  logs,
  onClearLogs,
  onTestSpeech,
  previewVoiceId,
  onPreviewVoice,
  onStopPreview,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
}) => {
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceFilter, setVoiceFilter] = useState<VoiceFilter>('Semua');
  const [confirmReset, setConfirmReset] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

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

  const effectiveVoiceURI = settings.ttsVoiceURI || DEFAULT_INDONESIAN_VOICE_ID;

  const filteredPresets = useMemo(() => {
    if (voiceFilter === 'Semua') return INDONESIAN_VOICE_PRESETS;
    return INDONESIAN_VOICE_PRESETS.filter((v) => v.gender === voiceFilter);
  }, [voiceFilter]);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onImportBackup(file);
      setImportFeedback({
        type: 'success',
        text: 'Jadwal dan pengaturan berhasil dipulihkan dari berkas cadangan.',
      });
    } catch (err) {
      setImportFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Berkas cadangan tidak valid.',
      });
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Pilihan Suara Pengumuman Bahasa Indonesia */}
      <section className="bg-white border border-[#E2E6DD] rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#EAECE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#13221C]">
              Pilihan Suara Pengumuman Bahasa Indonesia
            </h2>
            <p className="text-xs text-[#5B6B62] mt-0.5">
              Tersedia {INDONESIAN_VOICE_PRESETS.length} karakter suara Bahasa Indonesia untuk berbagai suasana kegiatan madrasah.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter suara Indonesia"
            className="inline-flex items-center gap-1 p-1 bg-[#F3F4EE] rounded-lg self-start sm:self-auto shrink-0"
          >
            {(['Semua', 'Wanita', 'Pria'] as VoiceFilter[]).map((tab) => {
              const count =
                tab === 'Semua'
                  ? INDONESIAN_VOICE_PRESETS.length
                  : INDONESIAN_VOICE_PRESETS.filter((v) => v.gender === tab).length;
              const active = voiceFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setVoiceFilter(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-[#0B3B2C] shadow-xs'
                      : 'text-[#5B6B62] hover:text-[#13221C]'
                  }`}
                >
                  {tab === 'Semua' ? `Semua (${count})` : `${tab} (${count})`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 md:gap-px bg-[#E5E8E0]">
          {filteredPresets.map((preset) => {
            const isSelected = effectiveVoiceURI === preset.id;
            const isPlaying = previewVoiceId === preset.id;
            return (
              <div
                key={preset.id}
                className={`p-4 sm:p-5 flex flex-col justify-between gap-3 transition-colors ${
                  isSelected
                    ? 'bg-[#EFF6F1]'
                    : 'bg-white hover:bg-[#FAFBF8]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#13221C] truncate">
                      {preset.name}
                    </h3>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E5A42] whitespace-nowrap shrink-0">
                        <Check className="h-3.5 w-3.5" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#64736A]">
                    {preset.gender} <span aria-hidden="true">·</span> {preset.roleLabel}
                  </div>
                  <p className="text-xs text-[#4C5D54] leading-relaxed pt-1">
                    {preset.recommendedFor}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#ECEFE8]">
                  <button
                    type="button"
                    onClick={() =>
                      isPlaying
                        ? onStopPreview()
                        : onPreviewVoice(preset.id, preset.samplePhrase)
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                      isPlaying
                        ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                        : 'bg-white border-[#CFD7CE] text-[#2A3B33] hover:bg-[#F7F8F4]'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="h-3 w-3 fill-current" />
                        <span>Hentikan</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" />
                        <span>Coba Suara</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ttsVoiceURI: preset.id })}
                    disabled={isSelected}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#0B3B2C] text-[#E5C167] cursor-default'
                        : 'bg-[#0E4A38] hover:bg-[#082D21] text-[#FAF8F2]'
                    }`}
                  >
                    {isSelected ? 'Sedang Dipakai' : 'Gunakan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School & TTS Voice Settings */}
        <section className="bg-white border border-[#E2E6DD] rounded-xl p-5 sm:p-6 space-y-5">
          <div className="pb-3 border-b border-[#EAECE6]">
            <h2 className="text-base font-bold text-[#13221C]">
              Identitas Madrasah &amp; Penalaan Suara
            </h2>
            <p className="text-xs text-[#5B6B62] mt-0.5">
              Sesuaikan nama instansi, kecepatan pengucapan, atau pilih suara lokal perangkat.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="school-name-input"
                className="block text-xs font-semibold text-[#2A3B33] mb-1.5"
              >
                Nama Madrasah / Instansi
              </label>
              <input
                id="school-name-input"
                type="text"
                value={settings.schoolName}
                onChange={(e) =>
                  onUpdateSettings({ schoolName: e.target.value })
                }
                placeholder="Contoh: MA Al-Huda"
                className="w-full h-10 px-3 rounded-lg border border-[#CFD7CE] text-sm text-[#13221C] focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
              />
            </div>

            <div>
              <label
                htmlFor="tts-voice-select"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Suara Aktif (Karakter Indonesia &amp; Perangkat)
              </label>
              <select
                id="tts-voice-select"
                value={effectiveVoiceURI}
                onChange={(e) =>
                  onUpdateSettings({ ttsVoiceURI: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <optgroup label="Karakter Suara Indonesia (12 Pilihan)">
                  {INDONESIAN_VOICE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.gender} · {preset.roleLabel})
                    </option>
                  ))}
                </optgroup>
                {browserVoices.length > 0 && (
                  <optgroup label="Suara Bawaan Perangkat / Browser (Offline)">
                    {browserVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {!isIndonesianPresetURI(effectiveVoiceURI) && (
                <p className="text-xs text-slate-500 mt-1">
                  Menggunakan suara lokal perangkat untuk pemutaran luring.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Kecepatan Bicara</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {settings.ttsRate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.3}
                  step={0.05}
                  value={settings.ttsRate}
                  onChange={(e) =>
                    onUpdateSettings({ ttsRate: Number(e.target.value) })
                  }
                  className="w-full accent-[#0B3B2C]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Nada Suara Perangkat (Pitch)</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {settings.ttsPitch.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  value={settings.ttsPitch}
                  onChange={(e) =>
                    onUpdateSettings({ ttsPitch: Number(e.target.value) })
                  }
                  className="w-full accent-[#0B3B2C]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Jeda Standar Bel ke Suara Pengumuman</span>
                <span className="font-mono tabular-nums text-emerald-800 font-semibold">
                  {(settings.ttsDelaySec ?? 1).toFixed(1)} detik
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={settings.ttsDelaySec ?? 1}
                onChange={(e) =>
                  onUpdateSettings({ ttsDelaySec: Number(e.target.value) })
                }
                className="w-full accent-[#0B3B2C]"
              />
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={onTestSpeech}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-900 whitespace-nowrap transition-colors"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Uji Bel &amp; Suara Pengumuman</span>
              </button>
            </div>
          </div>
        </section>

        {/* Backup, Restore & Reset */}
        <section className="bg-white border border-[#E2E6DD] rounded-xl p-5 sm:p-6 space-y-5">
          <div className="pb-3 border-b border-[#EAECE6]">
            <h2 className="text-base font-bold text-[#13221C]">
              Cadangan Data &amp; Pemulihan
            </h2>
            <p className="text-xs text-[#5B6B62] mt-0.5">
              Ekspor seluruh profil jadwal bel ke berkas JSON untuk dipindahkan ke komputer tata usaha lainnya.
            </p>
          </div>

          {importFeedback && (
            <div
              className={`rounded-lg px-3.5 py-2.5 text-xs font-medium border ${
                importFeedback.type === 'success'
                  ? 'bg-[#EFF6F1] border-[#B8D7C4] text-[#0B3B2C]'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {importFeedback.text}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onExportBackup}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] text-[#FAF8F2] text-xs font-semibold whitespace-nowrap transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-[#E5C167]" />
                <span>Ekspor Jadwal (.json)</span>
              </button>

              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#CFD7CE] bg-white hover:bg-[#F7F8F4] text-[#2A3B33] text-xs font-semibold whitespace-nowrap transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Impor Jadwal (.json)</span>
              </button>
            </div>

            <div className="pt-4 mt-4 border-t border-[#EAECE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#13221C]">
                  Kembalikan Jadwal Bawaan
                </div>
                <div className="text-xs text-[#5B6B62]">
                  Mengatur ulang profil jadwal ke setelan awal madrasah.
                </div>
              </div>

              {confirmReset ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefaults();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    Ya, Reset Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-2 rounded-lg border border-[#CFD7CE] text-xs font-semibold text-[#5B6B62] whitespace-nowrap"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Bawaan</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Ring History Log */}
      <section className="bg-white border border-[#E2E6DD] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#EAECE6] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#13221C]">
              Riwayat Bel Berbunyi
            </h2>
            <p className="text-xs text-[#5B6B62] mt-0.5">
              Catatan bel otomatis maupun manual yang telah dibunyikan.
            </p>
          </div>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CFD7CE] bg-white hover:bg-[#F7F8F4] text-xs font-semibold text-[#2A3B33] whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bersihkan Riwayat</span>
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="py-12 px-6 text-center text-xs text-[#5B6B62]">
            Belum ada riwayat bel yang berbunyi pada sesi tersimpan ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4E8DF] bg-[#F5F7F2] text-xs font-semibold text-[#3C5247]">
                  <th className="py-2.5 pl-5 pr-3 w-36">Waktu</th>
                  <th className="py-2.5 px-3">Kegiatan</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Profil</th>
                  <th className="py-2.5 px-3 w-28">Pemicu</th>
                  <th className="py-2.5 pl-3 pr-5 hidden md:table-cell">Audio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE8] text-xs">
                {logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#FAFBF8]">
                    <td className="py-2.5 pl-5 pr-3 font-mono tabular-nums text-[#3B4A42] whitespace-nowrap">
                      {entry.dayName}, {entry.timeStr}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#13221C]">
                      {entry.label}
                    </td>
                    <td className="py-2.5 px-3 text-[#5B6B62] hidden sm:table-cell">
                      {entry.profileName}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#0E4A38]">
                      {entry.triggerType}
                    </td>
                    <td className="py-2.5 pl-3 pr-5 text-[#5B6B62] hidden md:table-cell">
                      {entry.soundName}
                      {entry.ttsSpoken ? ' · Pengumuman Suara' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
