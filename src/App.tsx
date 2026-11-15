import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Coffee, Home, LogOut, Menu, Plus, Volume2 } from 'lucide-react';
import { AlHudaLogo } from './components/AlHudaLogo';
import { AudioLibraryView } from './components/AudioLibraryView';
import { HistorySettingsView } from './components/HistorySettingsView';
import { LoginView } from './components/LoginView';
import { ManualBellView } from './components/ManualBellView';
import { MasterClockPanel } from './components/MasterClockPanel';
import { ScheduleModal } from './components/ScheduleModal';
import { ScheduleView } from './components/ScheduleView';
import { Sidebar } from './components/Sidebar';
import { BUILT_IN_TONES, DEFAULT_PROFILES } from './data/defaultSchedules';
import { DEFAULT_INDONESIAN_VOICE_ID } from './data/indonesianVoices';
import {
  ActiveTab,
  AppSettings,
  BellLogEntry,
  CustomAudioTrack,
  ScheduleItem,
  ScheduleProfile,
} from './types/bell';
import {
  deleteCustomAudioTrack,
  listCustomAudioTracks,
  saveCustomAudioTrack,
} from './utils/audioDb';
import { soundEngine } from './utils/soundEngine';
import {
  formatClockHM,
  formatClockHMS,
  getIndonesianDayName,
  getNextScheduledBell,
} from './utils/timeUtils';

const STORAGE_KEYS = {
  profiles: 'gentasekolah_profiles_v1',
  settings: 'gentasekolah_settings_v1',
  logs: 'gentasekolah_logs_v1',
  auth: 'madrasah_bel_auth_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  schoolName: 'MA Al-Huda',
  autoBellEnabled: true,
  volume: 0.85,
  ttsRate: 0.98,
  ttsPitch: 1.0,
  ttsDelaySec: 1,
  ttsVoiceURI: DEFAULT_INDONESIAN_VOICE_ID,
  activeProfileId: DEFAULT_PROFILES[0].id,
};

function loadJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const TAB_TITLES: Record<ActiveTab, string> = {
  schedule: 'Jadwal & Kontrol Bel',
  manual: 'Bel Manual & Siaran',
  audio: 'Pustaka Audio',
  settings: 'Riwayat & Pengaturan',
};

