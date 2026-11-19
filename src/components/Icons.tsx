import React from 'react';

export const GameLogoSvg: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className="flex flex-col items-center text-center select-none">
    <svg
      viewBox="0 0 88 88"
      className="w-16 h-16 mb-2 drop-shadow-[0_6px_18px_rgba(52,211,153,0.45)]"
      aria-hidden="true"
    >
      {/* Haunted Moon & Mansion Silhouette Emblem */}
      <circle cx="44" cy="44" r="38" fill="#13192b" stroke="#34d399" strokeWidth="2.5" />
      <circle cx="56" cy="28" r="14" fill="#fef08a" opacity="0.88" />
      {/* Playful Ghost */}
      <path
        d="M32 52 C32 36, 54 36, 54 52 L54 64 L48 59 L43 64 L38 59 L32 64 Z"
        fill="#34d399"
      />
      <circle cx="39" cy="46" r="2.4" fill="#0b0e17" />
      <circle cx="47" cy="46" r="2.4" fill="#0b0e17" />
      {/* Vacuum Suction Beam */}
      <path d="M14 34 L31 44 L31 53 L14 44 Z" fill="#38bdf8" opacity="0.65" />
      <rect x="8" y="32" width="9" height="14" rx="2" fill="#f59e0b" />
    </svg>
    <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
      {title}
    </h1>
    <p className="mt-1 text-sm sm:text-base font-semibold tracking-widest text-emerald-400">
      {subtitle}
    </p>
  </div>
);

export const ScientistPortraitSvg: React.FC<{ className?: string }> = ({
  className = 'w-16 h-16',
}) => (
  <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
    <rect width="80" height="80" rx="14" fill="#172036" />
    {/* Lab coat shoulders */}
    <path d="M12 80 C12 58, 68 58, 68 80 Z" fill="#e2e8f0" />
    <path d="M32 62 L40 76 L48 62 Z" fill="#10b981" />
    {/* Wild scientist hair */}
    <path
      d="M16 36 Q10 18 26 20 Q34 8 44 16 Q58 8 62 24 Q72 28 64 40 Z"
      fill="#cbd5e1"
    />
    {/* Face */}
    <circle cx="40" cy="39" r="17" fill="#fcd3b4" />
    {/* Glowing lab goggles */}
    <rect x="21" y="30" width="38" height="12" rx="4" fill="#334155" />
    <circle cx="31" cy="36" r="6.5" fill="#38bdf8" stroke="#f59e0b" strokeWidth="2" />
    <circle cx="49" cy="36" r="6.5" fill="#34d399" stroke="#f59e0b" strokeWidth="2" />
    <circle cx="32.5" cy="34.5" r="2" fill="#ffffff" />
    <circle cx="50.5" cy="34.5" r="2" fill="#ffffff" />
    {/* Mustache & grin */}
    <path d="M27 49 Q40 43 53 49 Q46 53 40 50 Q34 53 27 49 Z" fill="#94a3b8" />
  </svg>
);
