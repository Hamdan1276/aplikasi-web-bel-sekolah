import React from 'react';
import {
  CalendarClock,
  History,
  LogOut,
  Music2,
  Radio,
  Volume2,
  X,
} from 'lucide-react';
import { ActiveTab, ScheduleProfile } from '../types/bell';
import { AlHudaLogo } from './AlHudaLogo';

interface SidebarProps {
  schoolName: string;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  profiles: ScheduleProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  autoBellEnabled: boolean;
  audioUnlocked: boolean;
  onUnlockAudio: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'schedule', label: 'Jadwal & Kontrol', icon: CalendarClock },
  { id: 'manual', label: 'Bel Manual & Siaran', icon: Radio },
  { id: 'audio', label: 'Pustaka Audio', icon: Music2 },
  { id: 'settings', label: 'Riwayat & Pengaturan', icon: History },
];

export const Sidebar: React.FC<SidebarProps> = ({
  schoolName,
  activeTab,
  onSelectTab,
  profiles,
  activeProfileId,
  onSelectProfile,
  autoBellEnabled,
  audioUnlocked,
  onUnlockAudio,
  mobileOpen,
  onCloseMobile,
  onLogout,
}) => {
  const content = (
    <div className="flex h-full flex-col justify-between bg-[#07261D] border-r border-[#124234] text-[#EDF3EF] px-4 py-5">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlHudaLogo className="h-10 w-10" />
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-[#FAF8F2] truncate">
                Bel Madrasah Aliyah
              </div>
              <div className="text-xs font-medium text-[#E5C167] truncate">
                {schoolName || 'MA Al-Huda'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-emerald-200 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-5 space-y-1.5" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#104736] text-[#FAF8F2] border border-[#C89B3C]/45 shadow-xs'
                    : 'text-[#B9CEC4] hover:bg-white/6 hover:text-[#FAF8F2] border border-transparent'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-[#E5C167]' : 'text-[#89A89B]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Profile Quick Switch */}
        <div className="mt-7 pt-5 border-t border-white/10">
          <div className="px-2 mb-2 text-xs font-semibold text-[#97B5A8]">
            Profil Jadwal Aktif
          </div>
          <div className="space-y-1">
            {profiles.map((profile) => {
              const selected = profile.id === activeProfileId;
              const activeCount = profile.items.filter((i) => i.enabled).length;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onSelectProfile(profile.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selected
                      ? 'bg-[#0E3C2E] text-[#FAF8F2] border border-[#C89B3C]/40'
                      : 'text-[#C2D4CB] hover:bg-white/6 border border-transparent'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">
                    {profile.name}
                  </div>
                  <div
                    className={`text-[11px] tabular-nums mt-0.5 ${
                      selected ? 'text-[#E5C167]' : 'text-[#89A89B]'
                    }`}
                  >
                    {activeCount} bel aktif
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Audio Readiness & System State */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        {!audioUnlocked ? (
          <button
            type="button"
            onClick={onUnlockAudio}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#C89B3C] hover:bg-[#B4872B] text-[#07261D] text-xs font-bold transition-colors whitespace-nowrap"
          >
            <Volume2 className="h-4 w-4 shrink-0" />
            <span>Aktifkan Audio Browser</span>
          </button>
        ) : (
          <div className="px-2 text-xs text-[#A8C1B5] flex items-center justify-between">
            <span>Output Audio</span>
            <span className="font-semibold text-[#7CE0B5]">Siap</span>
          </div>
        )}
        <div className="px-2 text-xs text-[#A8C1B5] flex items-center justify-between">
          <span>Penjadwal Otomatis</span>
          <span
            className={`font-semibold ${
              autoBellEnabled ? 'text-[#E5C167]' : 'text-[#8FA89C]'
            }`}
          >
            {autoBellEnabled ? 'Aktif' : 'Dijeda'}
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-red-950/60 hover:border-red-400/40 hover:text-red-200 text-[#D4E2DA] text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[264px] shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#061A13]/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
