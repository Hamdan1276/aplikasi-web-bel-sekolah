import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Edit2,
  FolderPlus,
  Play,
  Plus,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import {
  ALL_DAYS,
  BellCategory,
  CustomAudioTrack,
  DayOfWeek,
  ScheduleItem,
  ScheduleProfile,
  SHORT_DAY_LABELS,
} from '../types/bell';
import { resolveIndonesianVoiceLabel } from '../data/indonesianVoices';
import { soundEngine } from '../utils/soundEngine';
import { formatDaysSummary } from '../utils/timeUtils';

const CATEGORY_TEXT_COLORS: Record<BellCategory, string> = {
  Masuk: 'text-[#0E5A42] font-semibold',
  Pergantian: 'text-[#1F6A52] font-semibold',
  Istirahat: 'text-[#9C701C] font-semibold',
  Pulang: 'text-[#315545] font-semibold',
  Upacara: 'text-[#0B3B2C] font-semibold',
  Ujian: 'text-[#9E3232] font-semibold',
};

interface ScheduleViewProps {
  todayName: DayOfWeek;
  profiles: ScheduleProfile[];
  activeProfile: ScheduleProfile;
  customTracks: CustomAudioTrack[];
  currentlyPlayingItemId: string | null;
  nextBellItemId?: string | null;
  onSelectProfile: (id: string) => void;
  onCreateProfile: (name: string) => void;
  onDuplicateProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: ScheduleItem) => void;
  onToggleItemEnabled: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onPlayItem: (item: ScheduleItem) => void;
  onStopPlaying: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  todayName,
  profiles,
  activeProfile,
  customTracks,
  currentlyPlayingItemId,
  nextBellItemId,
  onSelectProfile,
  onCreateProfile,
  onDuplicateProfile,
  onDeleteProfile,
  onOpenAddModal,
  onOpenEditModal,
  onToggleItemEnabled,
  onDeleteItem,
  onPlayItem,
  onStopPlaying,
}) => {
  const [dayFilter, setDayFilter] = useState<'today' | 'all' | DayOfWeek>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      setBrowserVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...activeProfile.items]
      .filter((item) => {
        if (dayFilter === 'today') {
          if (!item.days.includes(todayName)) return false;
        } else if (dayFilter !== 'all') {
          if (!item.days.includes(dayFilter)) return false;
        }

        if (query) {
          const matchesLabel = item.label.toLowerCase().includes(query);
          const matchesTime = item.time.includes(query);
          const matchesCategory = item.category.toLowerCase().includes(query);
          return matchesLabel || matchesTime || matchesCategory;
        }
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [activeProfile.items, dayFilter, searchQuery, todayName]);

  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onCreateProfile(newProfileName.trim());
    setNewProfileName('');
    setCreatingProfile(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Selector Header */}
      <div className="bg-white border border-[#E2E6DD] rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#13221C]">
              Profil Jadwal Sekolah
            </h2>
            <p className="text-xs text-[#5B6B62]">
              {activeProfile.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreatingProfile((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#C8DBD0] bg-[#F3F8F5] hover:bg-[#E7F2EC] text-xs font-semibold text-[#0B3B2C] transition-colors whitespace-nowrap"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Profil Baru</span>
            </button>
            <button
              type="button"
              onClick={() => onDuplicateProfile(activeProfile.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4DCD4] bg-white hover:bg-[#F7F8F4] text-xs font-semibold text-[#2E3E36] transition-colors whitespace-nowrap"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Duplikat</span>
            </button>
            {profiles.length > 1 && (
              confirmDeleteProfile ? (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteProfile(activeProfile.id);
                      setConfirmDeleteProfile(false);
                    }}
                    className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    Konfirmasi Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteProfile(false)}
                    className="px-2.5 py-2 rounded-lg border border-[#D4DCD4] text-xs font-medium text-[#5B6B62] hover:bg-[#F7F8F4] whitespace-nowrap"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteProfile(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4DCD4] bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-semibold text-[#5B6B62] transition-colors whitespace-nowrap"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Profil</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => {
                  onSelectProfile(profile.id);
                  setConfirmDeleteProfile(false);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#0B3B2C] text-[#FAF8F2] border border-[#C89B3C]/45 shadow-xs'
                    : 'bg-[#FAF9F5] border border-[#E2E6DD] text-[#3B4A42] hover:border-[#B6CCBF] hover:bg-[#EFF5F1] hover:text-[#0B3B2C]'
                }`}
              >
                {profile.name}
              </button>
            );
          })}
        </div>

        {creatingProfile && (
          <form
            onSubmit={handleCreateProfileSubmit}
            className="mt-4 pt-4 border-t border-[#EAECE6] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <input
              type="text"
              required
              placeholder="Nama profil baru (misal: Jadwal Ekstrakurikuler Sabtu)"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-[#CFD7CE] text-sm text-[#13221C] focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 h-10 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] text-[#FAF8F2] text-xs font-semibold whitespace-nowrap"
              >
                Buat Profil
              </button>
              <button
                type="button"
                onClick={() => setCreatingProfile(false)}
                className="px-3 h-10 rounded-lg border border-[#CFD7CE] text-xs font-semibold text-[#5B6B62] hover:bg-[#F7F8F4] whitespace-nowrap"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Schedule Table Card */}
      <div className="bg-white border border-[#E2E6DD] rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#EAECE6] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Day Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-[#F3F4EE] rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setDayFilter('today')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                dayFilter === 'today'
                  ? 'bg-white text-[#0B3B2C] shadow-xs'
                  : 'text-[#5B6B62] hover:text-[#13221C]'
              }`}
            >
              Hari Ini ({SHORT_DAY_LABELS[todayName]})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                dayFilter === 'all'
                  ? 'bg-white text-[#0B3B2C] shadow-xs'
                  : 'text-[#5B6B62] hover:text-[#13221C]'
              }`}
            >
              Semua Hari
            </button>
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setDayFilter(day)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  dayFilter === day
                    ? 'bg-white text-[#0B3B2C] shadow-xs'
                    : 'text-[#5B6B62] hover:text-[#13221C]'
                }`}
              >
                {SHORT_DAY_LABELS[day]}
              </button>
            ))}
          </div>

          {/* Search & Add Button */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="h-4 w-4 text-[#73847B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari jam atau nama bel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#CFD7CE] text-sm text-[#13221C] placeholder:text-[#88988F] focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
              />
            </div>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] text-[#FAF8F2] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4 text-[#E5C167]" />
              <span>Tambah Jadwal</span>
            </button>
          </div>
        </div>

        {/* High-Density Schedule Data Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-3">
            <div className="text-sm font-semibold text-[#13221C]">
              Tidak ada jadwal bel untuk tampilan ini
            </div>
            <p className="text-xs text-[#5B6B62] max-w-md mx-auto">
              {dayFilter === 'today'
                ? `Belum ada jadwal yang ditetapkan untuk hari ${todayName} di profil ini. Anda dapat melihat Semua Hari atau menambahkan jadwal baru.`
                : 'Coba ubah kata kunci pencarian atau tambahkan jadwal bel baru.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              {dayFilter === 'today' && (
                <button
                  type="button"
                  onClick={() => setDayFilter('all')}
                  className="px-4 py-2 rounded-lg border border-[#CFD7CE] bg-white hover:bg-[#F7F8F4] text-xs font-semibold text-[#2E3E36] whitespace-nowrap"
                >
                  Lihat Semua Hari
                </button>
              )}
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] text-[#FAF8F2] text-xs font-semibold whitespace-nowrap"
              >
                Tambah Jadwal Bel
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4E8DF] bg-[#F5F7F2] text-xs font-semibold text-[#3C5247]">
                  <th className="py-3 pl-5 pr-3 w-24">Waktu</th>
                  <th className="py-3 px-3">Kegiatan</th>
                  <th className="py-3 px-3 hidden md:table-cell">Hari Aktif</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Audio & Pengumuman</th>
                  <th className="py-3 px-3 w-24 text-center">Status</th>
                  <th className="py-3 pl-3 pr-5 w-40 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE8] text-sm">
                {filteredItems.map((item) => {
                  const isPlayingThis = currentlyPlayingItemId === item.id;
                  const isNextUp = nextBellItemId === item.id;
                  const soundName = soundEngine.resolveSoundName(
                    item.soundId,
                    customTracks
                  );
                  const categoryColor =
                    CATEGORY_TEXT_COLORS[item.category] ?? 'text-slate-600 font-medium';
                  const customVoiceLabel = item.ttsVoiceURI
                    ? resolveIndonesianVoiceLabel(item.ttsVoiceURI, browserVoices)
                    : null;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isPlayingThis
                          ? 'bg-[#FBF7EC] hover:bg-[#F7F0DC]'
                          : isNextUp
                          ? 'bg-[#EFF7F2] hover:bg-[#E6F3EB]'
                          : 'hover:bg-[#FAFBF8]'
                      } ${!item.enabled ? 'opacity-55' : ''}`}
                    >
                      <td className="py-3 pl-5 pr-3 font-mono font-bold tabular-nums text-[#0B3B2C] whitespace-nowrap">
                        {item.time}
                      </td>
                      <td className="py-3 px-3 min-w-[200px]">
                        <div className="font-semibold text-[#13221C] flex items-center gap-2 flex-wrap">
                          <span>{item.label}</span>
                          {isNextUp && (
                            <span className="text-xs font-bold text-[#0E5A42]">
                              · Berikutnya
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#64736A] mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className={categoryColor}>{item.category}</span>
                          <span aria-hidden="true" className="md:hidden">
                            ·
                          </span>
                          <span className="md:hidden">
                            {formatDaysSummary(item.days)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#4C5D54] hidden md:table-cell whitespace-nowrap">
                        {formatDaysSummary(item.days)}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#5B6B62] hidden lg:table-cell">
                        <div className="truncate max-w-sm">
                          <span className="font-medium text-[#2A3B33]">{soundName}</span>
                          {item.repeat > 1 && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-[#9C701C] font-semibold">
                                {item.repeat}x Ulang
                              </span>
                            </>
                          )}
                          {item.ttsEnabled && item.ttsText && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-[#0E4A38] font-medium">
                                {customVoiceLabel ?? 'Suara Pengumuman'}
                              </span>
                              {typeof item.ttsDelaySec === 'number' && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span className="text-[#6E7D74] tabular-nums">
                                    Jeda {item.ttsDelaySec} dtk
                                  </span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.enabled}
                          aria-label={`Aktifkan bel ${item.label}`}
                          onClick={() => onToggleItemEnabled(item.id)}
                          className={`inline-flex items-center h-6 w-11 rounded-full transition-colors p-0.5 ${
                            item.enabled ? 'bg-[#0E5A42]' : 'bg-[#CBD3CA]'
                          }`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                              item.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                        {confirmDeleteId === item.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteItem(item.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                            >
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            {isPlayingThis ? (
                              <button
                                type="button"
                                onClick={onStopPlaying}
                                title="Hentikan bel"
                                aria-label={`Hentikan bel ${item.label}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >
                                <Square className="h-3.5 w-3.5 fill-current" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onPlayItem(item)}
                                title="Bunyikan uji coba"
                                aria-label={`Uji bel ${item.label}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              >
                                <Play className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(item)}
                              title="Ubah jadwal"
                              aria-label={`Ubah jadwal ${item.label}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              title="Hapus jadwal"
                              aria-label={`Hapus jadwal ${item.label}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