export default function App() {
  const [profiles, setProfiles] = useState<ScheduleProfile[]>(() =>
    loadJsonStorage<ScheduleProfile[]>(STORAGE_KEYS.profiles, DEFAULT_PROFILES)
  );
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = loadJsonStorage<Partial<AppSettings>>(STORAGE_KEYS.settings, {});
    const schoolName =
      !saved.schoolName || saved.schoolName === 'SMA Negeri 1 Nusantara'
        ? DEFAULT_SETTINGS.schoolName
        : saved.schoolName;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      schoolName,
    };
  });
  const [logs, setLogs] = useState<BellLogEntry[]>(() =>
    loadJsonStorage<BellLogEntry[]>(STORAGE_KEYS.logs, [])
  );
  const [customTracks, setCustomTracks] = useState<CustomAudioTrack[]>([]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.auth) === 'true' ||
        sessionStorage.getItem(STORAGE_KEYS.auth) === 'true'
      );
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  // Playback state
  const [isRinging, setIsRinging] = useState(false);
  const [ringingLabel, setRingingLabel] = useState<string | null>(null);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Guard against double-triggering in the same minute
  const triggeredMinutesRef = useRef<Set<string>>(new Set());

  // Persist profiles, settings, logs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
    } catch {
      // Ignore quota errors
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.logs,
        JSON.stringify(logs.slice(0, 120))
      );
    } catch {
      // Ignore
    }
  }, [logs]);

  // Load IndexedDB custom tracks on mount
  useEffect(() => {
    listCustomAudioTracks().then(setCustomTracks);
  }, []);

  // Unlock AudioContext on first user interaction
  const handleUnlockAudio = useCallback(async () => {
    const ok = await soundEngine.unlockAudio();
    setAudioUnlocked(ok);
  }, []);

  useEffect(() => {
    const onFirstGesture = () => {
      if (soundEngine.getAudioState() !== 'running') {
        soundEngine.unlockAudio().then((ok) => {
          if (ok) setAudioUnlocked(true);
        });
      } else {
        setAudioUnlocked(true);
      }
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    window.addEventListener('keydown', onFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  const activeProfile = useMemo(() => {
    return (
      profiles.find((p) => p.id === settings.activeProfileId) ?? profiles[0]
    );
  }, [profiles, settings.activeProfileId]);

  const todayName = useMemo(() => getIndonesianDayName(now), [now]);

  const todayItems = useMemo(
    () =>
      activeProfile.items
        .filter((it) => it.days.includes(todayName))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [activeProfile.items, todayName]
  );

  const todayStats = useMemo(() => {
    const enabledToday = todayItems.filter((it) => it.enabled);
    const currentHM = formatClockHM(now);
    const passedCount = enabledToday.filter((it) => it.time <= currentHM).length;
    const remainingCount = Math.max(0, enabledToday.length - passedCount);
    return {
      totalEnabled: enabledToday.length,
      passedCount,
      remainingCount,
    };
  }, [todayItems, now]);

  const nextBell = useMemo(
    () => getNextScheduledBell(now, activeProfile.items),
    [now, activeProfile.items]
  );

  const appendLog = useCallback(
    (entry: Omit<BellLogEntry, 'id' | 'timestamp'>) => {
      const record: BellLogEntry = {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      setLogs((prev) => [record, ...prev].slice(0, 120));
    },
    []
  );

  const stopAllPlayback = useCallback(() => {
    soundEngine.stopAll();
    setIsRinging(false);
    setRingingLabel(null);
    setPlayingItemId(null);
    setPlayingSoundId(null);
    setPreviewVoiceId(null);
  }, []);

  const triggerBell = useCallback(
    async (params: {
      itemId?: string;
      soundKey?: string;
      label: string;
      soundId: string;
      repeat: number;
      ttsEnabled: boolean;
      ttsText: string;
      voiceURI?: string;
      ttsDelaySec?: number;
      triggerType: 'Otomatis' | 'Manual';
      skipLog?: boolean;
    }) => {
      setAudioUnlocked(true);
      setPreviewVoiceId(null);
      setRingingLabel(params.label);
      setPlayingItemId(params.itemId ?? null);
      setPlayingSoundId(params.soundKey ?? null);

      const soundName =
        params.repeat === 0
          ? 'Tanpa Nada Pembuka'
          : soundEngine.resolveSoundName(params.soundId, customTracks);

      if (!params.skipLog) {
        const current = new Date();
        appendLog({
          timeStr: formatClockHMS(current),
          dayName: getIndonesianDayName(current),
          label: params.label,
          profileName: activeProfile.name,
          triggerType: params.triggerType,
          soundName,
          ttsSpoken: params.ttsEnabled && params.ttsText.trim().length > 0,
        });
      }

      const effectiveVoiceURI =
        params.voiceURI && params.voiceURI.trim().length > 0
          ? params.voiceURI.trim()
          : settings.ttsVoiceURI;
      const effectiveDelaySec =
        typeof params.ttsDelaySec === 'number' && !Number.isNaN(params.ttsDelaySec)
          ? params.ttsDelaySec
          : (settings.ttsDelaySec ?? 1);

      await soundEngine.playBellSequence({
        soundId: params.soundId,
        repeat: params.repeat,
        ttsEnabled: params.ttsEnabled,
        ttsText: params.ttsText,
        ttsDelaySec: effectiveDelaySec,
        volume: settings.volume,
        ttsRate: settings.ttsRate,
        ttsPitch: settings.ttsPitch,
        ttsVoiceURI: effectiveVoiceURI,
        onStateChange: (playing) => {
          setIsRinging(playing);
          if (!playing) {
            setRingingLabel(null);
            setPlayingItemId(null);
            setPlayingSoundId(null);
          }
        },
      });
    },
    [
      activeProfile.name,
      appendLog,
      customTracks,
      settings.ttsDelaySec,
      settings.ttsPitch,
      settings.ttsRate,
      settings.ttsVoiceURI,
      settings.volume,
    ]
  );

  // Master clock tick & automatic schedule trigger
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = new Date();
      setNow(current);

      if (!isAuthenticated || !settings.autoBellEnabled) return;

      const currentHM = formatClockHM(current);
      const currentDay = getIndonesianDayName(current);
      const dateKey = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;

      // Trigger only within the first 5 seconds of the matching minute
      if (current.getSeconds() > 5) return;

      for (const item of activeProfile.items) {
        if (!item.enabled) continue;
        if (!item.days.includes(currentDay)) continue;
        if (item.time !== currentHM) continue;

        const triggerKey = `${dateKey}_${currentHM}_${item.id}`;
        if (triggeredMinutesRef.current.has(triggerKey)) continue;

        triggeredMinutesRef.current.add(triggerKey);
        triggerBell({
          itemId: item.id,
          label: item.label,
          soundId: item.soundId,
          repeat: item.repeat,
          ttsEnabled: item.ttsEnabled,
          ttsText: item.ttsText,
          voiceURI: item.ttsVoiceURI,
          ttsDelaySec: item.ttsDelaySec,
          triggerType: 'Otomatis',
        });
        break;
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [activeProfile.items, isAuthenticated, settings.autoBellEnabled, triggerBell]);

  // Schedule CRUD handlers
  const handleSaveScheduleItem = (
    data: Omit<ScheduleItem, 'id'>,
    existingId?: string
  ) => {
    setProfiles((prev) =>
      prev.map((profile) => {
        if (profile.id !== activeProfile.id) return profile;
        if (existingId) {
          return {
            ...profile,
            items: profile.items.map((it) =>
              it.id === existingId ? { ...data, id: existingId } : it
            ),
          };
        }
        const newItem: ScheduleItem = {
          ...data,
          id: `bell_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        };
        return {
          ...profile,
          items: [...profile.items, newItem],
        };
      })
    );
  };

  const handleToggleItemEnabled = (itemId: string) => {
    setProfiles((prev) =>
      prev.map((profile) => {
        if (profile.id !== activeProfile.id) return profile;
        return {
          ...profile,
          items: profile.items.map((it) =>
            it.id === itemId ? { ...it, enabled: !it.enabled } : it
          ),
        };
      })
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setProfiles((prev) =>
      prev.map((profile) => {
        if (profile.id !== activeProfile.id) return profile;
        return {
          ...profile,
          items: profile.items.filter((it) => it.id !== itemId),
        };
      })
    );
  };

  // Profile CRUD handlers
  const handleCreateProfile = (name: string) => {
    const newProfile: ScheduleProfile = {
      id: `profile_${Date.now()}`,
      name,
      description: 'Profil jadwal kustom yang dibuat oleh operator sekolah.',
      items: [],
    };
    setProfiles((prev) => [...prev, newProfile]);
    setSettings((prev) => ({ ...prev, activeProfileId: newProfile.id }));
  };

  const handleDuplicateProfile = (sourceId: string) => {
    const source = profiles.find((p) => p.id === sourceId);
    if (!source) return;
    const copy: ScheduleProfile = {
      id: `profile_${Date.now()}`,
      name: `${source.name} (Salinan)`,
      description: source.description,
      items: source.items.map((it, idx) => ({
        ...it,
        id: `bell_${Date.now()}_${idx}`,
      })),
    };
    setProfiles((prev) => [...prev, copy]);
    setSettings((prev) => ({ ...prev, activeProfileId: copy.id }));
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    const remaining = profiles.filter((p) => p.id !== id);
    setProfiles(remaining);
    if (settings.activeProfileId === id) {
      setSettings((prev) => ({ ...prev, activeProfileId: remaining[0].id }));
    }
  };

  // Audio upload/delete handlers
  const handleUploadAudioFiles = async (files: FileList) => {
    const added: CustomAudioTrack[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/')) {
        throw new Error(
          `Berkas "${file.name}" bukan format audio yang didukung.`
        );
      }
      const track = await saveCustomAudioTrack(file);
      added.push(track);
    }
    setCustomTracks((prev) => [...added, ...prev]);
  };

  const handleDeleteCustomTrack = async (id: string) => {
    await deleteCustomAudioTrack(id);
    setCustomTracks((prev) => prev.filter((t) => t.id !== id));
    if (playingSoundId === `custom:${id}`) {
      stopAllPlayback();
    }
  };

  // Backup / Restore / Reset
  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Bel Madrasah Aliyah',
      settings,
      profiles,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal-bel-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as {
      profiles?: ScheduleProfile[];
      settings?: Partial<AppSettings>;
    };
    if (!Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
      throw new Error('Format berkas cadangan tidak memiliki daftar profil.');
    }
    setProfiles(parsed.profiles);
    if (parsed.settings) {
      setSettings((prev) => ({
        ...prev,
        ...parsed.settings,
        activeProfileId:
          parsed.settings?.activeProfileId &&
          parsed.profiles!.some((p) => p.id === parsed.settings?.activeProfileId)
            ? parsed.settings.activeProfileId
            : parsed.profiles![0].id,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        activeProfileId: parsed.profiles![0].id,
      }));
    }
  };

  const handleResetDefaults = () => {
    setProfiles(DEFAULT_PROFILES);
    setSettings((prev) => ({
      ...DEFAULT_SETTINGS,
      schoolName: prev.schoolName,
    }));
  };

  const handleLoginSuccess = (rememberMe: boolean) => {
    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.auth, 'true');
        sessionStorage.removeItem(STORAGE_KEYS.auth);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.auth, 'true');
        localStorage.removeItem(STORAGE_KEYS.auth);
      }
    } catch {
      // Ignore storage errors
    }
    setIsAuthenticated(true);
    handleUnlockAudio();
  };

  const handleLogout = () => {
    stopAllPlayback();
    try {
      localStorage.removeItem(STORAGE_KEYS.auth);
      sessionStorage.removeItem(STORAGE_KEYS.auth);
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    setActiveTab('schedule');
    setMobileMenuOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        schoolName={settings.schoolName}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F7F2] text-[#13221C]">
      <Sidebar
        schoolName={settings.schoolName}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        profiles={profiles}
        activeProfileId={activeProfile.id}
        onSelectProfile={(id) =>
          setSettings((prev) => ({ ...prev, activeProfileId: id }))
        }
        autoBellEnabled={settings.autoBellEnabled}
        audioUnlocked={audioUnlocked}
        onUnlockAudio={handleUnlockAudio}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 bg-[#FCFBF8]/95 backdrop-blur border-b border-[#E3E6DD]">
          <div className="h-1 bg-gradient-to-r from-[#07261D] via-[#0F4C3A] to-[#C89B3C]" />
          <div className="px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu navigasi"
                className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8DFD5] text-[#0B3B2C] hover:bg-[#EFF4EE] shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 text-sm min-w-0">
                <AlHudaLogo className="h-8 w-8 lg:hidden" />
                <span className="text-[#0E4A38] font-semibold hidden sm:inline whitespace-nowrap">
                  {settings.schoolName || 'MA Al-Huda'}
                </span>
                <span
                  aria-hidden="true"
                  className="text-[#B8892B] hidden sm:inline font-bold"
                >
                  /
                </span>
                <h1 className="font-bold text-[#13221C] truncate">
                  {TAB_TITLES[activeTab]}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {!audioUnlocked && (
                <button
                  type="button"
                  onClick={handleUnlockAudio}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#B88628] hover:bg-[#9E721F] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Aktifkan Audio</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] text-[#FAF8F2] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 shadow-xs border border-[#145843]"
              >
                <Plus className="h-3.5 w-3.5 text-[#E5C167]" />
                <span>Tambah Jadwal</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dan kembali ke halaman login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D8DFD5] bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-[#3B4A42] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1280px] w-full mx-auto space-y-6">
          <MasterClockPanel
            now={now}
            schoolName={settings.schoolName}
            activeProfileName={activeProfile.name}
            todayItems={todayItems}
            autoBellEnabled={settings.autoBellEnabled}
            onToggleAutoBell={() =>
              setSettings((prev) => ({
                ...prev,
                autoBellEnabled: !prev.autoBellEnabled,
              }))
            }
            nextBell={nextBell}
            volume={settings.volume}
            onChangeVolume={(val) =>
              setSettings((prev) => ({ ...prev, volume: val }))
            }
            isRinging={isRinging}
            ringingLabel={ringingLabel}
            onStopRinging={stopAllPlayback}
            onTriggerNextTest={() => {
              if (!nextBell) return;
              triggerBell({
                itemId: nextBell.item.id,
                label: nextBell.item.label,
                soundId: nextBell.item.soundId,
                repeat: nextBell.item.repeat,
                ttsEnabled: nextBell.item.ttsEnabled,
                ttsText: nextBell.item.ttsText,
                voiceURI: nextBell.item.ttsVoiceURI,
                ttsDelaySec: nextBell.item.ttsDelaySec,
                triggerType: 'Manual',
              });
            }}
            onPlaySpecificItem={(item) =>
              triggerBell({
                itemId: item.id,
                label: item.label,
                soundId: item.soundId,
                repeat: item.repeat,
                ttsEnabled: item.ttsEnabled,
                ttsText: item.ttsText,
                voiceURI: item.ttsVoiceURI,
                ttsDelaySec: item.ttsDelaySec,
                triggerType: 'Manual',
              })
            }
            audioUnlocked={audioUnlocked}
            onUnlockAudio={handleUnlockAudio}
          />

          {activeTab === 'schedule' && (
            <>
              {/* Operational Summary & 1-Click Quick Bell Strip */}
              <section
                aria-label="Ringkasan Operasional Hari Ini"
                className="bg-white border border-[#E2E6DD] rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EAECE6]"
              >
                <div className="p-4 sm:px-5">
                  <div className="text-xs font-semibold text-[#0E4A38]">
                    Jadwal Hari {todayName}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono tabular-nums text-[#092C21]">
                      {todayStats.totalEnabled} bel
                    </span>
                    <span className="text-xs text-[#5B6B62] tabular-nums">
                      · {todayStats.passedCount} lewat · {todayStats.remainingCount} tersisa
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:px-5">
                  <div className="text-xs font-semibold text-[#9C701C]">
                    Bel Terakhir Berbunyi
                  </div>
                  {logs.length > 0 ? (
                    <div className="mt-1.5 space-y-0.5">
                      <div className="text-sm font-bold text-[#13221C] truncate">
                        {logs[0].label}
                      </div>
                      <div className="text-xs text-[#64736A] font-mono tabular-nums">
                        {logs[0].dayName}, {logs[0].timeStr} · {logs[0].triggerType}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 text-sm font-semibold text-[#6E7D74]">
                      Belum ada bel tercatat
                    </div>
                  )}
                </div>

                <div className="p-4 sm:px-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[#0E4A38]">
                      Pustaka Audio Siap
                    </div>
                    <div className="mt-1.5 text-sm font-bold text-[#13221C] tabular-nums">
                      {BUILT_IN_TONES.length} nada bawaan · {customTracks.length} kustom
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audio')}
                    className="text-xs font-semibold text-[#0E4A38] hover:text-[#082D21] hover:underline whitespace-nowrap shrink-0"
                  >
                    Kelola
                  </button>
                </div>

                <div className="p-4 sm:px-5">
                  <div className="text-xs font-semibold text-[#4A5A51] mb-2">
                    Bel Cepat (Sekali Tekan)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        triggerBell({
                          itemId: 'quick-masuk',
                          label: 'Bel Masuk Kelas',
                          soundId: 'chime-masuk',
                          repeat: 1,
                          ttsEnabled: true,
                          ttsText:
                            'Bel masuk telah berbunyi. Kepada seluruh siswa harap memasuki ruang kelas.',
                          triggerType: 'Manual',
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#C6DDD1] bg-[#F2F8F4] hover:bg-[#E4F1EA] text-xs font-semibold text-[#0B3B2C] transition-colors whitespace-nowrap"
                    >
                      <Bell className="h-3.5 w-3.5 shrink-0" />
                      <span>Masuk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerBell({
                          itemId: 'quick-istirahat',
                          label: 'Bel Istirahat',
                          soundId: 'chime-istirahat',
                          repeat: 1,
                          ttsEnabled: true,
                          ttsText:
                            'Waktu istirahat dimulai. Silakan beristirahat dengan tertib.',
                          triggerType: 'Manual',
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E7D8B4] bg-[#FBF7EC] hover:bg-[#F5EBD4] text-xs font-semibold text-[#855C10] transition-colors whitespace-nowrap"
                    >
                      <Coffee className="h-3.5 w-3.5 shrink-0" />
                      <span>Istirahat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerBell({
                          itemId: 'quick-pulang',
                          label: 'Bel Pulang',
                          soundId: 'chime-pulang',
                          repeat: 1,
                          ttsEnabled: true,
                          ttsText:
                            'Kegiatan belajar hari ini telah selesai. Kepada seluruh siswa dipersilakan pulang dengan tertib.',
                          triggerType: 'Manual',
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D4DCD7] bg-[#F4F6F4] hover:bg-[#E8ECE9] text-xs font-semibold text-[#1D352A] transition-colors whitespace-nowrap"
                    >
                      <Home className="h-3.5 w-3.5 shrink-0" />
                      <span>Pulang</span>
                    </button>
                  </div>
                </div>
              </section>

              <ScheduleView
                todayName={todayName}
                profiles={profiles}
                activeProfile={activeProfile}
                customTracks={customTracks}
                currentlyPlayingItemId={playingItemId}
                nextBellItemId={nextBell?.dayOffset === 0 ? nextBell.item.id : null}
                onSelectProfile={(id) =>
                  setSettings((prev) => ({ ...prev, activeProfileId: id }))
                }
                onCreateProfile={handleCreateProfile}
                onDuplicateProfile={handleDuplicateProfile}
                onDeleteProfile={handleDeleteProfile}
                onOpenAddModal={() => {
                  setEditingItem(null);
                  setModalOpen(true);
                }}
                onOpenEditModal={(item) => {
                  setEditingItem(item);
                  setModalOpen(true);
                }}
                onToggleItemEnabled={handleToggleItemEnabled}
                onDeleteItem={handleDeleteItem}
                onPlayItem={(item) =>
                  triggerBell({
                    itemId: item.id,
                    label: item.label,
                    soundId: item.soundId,
                    repeat: item.repeat,
                    ttsEnabled: item.ttsEnabled,
                    ttsText: item.ttsText,
                    voiceURI: item.ttsVoiceURI,
                    ttsDelaySec: item.ttsDelaySec,
                    triggerType: 'Manual',
                  })
                }
                onStopPlaying={stopAllPlayback}
              />
            </>
          )}

          {activeTab === 'manual' && (
            <ManualBellView
              customTracks={customTracks}
              activeVoiceURI={settings.ttsVoiceURI}
              defaultDelaySec={settings.ttsDelaySec ?? 1}
              isRinging={isRinging}
              ringingLabel={ringingLabel}
              onTriggerManualBell={(params) =>
                triggerBell({
                  itemId: params.id,
                  label: params.label,
                  soundId: params.soundId,
                  repeat: params.repeat,
                  ttsEnabled: params.ttsEnabled,
                  ttsText: params.ttsText,
                  voiceURI: params.voiceURI,
                  ttsDelaySec: params.ttsDelaySec,
                  triggerType: 'Manual',
                })
              }
              onStopRinging={stopAllPlayback}
            />
          )}

          {activeTab === 'audio' && (
            <AudioLibraryView
              customTracks={customTracks}
              playingSoundId={playingSoundId}
              onPlaySound={(soundId, label) =>
                triggerBell({
                  soundKey: soundId,
                  label: `Pratinjau: ${label}`,
                  soundId,
                  repeat: 1,
                  ttsEnabled: false,
                  ttsText: '',
                  triggerType: 'Manual',
                  skipLog: true,
                })
              }
              onStopSound={stopAllPlayback}
              onUploadFiles={handleUploadAudioFiles}
              onDeleteCustomTrack={handleDeleteCustomTrack}
            />
          )}

          {activeTab === 'settings' && (
            <HistorySettingsView
              settings={settings}
              onUpdateSettings={(patch) =>
                setSettings((prev) => ({ ...prev, ...patch }))
              }
              logs={logs}
              onClearLogs={() => setLogs([])}
              onTestSpeech={() =>
                triggerBell({
                  label: 'Uji Suara Pengumuman',
                  soundId: 'chime-ganti',
                  repeat: 1,
                  ttsEnabled: true,
                  ttsText: `Perhatian, ini adalah pengujian suara pengumuman untuk ${
                    settings.schoolName || 'MA Al-Huda'
                  }.`,
                  triggerType: 'Manual',
                  skipLog: true,
                })
              }
              previewVoiceId={previewVoiceId}
              onPreviewVoice={(voiceURI, sampleText) => {
                setAudioUnlocked(true);
                setPreviewVoiceId(voiceURI);
                setRingingLabel('Pratinjau Suara Indonesia');
                soundEngine.previewIndonesianVoice({
                  text: sampleText,
                  volume: settings.volume,
                  rate: settings.ttsRate,
                  pitch: settings.ttsPitch,
                  voiceURI,
                  onStateChange: (playing) => {
                    setIsRinging(playing);
                    if (!playing) {
                      setPreviewVoiceId(null);
                      setRingingLabel(null);
                    }
                  },
                });
              }}
              onStopPreview={stopAllPlayback}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDefaults={handleResetDefaults}
            />
          )}
        </main>
      </div>

      <ScheduleModal
        isOpen={modalOpen}
        initialItem={editingItem}
        customTracks={customTracks}
        defaultVoiceURI={settings.ttsVoiceURI}
        defaultDelaySec={settings.ttsDelaySec ?? 1}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveScheduleItem}
        onPreviewSound={(params) =>
          triggerBell({
            label: 'Pratinjau Jadwal',
            soundId: params.soundId,
            repeat: params.repeat,
            ttsEnabled: params.ttsEnabled,
            ttsText: params.ttsText,
            voiceURI: params.ttsVoiceURI,
            ttsDelaySec: params.ttsDelaySec,
            triggerType: 'Manual',
            skipLog: true,
          })
        }
        onPreviewVoice={(voiceURI, sampleText) => {
          setAudioUnlocked(true);
          setPreviewVoiceId(voiceURI);
          setRingingLabel('Pratinjau Suara Pengumuman');
          soundEngine.previewIndonesianVoice({
            text: sampleText,
            volume: settings.volume,
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
            voiceURI,
            onStateChange: (playing) => {
              setIsRinging(playing);
              if (!playing) {
                setPreviewVoiceId(null);
                setRingingLabel(null);
              }
            },
          });
        }}
        isPreviewPlaying={isRinging}
        onStopPreview={stopAllPlayback}
      />
    </div>
  );
}
