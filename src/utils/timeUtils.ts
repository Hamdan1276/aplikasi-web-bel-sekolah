import { ALL_DAYS, DayOfWeek, ScheduleItem } from '../types/bell';

const INDONESIAN_DAYS_BY_JS_DAY: DayOfWeek[] = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function getIndonesianDayName(date: Date): DayOfWeek {
  return INDONESIAN_DAYS_BY_JS_DAY[date.getDay()];
}

export function formatIndonesianDate(date: Date): string {
  const dayName = getIndonesianDayName(date);
  const dayNum = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

export function formatClockHMS(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatClockHM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatCountdownReadable(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Sekarang';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs} jam ${mins} mnt`;
  }
  if (mins > 0) {
    return `${mins} mnt ${secs} dtk`;
  }
  return `${secs} detik`;
}

export interface NextBellResult {
  item: ScheduleItem;
  dayName: DayOfWeek;
  dayOffset: number; // 0 = today, 1 = tomorrow, etc.
  remainingSeconds: number;
}

export function getNextScheduledBell(
  now: Date,
  items: ScheduleItem[]
): NextBellResult | null {
  const enabledItems = items.filter((item) => item.enabled && item.days.length > 0);
  if (enabledItems.length === 0) return null;

  const currentSecondsOfDay =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const todayName = getIndonesianDayName(now);
  const todayIdx = ALL_DAYS.indexOf(todayName);

  for (let offset = 0; offset < 7; offset++) {
    const checkDay = ALL_DAYS[(todayIdx + offset) % 7];
    const dayItems = enabledItems
      .filter((item) => item.days.includes(checkDay))
      .sort((a, b) => a.time.localeCompare(b.time));

    for (const item of dayItems) {
      const [hh, mm] = item.time.split(':').map(Number);
      if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
      const itemSeconds = hh * 3600 + mm * 60;
      const diff = offset * 86400 + itemSeconds - currentSecondsOfDay;
      if (diff > 0) {
        return {
          item,
          dayName: checkDay,
          dayOffset: offset,
          remainingSeconds: diff,
        };
      }
    }
  }

  return null;
}

export function formatDaysSummary(days: DayOfWeek[]): string {
  if (days.length === 7) return 'Setiap Hari';
  const weekdays: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const monToThu: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis'];
  const monToSat: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const hasAll = (target: DayOfWeek[]) =>
    days.length === target.length && target.every((d) => days.includes(d));

  if (hasAll(monToSat)) return 'Senin – Sabtu';
  if (hasAll(weekdays)) return 'Senin – Jumat';
  if (hasAll(monToThu)) return 'Senin – Kamis';

  const shortMap: Record<DayOfWeek, string> = {
    Senin: 'Sen',
    Selasa: 'Sel',
    Rabu: 'Rab',
    Kamis: 'Kam',
    Jumat: 'Jum',
    Sabtu: 'Sab',
    Minggu: 'Min',
  };

  return ALL_DAYS.filter((d) => days.includes(d))
    .map((d) => shortMap[d])
    .join(', ');
}
