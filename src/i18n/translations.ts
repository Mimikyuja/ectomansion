import { DifficultyId, Language, TrapType, VacuumUpgradeKey } from '../game/types';

export interface TranslationBundle {
  gameTitle: string;
  gameSubtitle: string;
  startNew: string;
  continueGame: string;
  openLab: string;
  languageLabel: string;
  difficultyLabel: string;
  controlsHint: string;
  difficulties: Record<DifficultyId, { name: string; desc: string }>;
  intro: {
    speaker: string;
    slides: { title: string; body: string }[];
    next: string;
    deploy: string;
    skip: string;
  };
  cinematic: {
    speaker: string;
    beats: string[];
    skip: string;
    startNow: string;
  };
  touch: {
    vacuum: string;
    flash: string;
    dash: string;
    slam: string;
    toggleLabel: string;
  };
  hub: {
    labTitle: string;
    scientistName: string;
    scientistQuote: string;
    fragmentsLabel: string;
    ectoBalance: string;
    capturedTotal: string;
    tabMissions: string;
    tabUpgrades: string;
    playMission: string;
    locked: string;
    bossTag: string;
    wingNames: Record<1 | 2 | 3 | 4, string>;
    upgradeSectionVacuum: string;
    upgradeSectionTraps: string;
    levelLabel: string;
    maxed: string;
    unlockBtn: string;
    upgradeBtn: string;
    backToTitle: string;
  };
  missions: Record<number, { title: string; briefing: string }>;
  bosses: {
    boss_clang: { name: string; subtitle: string };
    boss_grimoire: { name: string; subtitle: string };
    boss_thorn: { name: string; subtitle: string };
    boss_aetherion: { name: string; subtitle: string };
  };
  upgrades: Record<VacuumUpgradeKey, { name: string; desc: string }>;
  traps: Record<TrapType, { name: string; short: string; desc: string }>;
  hud: {
    wave: string;
    ghostsLeft: string;
    slamReady: string;
    slamCharge: string;
    flashReady: string;
    dash: string;
    pause: string;
    mute: string;
    unmute: string;
    controlBar: string;
    keys: string;
    roomsVisited: string;
    radioStunHint: string;
    radioPullHint: string;
    radioBossHint: string;
    radioFinalHint: string;
    radioExploreHint: string;
    radioKeyFound: string;
    radioDoorUnlocked: string;
    radioSwitchHint: string;
  };
  rooms: Record<string, string>;
  objectives: Record<
    'explore' | 'clearRoom' | 'findKey' | 'hitSwitch' | 'reachGoal' | 'defeatBoss',
    string
  >;
  modals: {
    pausedTitle: string;
    resume: string;
    restart: string;
    toLab: string;
    victoryTitle: string;
    finalVictoryTitle: string;
    finalVictoryBody: string;
    defeatTitle: string;
    defeatBody: string;
    rankLabel: string;
    ectoEarned: string;
    ghostsCaptured: string;
    timeTaken: string;
    nextMission: string;
    retry: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  es: {
    gameTitle: 'EctoMansión',
    gameSubtitle: 'SpectroVac 3000',
    startNew: 'Iniciar Aventura',
    continueGame: 'Entrar al Laboratorio',
    openLab: 'Misiones y Taller',
    languageLabel: 'Idioma',
    difficultyLabel: 'Dificultad',
    controlsHint: 'WASD Mover · Ratón Apuntar · Clic Izq Succionar · Clic Der / F Flash · Espacio Golpe/Esquive · 1-3 Trampas',
    difficulties: {
      easy: { name: 'Fácil', desc: 'Fantasmas más lentos y menos daño' },
      normal: { name: 'Normal', desc: 'Aventura equilibrada estilo mansión' },
      hard: { name: 'Difícil', desc: 'Fantasmas agresivos y +35% Ecto-Energía' },
      nightmare: { name: 'Pesadilla', desc: 'Máximo peligro y +75% Ecto-Energía' },
    },
    intro: {
      speaker: 'Dr. E. Volt — Laboratorio Espectral',
      slides: [
        {
          title: '¡Emergencia en la Mansión Sombría!',
          body: '¡Chico, qué alivio que contestes! Los fantasmas de la mansión siempre fueron traviesos pero inofensivos... hasta anoche.',
        },
        {
          title: 'El Meteorito Astral',
          body: 'Algo cayó del cielo atravesando el observatorio y se rompió en 4 fragmentos malditos. ¡Su energía volvió hostiles a los espíritus y poseyó a 4 Jefes!',
        },
        {
          title: 'Te envío la SpectroVac-3000',
          body: 'Úsala para cegar a los fantasmas con el Flash (F / Clic Der), succionarlos (Clic Izq) y enviarlos a mis tanques de investigación. ¡Mejora tus trampas en mi taller!',
        },
      ],
      next: 'Siguiente',
      deploy: 'Ir a la Mansión',
      skip: 'Saltar',
    },
    cinematic: {
      speaker: 'Dr. E. Volt · Transmisión de Emergencia',
      beats: [
        'En la Mansión Sombría, los fantasmas siempre fueron traviesos pero totalmente inofensivos...',
        '¡Hasta que anoche un meteorito astral cayó del cielo y estalló en 4 fragmentos malditos!',
        'La energía celestial corrompió a todos los espíritus y los volvió hostiles bajo el mando de 4 Jefes.',
        '¡Chico! Te teletransporto la SpectroVac-3000. ¡Ciega, succiona y envíalos a mi laboratorio!',
      ],
      skip: 'Saltar cinemática',
      startNow: '¡A cazar fantasmas!',
    },
    touch: {
      vacuum: 'Succionar',
      flash: 'Flash',
      dash: 'Esquive',
      slam: 'Golpe',
      toggleLabel: 'Controles Táctiles',
    },
    hub: {
      labTitle: 'Laboratorio del Dr. E. Volt',
      scientistName: 'Dr. E. Volt',
      scientistQuote: 'Cada fantasma que recolectas alimenta mis experimentos para purificar el meteorito.',
      fragmentsLabel: 'Fragmentos Astrales',
      ectoBalance: 'Ecto-Energía',
      capturedTotal: 'Capturados',
      tabMissions: 'Misiones de la Mansión (10)',
      tabUpgrades: 'Mejoras de Aspiradora y Trampas',
      playMission: 'Desplegar',
      locked: 'Bloqueada',
      bossTag: 'JEFE',
      wingNames: {
        1: 'Ala 1 · Vestíbulo Sombrío',
        2: 'Ala 2 · Biblioteca Arcana',
        3: 'Ala 3 · Invernadero Lunar',
        4: 'Ala 4 · Torre del Observatorio',
      },
      upgradeSectionVacuum: 'Módulos de la SpectroVac-3000',
      upgradeSectionTraps: 'Trampas Experimentales (Teclas 1, 2, 3)',
      levelLabel: 'Niv.',
      maxed: 'MÁXIMO',
      unlockBtn: 'Fabricar',
      upgradeBtn: 'Mejorar',
      backToTitle: 'Menú Principal',
    },
    missions: {
      1: { title: '01. Primera Llamada', briefing: 'Limpia el vestíbulo de Acechadores Verdes. Usa el Flash (F / Clic Der) antes de succionar.' },
      2: { title: '02. Banquete Turbulento', briefing: 'Cuidado con los Escupidores de ectoplasma que rondan el comedor.' },
      3: { title: '03. El Caballero Hueco', briefing: 'JEFE 1: Sir Estruendo bloquea con su escudo. Esquiva su golpe y atúrdelo con Flash cuando baje la guardia.' },
      4: { title: '04. Estantes Susurrantes', briefing: 'Los Espectros Sombra son casi invisibles hasta que los iluminas con el Flash.' },
      5: { title: '05. Galería del Reloj', briefing: 'Oleada combinada con fantasmas velocistas y espectros acorazados.' },
      6: { title: '06. El Grimorio Vivo', briefing: 'JEFE 2: El libro maldito invoca fantasmas y lanza ondas arcanas. ¡Usa trampas para frenar a sus súbditos!' },
      7: { title: '07. Flores Malditas', briefing: 'El invernadero está saturado de esporas tóxicas y fantasmas rápidos.' },
      8: { title: '08. Jardín de Espinas', briefing: 'JEFE 3: La Baronesa Espina ataca con raíces espectrales. Atráela a tus trampas Crio o Red.' },
      9: { title: '09. Brecha del Meteorito', briefing: 'La guardia más feroz protege la entrada al núcleo estelar.' },
      10: { title: '10. El Núcleo Celeste', briefing: 'JEFE FINAL: Aeterión concentra la energía del meteorito. ¡Purifícalo para salvar la mansión!' },
    },
    bosses: {
      boss_clang: { name: 'Sir Estruendo', subtitle: 'Guardián del Vestíbulo · Fragmento I' },
      boss_grimoire: { name: 'El Grimorio Vivo', subtitle: 'Tomo de la Biblioteca · Fragmento II' },
      boss_thorn: { name: 'Baronesa Espina', subtitle: 'Reina del Invernadero · Fragmento III' },
      boss_aetherion: { name: 'Aeterión, Núcleo Celeste', subtitle: 'Anomalía del Meteorito · Fragmento Final' },
    },
    upgrades: {
      suction: { name: 'Turbina de Succión', desc: 'Aumenta la potencia y velocidad al aspirar fantasmas.' },
      strobe: { name: 'Flash Estroboscópico', desc: 'Mayor alcance, ángulo amplio y aturdimiento más largo.' },
      slam: { name: 'Golpe Espectral', desc: 'Aumenta el daño explosivo al pulsar Espacio mientras succionas.' },
      suit: { name: 'Traje Ecto-Blindado', desc: 'Incrementa tu salud máxima en +25 PS por nivel.' },
    },
    traps: {
      snare: { name: 'Red Espectral', short: 'Red', desc: 'Atrapa y aturde en el suelo a cualquier fantasma que la pise.' },
      decoy: { name: 'Señuelo Solar', short: 'Señuelo', desc: 'Atrae fantasmas cercanos y estalla en un destello cegador.' },
      cryo: { name: 'Bobina Crio-Vórtice', short: 'Crio', desc: 'Congela el área, ralentiza enemigos y los atrae al centro.' },
    },
    hud: {
      wave: 'Oleada',
      ghostsLeft: 'Fantasmas',
      slamReady: '¡GOLPE LISTO! [Espacio]',
      slamCharge: 'Carga Golpe',
      flashReady: 'Flash [F / Der]',
      dash: 'Esquive [Espacio]',
      pause: 'Pausa',
      mute: 'Silenciar',
      unmute: 'Audio',
      controlBar: 'WASD Mover · Clic Der / F Flash · Mantener Clic Izq Succionar · Espacio Golpe/Esquive · 1-3 Trampas',
      keys: 'Llaves',
      roomsVisited: 'Salas',
      radioStunHint: 'Dr. Volt: ¡Usa el Flash (F o Clic Der) para aturdirlos antes de succionar!',
      radioPullHint: 'Dr. Volt: ¡Bien! Mantén Clic Izq para succionar y pulsa Espacio al llenar la barra!',
      radioBossHint: 'Dr. Volt: ¡Cuidado con su ataque rojo! Esquiva y atúrdelo justo después.',
      radioFinalHint: 'Dr. Volt: ¡Es el núcleo del meteorito! ¡Usa todo lo que mejoraste en el taller!',
      radioExploreHint: 'Dr. Volt: ¡Explora los cuartos, aspira cofres o armarios que tiemblen y ten cuidado con emboscadas!',
      radioKeyFound: 'Dr. Volt: ¡Encontraste una Llave de la Mansión! Acércate a la puerta dorada.',
      radioDoorUnlocked: 'Dr. Volt: ¡Puerta desbloqueada! Avanza a la siguiente habitación.',
      radioSwitchHint: 'Dr. Volt: ¡Ilumina el sensor verde con el Flash (F o Clic Der) para abrir el sello!',
    },
    rooms: {
      porch: 'Porche de Entrada',
      foyer: 'Vestíbulo Principal',
      coatRoom: 'Guardarropa',
      parlor: 'Salón Sombrío',
      grandHall: 'Gran Pasillo',
      pantry: 'Despensa',
      kitchen: 'Cocina Antigua',
      diningHall: 'Comedor Principal',
      armory: 'Sala de Armaduras',
      banquetHall: 'Galería del Banquete',
      knightSanctum: 'Santuario del Caballero',
      libraryAtrium: 'Atrio de la Biblioteca',
      readingNook: 'Rincón de Lectura',
      secretArchive: 'Archivo Secreto',
      forbiddenStudy: 'Estudio Prohibido',
      clockCorridor: 'Pasillo del Péndulo',
      gearRoom: 'Sala de Engranajes',
      pendulumHall: 'Cámara del Reloj',
      clockGallery: 'Galería Horológica',
      arcanePassage: 'Pasaje Arcano',
      grimoireSanctum: 'Santuario del Grimorio',
      conservatoryGate: 'Entrada del Invernadero',
      moonAtrium: 'Atrio Lunar',
      eastGreenhouse: 'Invernadero Este',
      thornyNursery: 'Vivero Espinoso',
      vineCorridor: 'Corredor de Lianas',
      botanicalRotunda: 'Rotonda Botánica',
      towerStairs: 'Escaleras de la Torre',
      starHall: 'Salón Estelar',
      labAnnex: 'Anexo del Telescopio',
      astralBridge: 'Puente Astral',
      obsVestibule: 'Vestíbulo Celeste',
      astralCorridor: 'Pasillo del Meteorito',
      meteorCore: 'Cúpula del Núcleo',
    },
    objectives: {
      explore: 'Explora la mansión e inspecciona muebles con la aspiradora',
      clearRoom: '¡Captura a los fantasmas de esta sala!',
      findKey: 'Busca una Llave en cofres o armarios de otras salas',
      hitSwitch: 'Activa el sensor verde con tu Flash (F / Clic Der)',
      reachGoal: 'Avanza hacia la sala final marcada en el mapa',
      defeatBoss: '¡Captura al Jefe poseído por el fragmento!',
    },
    modals: {
      pausedTitle: 'Misión en Pausa',
      resume: 'Continuar',
      restart: 'Reiniciar Misión',
      toLab: 'Volver al Laboratorio',
      victoryTitle: '¡Sector Despejado!',
      finalVictoryTitle: '¡Mansión Purificada!',
      finalVictoryBody: '¡Increíble! Al capturar a Aeterión, el meteorito perdió su corrupción y todos los fantasmas volvieron a ser amigables. El Dr. E. Volt ya celebra en el laboratorio.',
      defeatTitle: '¡Sobrecarga Espectral!',
      defeatBody: 'Los fantasmas te han dejado sin energía. Mejora tu aspiradora o cambia de estrategia con trampas.',
      rankLabel: 'Rango',
      ectoEarned: 'Ecto-Energía',
      ghostsCaptured: 'Capturados',
      timeTaken: 'Tiempo',
      nextMission: 'Siguiente Misión',
      retry: 'Reintentar',
    },
  },
  en: {
    gameTitle: 'EctoMansion',
    gameSubtitle: 'SpectroVac 3000',
    startNew: 'Start Adventure',
    continueGame: 'Enter Laboratory',
    openLab: 'Missions & Workshop',
    languageLabel: 'Language',
    difficultyLabel: 'Difficulty',
    controlsHint: 'WASD Move · Mouse Aim · Left-Click Vacuum · Right-Click / F Flash · Space Slam/Dash · 1-3 Traps',
    difficulties: {
      easy: { name: 'Casual', desc: 'Slower ghosts and reduced damage' },
      normal: { name: 'Standard', desc: 'Balanced haunted mansion challenge' },
      hard: { name: 'Hard', desc: 'Aggressive ghosts and +35% Ecto-Energy' },
      nightmare: { name: 'Nightmare', desc: 'Maximum danger and +75% Ecto-Energy' },
    },
    intro: {
      speaker: 'Dr. E. Volt — Spectral Lab',
      slides: [
        {
          title: 'Emergency at Gloomshade Mansion!',
          body: 'Kid, thank goodness you picked up! The mansion ghosts were always playful and harmless... until last night.',
        },
        {
          title: 'The Fallen Sky Meteorite',
          body: 'Something fell from the sky into the observatory and shattered into 4 cursed shards. Its energy turned every ghost hostile and possessed 4 Bosses!',
        },
        {
          title: 'Deploying the SpectroVac-3000',
          body: 'Stun ghosts with the Strobe Flash (F / Right-Click), hold Left-Click to vacuum them up, and send them to my lab tanks. Upgrade your gear & traps in my workshop!',
        },
      ],
      next: 'Next',
      deploy: 'Enter Mansion',
      skip: 'Skip',
    },
    cinematic: {
      speaker: 'Dr. E. Volt · Emergency Broadcast',
      beats: [
        'At Gloomshade Mansion, the ghosts were always mischievous yet completely harmless...',
        'Until last night, when an astral meteorite fell from the sky and shattered into 4 cursed shards!',
        'Its cosmic pulse corrupted every spirit, turning them hostile under 4 possessed Bosses.',
        'Kid! I am beaming you the SpectroVac-3000. Flash, vacuum, and send them to my lab!',
      ],
      skip: 'Skip cutscene',
      startNow: 'Start Hunting!',
    },
    touch: {
      vacuum: 'Vacuum',
      flash: 'Flash',
      dash: 'Dash',
      slam: 'Slam',
      toggleLabel: 'Touch Controls',
    },
    hub: {
      labTitle: "Dr. E. Volt's Laboratory",
      scientistName: 'Dr. E. Volt',
      scientistQuote: 'Every ghost you capture fuels my experiments to purify the fallen meteorite.',
      fragmentsLabel: 'Astral Shards',
      ectoBalance: 'Ecto-Energy',
      capturedTotal: 'Captured',
      tabMissions: 'Mansion Missions (10)',
      tabUpgrades: 'Vacuum & Trap Upgrades',
      playMission: 'Deploy',
      locked: 'Locked',
      bossTag: 'BOSS',
      wingNames: {
        1: 'Wing 1 · Gloom Foyer',
        2: 'Wing 2 · Arcane Library',
        3: 'Wing 3 · Moonlit Conservatory',
        4: 'Wing 4 · Observatory Tower',
      },
      upgradeSectionVacuum: 'SpectroVac-3000 Modules',
      upgradeSectionTraps: 'Special Traps (Keys 1, 2, 3)',
      levelLabel: 'Lv.',
      maxed: 'MAXED',
      unlockBtn: 'Craft',
      upgradeBtn: 'Upgrade',
      backToTitle: 'Title Screen',
    },
    missions: {
      1: { title: '01. First Dispatch', briefing: 'Clear the foyer of Green Lurkers. Stun them with Flash (F / Right-Click) before vacuuming.' },
      2: { title: '02. Haunted Banquet', briefing: 'Watch out for Ectoplasm Spitters haunting the dining wing.' },
      3: { title: '03. Hollow Knight', briefing: 'BOSS 1: Sir Clang blocks with his shield. Dodge his slam and Flash when he lowers his guard.' },
      4: { title: '04. Whispering Shelves', briefing: 'Sneak-Shades turn nearly invisible until revealed by your Strobe Flash.' },
      5: { title: '05. Clockwork Gallery', briefing: 'Mixed wave featuring high-speed Dashers and Armored Spirits.' },
      6: { title: '06. Living Grimoire', briefing: 'BOSS 2: The cursed spellbook summons phantoms and arcane rings. Use traps for crowd control!' },
      7: { title: '07. Blighted Blooms', briefing: 'The conservatory is overrun with toxic spore spitters and dashers.' },
      8: { title: '08. Garden of Thorns', briefing: 'BOSS 3: Baroness Thornshade lashes with spectral vines. Lure her onto Snare or Cryo traps.' },
      9: { title: '09. Meteorite Breach', briefing: 'The fiercest spectral guard defends the astral observatory.' },
      10: { title: '10. Sky-Fallen Core', briefing: 'FINAL BOSS: Aetherion channels the sky meteorite. Purify it to save the mansion!' },
    },
    bosses: {
      boss_clang: { name: 'Sir Clang', subtitle: 'Foyer Champion · Shard I' },
      boss_grimoire: { name: 'Living Grimoire', subtitle: 'Library Tome · Shard II' },
      boss_thorn: { name: 'Baroness Thornshade', subtitle: 'Conservatory Queen · Shard III' },
      boss_aetherion: { name: 'Aetherion, Sky Core', subtitle: 'Meteorite Anomaly · Final Shard' },
    },
    upgrades: {
      suction: { name: 'Suction Turbine', desc: 'Boosts vacuum pull force and capture damage per second.' },
      strobe: { name: 'Strobe Flash', desc: 'Wider stun cone, longer range, and extended stun duration.' },
      slam: { name: 'Power Slam', desc: 'Increases burst shockwave damage when pressing Space while pulling.' },
      suit: { name: 'Ecto-Reinforced Suit', desc: 'Increases maximum health by +25 HP per level.' },
    },
    traps: {
      snare: { name: 'Ecto-Snare Net', short: 'Snare', desc: 'Pins and stuns any ghost stepping over the floor rune.' },
      decoy: { name: 'Solar Decoy', short: 'Decoy', desc: 'Attracts nearby ghosts and detonates in a blinding flash.' },
      cryo: { name: 'Cryo-Vortex Coil', short: 'Cryo', desc: 'Chills an area, slowing ghosts and pulling them inward.' },
    },
    hud: {
      wave: 'Wave',
      ghostsLeft: 'Ghosts',
      slamReady: 'SLAM READY! [Space]',
      slamCharge: 'Slam Charge',
      flashReady: 'Flash [F / R-Click]',
      dash: 'Dash [Space]',
      pause: 'Pause',
      mute: 'Mute',
      unmute: 'Audio',
      controlBar: 'WASD Move · Right-Click / F Flash · Hold Left-Click Vacuum · Space Slam/Dash · 1-3 Traps',
      keys: 'Keys',
      roomsVisited: 'Rooms',
      radioExploreHint: 'Dr. Volt: Walk inside, vacuum rattling chests & wardrobes, and watch out for ambushes!',
      radioKeyFound: 'Dr. Volt: You found a Mansion Key! Walk up to the golden gate to unlock it.',
      radioDoorUnlocked: 'Dr. Volt: Gate unlocked! Step into the next room.',
      radioSwitchHint: 'Dr. Volt: Aim at the green Strobe Sensor and hit it with Flash (F / Right-Click)!',
      radioStunHint: 'Dr. Volt: Hit them with your Strobe Flash (F or Right-Click) before vacuuming!',
      radioPullHint: 'Dr. Volt: Nice! Hold Left-Click to pull and hit Space when the Slam gauge fills!',
      radioBossHint: 'Dr. Volt: Watch the red telegraph! Dash away, then Flash right after their swing.',
      radioFinalHint: 'Dr. Volt: That is the meteorite core! Unleash everything you upgraded!',
    },
    rooms: {
      porch: 'Mansion Porch',
      foyer: 'Grand Foyer',
      coatRoom: 'Coat Room',
      parlor: 'Shadow Parlor',
      grandHall: 'Grand Hallway',
      pantry: 'Pantry',
      kitchen: 'Old Kitchen',
      diningHall: 'Dining Hall',
      armory: 'Armor Hall',
      banquetHall: 'Banquet Gallery',
      knightSanctum: 'Knight Sanctum',
      libraryAtrium: 'Library Atrium',
      readingNook: 'Reading Nook',
      secretArchive: 'Secret Archive',
      forbiddenStudy: 'Forbidden Study',
      clockCorridor: 'Pendulum Hall',
      gearRoom: 'Clockwork Gear Room',
      pendulumHall: 'Chime Chamber',
      clockGallery: 'Horology Gallery',
      arcanePassage: 'Arcane Passage',
      grimoireSanctum: 'Grimoire Sanctum',
      conservatoryGate: 'Conservatory Gate',
      moonAtrium: 'Moonlight Atrium',
      eastGreenhouse: 'East Greenhouse',
      thornyNursery: 'Thorny Nursery',
      vineCorridor: 'Vine Corridor',
      botanicalRotunda: 'Botanical Rotunda',
      towerStairs: 'Tower Stairwell',
      starHall: 'Starlight Hall',
      labAnnex: 'Telescope Annex',
      astralBridge: 'Astral Bridge',
      obsVestibule: 'Celestial Vestibule',
      astralCorridor: 'Meteorite Corridor',
      meteorCore: 'Sky Core Dome',
    },
    objectives: {
      explore: 'Explore the mansion & vacuum furniture for clues',
      clearRoom: 'Capture the ambushing ghosts in this room!',
      findKey: 'Search chests & wardrobes for a Mansion Key',
      hitSwitch: 'Flash the green Strobe Sensor (F / Right-Click)',
      reachGoal: 'Proceed to the marked destination room',
      defeatBoss: 'Capture the Shard-Possessed Boss!',
    },
    modals: {
      pausedTitle: 'Mission Paused',
      resume: 'Resume',
      restart: 'Restart Mission',
      toLab: 'Return to Lab',
      victoryTitle: 'Sector Cleared!',
      finalVictoryTitle: 'Mansion Purified!',
      finalVictoryBody: 'Incredible work! Capturing Aetherion purged the meteorite corruption, and all the mansion ghosts are friendly once again. Dr. E. Volt is celebrating in the lab!',
      defeatTitle: 'Spectral Overload!',
      defeatBody: 'The hostile ghosts knocked you out. Upgrade your SpectroVac or deploy traps to turn the tide.',
      rankLabel: 'Rank',
      ectoEarned: 'Ecto-Energy',
      ghostsCaptured: 'Captured',
      timeTaken: 'Time',
      nextMission: 'Next Mission',
      retry: 'Retry Mission',
    },
  },
  ja: {
    gameTitle: 'エクトマンション',
    gameSubtitle: 'SpectroVac 3000',
    startNew: '冒険を始める',
    continueGame: '研究所へ入る',
    openLab: 'ミッションと強化',
    languageLabel: '言語',
    difficultyLabel: '難易度',
    controlsHint: 'WASD 移動 · マウス 照準 · 左クリック 吸引 · 右クリック / F フラッシュ · Space スラム/回避 · 1-3 トラップ',
    difficulties: {
      easy: { name: 'イージー', desc: 'お化けが遅く、受けるダメージも控えめ' },
      normal: { name: 'ノーマル', desc: 'バランスの取れた屋敷の冒険' },
      hard: { name: 'ハード', desc: '好戦的なお化け＆エクト報酬 +35%' },
      nightmare: { name: 'ナイトメア', desc: '極限の難易度＆エクト報酬 +75%' },
    },
    intro: {
      speaker: 'Dr. E・ボルト — 霊体研究所',
      slides: [
        {
          title: '闇の屋敷に緊急事態！',
          body: 'おお、出てくれて助かったよ！屋敷のお化けたちは元々イタズラ好きだけど無害だったんだ…昨夜まではな。',
        },
        {
          title: '空から落ちた謎の隕石',
          body: '空から何かが天文台に墜落し、4つの呪われた欠片に砕け散った！そのせいで霊たちが凶暴化し、4体のボスが暴走しているんだ！',
        },
        {
          title: '新型掃除機「SpectroVac-3000」',
          body: 'フラッシュ(F/右クリック)で怯ませ、左クリック長押しで吸い込んで研究所のタンクへ送ってくれ！工房で機能やトラップを強化しよう！',
        },
      ],
      next: '次へ',
      deploy: '屋敷へ向かう',
      skip: 'スキップ',
    },
    cinematic: {
      speaker: 'Dr. E・ボルト · 緊急通信',
      beats: [
        '闇の屋敷のお化けたちは、いつもイタズラ好きだけど無害な存在だった…',
        '昨夜、空から謎の隕石が墜落し、4つの呪われた欠片に砕け散るまでは！',
        '隕石の波動で霊たちは凶暴化し、4体のボスが屋敷を占拠してしまったんだ。',
        '頼む！今「SpectroVac-3000」を送ったぞ。閃光で怯ませて吸い込み、研究所へ送ってくれ！',
      ],
      skip: 'スキップ',
      startNow: '出動する！',
    },
    touch: {
      vacuum: '吸引',
      flash: 'フラッシュ',
      dash: '回避',
      slam: 'スラム',
      toggleLabel: 'タッチ操作',
    },
    hub: {
      labTitle: 'Dr. E・ボルトの研究所',
      scientistName: 'Dr. E・ボルト',
      scientistQuote: '君が捕まえたお化けが、隕石を浄化する実験のエネルギーになるんだ。',
      fragmentsLabel: '星の欠片',
      ectoBalance: 'エクトエネルギー',
      capturedTotal: '捕獲数',
      tabMissions: '屋敷ミッション (全10種)',
      tabUpgrades: '掃除機＆トラップ強化',
      playMission: '出動する',
      locked: '未開放',
      bossTag: 'ボス',
      wingNames: {
        1: '第1区画 · 闇の玄関ホール',
        2: '第2区画 · 秘術の図書館',
        3: '第3区画 · 月光の温室',
        4: '第4区画 · 天文台の塔',
      },
      upgradeSectionVacuum: 'SpectroVac-3000 強化モジュール',
      upgradeSectionTraps: '特殊トラップ (キー 1, 2, 3)',
      levelLabel: 'Lv.',
      maxed: '最大',
      unlockBtn: '開発する',
      upgradeBtn: '強化する',
      backToTitle: 'タイトルへ',
    },
    missions: {
      1: { title: '01. 最初の出動', briefing: '玄関ホールのグリーン・ラーカーを掃除しよう。吸引前にフラッシュ(F/右クリック)！' },
      2: { title: '02. 呪われた晩餐会', briefing: 'エクトプラズムを吐き出すスピッターに気をつけろ。' },
      3: { title: '03. 虚ろの騎士', briefing: 'ボス1：サー・クラングは盾で防ぐぞ。攻撃を回避した直後にフラッシュだ！' },
      4: { title: '04. 囁く本棚', briefing: 'スニーク・シェイドは透明に近い。フラッシュの光で姿を暴け！' },
      5: { title: '05. 時計仕掛けの回廊', briefing: '高速のダッシャーと装甲霊が同時に襲いかかる！' },
      6: { title: '06. 生ける魔導書', briefing: 'ボス2：呪われた魔導書が霊を呼び出す。トラップで動きを封じよう！' },
      7: { title: '07. 毒花の温室', briefing: '毒胞子と素早いお化けが温室を満たしている。' },
      8: { title: '08. 茨の庭園', briefing: 'ボス3：ソーンシェイド男爵夫人の茨攻撃をかわし、氷や網のトラップへ誘い込め！' },
      9: { title: '09. 隕石の裂け目', briefing: '天文台の核を守る精鋭ゴーストたちを突破せよ。' },
      10: { title: '10. 天墜のコア', briefing: '最終ボス：エテリオンが隕石の力を操る。浄化して屋敷を救おう！' },
    },
    bosses: {
      boss_clang: { name: 'サー・クラング', subtitle: '玄関の守護者 · 欠片 I' },
      boss_grimoire: { name: '生ける魔導書', subtitle: '図書館の禁書 · 欠片 II' },
      boss_thorn: { name: 'ソーンシェイド夫人', subtitle: '温室の女王 · 欠片 III' },
      boss_aetherion: { name: 'エテリオン・天墜核', subtitle: '隕石の特異点 · 最終欠片' },
    },
    upgrades: {
      suction: { name: '吸引タービン', desc: 'お化けを吸い込む力と秒間ダメージを強化します。' },
      strobe: { name: 'ストロボフラッシュ', desc: '閃光の範囲・射程・スタン時間を拡大します。' },
      slam: { name: 'スペクトラル・スラム', desc: '吸引中にSpaceで放つ衝撃波ダメージを強化します。' },
      suit: { name: '対霊強化スーツ', desc: 'レベルごとに最大HPが +25 増加します。' },
    },
    traps: {
      snare: { name: 'エクト捕縛ネット', short: '捕縛網', desc: '踏んだお化けを地面に拘束してスタンさせます。' },
      decoy: { name: 'ソーラーデコイ', short: 'デコイ', desc: '周囲のお化けを引き寄せ、眩しい閃光で爆発します。' },
      cryo: { name: 'クライオ渦巻コイル', short: '氷コイル', desc: '周囲を冷却し、お化けを減速させて中心へ引き寄せます。' },
    },
    hud: {
      wave: 'ウェーブ',
      ghostsLeft: '残り霊体',
      slamReady: 'スラム準備完了! [Space]',
      slamCharge: 'スラム充填',
      flashReady: 'フラッシュ [F/右]',
      dash: '回避 [Space]',
      pause: '一時停止',
      mute: '消音',
      unmute: '音声',
      controlBar: 'WASD 移動 · 右クリック/F フラッシュ · 左長押し 吸引 · Space スラム/回避 · 1-3 トラップ',
      keys: 'カギ',
      roomsVisited: '探索',
      radioExploreHint: 'Dr.ボルト: 屋敷の中を歩き回り、怪しい宝箱やタンスを掃除機で調べてみよう！',
      radioKeyFound: 'Dr.ボルト: 屋敷のカギを見つけたぞ！黄金の扉に近づいて開けよう！',
      radioDoorUnlocked: 'Dr.ボルト: 扉の封印が解けた！次の部屋へ進もう！',
      radioSwitchHint: 'Dr.ボルト: 緑のセンサーにフラッシュ(Fか右クリック)を当てて扉を開けるんだ！',
      radioStunHint: 'Dr.ボルト: 吸う前にフラッシュ(Fか右クリック)で目を眩ませるんだ！',
      radioPullHint: 'Dr.ボルト: その調子！左長押しで引き寄せ、ゲージが溜まったらSpaceだ！',
      radioBossHint: 'Dr.ボルト: 赤い予兆に気をつけろ！回避した直後にフラッシュを狙え！',
      radioFinalHint: 'Dr.ボルト: あれが隕石の核だ！強化した全ての力とトラップを使い切れ！',
    },
    rooms: {
      porch: '屋敷の玄関ポーチ',
      foyer: '大広間',
      coatRoom: 'クローク室',
      parlor: '闇の応接間',
      grandHall: '大廊下',
      pantry: '食料庫',
      kitchen: '古い厨房',
      diningHall: '大食堂',
      armory: '甲冑の間',
      banquetHall: '宴の回廊',
      knightSanctum: '騎士の聖域',
      libraryAtrium: '図書館アトリウム',
      readingNook: '読書室',
      secretArchive: '秘密の書庫',
      forbiddenStudy: '禁断の書斎',
      clockCorridor: '振り子の廊下',
      gearRoom: '歯車の部屋',
      pendulumHall: '時計の間',
      clockGallery: '機械仕掛けの回廊',
      arcanePassage: '秘術の通路',
      grimoireSanctum: '魔導書の聖域',
      conservatoryGate: '温室の入口',
      moonAtrium: '月光の中庭',
      eastGreenhouse: '東の温室',
      thornyNursery: '茨の苗床',
      vineCorridor: '蔓の回廊',
      botanicalRotunda: '植物の円堂',
      towerStairs: '塔の階段室',
      starHall: '星明りの広間',
      labAnnex: '天体観測室',
      astralBridge: '星の架け橋',
      obsVestibule: '天文台の前室',
      astralCorridor: '隕石の回廊',
      meteorCore: '天墜核ドーム',
    },
    objectives: {
      explore: '屋敷を探索し、掃除機で家具を調べよう',
      clearRoom: '部屋に現れたお化けをすべて捕獲しよう！',
      findKey: '他の部屋の宝箱やタンスからカギを探そう',
      hitSwitch: '緑色のセンサーにフラッシュ(F/右)を当てよう',
      reachGoal: 'マップの目的地ルームへ向かおう',
      defeatBoss: '欠片に憑かれたボスを捕獲しよう！',
    },
    modals: {
      pausedTitle: 'ポーズ中',
      resume: '再開する',
      restart: 'やり直す',
      toLab: '研究所へ戻る',
      victoryTitle: '区画クリア！',
      finalVictoryTitle: '屋敷の浄化完了！',
      finalVictoryBody: '見事だ！エテリオンを捕獲したことで隕石の呪いは消え、お化けたちは元の優しい姿に戻ったぞ！研究所で祝杯をあげよう！',
      defeatTitle: '霊力オーバーロード！',
      defeatBody: 'お化けに圧倒されてしまった。研究所で掃除機やトラップを強化して再挑戦しよう。',
      rankLabel: 'ランク',
      ectoEarned: '獲得エクト',
      ghostsCaptured: '捕獲数',
      timeTaken: 'タイム',
      nextMission: '次のミッション',
      retry: '再挑戦',
    },
  },
};
