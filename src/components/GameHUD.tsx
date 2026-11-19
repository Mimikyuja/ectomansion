import React, { useRef, useState } from 'react';
import {
  Crosshair,
  Gamepad2,
  Heart,
  KeyRound,
  MapPin,
  Pause,
  Snowflake,
  Sun,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import { HudSnapshot, TrapType, UpgradesState } from '../game/types';
import { TranslationBundle } from '../i18n/translations';

interface GameHUDProps {
  t: TranslationBundle;
  hud: HudSnapshot;
  missionTitle: string;
  upgrades: UpgradesState;
  muted: boolean;
  touchEnabled: boolean;
  onToggleTouch: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerFlash: () => void;
  onDeployTrap: (type: TrapType) => void;
  onJoystickChange: (x: number, y: number) => void;
  onVacuumHoldChange: (active: boolean) => void;
  onSlamOrDash: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  t,
  hud,
  missionTitle,
  upgrades,
  muted,
  touchEnabled,
  onToggleTouch,
  onToggleMute,
  onPause,
  onTriggerFlash,
  onDeployTrap,
  onJoystickChange,
  onVacuumHoldChange,
  onSlamOrDash,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const bossInfo = hud.bossNameKey
    ? t.bosses[hud.bossNameKey as keyof TranslationBundle['bosses']]
    : null;
  const bossPct = Math.max(
    0,
    Math.min(100, (hud.bossHp / Math.max(1, hud.bossMaxHp)) * 100),
  );

  const radioText =
    hud.radioMessageKey && hud.radioMessageKey in t.hud
      ? t.hud[hud.radioMessageKey as keyof TranslationBundle['hud']]
      : null;

  // Virtual Joystick state
  const joyRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [vacPressed, setVacPressed] = useState(false);

  const updateStickFromPointer = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobOffset({ x: dx, y: dy });
    onJoystickChange(dx / maxR, dy / maxR);
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onJoystickChange(0, 0);
  };

  const slamReady = hud.surgeCharge >= 95 && hud.isPulling;

  const roomName = t.rooms[hud.currentRoomNameKey] || hud.currentRoomNameKey;
  const objectiveText = t.objectives[hud.objectiveKey] || '';

  // Compute compact minimap grid bounds
  const minGx = hud.minimapRooms.length ? Math.min(...hud.minimapRooms.map((r) => r.gx)) : 0;
  const maxGx = hud.minimapRooms.length ? Math.max(...hud.minimapRooms.map((r) => r.gx)) : 0;
  const minGz = hud.minimapRooms.length ? Math.min(...hud.minimapRooms.map((r) => r.gz)) : 0;
  const maxGz = hud.minimapRooms.length ? Math.max(...hud.minimapRooms.map((r) => r.gz)) : 0;
  const cols = maxGx - minGx + 1;
  const rows = maxGz - minGz + 1;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* TOP PERIMETER CLUSTER */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left: Kid Health, Ecto-Energy, Surge Gauge, Keys */}
        <div className="pointer-events-auto flex flex-col gap-1.5 bg-[#0c111f]/90 border border-slate-700/80 rounded-xl px-3 py-2 min-w-[148px] sm:min-w-[210px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-rose-400">
              <Heart className="w-4 h-4 fill-current" />
              <span className="font-mono-num text-xs sm:text-sm font-bold text-white">
                {hud.hp}/{hud.maxHp}
              </span>
            </div>
            <span className="font-mono-num text-xs font-bold text-emerald-400">
              +{hud.ectoCollectedInMission} EE
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                hpPct > 40 ? 'bg-emerald-400' : hpPct > 20 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] pt-0.5">
            <span className={hud.surgeCharge >= 95 ? 'text-amber-300 font-bold' : 'text-slate-300'}>
              {hud.surgeCharge >= 95 ? t.hud.slamReady : t.hud.slamCharge}
            </span>
            <span className="font-mono-num text-slate-300">{hud.surgeCharge}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                hud.surgeCharge >= 95 ? 'bg-amber-400' : 'bg-sky-400'
              }`}
              style={{ width: `${hud.surgeCharge}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-800/90 mt-0.5">
            <span className="flex items-center gap-1 font-mono-num font-bold text-amber-300">
              <KeyRound className="w-3.5 h-3.5" />
              {t.hud.keys}: {hud.keysHeld}
            </span>
            <span className="font-mono-num text-slate-300">
              {t.hud.roomsVisited} {hud.roomsVisited}/{hud.totalRooms}
            </span>
          </div>
        </div>

        {/* Top-Center: Current Room, Exploration Objective, & Boss Bar */}
        <div className="flex flex-col items-center gap-1.5 max-w-md flex-1 min-w-0">
          <div className="bg-[#0c111f]/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-center max-w-full">
            <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-300 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">{roomName}</span>
              <span className="hidden sm:inline text-slate-500">·</span>
              <span className="hidden sm:inline text-slate-300 truncate">{missionTitle}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-slate-200 mt-0.5">
              <span className="truncate">{objectiveText}</span>
              {hud.ghostsRemaining > 0 && (
                <span className="font-mono-num font-bold text-emerald-400 shrink-0">
                  ({hud.ghostsRemaining})
                </span>
              )}
            </div>
          </div>

          {bossInfo && (
            <div className="w-full bg-[#1a0f1f]/92 border border-rose-500/50 rounded-xl px-3 py-1.5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1">
                <span className="font-display font-bold text-rose-300 truncate">{bossInfo.name}</span>
                <span className="font-mono-num text-slate-300 shrink-0 ml-2">
                  {hud.bossHp}/{hud.bossMaxHp}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-100"
                  style={{ width: `${bossPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Mansion Minimap + Touch Toggle, Mute & Pause */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onToggleTouch}
              title={t.touch.toggleLabel}
              aria-label={t.touch.toggleLabel}
              className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                touchEnabled
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                  : 'bg-[#0c111f]/90 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              className="p-2.5 rounded-xl bg-[#0c111f]/90 border border-slate-700/80 text-slate-200 hover:text-white cursor-pointer"
              aria-label={muted ? t.hud.unmute : t.hud.mute}
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2.5 rounded-xl bg-[#0c111f]/90 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">{t.hud.pause}</span>
            </button>
          </div>

          {hud.minimapRooms.length > 0 && (
            <div className="bg-[#0c111f]/90 border border-slate-700/80 rounded-xl p-1.5 sm:p-2">
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${cols}, 16px)`,
                  gridTemplateRows: `repeat(${rows}, 16px)`,
                }}
              >
                {hud.minimapRooms.map((r) => {
                  const isCurrent = r.id === hud.currentRoomId;
                  return (
                    <div
                      key={r.id}
                      style={{
                        gridColumnStart: r.gx - minGx + 1,
                        gridRowStart: r.gz - minGz + 1,
                      }}
                      className={`w-4 h-4 rounded-[3px] border flex items-center justify-center relative ${
                        isCurrent
                          ? 'bg-emerald-400 border-white shadow-sm'
                          : r.visited
                            ? 'bg-slate-600/90 border-slate-400/70'
                            : 'bg-slate-900/95 border-slate-700/60'
                      }`}
                    >
                      {r.isGoal && !isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      )}
                      {r.hasLockedDoor && !isCurrent && !r.isGoal && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM LAYER: Radio Hint + Mobile Touch Pads + Trap Hotbar */}
      <div className="flex flex-col gap-2">
        {radioText && (
          <div className="mx-auto px-3.5 py-2 rounded-xl bg-[#131c33]/95 border border-emerald-400/50 text-xs sm:text-sm text-emerald-200 font-medium shadow-lg max-w-xl text-center">
            {radioText}
          </div>
        )}

        {/* MOBILE TOUCH CONTROLS (Left Stick + Right Action Cluster) */}
        {touchEnabled && (
          <div className="flex items-end justify-between gap-2 pb-1">
            {/* Left Virtual Thumbstick */}
            <div
              ref={joyRef}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                activePointerId.current = e.pointerId;
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                updateStickFromPointer(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (activePointerId.current !== e.pointerId) return;
                updateStickFromPointer(e.clientX, e.clientY);
              }}
              onPointerUp={(e) => {
                if (activePointerId.current === e.pointerId) resetStick();
              }}
              onPointerCancel={(e) => {
                if (activePointerId.current === e.pointerId) resetStick();
              }}
              className="pointer-events-auto touch-none relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#0f1628]/80 border-2 border-slate-600/80 flex items-center justify-center shadow-lg"
            >
              <div className="w-16 h-16 rounded-full border border-slate-700/70 pointer-events-none" />
              <div
                className="w-12 h-12 rounded-full bg-emerald-400/90 border-2 border-white/80 shadow-md pointer-events-none"
                style={{
                  transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
                }}
              />
            </div>

            {/* Right Touch Action Buttons */}
            <div className="pointer-events-auto touch-none flex items-end gap-2.5">
              {/* Slam / Dash */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSlamOrDash();
                }}
                className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center text-[10px] font-bold shadow-lg active:scale-95 transition-transform ${
                  slamReady
                    ? 'bg-amber-400 border-white text-slate-950'
                    : 'bg-[#121a2e]/90 border-sky-400/70 text-sky-200'
                }`}
              >
                <span>{slamReady ? t.touch.slam : t.touch.dash}</span>
              </button>

              {/* Strobe Flash */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTriggerFlash();
                }}
                className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold shadow-lg active:scale-95 transition-transform ${
                  hud.strobeCooldownRatio <= 0.02
                    ? 'bg-amber-400/95 border-amber-100 text-slate-950'
                    : 'bg-slate-800/90 border-slate-600 text-slate-400'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>{t.touch.flash}</span>
              </button>

              {/* Hold-to-Vacuum */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  setVacPressed(true);
                  onVacuumHoldChange(true);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  setVacPressed(false);
                  onVacuumHoldChange(false);
                }}
                onPointerCancel={() => {
                  setVacPressed(false);
                  onVacuumHoldChange(false);
                }}
                className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 text-xs font-bold shadow-xl transition-transform ${
                  vacPressed
                    ? 'bg-sky-400 border-white text-slate-950 scale-95'
                    : 'bg-emerald-500/90 border-emerald-200 text-slate-950'
                }`}
              >
                <Wind className="w-6 h-6" />
                <span>{t.touch.vacuum}</span>
              </button>
            </div>
          </div>
        )}

        {/* Trap Hotbar (works on both mobile & desktop) */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-[#0c111f]/90 border border-slate-700/80 rounded-xl px-2.5 sm:px-3 py-1.5">
            {!touchEnabled && (
              <>
                <button
                  onClick={onTriggerFlash}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    hud.strobeCooldownRatio <= 0.02
                      ? 'bg-amber-400/20 border-amber-400/70 text-amber-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t.hud.flashReady}</span>
                </button>
                <div className="w-px h-6 bg-slate-700" />
              </>
            )}

            {(['snare', 'decoy', 'cryo'] as TrapType[]).map((trapKey, idx) => {
              const unlocked = upgrades.traps[trapKey] > 0;
              const count = hud.trapCharges[trapKey];
              const Icon =
                trapKey === 'snare' ? Crosshair : trapKey === 'decoy' ? Sun : Snowflake;
              return (
                <button
                  key={trapKey}
                  disabled={!unlocked || count <= 0}
                  onClick={() => onDeployTrap(trapKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors min-h-[40px] ${
                    !unlocked
                      ? 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
                      : count > 0
                        ? 'bg-slate-800/90 hover:bg-slate-700 border-sky-400/50 text-slate-100 cursor-pointer'
                        : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {!touchEnabled && (
                    <span className="font-mono-num text-[10px] px-1 rounded bg-slate-950 text-slate-300">
                      {idx + 1}
                    </span>
                  )}
                  <Icon className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t.traps[trapKey].short}</span>
                  <span className="font-mono-num text-emerald-400">
                    {unlocked ? `×${count}` : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {!touchEnabled && (
            <p className="text-[11px] text-slate-300 bg-[#0c111f]/80 px-3 py-1 rounded-md hidden sm:block">
              {t.hud.controlBar}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
