import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Coffee,
  Flag,
  Home,
  Megaphone,
  RefreshCw,
  Square,
  Volume2,
} from 'lucide-react';
import { BUILT_IN_TONES } from '../data/defaultSchedules';
import {
  INDONESIAN_VOICE_PRESETS,
  resolveIndonesianVoiceLabel,
} from '../data/indonesianVoices';
import { CustomAudioTrack } from '../types/bell';

interface ManualBellViewProps {
  customTracks: CustomAudioTrack[];
  activeVoiceURI: string;
  defaultDelaySec: number;
  isRinging: boolean;
  ringingLabel: string | null;
  onTriggerManualBell: (params: {
    id: string;
    label: string;
    soundId: string;
    repeat: number;
    ttsEnabled: boolean;
    ttsText: string;
    voiceURI?: string;
    ttsDelaySec?: number;
  }) => void;
  onStopRinging: () => void;
}

interface QuickBellPreset {
  id: string;
  title: string;
  subtitle: string;
  soundId: string;
  repeat: number;
  ttsEnabled: boolean;
  ttsText: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'default' | 'warning';
}

const QUICK_BELLS: QuickBellPreset[] = [
  {
    id: 'manual-masuk',
    title: 'Bel Masuk Kelas',
    subtitle: 'Nada Masuk · 1x Putar',
    soundId: 'chime-masuk',
    repeat: 1,
    ttsEnabled: true,
    ttsText:
      'Perhatian, bel masuk telah berbunyi. Kepada seluruh siswa harap segera memasuki ruang kelas.',
    icon: Bell,
    tone: 'default',
  },
  {
    id: 'manual-ganti',
    title: 'Pergantian Jam Pelajaran',
    subtitle: 'Ding-Dong · 1x Putar',
    soundId: 'chime-ganti',
    repeat: 1,
    ttsEnabled: false,
    ttsText: '',
    icon: RefreshCw,
    tone: 'default',
  },
  {
    id: 'manual-istirahat',
    title: 'Bel Istirahat',
    subtitle: 'Melodi Istirahat · 1x Putar',
    soundId: 'chime-istirahat',
    repeat: 1,
    ttsEnabled: true,
    ttsText: 'Waktu istirahat dimulai. Silakan beristirahat dengan tertib.',
    icon: Coffee,
    tone: 'default',
  },
  {
    id: 'manual-pulang',
    title: 'Bel Pulang Sekolah',
    subtitle: 'Melodi Penutup · 1x Putar',
    soundId: 'chime-pulang',
    repeat: 1,
    ttsEnabled: true,
    ttsText:
      'Kegiatan belajar mengajar telah selesai. Kepada seluruh siswa dipersilakan pulang dengan tertib.',
    icon: Home,
    tone: 'default',
  },
  {
    id: 'manual-upacara',
    title: 'Panggilan Upacara / Apel',
    subtitle: 'Westminster Chime · 1x Putar',
    soundId: 'westminster',
    repeat: 1,
    ttsEnabled: true,
    ttsText:
      'Perhatian, kepada seluruh peserta didik dan dewan guru dimohon segera berkumpul di lapangan upacara.',
    icon: Flag,
    tone: 'default',
  },
  {
    id: 'manual-darurat',
    title: 'Peringatan / Kumpul Darurat',
    subtitle: 'Nada Peringatan · 2x Putar',
    soundId: 'alert-ujian',
    repeat: 2,
    ttsEnabled: true,
    ttsText:
      'Perhatian seluruh warga sekolah, harap tetap tenang dan ikuti arahan petugas menuju titik kumpul.',
    icon: AlertTriangle,
    tone: 'warning',
  },
];

const ANNOUNCEMENT_TEMPLATES = [
  {
    label: 'Rapat Dewan Guru',
    text: 'Dimohon perhatian, kepada Bapak dan Ibu guru dimohon berkumpul di ruang guru setelah jam pelajaran berakhir untuk mengikuti rapat koordinasi.',
  },
  {
    label: 'Kebersihan Lingkungan',
    text: 'Perhatian kepada seluruh siswa, sepuluh menit ke depan akan dilaksanakan kegiatan kebersihan kelas dan lingkungan sekolah.',
  },
  {
    label: 'Panggilan Piket / OSIS',
    text: 'Dimohon perhatian, kepada pengurus OSIS dan petugas piket hari ini harap segera menuju ruang kesiswaan.',
  },
  {
    label: 'Tamu / Penjemputan',
    text: 'Perhatian, bagi siswa yang dipanggil ke pos satpam atau ruang tata usaha dimohon segera melapor kepada guru piket.',
  },
];

