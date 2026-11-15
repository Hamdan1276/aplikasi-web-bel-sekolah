import React, { useMemo } from 'react';
import {
  BellRing,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ScheduleItem } from '../types/bell';
import {
  formatClockHMS,
  formatCountdown,
  formatCountdownReadable,
  formatIndonesianDate,
  NextBellResult,
} from '../utils/timeUtils';
import { AlHudaLogo } from './AlHudaLogo';

interface MasterClockPanelProps {
  now: Date;
  schoolName: string;
  activeProfileName: string;
  todayItems: ScheduleItem[];
  autoBellEnabled: boolean;
  onToggleAutoBell: () => void;
  nextBell: NextBellResult | null;
  volume: number;
  onChangeVolume: (val: number) => void;
  isRinging: boolean;
  ringingLabel: string | null;
  onStopRinging: () => void;
  onTriggerNextTest: () => void;
  onPlaySpecificItem: (item: ScheduleItem) => void;
  audioUnlocked: boolean;
  onUnlockAudio: () => void;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export const MasterClockPanel: React.FC<MasterClockPanelProps> = ({
  now,
  schoolName,
  activeProfileName,
  todayItems,
  autoBellEnabled,
  onToggleAutoBell,
  nextBell,
  volume,
  onChangeVolume,
  isRinging,
  ringingLabel,
  onStopRinging,
  onTriggerNextTest,
  onPlaySpecificItem,
  audioUnlocked,
  onUnlockAudio,
}) => {
  const clockStr = formatClockHMS(now);
  const dateStr = formatIndonesianDate(now);

  const timeline = useMemo(() => {
    const enabled = [...todayItems]
      .filter((it) => it.enabled)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (enabled.length === 0) return null;

    const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const firstMin = Math.max(0, timeToMinutes(enabled[0].time) - 20);
    const lastMin = Math.min(1440, timeToMinutes(enabled[enabled.length - 1].time) + 20);
    const span = Math.max(60, lastMin - firstMin);

    const progressPct = Math.max(
      0,
      Math.min(100, ((nowMinutes - firstMin) / span) * 100)
    );

    const nodes = enabled.map((item) => {
      const m = timeToMinutes(item.time);
      const pct = Math.max(1.5, Math.min(98.5, ((m - firstMin) / span) * 100));
      const isNext = nextBell?.dayOffset === 0 && nextBell.item.id === item.id;
      const isPassed = m <= nowMinutes && !isNext;
      return { item, pct, isNext, isPassed };
    });

    return {
      nodes,
      progressPct,
      startLabel: enabled[0].time,
      endLabel: enabled[enabled.length - 1].time,
    };
  }, [todayItems, now, nextBell]);

  return (
    <section
      aria-label="Panel Jam Induk dan Status Bel"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#051F17] via-[#093528] to-[#0F4938] text-[#FAF8F2] border border-[#195945] shadow-md"
    >
      {/* Warm Gold & Emerald Ambient Glow Accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-12 h-64 w-64 rounded-full bg-[#D4A843]/15 blur-3xl"
      />

      {/* Subtle Geometric Madrasah Lattice Accent */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-full w-72 opacity-[0.09] text-[#E5C167]"
        viewBox="0 0 240 240"
        fill="none"
      >
        <pattern
          id="madrasah-lattice"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M24 0L48 24L24 48L0 24Z"
            stroke="currentColor"
            strokeWidth="1"
          />
          <rect
            x="9"
            y="9"
            width="30"
            height="30"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="0.8" />
        </pattern>
        <rect width="240" height="240" fill="url(#madrasah-lattice)" />
      </svg>

      <div className="relative p-5 sm:p-7 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Left: Madrasah Emblem, Digital Master Clock & Identity */}
          <div className="xl:col-span-5 flex items-center gap-4 sm:gap-5">
            <AlHudaLogo className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" />

            <div className="min-w-0 space-y-1.5">
              <div className="text-xs font-medium text-[#B8D4C6] flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#E5C167]">
                  {schoolName || 'MA Al-Huda'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#DDEBE3] truncate">{activeProfileName}</span>
              </div>

              <div className="font-mono text-3xl sm:text-4xl lg:text-[48px] leading-none font-bold tracking-tight tabular-nums text-[#FAF8F2] drop-shadow-sm">
                {clockStr}
              </div>

              <div className="text-xs sm:text-sm text-[#E5C167]/95 font-medium">
                {dateStr}
              </div>
            </div>
          </div>

          {/* Center: Next Bell Countdown or Active Ringing State */}
          <div className="xl:col-span-4 xl:border-l xl:border-white/15 xl:pl-6 space-y-2">
            {isRinging ? (
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-[#E5C167] flex items-center gap-2">
                  <BellRing className="h-4 w-4 shrink-0" />
                  <span>Bel Sedang Berbunyi</span>
                </div>
                <div className="text-lg font-bold text-[#FAF8F2] truncate">
                  {ringingLabel || 'Membunyikan Bel Madrasah'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onStopRinging}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Hentikan Bel</span>
                  </button>
                  <div className="flex items-end gap-1 h-5" aria-hidden="true">
                    <span className="w-1 bg-[#E5C167] rounded-full h-3 animate-bounce" />
                    <span className="w-1 bg-[#F0D58A] rounded-full h-5 animate-bounce [animation-delay:120ms]" />
                    <span className="w-1 bg-[#E5C167] rounded-full h-2.5 animate-bounce [animation-delay:240ms]" />
                    <span className="w-1 bg-[#F0D58A] rounded-full h-4 animate-bounce [animation-delay:360ms]" />
                  </div>
                </div>
              </div>
            ) : nextBell ? (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-[#B8D4C6] flex items-center gap-2">
                  <span>Bel Berikutnya</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#E5C167] font-semibold">
                    {nextBell.dayOffset === 0
                      ? `Hari ini, ${nextBell.item.time}`
                      : `${nextBell.dayName}, ${nextBell.item.time}`}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-3xl sm:text-4xl font-bold tabular-nums text-[#7BE3B6]">
                    {formatCountdown(nextBell.remainingSeconds)}
                  </span>
                  <span className="text-xs text-[#B8D4C6] tabular-nums">
                    ({formatCountdownReadable(nextBell.remainingSeconds)})
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-0.5">
                  <span className="text-sm font-semibold text-[#FAF8F2] truncate">
                    {nextBell.item.label}
                  </span>
                  <button
                    type="button"
                    onClick={onTriggerNextTest}
                    className="text-xs font-semibold text-[#E5C167] hover:text-[#F4DA8E] underline underline-offset-4 whitespace-nowrap shrink-0"
                  >
                    Bunyikan Sekarang
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs font-medium text-[#B8D4C6]">
                  Bel Berikutnya
                </div>
                <div className="text-base font-semibold text-[#FAF8F2]">
                  Tidak ada jadwal aktif
                </div>
                <div className="text-xs text-[#B8D4C6]">
                  Aktifkan atau tambahkan jadwal bel pada tabel di bawah.
                </div>
              </div>
            )}
          </div>

          {/* Right: Master Auto Toggle + Volume Control */}
          <div className="xl:col-span-3 xl:border-l xl:border-white/10 xl:pl-6 flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onToggleAutoBell}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  autoBellEnabled
                    ? 'bg-[#C89B3C] hover:bg-[#B4872B] text-[#051F17]'
                    : 'bg-white/10 hover:bg-white/15 text-[#FAF8F2] border border-white/15'
                }`}
              >
                {autoBellEnabled ? (
                  <>
                    <Pause className="h-3.5 w-3.5 shrink-0" />
                    <span>Otomatis: Aktif</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 shrink-0" />
                    <span>Otomatis: Dijeda</span>
                  </>
                )}
              </button>

              {!audioUnlocked && (
                <button
                  type="button"
                  onClick={onUnlockAudio}
                  className="px-3 py-2.5 rounded-lg bg-[#E5C167] hover:bg-[#D4AE52] text-[#051F17] text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                >
                  Aktifkan Suara
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 bg-white/6 border border-white/12 rounded-lg px-3 py-2">
              <button
                type="button"
                onClick={() => onChangeVolume(volume > 0 ? 0 : 0.85)}
                aria-label={volume === 0 ? 'Nyalakan volume' : 'Bisukan volume'}
                className="text-[#B8D4C6] hover:text-white shrink-0"
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => onChangeVolume(Number(e.target.value) / 100)}
                aria-label="Volume utama bel madrasah"
                className="w-full accent-[#E5C167] h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-xs tabular-nums text-[#DDEBE3] w-9 text-right shrink-0">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Strip: Live Daily Bell Timeline */}
        {timeline && (
          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#B8D4C6]">
              <span className="font-medium">
                Linimasa Bel Hari Ini ({timeline.nodes.length} titik jadwal)
              </span>
              <span className="font-mono tabular-nums text-[#B8D4C6]">
                {timeline.startLabel} — {timeline.endLabel}
              </span>
            </div>

            <div className="relative h-6 flex items-center">
              {/* Base Track */}
              <div className="w-full h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#45B889] to-[#E5C167] transition-all duration-300"
                  style={{ width: `${timeline.progressPct}%` }}
                />
              </div>

              {/* Bell Tick Markers */}
              {timeline.nodes.map((node) => (
                <button
                  key={node.item.id}
                  type="button"
                  onClick={() => onPlaySpecificItem(node.item)}
                  title={`${node.item.time} — ${node.item.label} (Klik untuk bunyikan)`}
                  aria-label={`${node.item.time} ${node.item.label}`}
                  style={{ left: `${node.pct}%` }}
                  className={`absolute -translate-x-1/2 rounded-full transition-transform hover:scale-125 focus-visible:outline-2 focus-visible:outline-[#E5C167] ${
                    node.isNext
                      ? 'h-4 w-4 bg-[#E5C167] ring-4 ring-[#E5C167]/25 z-20'
                      : node.isPassed
                      ? 'h-2.5 w-2.5 bg-[#63D2A2]/85 z-10'
                      : 'h-2.5 w-2.5 bg-white/60 hover:bg-white z-10'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
