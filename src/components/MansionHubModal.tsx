import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  Lock,
  Play,
  Shield,
  Skull,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  MISSIONS,
  TRAP_SPECS,
  VACUUM_UPGRADE_SPECS,
} from '../game/data';
import {
  DifficultyId,
  SaveState,
  TrapType,
  VacuumUpgradeKey,
} from '../game/types';
import { TranslationBundle } from '../i18n/translations';
import { ScientistPortraitSvg } from './Icons';

interface MansionHubModalProps {
  t: TranslationBundle;
  save: SaveState;
  onSelectMission: (missionId: number) => void;
  onUpgradeVacuum: (key: VacuumUpgradeKey) => void;
  onUpgradeTrap: (key: TrapType) => void;
  onChangeDifficulty: (diff: DifficultyId) => void;
  onBackToTitle: () => void;
}

const DIFFICULTIES: DifficultyId[] = ['easy', 'normal', 'hard', 'nightmare'];

export const MansionHubModal: React.FC<MansionHubModalProps> = ({
  t,
  save,
  onSelectMission,
  onUpgradeVacuum,
  onUpgradeTrap,
  onChangeDifficulty,
  onBackToTitle,
}) => {
  const [tab, setTab] = useState<'missions' | 'upgrades'>('missions');

  const defeatedBosses = [3, 6, 8, 10].filter((id) => Boolean(save.missionRanks[id])).length;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#070a12]/92">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#11172a] border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Top Lab Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-slate-800 bg-[#0d1221]">
          <div className="flex items-center gap-3.5">
            <ScientistPortraitSvg className="w-12 h-12 shrink-0 rounded-lg border border-emerald-500/40" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-white">
                  {t.hub.labTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-300 max-w-md">
                {t.hub.scientistQuote}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">{t.hub.fragmentsLabel}</div>
              <div className="font-mono-num text-base font-bold text-purple-300">
                {defeatedBosses} / 4
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">{t.hub.capturedTotal}</div>
              <div className="font-mono-num text-base font-bold text-sky-300">
                {save.totalCaptured}
              </div>
            </div>
            <div className="text-right px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40">
              <div className="text-[11px] text-emerald-300">{t.hub.ectoBalance}</div>
              <div className="font-mono-num text-lg font-bold text-emerald-400">
                {save.ectoEnergy} EE
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs + Difficulty Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-[#0f1526]">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#090d18]">
            <button
              onClick={() => setTab('missions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'missions'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>{t.hub.tabMissions}</span>
            </button>
            <button
              onClick={() => setTab('upgrades')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'upgrades'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>{t.hub.tabUpgrades}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{t.difficultyLabel}:</span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#090d18]">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => onChangeDifficulty(d)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    save.difficulty === d
                      ? d === 'nightmare'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.difficulties[d].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scroll p-5">
          {tab === 'missions' ? (
            <div className="space-y-6">
              {([1, 2, 3, 4] as const).map((wingNum) => {
                const wingMissions = MISSIONS.filter((m) => m.wing === wingNum);
                return (
                  <div key={wingNum}>
                    <h3 className="text-xs font-bold tracking-wider text-amber-300 mb-3">
                      {t.hub.wingNames[wingNum]}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {wingMissions.map((m) => {
                        const unlocked = m.id <= save.highestUnlockedMission;
                        const rank = save.missionRanks[m.id];
                        const mText = t.missions[m.id];
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col justify-between p-4 rounded-xl border transition-colors ${
                              !unlocked
                                ? 'bg-[#0b0f1d] border-slate-800/80 opacity-60'
                                : m.isBoss
                                  ? 'bg-[#1b1328] border-rose-500/45'
                                  : 'bg-[#151d33] border-slate-700/80'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <span className="font-display text-base font-bold text-white leading-snug">
                                  {mText.title}
                                </span>
                                {m.isBoss && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold shrink-0">
                                    <Skull className="w-3 h-3" />
                                    {t.hub.bossTag}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                {mText.briefing}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                              <div className="flex items-center gap-2 text-xs font-mono-num">
                                <span className="text-emerald-400 font-semibold">
                                  +{m.baseReward} EE
                                </span>
                                {rank && (
                                  <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    {t.modals.rankLabel} {rank}
                                  </span>
                                )}
                              </div>

                              {unlocked ? (
                                <button
                                  onClick={() => onSelectMission(m.id)}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>{t.hub.playMission}</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                                  <Lock className="w-3.5 h-3.5" />
                                  {t.hub.locked}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vacuum Upgrades */}
              <div>
                <h3 className="text-xs font-bold tracking-wider text-emerald-400 mb-3">
                  {t.hub.upgradeSectionVacuum}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VACUUM_UPGRADE_SPECS.map((spec) => {
                    const lvl = save.upgrades[spec.key];
                    const isMax = lvl >= spec.maxLevel;
                    const cost = isMax ? 0 : spec.costs[lvl - 1];
                    const canAfford = !isMax && save.ectoEnergy >= cost;
                    const info = t.upgrades[spec.key];
                    const Icon =
                      spec.key === 'suction'
                        ? Zap
                        : spec.key === 'strobe'
                          ? Sparkles
                          : spec.key === 'slam'
                            ? Wrench
                            : Shield;

                    return (
                      <div
                        key={spec.key}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#151d33] border border-slate-700/80"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm font-bold text-white">
                                {info.name}
                              </span>
                              <span className="font-mono-num text-xs text-amber-300 font-semibold">
                                {t.hub.levelLabel} {lvl}/{spec.maxLevel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">{info.desc}</p>
                            {/* Level bar */}
                            <div className="flex gap-1 mt-2">
                              {Array.from({ length: spec.maxLevel }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`h-1.5 w-6 rounded-sm ${
                                    idx < lvl ? 'bg-emerald-400' : 'bg-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={!canAfford || isMax}
                          onClick={() => onUpgradeVacuum(spec.key)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold font-mono-num shrink-0 transition-colors ${
                            isMax
                              ? 'bg-slate-800 text-slate-400 cursor-default'
                              : canAfford
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isMax ? t.hub.maxed : `${t.hub.upgradeBtn} · ${cost}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Traps */}
              <div>
                <h3 className="text-xs font-bold tracking-wider text-sky-400 mb-3">
                  {t.hub.upgradeSectionTraps}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TRAP_SPECS.map((spec) => {
                    const lvl = save.upgrades.traps[spec.key];
                    const isMax = lvl >= spec.maxLevel;
                    const cost = isMax ? 0 : spec.costs[lvl];
                    const canAfford = !isMax && save.ectoEnergy >= cost;
                    const info = t.traps[spec.key];

                    return (
                      <div
                        key={spec.key}
                        className="flex flex-col justify-between p-4 rounded-xl bg-[#151d33] border border-slate-700/80"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-display text-sm font-bold text-white">
                              {info.name}
                            </span>
                            <span className="font-mono-num text-xs text-sky-300 font-semibold">
                              {lvl === 0 ? '—' : `${t.hub.levelLabel} ${lvl}/${spec.maxLevel}`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mb-4">
                            {info.desc}
                          </p>
                        </div>

                        <button
                          disabled={!canAfford || isMax}
                          onClick={() => onUpgradeTrap(spec.key)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono-num transition-colors ${
                            isMax
                              ? 'bg-slate-800 text-slate-400 cursor-default'
                              : canAfford
                                ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isMax
                            ? t.hub.maxed
                            : `${lvl === 0 ? t.hub.unlockBtn : t.hub.upgradeBtn} · ${cost} EE`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-[#0d1221]">
          <button
            onClick={onBackToTitle}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.hub.backToTitle}</span>
          </button>
          <span className="text-xs text-slate-400">{t.controlsHint}</span>
        </div>
      </div>
    </div>
  );
};