export const ManualBellView: React.FC<ManualBellViewProps> = ({
  customTracks,
  activeVoiceURI,
  defaultDelaySec,
  isRinging,
  ringingLabel,
  onTriggerManualBell,
  onStopRinging,
}) => {
  const [announcementText, setAnnouncementText] = useState(
    'Perhatian kepada seluruh siswa, kegiatan belajar mengajar berjalan sesuai jadwal. Terima kasih.'
  );
  const [playIntroChime, setPlayIntroChime] = useState(true);
  const [introSoundId, setIntroSoundId] = useState('chime-ganti');
  const [broadcastVoiceURI, setBroadcastVoiceURI] = useState('');
  const [broadcastDelaySec, setBroadcastDelaySec] = useState(defaultDelaySec);
  const [withVoiceOnQuick, setWithVoiceOnQuick] = useState(true);
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

  const activeDefaultVoiceLabel = resolveIndonesianVoiceLabel(
    activeVoiceURI,
    browserVoices
  );

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    onTriggerManualBell({
      id: 'manual-broadcast',
      label: 'Siaran Pengumuman Langsung',
      soundId: playIntroChime ? introSoundId : 'chime-ganti',
      repeat: playIntroChime ? 1 : 0,
      ttsEnabled: true,
      ttsText: announcementText.trim(),
      voiceURI: broadcastVoiceURI || undefined,
      ttsDelaySec: broadcastDelaySec,
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Manual Bell Console */}
      <section className="bg-white border border-[#E2E6DD] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAECE6]">
          <div>
            <h2 className="text-base font-bold text-[#13221C]">
              Konsol Bel Manual Sekali Tekan
            </h2>
            <p className="text-xs text-[#5B6B62] mt-0.5">
              Bunyikan nada bel secara langsung di luar jadwal otomatis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#2E3E36] cursor-pointer">
              <input
                type="checkbox"
                checked={withVoiceOnQuick}
                onChange={(e) => setWithVoiceOnQuick(e.target.checked)}
                className="h-4 w-4 rounded border-[#C8D1C7] text-[#0B3B2C] focus:ring-[#0B3B2C]"
              />
              <span>Sertakan suara pengumuman</span>
            </label>

            {isRinging && (
              <button
                type="button"
                onClick={onStopRinging}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold whitespace-nowrap"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Hentikan</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {QUICK_BELLS.map((preset) => {
            const Icon = preset.icon;
            const isThisActive =
              isRinging && ringingLabel === preset.title;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (isThisActive) {
                    onStopRinging();
                  } else {
                    onTriggerManualBell({
                      id: preset.id,
                      label: preset.title,
                      soundId: preset.soundId,
                      repeat: preset.repeat,
                      ttsEnabled: withVoiceOnQuick && preset.ttsEnabled,
                      ttsText: preset.ttsText,
                    });
                  }
                }}
                className={`text-left p-4 rounded-xl border transition-colors flex items-start gap-3.5 ${
                  isThisActive
                    ? 'bg-[#0B3B2C] text-[#FAF8F2] border-[#C89B3C]/60'
                    : preset.tone === 'warning'
                    ? 'bg-red-50/60 hover:bg-red-50 border-red-200 text-[#13221C]'
                    : 'bg-[#FCFBF8] hover:bg-[#F1F6F2] border-[#E2E6DD] text-[#13221C]'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isThisActive
                      ? 'bg-white/15 text-[#E5C167]'
                      : preset.tone === 'warning'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-[#E9F2EC] text-[#0B3B2C]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">
                    {preset.title}
                  </div>
                  <div
                    className={`text-xs mt-0.5 truncate ${
                      isThisActive ? 'text-[#B8D4C6]' : 'text-[#5B6B62]'
                    }`}
                  >
                    {isThisActive ? 'Sedang berbunyi — klik untuk hentikan' : preset.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Announcement Console */}
      <section className="bg-white border border-[#E2E6DD] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="pb-4 border-b border-[#EAECE6]">
          <h2 className="text-base font-bold text-[#13221C] flex items-center gap-2">
            <Megaphone className="h-4.5 w-4.5 text-[#0E4A38]" />
            <span>Siaran Pengumuman Suara Langsung</span>
          </h2>
          <p className="text-xs text-[#5B6B62] mt-0.5">
            Ketik teks pengumuman untuk dibacakan otomatis ke pengeras suara dalam Bahasa Indonesia.
          </p>
        </div>

        {/* Quick Template Selector */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#4C5D54]">
            Templat Pengumuman Cepat
          </div>
          <div className="flex flex-wrap gap-2">
            {ANNOUNCEMENT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => setAnnouncementText(tpl.text)}
                className="px-3 py-1.5 rounded-lg border border-[#DCE2DA] bg-[#F7F8F4] hover:bg-[#ECF3EE] hover:border-[#B6CCBF] text-xs font-medium text-[#2A3B33] transition-colors whitespace-nowrap"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label
              htmlFor="live-announcement-text"
              className="block text-xs font-semibold text-[#2A3B33] mb-1.5"
            >
              Naskah Pengumuman
            </label>
            <textarea
              id="live-announcement-text"
              rows={3}
              required
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Tuliskan pengumuman yang akan dibacakan..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#CFD7CE] text-sm text-[#13221C] focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="broadcast-voice-select"
                  className="text-xs font-semibold text-[#2A3B33] whitespace-nowrap"
                >
                  Pilih Suara:
                </label>
                <select
                  id="broadcast-voice-select"
                  value={broadcastVoiceURI}
                  onChange={(e) => setBroadcastVoiceURI(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#CFD7CE] text-xs text-[#13221C] bg-white max-w-[230px] focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                >
                  <option value="">
                    Ikuti Penalaan Suara ({activeDefaultVoiceLabel})
                  </option>
                  <optgroup label="Karakter Suara Indonesia (12 Pilihan)">
                    {INDONESIAN_VOICE_PRESETS.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} ({voice.gender} · {voice.roleLabel})
                      </option>
                    ))}
                  </optgroup>
                  {browserVoices.length > 0 && (
                    <optgroup label="Suara Perangkat / Browser">
                      {browserVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#2E3E36] cursor-pointer">
                <input
                  type="checkbox"
                  checked={playIntroChime}
                  onChange={(e) => setPlayIntroChime(e.target.checked)}
                  className="h-4 w-4 rounded border-[#C8D1C7] text-[#0B3B2C] focus:ring-[#0B3B2C]"
                />
                <span>Nada pembuka</span>
              </label>

              {playIntroChime && (
                <>
                  <select
                    value={introSoundId}
                    onChange={(e) => setIntroSoundId(e.target.value)}
                    aria-label="Pilih nada pembuka siaran"
                    className="h-9 px-2.5 rounded-lg border border-[#CFD7CE] text-xs text-[#13221C] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                  >
                    {BUILT_IN_TONES.map((tone) => (
                      <option key={tone.id} value={tone.id}>
                        {tone.name} ({tone.durationLabel})
                      </option>
                    ))}
                    {customTracks.map((t) => (
                      <option key={t.id} value={`custom:${t.id}`}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={broadcastDelaySec}
                    onChange={(e) => setBroadcastDelaySec(Number(e.target.value))}
                    aria-label="Jeda bel ke suara pengumuman"
                    className="h-9 px-2.5 rounded-lg border border-[#CFD7CE] text-xs text-[#13221C] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                  >
                    {[0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].map((sec) => (
                      <option key={sec} value={sec}>
                        Jeda {sec} dtk
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {isRinging && (
                <button
                  type="button"
                  onClick={onStopRinging}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold whitespace-nowrap"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Hentikan Siaran</span>
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] text-[#FAF8F2] text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Volume2 className="h-4 w-4 text-[#E5C167]" />
                <span>Siarkan Pengumuman</span>
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};
