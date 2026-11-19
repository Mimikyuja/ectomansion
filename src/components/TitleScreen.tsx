import React, { useEffect } from 'react';
import { Volume2, VolumeX, Play, FlaskConical, Film } from 'lucide-react';
import { DifficultyId, Language } from '../game/types';
import { TranslationBundle } from '../i18n/translations';
import { GameLogoSvg } from './Icons';

interface TitleScreenProps {
  t: TranslationBundle;
  language: Language;
  difficulty: DifficultyId;
  hasProgress: boolean;
  muted: boolean;
  onChangeLanguage: (lang: Language) => void;
  onChangeDifficulty: (diff: DifficultyId) => void;
  onStart: () => void;
  onOpenLab: () => void;
  onPlayCinematic: () => void;
  onToggleMute: () => void;
  onUnlockAudio: () => void;
}

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
];

const DIFFICULTY_ORDER: DifficultyId[] = ['easy', 'normal', 'hard', 'nightmare'];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  t,
  language,
  difficulty,
  hasProgress,
  muted,
  onChangeLanguage,
  onChangeDifficulty,
  onStart,
  onOpenLab,
  onPlayCinematic,
  onToggleMute,
  onUnlockAudio,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onUnlockAudio();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart, onUnlockAudio]);

  return (
    <div
      onPointerDown={onUnlockAudio}
      className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-8 pointer-events-none bg-gradient-to-b from-[#080b14]/75 via-transparent to-[#080b14]/88"
    >
      {/* Top Bar: Language Switcher & Audio */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto">
        <div
          className="flex items-center gap-1 p-1 rounded-lg bg-[#0f1526]/92 border border-slate-700/80"
          role="group"
          aria-label={t.languageLabel}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => onChangeLanguage(l.id)}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                language === l.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f1526]/92 border border-slate-700/80 text-slate-200 hover:text-white hover:border-emerald-400/60 transition-colors text-xs font-semibold cursor-pointer"
          aria-label={muted ? t.hud.unmute : t.hud.mute}
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="hidden sm:inline">{muted ? t.hud.unmute : t.hud.mute}</span>
        </button>
      </div>

      {/* Center-Bottom Hero Lockup & Controls */}
      <div className="flex flex-col items-center gap-4 sm:gap-6 my-auto pointer-events-auto max-w-2xl mx-auto w-full">
        <GameLogoSvg title={t.gameTitle} subtitle={t.gameSubtitle} />

        {/* Difficulty Selector Panel */}
        <div className="w-full rounded-xl bg-[#0e1424]/92 border border-slate-700/80 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-semibold text-slate-300 tracking-wide">
              {t.difficultyLabel}
            </span>
            <span className="text-xs text-amber-300 font-medium">
              {t.difficulties[difficulty].desc}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTY_ORDER.map((d) => {
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => onChangeDifficulty(d)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer border whitespace-nowrap ${
                    active
                      ? d === 'nightmare'
                        ? 'bg-rose-500 text-white border-rose-400'
                        : d === 'hard'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {t.difficulties[d].name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display text-lg font-bold shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{hasProgress ? t.continueGame : t.startNew}</span>
          </button>

          {hasProgress && (
            <>
              <button
                onClick={onOpenLab}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#131b30]/95 hover:bg-[#1b2642] text-slate-100 border border-slate-600 font-semibold text-sm transition-colors cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 text-amber-400" />
                <span>{t.openLab}</span>
              </button>
              <button
                onClick={onPlayCinematic}
                className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-[#131b30]/95 hover:bg-[#1b2642] text-slate-200 border border-slate-700 font-semibold text-sm transition-colors cursor-pointer"
                aria-label="Replay Intro"
              >
                <Film className="w-4 h-4 text-sky-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Single Clean Control Hint Line */}
      <div className="text-center pointer-events-none hidden sm:block">
        <p className="inline-block px-4 py-1.5 rounded-lg bg-[#0c111f]/90 border border-slate-800 text-xs text-slate-300">
          {t.controlsHint}
        </p>
      </div>
    </div>
  );
};
