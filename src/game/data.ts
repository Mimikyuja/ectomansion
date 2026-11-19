import {
  DifficultyConfig,
  DifficultyId,
  MissionDef,
  SaveState,
  TrapType,
  UpgradesState,
  VacuumUpgradeKey,
} from './types';

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    hpMult: 0.78,
    speedMult: 0.85,
    damageMult: 0.75,
    telegraphMult: 1.25,
    rewardMult: 0.9,
  },
  normal: {
    id: 'normal',
    hpMult: 1.0,
    speedMult: 1.0,
    damageMult: 1.0,
    telegraphMult: 1.0,
    rewardMult: 1.0,
  },
  hard: {
    id: 'hard',
    hpMult: 1.32,
    speedMult: 1.15,
    damageMult: 1.35,
    telegraphMult: 0.85,
    rewardMult: 1.35,
  },
  nightmare: {
    id: 'nightmare',
    hpMult: 1.75,
    speedMult: 1.28,
    damageMult: 1.8,
    telegraphMult: 0.72,
    rewardMult: 1.75,
  },
};

export const MISSIONS: MissionDef[] = [
  // WING 1: FOYER & DINING HALL
  {
    id: 1,
    wing: 1,
    theme: 'foyer',
    isBoss: false,
    baseReward: 80,
    recommendedPower: 1,
    waves: [
      [{ type: 'lurker', count: 3 }],
      [{ type: 'lurker', count: 4 }],
    ],
  },
  {
    id: 2,
    wing: 1,
    theme: 'foyer',
    isBoss: false,
    baseReward: 120,
    recommendedPower: 1,
    waves: [
      [
        { type: 'lurker', count: 3 },
        { type: 'spitter', count: 1 },
      ],
      [
        { type: 'lurker', count: 3 },
        { type: 'spitter', count: 2 },
      ],
    ],
  },
  {
    id: 3,
    wing: 1,
    theme: 'foyer',
    isBoss: true,
    bossType: 'boss_clang',
    baseReward: 240,
    recommendedPower: 2,
    waves: [
      [
        { type: 'boss_clang', count: 1 },
        { type: 'lurker', count: 2 },
      ],
    ],
  },

  // WING 2: ARCANE LIBRARY
  {
    id: 4,
    wing: 2,
    theme: 'library',
    isBoss: false,
    baseReward: 160,
    recommendedPower: 2,
    waves: [
      [
        { type: 'lurker', count: 2 },
        { type: 'dasher', count: 2 },
      ],
      [
        { type: 'dasher', count: 2 },
        { type: 'sneak', count: 2 },
      ],
    ],
  },
  {
    id: 5,
    wing: 2,
    theme: 'library',
    isBoss: false,
    baseReward: 200,
    recommendedPower: 2,
    waves: [
      [
        { type: 'sneak', count: 3 },
        { type: 'spitter', count: 2 },
      ],
      [
        { type: 'dasher', count: 3 },
        { type: 'armored', count: 1 },
      ],
    ],
  },
  {
    id: 6,
    wing: 2,
    theme: 'library',
    isBoss: true,
    bossType: 'boss_grimoire',
    baseReward: 340,
    recommendedPower: 3,
    waves: [
      [
        { type: 'boss_grimoire', count: 1 },
        { type: 'sneak', count: 2 },
      ],
    ],
  },

  // WING 3: MOONLIT CONSERVATORY
  {
    id: 7,
    wing: 3,
    theme: 'conservatory',
    isBoss: false,
    baseReward: 250,
    recommendedPower: 3,
    waves: [
      [
        { type: 'spitter', count: 3 },
        { type: 'dasher', count: 2 },
      ],
      [
        { type: 'armored', count: 2 },
        { type: 'spitter', count: 2 },
        { type: 'sneak', count: 2 },
      ],
    ],
  },
  {
    id: 8,
    wing: 3,
    theme: 'conservatory',
    isBoss: true,
    bossType: 'boss_thorn',
    baseReward: 460,
    recommendedPower: 4,
    waves: [
      [
        { type: 'boss_thorn', count: 1 },
        { type: 'spitter', count: 2 },
      ],
    ],
  },

  // WING 4: OBSERVATORY & ASTRAL CORE
  {
    id: 9,
    wing: 4,
    theme: 'observatory',
    isBoss: false,
    baseReward: 360,
    recommendedPower: 4,
    waves: [
      [
        { type: 'armored', count: 2 },
        { type: 'dasher', count: 3 },
        { type: 'sneak', count: 2 },
      ],
      [
        { type: 'armored', count: 2 },
        { type: 'spitter', count: 3 },
        { type: 'dasher', count: 2 },
      ],
    ],
  },
  {
    id: 10,
    wing: 4,
    theme: 'observatory',
    isBoss: true,
    bossType: 'boss_aetherion',
    baseReward: 800,
    recommendedPower: 5,
    waves: [
      [
        { type: 'boss_aetherion', count: 1 },
        { type: 'sneak', count: 2 },
      ],
    ],
  },
];

