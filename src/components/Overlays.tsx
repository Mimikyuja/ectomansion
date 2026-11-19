import React, { useState } from 'react';
import { ArrowRight, Play, RotateCcw, Trophy, FlaskConical, Skull } from 'lucide-react';
import { Language, MissionResult } from '../game/types';
import { TranslationBundle } from '../i18n/translations';
import { ScientistPortraitSvg } from './Icons';

interface CinematicOverlayProps {
  t: TranslationBundle;
  beat: number;
  onAdvance: () => void;
  onSkip: () => void;
}

export const CinematicOverlay: React.FC<CinematicOverlayProps> = ({
  t,
  beat,
  onAdvance,
  onSkip,
}) => {
  const beats = t.cinematic.beats;
  const clampedBeat = Math.min(beats.length - 1, Math.max(0, beat));
  const isLast = clampedBeat >= beats.length - 1;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Skip button */}
      <div className="flex justify-end pointer-events-auto">
        <button
          onClick={onSkip}
          className="px-4 py-2 rounded-xl bg-[#0c111f]/90 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
        >
          {t.cinematic.skip}
        </button>
      </div>

      {/* Bottom Subtitle Letterbox Panel (leaves 3D cutscene center unobstructed) */}
      <div className="pointer-events-auto w-full max-w-2xl mx-auto rounded-2xl bg-[#0c111f]/94 border border-emerald-500/45 p-4 sm:p-5 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <ScientistPortraitSvg className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl border border-emerald-400/50" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] sm:text-xs font-bold text-emerald-400">
              {t.cinematic.speaker}
            </div>
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed mt-1">
              {beats[clampedBeat]}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {beats.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === clampedBeat
                    ? 'w-6 bg-emerald-400'
                    : idx < clampedBeat
                      ? 'w-2 bg-emerald-700'
                      : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={onAdvance}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <span>{isLast ? t.cinematic.startNow : t.intro.next}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface IntroStoryModalProps {
  t: TranslationBundle;
  onComplete: () => void;
}

export const IntroStoryModal: React.FC<IntroStoryModalProps> = ({ t, onComplete }) => {
  const [slide, setSlide] = useState(0);
  const slides = t.intro.slides;
  const isLast = slide >= slides.length - 1;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070a12]/90">
      <div className="w-full max-w-lg rounded-2xl bg-[#11172a] border border-emerald-500/40 p-6 shadow-2xl">
        <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-800">
          <ScientistPortraitSvg className="w-14 h-14 shrink-0 rounded-xl border border-emerald-400/50" />
          <div>
            <div className="text-xs font-bold text-emerald-400">{t.intro.speaker}</div>
            <h2 className="font-display text-xl font-bold text-white mt-0.5">
              {slides[slide].title}
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-200 leading-relaxed min-h-[84px]">
          {slides[slide].body}
        </p>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === slide ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onComplete}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              {t.intro.skip}
            </button>
            <button
              onClick={() => (isLast ? onComplete() : setSlide((s) => s + 1))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer transition-colors"
            >
              <span>{isLast ? t.intro.deploy : t.intro.next}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PauseModalProps {
  t: TranslationBundle;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  onResume: () => void;
  onRestart: () => void;
  onToLab: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  t,
  language,
  onChangeLanguage,
  onResume,
  onRestart,
  onToLab,
}) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070a12]/85">
    <div className="w-full max-w-sm rounded-2xl bg-[#11172a] border border-slate-700 p-6 shadow-2xl">
      <h2 className="font-display text-2xl font-bold text-white text-center mb-5">
        {t.modals.pausedTitle}
      </h2>

      <div className="flex items-center justify-center gap-1.5 p-1 rounded-lg bg-[#090d18] mb-5">
        {(['es', 'en', 'ja'] as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => onChangeLanguage(l)}
            className={`flex-1 py-1.5 rounded text-xs font-semibold cursor-pointer ${
              language === l ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            {l === 'es' ? 'Español' : l === 'en' ? 'English' : '日本語'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={onResume}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{t.modals.resume}</span>
        </button>
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.modals.restart}</span>
        </button>
        <button
          onClick={onToLab}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm cursor-pointer"
        >
          <FlaskConical className="w-4 h-4 text-amber-400" />
          <span>{t.modals.toLab}</span>
        </button>
      </div>
    </div>
  </div>
);

interface VictoryModalProps {
  t: TranslationBundle;
  result: MissionResult;
  onNextMission: () => void;
  onToLab: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  t,
  result,
  onNextMission,
  onToLab,
}) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070a12]/88">
    <div className="w-full max-w-md rounded-2xl bg-[#11172a] border border-emerald-500/50 p-6 shadow-2xl text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mx-auto mb-3 text-emerald-400">
        <Trophy className="w-7 h-7" />
      </div>
      <h2 className="font-display text-2xl font-bold text-white">
        {result.isFinalVictory ? t.modals.finalVictoryTitle : t.modals.victoryTitle}
      </h2>
      {result.isFinalVictory && (
        <p className="text-sm text-emerald-200 mt-2 leading-relaxed">
          {t.modals.finalVictoryBody}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 my-5 text-left">
        <div className="p-3 rounded-xl bg-[#0c111f] border border-slate-800">
          <div className="text-xs text-slate-400">{t.modals.rankLabel}</div>
          <div className="font-display text-2xl font-bold text-amber-300">{result.rank}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#0c111f] border border-slate-800">
          <div className="text-xs text-slate-400">{t.modals.ectoEarned}</div>
          <div className="font-mono-num text-xl font-bold text-emerald-400">
            +{result.ectoEarned} EE
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#0c111f] border border-slate-800">
          <div className="text-xs text-slate-400">{t.modals.ghostsCaptured}</div>
          <div className="font-mono-num text-lg font-bold text-white">
            {result.ghostsCaptured}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#0c111f] border border-slate-800">
          <div className="text-xs text-slate-400">{t.modals.timeTaken}</div>
          <div className="font-mono-num text-lg font-bold text-white">
            {result.timeSeconds}s
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={onToLab}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
        >
          <FlaskConical className="w-4 h-4 text-amber-400" />
          <span>{t.modals.toLab}</span>
        </button>
        {!result.isFinalVictory && (
          <button
            onClick={onNextMission}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer"
          >
            <span>{t.modals.nextMission}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  </div>
);

interface DefeatModalProps {
  t: TranslationBundle;
  onRetry: () => void;
  onToLab: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({ t, onRetry, onToLab }) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070a12]/88">
    <div className="w-full max-w-md rounded-2xl bg-[#11172a] border border-rose-500/50 p-6 shadow-2xl text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center mx-auto mb-3 text-rose-400">
        <Skull className="w-7 h-7" />
      </div>
      <h2 className="font-display text-2xl font-bold text-white">{t.modals.defeatTitle}</h2>
      <p className="text-sm text-slate-300 mt-2 mb-6 leading-relaxed">
        {t.modals.defeatBody}
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={onToLab}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
        >
          <FlaskConical className="w-4 h-4 text-amber-400" />
          <span>{t.modals.toLab}</span>
        </button>
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.modals.retry}</span>
        </button>
      </div>
    </div>
  </div>
);
