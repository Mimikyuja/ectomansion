import { FloorPlan, WingTheme } from './types';

export const ROOM_GRID_STEP = 12; // 12m center-to-center between adjacent rooms
export const ROOM_INNER_HALF = 5.4; // 10.8m x 10.8m interior per room

export function getFloorPlanForMission(missionId: number, theme: WingTheme): FloorPlan {
  switch (missionId) {
    case 1:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'porch',
            gx: 0,
            gz: 1,
            nameKey: 'porch',
            isStart: true,
            isPorch: true,
            props: [
              { id: 'p1_crate', kind: 'crate', localX: -3.2, localZ: 2.2, reward: 'ecto' },
              { id: 'p1_crate2', kind: 'crate', localX: 3.2, localZ: 2.2, reward: 'heart' },
            ],
          },
          {
            id: 'foyer',
            gx: 0,
            gz: 0,
            nameKey: 'foyer',
            ambushOnEnter: [{ type: 'lurker', count: 2 }],
            clearSealDoorId: 'd_foyer_closet',
            props: [
              { id: 'f1_clock', kind: 'clock', localX: -3.6, localZ: -3.6, reward: 'ecto' },
            ],
          },
          {
            id: 'closet',
            gx: -1,
            gz: 0,
            nameKey: 'coatRoom',
            props: [
              { id: 'c1_wardrobe', kind: 'wardrobe', localX: -3.2, localZ: -2.2, reward: 'ambush', ambushGhost: 'lurker' },
              { id: 'c1_chest', kind: 'chest', localX: 0, localZ: -3.4, reward: 'key' },
            ],
          },
          {
            id: 'parlor',
            gx: 1,
            gz: 0,
            nameKey: 'parlor',
            isGoal: true,
            ambushOnEnter: [{ type: 'lurker', count: 3 }],
            props: [
              { id: 'pa1_chest', kind: 'chest', localX: 3.4, localZ: -3.2, reward: 'ecto' },
              { id: 'pa1_wardrobe', kind: 'wardrobe', localX: 3.4, localZ: 2.5, reward: 'trap' },
            ],
          },
        ],
        doors: [
          { id: 'd_porch_foyer', roomA: 'porch', roomB: 'foyer', lockType: 'open' },
          { id: 'd_foyer_closet', roomA: 'foyer', roomB: 'closet', lockType: 'seal' },
          { id: 'd_foyer_parlor', roomA: 'foyer', roomB: 'parlor', lockType: 'key' },
        ],
      };

    case 2:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'foyer',
            gx: 0,
            gz: 1,
            nameKey: 'foyer',
            isStart: true,
            props: [
              { id: 'm2_crate', kind: 'crate', localX: -3.4, localZ: 2.0, reward: 'trap' },
            ],
          },
          {
            id: 'hall',
            gx: 0,
            gz: 0,
            nameKey: 'grandHall',
            ambushOnEnter: [{ type: 'lurker', count: 2 }],
            props: [
              { id: 'm2_clock', kind: 'clock', localX: -3.6, localZ: -3.4, reward: 'ecto' },
            ],
          },
          {
            id: 'pantry',
            gx: -1,
            gz: 0,
            nameKey: 'pantry',
            ambushOnEnter: [{ type: 'spitter', count: 1 }],
            props: [
              { id: 'm2_switch', kind: 'strobe_switch', localX: -3.4, localZ: -3.2, reward: 'switch', unlocksDoorId: 'd_hall_dining' },
              { id: 'm2_chest', kind: 'chest', localX: -3.2, localZ: 2.8, reward: 'heart' },
            ],
          },
          {
            id: 'kitchen',
            gx: 0,
            gz: -1,
            nameKey: 'kitchen',
            ambushOnEnter: [{ type: 'lurker', count: 2 }, { type: 'spitter', count: 1 }],
            props: [
              { id: 'm2_wardrobe', kind: 'wardrobe', localX: 3.4, localZ: -3.2, reward: 'ambush', ambushGhost: 'lurker' },
            ],
          },
          {
            id: 'dining',
            gx: 1,
            gz: 0,
            nameKey: 'diningHall',
            isGoal: true,
            ambushOnEnter: [{ type: 'lurker', count: 2 }, { type: 'spitter', count: 2 }],
            props: [
              { id: 'm2_dchest', kind: 'chest', localX: 3.4, localZ: -3.4, reward: 'ecto' },
            ],
          },
        ],
        doors: [
          { id: 'd_foyer_hall', roomA: 'foyer', roomB: 'hall', lockType: 'open' },
          { id: 'd_hall_pantry', roomA: 'hall', roomB: 'pantry', lockType: 'open' },
          { id: 'd_hall_kitchen', roomA: 'hall', roomB: 'kitchen', lockType: 'open' },
          { id: 'd_hall_dining', roomA: 'hall', roomB: 'dining', lockType: 'seal' },
        ],
      };

    case 3:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'vestibule',
            gx: 0,
            gz: 2,
            nameKey: 'foyer',
            isStart: true,
            props: [
              { id: 'm3_c1', kind: 'crate', localX: -3.2, localZ: 2.0, reward: 'trap' },
              { id: 'm3_c2', kind: 'crate', localX: 3.2, localZ: 2.0, reward: 'heart' },
            ],
          },
          {
            id: 'armory',
            gx: 0,
            gz: 1,
            nameKey: 'armory',
            ambushOnEnter: [{ type: 'lurker', count: 2 }],
            clearSealDoorId: 'd_armory_corridor',
            props: [
              { id: 'm3_w1', kind: 'wardrobe', localX: -3.6, localZ: -2.8, reward: 'ecto' },
            ],
          },
          {
            id: 'corridor',
            gx: 1,
            gz: 1,
            nameKey: 'banquetHall',
            props: [
              { id: 'm3_ch', kind: 'chest', localX: 3.4, localZ: -3.2, reward: 'key' },
              { id: 'm3_cl', kind: 'clock', localX: 3.4, localZ: 3.0, reward: 'ambush', ambushGhost: 'lurker' },
            ],
          },
          {
            id: 'arena',
            gx: 1,
            gz: 0,
            nameKey: 'knightSanctum',
            isGoal: true,
            ambushOnEnter: [{ type: 'boss_clang', count: 1 }, { type: 'lurker', count: 1 }],
            props: [
              { id: 'm3_arena_c', kind: 'crate', localX: -3.8, localZ: -3.6, reward: 'heart' },
            ],
          },
        ],
        doors: [
          { id: 'd_vest_armory', roomA: 'vestibule', roomB: 'armory', lockType: 'open' },
          { id: 'd_armory_corridor', roomA: 'armory', roomB: 'corridor', lockType: 'seal' },
          { id: 'd_corridor_arena', roomA: 'corridor', roomB: 'arena', lockType: 'key' },
        ],
      };

    case 4:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'entry',
            gx: 0,
            gz: 1,
            nameKey: 'libraryAtrium',
            isStart: true,
            props: [{ id: 'm4_c', kind: 'crate', localX: 3.2, localZ: 2.2, reward: 'trap' }],
          },
          {
            id: 'nook',
            gx: 0,
            gz: 0,
            nameKey: 'readingNook',
            ambushOnEnter: [{ type: 'dasher', count: 2 }],
            props: [
              { id: 'm4_cl', kind: 'clock', localX: -3.6, localZ: -3.2, reward: 'ecto' },
            ],
          },
          {
            id: 'archive',
            gx: -1,
            gz: 0,
            nameKey: 'secretArchive',
            props: [
              { id: 'm4_w', kind: 'wardrobe', localX: -3.4, localZ: -2.4, reward: 'ambush', ambushGhost: 'sneak' },
              { id: 'm4_k', kind: 'chest', localX: -3.4, localZ: 2.8, reward: 'key' },
            ],
          },
          {
            id: 'study',
            gx: 0,
            gz: -1,
            nameKey: 'forbiddenStudy',
            isGoal: true,
            ambushOnEnter: [{ type: 'sneak', count: 2 }, { type: 'dasher', count: 2 }],
            props: [
              { id: 'm4_end', kind: 'chest', localX: 3.2, localZ: -3.2, reward: 'ecto' },
            ],
          },
        ],
        doors: [
          { id: 'd4_1', roomA: 'entry', roomB: 'nook', lockType: 'open' },
          { id: 'd4_2', roomA: 'nook', roomB: 'archive', lockType: 'open' },
          { id: 'd4_3', roomA: 'nook', roomB: 'study', lockType: 'key' },
        ],
      };

    case 5:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'entry',
            gx: 0,
            gz: 1,
            nameKey: 'clockCorridor',
            isStart: true,
            props: [{ id: 'm5_c', kind: 'crate', localX: -3.2, localZ: 2.2, reward: 'trap' }],
          },
          {
            id: 'gears',
            gx: 0,
            gz: 0,
            nameKey: 'gearRoom',
            ambushOnEnter: [{ type: 'sneak', count: 2 }, { type: 'spitter', count: 1 }],
            props: [
              { id: 'm5_sw', kind: 'strobe_switch', localX: 3.4, localZ: -3.4, reward: 'switch', unlocksDoorId: 'd5_west' },
            ],
          },
          {
            id: 'pendulum',
            gx: -1,
            gz: 0,
            nameKey: 'pendulumHall',
            ambushOnEnter: [{ type: 'dasher', count: 2 }],
            props: [
              { id: 'm5_k', kind: 'chest', localX: -3.4, localZ: -3.2, reward: 'key' },
              { id: 'm5_h', kind: 'crate', localX: -3.4, localZ: 2.6, reward: 'heart' },
            ],
          },
          {
            id: 'gallery',
            gx: 1,
            gz: 0,
            nameKey: 'clockGallery',
            isGoal: true,
            ambushOnEnter: [{ type: 'armored', count: 1 }, { type: 'dasher', count: 2 }, { type: 'spitter', count: 1 }],
            props: [{ id: 'm5_g', kind: 'chest', localX: 3.4, localZ: 2.8, reward: 'ecto' }],
          },
        ],
        doors: [
          { id: 'd5_1', roomA: 'entry', roomB: 'gears', lockType: 'open' },
          { id: 'd5_west', roomA: 'gears', roomB: 'pendulum', lockType: 'seal' },
          { id: 'd5_east', roomA: 'gears', roomB: 'gallery', lockType: 'key' },
        ],
      };

    case 6:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'entry',
            gx: 0,
            gz: 2,
            nameKey: 'libraryAtrium',
            isStart: true,
            props: [
              { id: 'm6_c1', kind: 'crate', localX: -3.2, localZ: 2.0, reward: 'trap' },
              { id: 'm6_c2', kind: 'crate', localX: 3.2, localZ: 2.0, reward: 'heart' },
            ],
          },
          {
            id: 'passage',
            gx: 0,
            gz: 1,
            nameKey: 'arcanePassage',
            ambushOnEnter: [{ type: 'sneak', count: 2 }, { type: 'dasher', count: 1 }],
            clearSealDoorId: 'd6_2',
            props: [{ id: 'm6_w', kind: 'wardrobe', localX: -3.5, localZ: -2.8, reward: 'ecto' }],
          },
          {
            id: 'sanctum',
            gx: 0,
            gz: 0,
            nameKey: 'grimoireSanctum',
            isGoal: true,
            ambushOnEnter: [{ type: 'boss_grimoire', count: 1 }, { type: 'sneak', count: 2 }],
            props: [{ id: 'm6_h', kind: 'crate', localX: 3.6, localZ: -3.4, reward: 'heart' }],
          },
        ],
        doors: [
          { id: 'd6_1', roomA: 'entry', roomB: 'passage', lockType: 'open' },
          { id: 'd6_2', roomA: 'passage', roomB: 'sanctum', lockType: 'seal' },
        ],
      };

    case 7:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'mudroom',
            gx: 0,
            gz: 1,
            nameKey: 'conservatoryGate',
            isStart: true,
            props: [{ id: 'm7_c', kind: 'crate', localX: 3.2, localZ: 2.2, reward: 'trap' }],
          },
          {
            id: 'atrium',
            gx: 0,
            gz: 0,
            nameKey: 'moonAtrium',
            ambushOnEnter: [{ type: 'spitter', count: 2 }, { type: 'dasher', count: 1 }],
            props: [{ id: 'm7_ch', kind: 'chest', localX: -3.4, localZ: -3.2, reward: 'ecto' }],
          },
          {
            id: 'east',
            gx: 1,
            gz: 0,
            nameKey: 'eastGreenhouse',
            props: [
              { id: 'm7_w', kind: 'wardrobe', localX: 3.4, localZ: -2.6, reward: 'ambush', ambushGhost: 'armored' },
              { id: 'm7_k', kind: 'chest', localX: 3.4, localZ: 2.8, reward: 'key' },
            ],
          },
          {
            id: 'nursery',
            gx: 0,
            gz: -1,
            nameKey: 'thornyNursery',
            isGoal: true,
            ambushOnEnter: [{ type: 'armored', count: 2 }, { type: 'spitter', count: 2 }, { type: 'sneak', count: 1 }],
            props: [{ id: 'm7_h', kind: 'crate', localX: -3.4, localZ: -3.4, reward: 'heart' }],
          },
        ],
        doors: [
          { id: 'd7_1', roomA: 'mudroom', roomB: 'atrium', lockType: 'open' },
          { id: 'd7_2', roomA: 'atrium', roomB: 'east', lockType: 'open' },
          { id: 'd7_3', roomA: 'atrium', roomB: 'nursery', lockType: 'key' },
        ],
      };

    case 8:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'gate',
            gx: 0,
            gz: 2,
            nameKey: 'conservatoryGate',
            isStart: true,
            props: [
              { id: 'm8_c1', kind: 'crate', localX: -3.2, localZ: 2.0, reward: 'trap' },
              { id: 'm8_c2', kind: 'crate', localX: 3.2, localZ: 2.0, reward: 'heart' },
            ],
          },
          {
            id: 'vines',
            gx: 0,
            gz: 1,
            nameKey: 'vineCorridor',
            ambushOnEnter: [{ type: 'spitter', count: 2 }, { type: 'armored', count: 1 }],
            clearSealDoorId: 'd8_2',
            props: [{ id: 'm8_ch', kind: 'chest', localX: -3.5, localZ: -3.2, reward: 'ecto' }],
          },
          {
            id: 'rotunda',
            gx: 0,
            gz: 0,
            nameKey: 'botanicalRotunda',
            isGoal: true,
            ambushOnEnter: [{ type: 'boss_thorn', count: 1 }, { type: 'spitter', count: 1 }],
            props: [{ id: 'm8_h', kind: 'crate', localX: 3.6, localZ: -3.4, reward: 'heart' }],
          },
        ],
        doors: [
          { id: 'd8_1', roomA: 'gate', roomB: 'vines', lockType: 'open' },
          { id: 'd8_2', roomA: 'vines', roomB: 'rotunda', lockType: 'seal' },
        ],
      };

    case 9:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'stairs',
            gx: 0,
            gz: 1,
            nameKey: 'towerStairs',
            isStart: true,
            props: [{ id: 'm9_c', kind: 'crate', localX: -3.2, localZ: 2.2, reward: 'trap' }],
          },
          {
            id: 'starhall',
            gx: 0,
            gz: 0,
            nameKey: 'starHall',
            ambushOnEnter: [{ type: 'armored', count: 2 }, { type: 'dasher', count: 2 }],
            props: [
              { id: 'm9_sw', kind: 'strobe_switch', localX: 3.4, localZ: -3.2, reward: 'switch', unlocksDoorId: 'd9_annex' },
            ],
          },
          {
            id: 'annex',
            gx: -1,
            gz: 0,
            nameKey: 'labAnnex',
            ambushOnEnter: [{ type: 'sneak', count: 2 }],
            props: [
              { id: 'm9_k', kind: 'chest', localX: -3.4, localZ: -3.2, reward: 'key' },
              { id: 'm9_h', kind: 'crate', localX: -3.4, localZ: 2.6, reward: 'heart' },
            ],
          },
          {
            id: 'bridge',
            gx: 0,
            gz: -1,
            nameKey: 'astralBridge',
            isGoal: true,
            ambushOnEnter: [{ type: 'armored', count: 2 }, { type: 'spitter', count: 2 }, { type: 'dasher', count: 2 }],
            props: [{ id: 'm9_e', kind: 'chest', localX: 3.4, localZ: -3.2, reward: 'ecto' }],
          },
        ],
        doors: [
          { id: 'd9_1', roomA: 'stairs', roomB: 'starhall', lockType: 'open' },
          { id: 'd9_annex', roomA: 'starhall', roomB: 'annex', lockType: 'seal' },
          { id: 'd9_2', roomA: 'starhall', roomB: 'bridge', lockType: 'key' },
        ],
      };

    case 10:
    default:
      return {
        missionId,
        theme,
        rooms: [
          {
            id: 'vestibule',
            gx: 0,
            gz: 2,
            nameKey: 'obsVestibule',
            isStart: true,
            props: [
              { id: 'm10_c1', kind: 'crate', localX: -3.2, localZ: 2.0, reward: 'trap' },
              { id: 'm10_c2', kind: 'crate', localX: 3.2, localZ: 2.0, reward: 'heart' },
            ],
          },
          {
            id: 'corridor',
            gx: 0,
            gz: 1,
            nameKey: 'astralCorridor',
            ambushOnEnter: [{ type: 'armored', count: 1 }, { type: 'dasher', count: 2 }],
            clearSealDoorId: 'd10_2',
            props: [{ id: 'm10_ch', kind: 'chest', localX: -3.4, localZ: -3.0, reward: 'ecto' }],
          },
          {
            id: 'core',
            gx: 0,
            gz: 0,
            nameKey: 'meteorCore',
            isGoal: true,
            ambushOnEnter: [{ type: 'boss_aetherion', count: 1 }, { type: 'sneak', count: 2 }],
            props: [
              { id: 'm10_h1', kind: 'crate', localX: -3.6, localZ: -3.6, reward: 'heart' },
              { id: 'm10_h2', kind: 'crate', localX: 3.6, localZ: -3.6, reward: 'trap' },
            ],
          },
        ],
        doors: [
          { id: 'd10_1', roomA: 'vestibule', roomB: 'corridor', lockType: 'open' },
          { id: 'd10_2', roomA: 'corridor', roomB: 'core', lockType: 'seal' },
        ],
      };
  }
}