export interface UpgradeSpec {
  key: VacuumUpgradeKey;
  maxLevel: number;
  costs: number[]; // cost to upgrade from level i to i+1
}

export const VACUUM_UPGRADE_SPECS: UpgradeSpec[] = [
  { key: 'suction', maxLevel: 5, costs: [90, 180, 300, 480] },
  { key: 'strobe', maxLevel: 5, costs: [80, 160, 270, 420] },
  { key: 'slam', maxLevel: 5, costs: [100, 200, 340, 520] },
  { key: 'suit', maxLevel: 5, costs: [85, 175, 290, 450] },
];

export interface TrapSpec {
  key: TrapType;
  maxLevel: number;
  costs: number[]; // cost from level 0->1 (unlock), 1->2, 2->3
  baseCharges: number;
}

export const TRAP_SPECS: TrapSpec[] = [
  { key: 'snare', maxLevel: 3, costs: [0, 140, 280], baseCharges: 2 },
  { key: 'decoy', maxLevel: 3, costs: [130, 220, 360], baseCharges: 2 },
  { key: 'cryo', maxLevel: 3, costs: [180, 280, 440], baseCharges: 2 },
];

export const DEFAULT_UPGRADES: UpgradesState = {
  suction: 1,
  strobe: 1,
  slam: 1,
  suit: 1,
  traps: {
    snare: 1,
    decoy: 0,
    cryo: 0,
  },
};

export const DEFAULT_SAVE_STATE: SaveState = {
  language: 'es',
  difficulty: 'normal',
  ectoEnergy: 100,
  totalCaptured: 0,
  highestUnlockedMission: 1,
  missionRanks: {},
  seenIntro: false,
  muted: false,
  upgrades: DEFAULT_UPGRADES,
};

const STORAGE_KEY = 'ectoman_spectrovac_save_v1';

export function loadSaveState(): SaveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE_STATE);
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return {
      ...structuredClone(DEFAULT_SAVE_STATE),
      ...parsed,
      upgrades: {
        ...structuredClone(DEFAULT_UPGRADES),
        ...(parsed.upgrades || {}),
        traps: {
          ...structuredClone(DEFAULT_UPGRADES.traps),
          ...(parsed.upgrades?.traps || {}),
        },
      },
      missionRanks: parsed.missionRanks || {},
    };
  } catch {
    return structuredClone(DEFAULT_SAVE_STATE);
  }
}

export function persistSaveState(state: SaveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function getPlayerMaxHp(upgrades: UpgradesState): number {
  return 100 + (upgrades.suit - 1) * 25;
}

export function getVacuumDps(upgrades: UpgradesState): number {
  return 26 + (upgrades.suction - 1) * 9;
}

export function getStrobeStats(upgrades: UpgradesState) {
  return {
    range: 7.2 + (upgrades.strobe - 1) * 0.85,
    angleRad: ((48 + (upgrades.strobe - 1) * 6) * Math.PI) / 180,
    stunDuration: 3.1 + (upgrades.strobe - 1) * 0.45,
    cooldown: Math.max(0.75, 1.45 - (upgrades.strobe - 1) * 0.14),
  };
}

export function getSlamDamage(upgrades: UpgradesState): number {
  return 55 + (upgrades.slam - 1) * 22;
}
