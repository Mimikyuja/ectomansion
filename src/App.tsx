/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { MansionHubModal } from './components/MansionHubModal';
import {
  CinematicOverlay,
  DefeatModal,
  PauseModal,
  VictoryModal,
} from './components/Overlays';
import { TitleScreen } from './components/TitleScreen';
import { GameEngine } from './game/GameEngine';
import {
  MISSIONS,
  TRAP_SPECS,
  VACUUM_UPGRADE_SPECS,
  loadSaveState,
  persistSaveState,
} from './game/data';
import {
  DifficultyId,
  HudSnapshot,
  Language,
  MissionResult,
  SaveState,
  ScreenMode,
  TrapType,
  VacuumUpgradeKey,
} from './game/types';
import { TRANSLATIONS } from './i18n/translations';

const INITIAL_HUD: HudSnapshot = {
  hp: 100,
  maxHp: 100,
  ectoCollectedInMission: 0,
  surgeCharge: 0,
  strobeCooldownRatio: 0,
  dashCooldownRatio: 0,
  waveIndex: 1,
  totalWaves: 1,
  ghostsRemaining: 0,
  totalGhostsInWave: 0,
  capturedCount: 0,
  elapsedSeconds: 0,
  isPulling: false,
  bossNameKey: null,
  bossHp: 0,
  bossMaxHp: 1,
  bossPhase: 1,
  trapCharges: { snare: 2, decoy: 0, cryo: 0 },
  radioMessageKey: null,
  currentRoomId: 'porch',
  currentRoomNameKey: 'porch',
  objectiveKey: 'explore',
  keysHeld: 0,
  roomsVisited: 1,
  totalRooms: 4,
  minimapRooms: [],
};

const RANK_WEIGHT: Record<'S' | 'A' | 'B', number> = { S: 3, A: 2, B: 1 };

