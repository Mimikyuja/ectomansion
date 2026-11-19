export type Language = 'es' | 'en' | 'ja';

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'nightmare';

export interface DifficultyConfig {
  id: DifficultyId;
  hpMult: number;
  speedMult: number;
  damageMult: number;
  telegraphMult: number;
  rewardMult: number;
}

export type WingTheme = 'foyer' | 'library' | 'conservatory' | 'observatory';

export type GhostType =
  | 'lurker'
  | 'dasher'
  | 'sneak'
  | 'spitter'
  | 'armored'
  | 'boss_clang'
  | 'boss_grimoire'
  | 'boss_thorn'
  | 'boss_aetherion';

export type TrapType = 'snare' | 'decoy' | 'cryo';

export interface WaveSpawn {
  type: GhostType;
  count: number;
}

export type PropKind = 'chest' | 'wardrobe' | 'clock' | 'crate' | 'strobe_switch';

export type PropReward = 'ecto' | 'heart' | 'key' | 'trap' | 'ambush' | 'switch';

export interface RoomPropPlacement {
  id: string;
  kind: PropKind;
  localX: number; // relative to room center
  localZ: number;
  reward: PropReward;
  ambushGhost?: GhostType;
  unlocksDoorId?: string;
}

export interface RoomBlueprint {
  id: string;
  gx: number; // grid X (each grid cell = 12m)
  gz: number; // grid Z
  nameKey: string;
  isStart?: boolean;
  isGoal?: boolean;
  isPorch?: boolean;
  ambushOnEnter?: WaveSpawn[];
  clearSealDoorId?: string;
  props: RoomPropPlacement[];
}

export interface DoorBlueprint {
  id: string;
  roomA: string;
  roomB: string;
  lockType: 'open' | 'key' | 'seal'; // 'seal' unlocked by strobe_switch or clearing room
}

export interface MissionDef {
  id: number; // 1..10
  wing: 1 | 2 | 3 | 4;
  theme: WingTheme;
  isBoss: boolean;
  bossType?: GhostType;
  waves: WaveSpawn[][];
  baseReward: number;
  recommendedPower: number;
}

export interface FloorPlan {
  missionId: number;
  theme: WingTheme;
  rooms: RoomBlueprint[];
  doors: DoorBlueprint[];
}

export type VacuumUpgradeKey = 'suction' | 'strobe' | 'slam' | 'suit';

export interface UpgradesState {
  suction: number;
  strobe: number;
  slam: number;
  suit: number;
  traps: {
    snare: number;
    decoy: number;
    cryo: number;
  };
}

export interface SaveState {
  language: Language;
  difficulty: DifficultyId;
  ectoEnergy: number;
  totalCaptured: number;
  highestUnlockedMission: number;
  missionRanks: Record<number, 'S' | 'A' | 'B'>;
  seenIntro: boolean;
  muted: boolean;
  upgrades: UpgradesState;
}

export type ScreenMode =
  | 'title'
  | 'intro'
  | 'hub'
  | 'playing'
  | 'paused'
  | 'victory'
  | 'gameover';

export interface MinimapRoomInfo {
  id: string;
  gx: number;
  gz: number;
  visited: boolean;
  isGoal: boolean;
  hasLockedDoor: boolean;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  ectoCollectedInMission: number;
  surgeCharge: number;
  strobeCooldownRatio: number;
  dashCooldownRatio: number;
  waveIndex: number;
  totalWaves: number;
  ghostsRemaining: number;
  totalGhostsInWave: number;
  capturedCount: number;
  elapsedSeconds: number;
  isPulling: boolean;
  bossNameKey: string | null;
  bossHp: number;
  bossMaxHp: number;
  bossPhase: number;
  trapCharges: Record<TrapType, number>;
  radioMessageKey: string | null;
  // Exploration HUD fields
  currentRoomId: string;
  currentRoomNameKey: string;
  objectiveKey: 'explore' | 'clearRoom' | 'findKey' | 'hitSwitch' | 'reachGoal' | 'defeatBoss';
  keysHeld: number;
  roomsVisited: number;
  totalRooms: number;
  minimapRooms: MinimapRoomInfo[];
}

export interface MissionResult {
  missionId: number;
  rank: 'S' | 'A' | 'B';
  ectoEarned: number;
  ghostsCaptured: number;
  timeSeconds: number;
  damageTaken: number;
  isFinalVictory: boolean;
}
