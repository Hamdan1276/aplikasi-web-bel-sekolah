import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import { formatClockHMS, formatIndonesianDate } from '../utils/timeUtils';
import { AlHudaLogo } from './AlHudaLogo';

interface LoginViewProps {
  schoolName: string;
  onLoginSuccess: (rememberMe: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  schoolName,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    if (cleanUser === 'madrasah' && password === 'aliyah') {
      setErrorMsg('');
      onLoginSuccess(rememberMe);
    } else {
      setErrorMsg('Nama pengguna atau kata sandi tidak sesuai. Silakan periksa kembali.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 items-stretch bg-[#F8F7F2] text-[#13221C]">
      {/* Left Islamic Architectural Showcase Panel */}
      <section className="lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-[#041B14] via-[#082E22] to-[#0E4332] text-[#FAF8F2] flex flex-col justify-between p-7 sm:p-10 lg:p-14">
        {/* Intricate Islamic Geometric Star & Mihrab Lattice Pattern */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09] text-[#E5C167]"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="islamic-khatam-grid"
              width="96"
              height="96"
              patternUnits="userSpaceOnUse"
            >
              {/* Outer diamond */}
              <path
                d="M48 4 L92 48 L48 92 L4 48 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              {/* Intersecting square (Rub el Hizb 8-point star) */}
              <rect
                x="17"
                y="17"
                width="62"
                height="62"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              {/* Inner octagon & center rosette */}
              <circle
                cx="48"
                cy="48"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.9"
              />
              <circle
                cx="48"
                cy="48"
                r="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.9"
              />
              {/* Corner accents */}
              <circle
                cx="0"
                cy="0"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.7"
              />
              <circle
                cx="96"
                cy="0"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.7"
              />
              <circle
                cx="0"
                cy="96"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.7"
              />
              <circle
                cx="96"
                cy="96"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.7"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-khatam-grid)" />
        </svg>

        {/* Subtle Decorative Mihrab Arch Silhouette on Right Edge */}
        <svg
          aria-hidden="true"
          viewBox="0 0 320 420"
          className="pointer-events-none hidden lg:block absolute -right-12 bottom-0 h-[78%] w-auto opacity-[0.08] text-[#E5C167]"
          fill="none"
        >
          <path
            d="M30 420 V190 C30 110 95 45 160 15 C225 45 290 110 290 190 V420"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M58 420 V195 C58 128 110 72 160 45 C210 72 262 128 262 195 V420"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M160 72 L182 110 L160 148 L138 110 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>

        {/* Top: Basmalah & Brand */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3.5">
            <AlHudaLogo className="h-14 w-14 drop-shadow-sm" />
            <div>
              <div className="text-sm font-bold tracking-tight text-[#FAF8F2]">
                Bel Madrasah Aliyah
              </div>
              <div className="text-xs text-[#E5C167]">
                {schoolName || 'MA Al-Huda'}
              </div>
            </div>
          </div>

          <div className="pt-2 lg:pt-8 space-y-4 max-w-xl">
            <p
              dir="rtl"
              lang="ar"
              className="font-arabic text-2xl sm:text-3xl font-bold text-[#E7C66D] tracking-wide"
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>
            <p className="text-xs sm:text-sm font-medium text-[#B8D4C6]">
              Assalamu&apos;alaikum Warahmatullahi Wabarakatuh
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.15] text-[#FAF8F2] text-balance">
              Sistem Kendali Bel &amp; Siaran Otomatis Madrasah Aliyah Al-Huda
            </h1>
            <p className="text-sm sm:text-base text-[#CCE0D5]/85 leading-relaxed max-w-lg">
              Mengatur ketepatan waktu kegiatan belajar mengajar, tadarus pagi,
              sholat berjamaah, serta pelaksanaan asesmen di lingkungan{' '}
              {schoolName || 'MA Al-Huda'}.
            </p>
          </div>
        </div>

        {/* Bottom: Live Madrasah Digital Clock & Operational Notes */}
        <div className="relative z-10 mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-[#B5D1C3] mb-1">
              Waktu Madrasah Saat Ini
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold tabular-nums text-[#FAF8F2]">
              {formatClockHMS(now)}
            </div>
            <div className="text-xs sm:text-sm text-[#E5C167] mt-0.5">
              {formatIndonesianDate(now)}
            </div>
          </div>

          <div className="text-xs text-[#B8D4C6] space-y-1 sm:text-right">
            <div>24 Nada Lonceng Islami &amp; Nusantara</div>
            <div>12 Karakter Suara Bahasa Indonesia</div>
          </div>
        </div>
      </section>

      {/* Right Login Form Panel */}
      <section className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md bg-white border border-[#E2E6DD] rounded-2xl p-7 sm:p-9 shadow-sm space-y-6">
          {/* Form Header with Subtle Mihrab Crest */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-[#0B3B2C]">
              <svg
                aria-hidden="true"
                viewBox="0 0 32 32"
                className="h-6 w-6 text-[#B88628] shrink-0"
                fill="none"
              >
                <path
                  d="M6 27V14C6 8.8 10.6 4.8 16 3C21.4 4.8 26 8.8 26 14V27"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 9L19.5 14.5L16 20L12.5 14.5L16 9Z"
                  stroke="#0B3B2C"
                  strokeWidth="1.75"
                />
              </svg>
              <span className="text-xs font-bold tracking-wide text-[#0B3B2C]">
                {schoolName || 'MA Al-Huda'}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[#13221C]">
              Masuk Ruang Kendali
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B62] leading-relaxed">
              Masukkan nama pengguna dan kata sandi operator untuk mengakses
              jadwal serta perangkat bel.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-700"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-[#2A3B33] mb-1.5"
              >
                Nama Pengguna
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-[#73847B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama pengguna"
                  className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#CFD7CE] text-sm text-[#13221C] placeholder:text-[#88988F] focus:outline-none focus:ring-2 focus:ring-[#0B3B2C] focus:border-[#0B3B2C]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#2A3B33] mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#73847B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full h-11 pl-10 pr-11 rounded-lg border border-[#CFD7CE] text-sm text-[#13221C] placeholder:text-[#88988F] focus:outline-none focus:ring-2 focus:ring-[#0B3B2C] focus:border-[#0B3B2C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? 'Sembunyikan kata sandi'
                      : 'Tampilkan kata sandi'
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-[#6E7F76] hover:text-[#13221C] hover:bg-[#F2F5F0]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#4C5D54]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#C8D1C7] text-[#0B3B2C] focus:ring-[#0B3B2C]"
                />
                <span>Biarkan tetap masuk di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] text-[#FAF8F2] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <LogIn className="h-4 w-4 text-[#E5C167]" />
              <span>Masuk ke Aplikasi</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#EAECE6] text-center text-xs text-[#64736A]">
            Panel Operator Bel Otomatis · {schoolName || 'MA Al-Huda'}
          </div>
        </div>
      </section>
    </div>
  );
};