function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 900
  );
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [save, setSave] = useState<SaveState>(() => loadSaveState());
  const [screen, setScreen] = useState<ScreenMode>('title');
  const [cineBeat, setCineBeat] = useState(0);
  const [activeMissionId, setActiveMissionId] = useState<number>(1);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [lastResult, setLastResult] = useState<MissionResult | null>(null);
  const [touchEnabled, setTouchEnabled] = useState<boolean>(() => detectTouchDevice());

  const saveRef = useRef(save);
  saveRef.current = save;

  const updateSave = useCallback((updater: (prev: SaveState) => SaveState) => {
    setSave((prev) => {
      const next = updater(prev);
      persistSaveState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const engine = new GameEngine(el, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onMissionComplete: (result) => {
        setLastResult(result);
        setScreen('victory');
        engine.audio.setMusicTheme('title');
        updateSave((prev) => {
          const prevRank = prev.missionRanks[result.missionId];
          const bestRank =
            prevRank && RANK_WEIGHT[prevRank] > RANK_WEIGHT[result.rank]
              ? prevRank
              : result.rank;
          return {
            ...prev,
            ectoEnergy: prev.ectoEnergy + result.ectoEarned,
            totalCaptured: prev.totalCaptured + result.ghostsCaptured,
            highestUnlockedMission: Math.min(
              10,
              Math.max(prev.highestUnlockedMission, result.missionId + 1),
            ),
            missionRanks: {
              ...prev.missionRanks,
              [result.missionId]: bestRank,
            },
          };
        });
      },
      onMissionFailed: () => {
        engine.audio.setMusicTheme('title');
        setScreen('gameover');
      },
      onTogglePause: () => {
        setScreen((curr) => {
          if (curr === 'playing') {
            engine.setPaused(true);
            return 'paused';
          }
          if (curr === 'paused') {
            engine.setPaused(false);
            return 'playing';
          }
          return curr;
        });
      },
    });

    engine.audio.setMuted(saveRef.current.muted);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [updateSave]);

  const t = TRANSLATIONS[save.language];

  const handleUnlockAudio = useCallback(() => {
    engineRef.current?.audio.unlock();
  }, []);

  const handleChangeLanguage = useCallback(
    (lang: Language) => {
      updateSave((prev) => ({ ...prev, language: lang }));
    },
    [updateSave],
  );

  const handleChangeDifficulty = useCallback(
    (difficulty: DifficultyId) => {
      updateSave((prev) => ({ ...prev, difficulty }));
    },
    [updateSave],
  );

  const handleToggleMute = useCallback(() => {
    updateSave((prev) => {
      const nextMuted = !prev.muted;
      engineRef.current?.audio.setMuted(nextMuted);
      if (!nextMuted) engineRef.current?.audio.unlock();
      return { ...prev, muted: nextMuted };
    });
  }, [updateSave]);

  const launchMission = useCallback((missionId: number) => {
    const mission = MISSIONS.find((m) => m.id === missionId) || MISSIONS[0];
    setActiveMissionId(mission.id);
    setLastResult(null);
    setScreen('playing');
    engineRef.current?.startMission(
      mission,
      saveRef.current.difficulty,
      saveRef.current.upgrades,
    );
  }, []);

  const playOpeningCinematic = useCallback(
    (enterFirstMissionAfter: boolean) => {
      setCineBeat(0);
      setScreen('intro');
      engineRef.current?.startCinematic(
        (beat) => setCineBeat(beat),
        () => {
          updateSave((prev) => ({ ...prev, seenIntro: true }));
          if (enterFirstMissionAfter) {
            launchMission(1);
          } else {
            engineRef.current?.loadDioramaScene();
            setScreen('hub');
          }
        },
      );
    },
    [launchMission, updateSave],
  );

  const handleStartFromTitle = useCallback(() => {
    engineRef.current?.audio.unlock();
    if (!saveRef.current.seenIntro) {
      playOpeningCinematic(true);
    } else {
      setScreen('hub');
    }
  }, [playOpeningCinematic]);

  const handleReturnToLab = useCallback(() => {
    engineRef.current?.loadDioramaScene();
    setScreen('hub');
  }, []);

  const handleBackToTitle = useCallback(() => {
    engineRef.current?.loadDioramaScene();
    setScreen('title');
  }, []);

  const handleUpgradeVacuum = useCallback(
    (key: VacuumUpgradeKey) => {
      const spec = VACUUM_UPGRADE_SPECS.find((s) => s.key === key);
      if (!spec) return;
      updateSave((prev) => {
        const lvl = prev.upgrades[key];
        if (lvl >= spec.maxLevel) return prev;
        const cost = spec.costs[lvl - 1];
        if (prev.ectoEnergy < cost) return prev;
        engineRef.current?.audio.playTrapDeploy();
        return {
          ...prev,
          ectoEnergy: prev.ectoEnergy - cost,
          upgrades: {
            ...prev.upgrades,
            [key]: lvl + 1,
          },
        };
      });
    },
    [updateSave],
  );

  const handleUpgradeTrap = useCallback(
    (key: TrapType) => {
      const spec = TRAP_SPECS.find((s) => s.key === key);
      if (!spec) return;
      updateSave((prev) => {
        const lvl = prev.upgrades.traps[key];
        if (lvl >= spec.maxLevel) return prev;
        const cost = spec.costs[lvl];
        if (prev.ectoEnergy < cost) return prev;
        engineRef.current?.audio.playTrapDeploy();
        return {
          ...prev,
          ectoEnergy: prev.ectoEnergy - cost,
          upgrades: {
            ...prev.upgrades,
            traps: {
              ...prev.upgrades.traps,
              [key]: lvl + 1,
            },
          },
        };
      });
    },
    [updateSave],
  );

  const hasProgress =
    save.seenIntro || save.highestUnlockedMission > 1 || save.totalCaptured > 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b0e17] touch-none">
      {/* Isolated 3D WebGL Viewport */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          t={t}
          language={save.language}
          difficulty={save.difficulty}
          hasProgress={hasProgress}
          muted={save.muted}
          onChangeLanguage={handleChangeLanguage}
          onChangeDifficulty={handleChangeDifficulty}
          onStart={handleStartFromTitle}
          onOpenLab={() => {
            handleUnlockAudio();
            setScreen('hub');
          }}
          onPlayCinematic={() => playOpeningCinematic(!save.seenIntro)}
          onToggleMute={handleToggleMute}
          onUnlockAudio={handleUnlockAudio}
        />
      )}

      {/* 3D Opening Cinematic Overlay */}
      {screen === 'intro' && (
        <CinematicOverlay
          t={t}
          beat={cineBeat}
          onAdvance={() => engineRef.current?.advanceCinematicBeat()}
          onSkip={() => engineRef.current?.skipCinematic()}
        />
      )}

      {/* Dr. E. Volt Lab & 10-Mission Hub */}
      {screen === 'hub' && (
        <MansionHubModal
          t={t}
          save={save}
          onSelectMission={launchMission}
          onUpgradeVacuum={handleUpgradeVacuum}
          onUpgradeTrap={handleUpgradeTrap}
          onChangeDifficulty={handleChangeDifficulty}
          onBackToTitle={handleBackToTitle}
        />
      )}

      {/* In-Game Perimeter HUD + Mobile Touch Controls */}
      {(screen === 'playing' || screen === 'paused') && (
        <GameHUD
          t={t}
          hud={hud}
          missionTitle={t.missions[activeMissionId]?.title || ''}
          upgrades={save.upgrades}
          muted={save.muted}
          touchEnabled={touchEnabled}
          onToggleTouch={() => setTouchEnabled((v) => !v)}
          onToggleMute={handleToggleMute}
          onPause={() => {
            engineRef.current?.setPaused(true);
            setScreen('paused');
          }}
          onTriggerFlash={() => engineRef.current?.triggerStrobeFlash()}
          onDeployTrap={(trap) => engineRef.current?.deployTrap(trap)}
          onJoystickChange={(x, y) => engineRef.current?.setVirtualJoystick(x, y)}
          onVacuumHoldChange={(active) => engineRef.current?.setVirtualVacuum(active)}
          onSlamOrDash={() => engineRef.current?.triggerSpaceAction()}
        />
      )}

      {/* Pause Modal */}
      {screen === 'paused' && (
        <PauseModal
          t={t}
          language={save.language}
          onChangeLanguage={handleChangeLanguage}
          onResume={() => {
            engineRef.current?.setPaused(false);
            setScreen('playing');
          }}
          onRestart={() => launchMission(activeMissionId)}
          onToLab={handleReturnToLab}
        />
      )}

      {/* Victory Modal */}
      {screen === 'victory' && lastResult && (
        <VictoryModal
          t={t}
          result={lastResult}
          onNextMission={() =>
            launchMission(Math.min(10, lastResult.missionId + 1))
          }
          onToLab={handleReturnToLab}
        />
      )}

      {/* Defeat Modal */}
      {screen === 'gameover' && (
        <DefeatModal
          t={t}
          onRetry={() => launchMission(activeMissionId)}
          onToLab={handleReturnToLab}
        />
      )}
    </div>
  );
}
