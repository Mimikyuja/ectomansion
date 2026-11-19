import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AudioEngine } from './audio';
import {
  DIFFICULTIES,
  TRAP_SPECS,
  getPlayerMaxHp,
  getSlamDamage,
  getStrobeStats,
  getVacuumDps,
} from './data';
import { ROOM_GRID_STEP, ROOM_INNER_HALF, getFloorPlanForMission } from './layouts';
import {
  GhostRig,
  KidHeroRig,
  MansionDoorRuntime,
  MansionFloorBuildResult,
  MansionPropRuntime,
  MansionRoomRuntime,
  ObstacleBox,
  RoomBuildResult,
  buildMansionFloor,
  createGhostMesh,
  createKidHero,
  createMansionRoom,
  createTrapMesh,
} from './models';
import { createContactShadowTexture } from './textures';
import {
  DifficultyId,
  GhostType,
  HudSnapshot,
  MinimapRoomInfo,
  MissionDef,
  MissionResult,
  TrapType,
  UpgradesState,
} from './types';

// Reusable scratch math objects (Zero GC inside render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _ndc = new THREE.Vector2();
const _floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.7);
const _raycaster = new THREE.Raycaster();

interface GhostEntity {
  id: number;
  type: GhostType;
  isBoss: boolean;
  rig: GhostRig;
  x: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  state: 'chase' | 'windup' | 'attack' | 'recover' | 'stunned';
  stateTimer: number;
  attackCooldown: number;
  hitFlashTimer: number;
  phase: number;
  targetX: number;
  targetZ: number;
  beingPulled: boolean;
}

interface ProjectileEntity {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  damage: number;
  life: number;
}

interface HazardCircle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  x: number;
  z: number;
  radius: number;
  timer: number;
  duration: number;
  damage: number;
  triggered: boolean;
}

interface ActiveTrap {
  type: TrapType;
  mesh: THREE.Group;
  x: number;
  z: number;
  life: number;
  level: number;
  tickTimer: number;
}

interface EctoPickup {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  vy: number;
  y: number;
  kind: 'ecto' | 'heart';
  value: number;
  life: number;
}

interface Particle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scaleRate: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onMissionComplete: (result: MissionResult) => void;
  onMissionFailed: () => void;
  onTogglePause: () => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  public audio: AudioEngine;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private contactTex: THREE.CanvasTexture;

  private frameId = 0;
  private lastTime = 0;
  private disposed = false;

  // Lighting
  private keyLight: THREE.DirectionalLight;
  private flashPointLight: THREE.PointLight;
  private vacSpotLight: THREE.SpotLight;

  // Room & Actors
  private currentRoom: RoomBuildResult | null = null;
  private floorState: MansionFloorBuildResult | null = null;
  private hero: KidHeroRig;
  private roomHalfSize = 9.4;

  // Mode
  private mode: 'diorama' | 'cinematic' | 'playing' | 'paused' | 'ended' = 'diorama';
  private dioramaAngle = 0;

  // Cinematic State
  private cineTimer = 0;
  private cineBeat = 0;
  private cineMeteor: THREE.Group | null = null;
  private cineShards: { mesh: THREE.Mesh; vx: number; vy: number; vz: number }[] = [];
  private cineBeam: THREE.Mesh | null = null;
  private cineMeteorCrashed = false;
  private cineBeamFired = false;
  private cineOnBeat?: (beat: number) => void;
  private cineOnDone?: () => void;

  // Active Mission State
  private mission: MissionDef | null = null;
  private difficulty: DifficultyId = 'normal';
  private upgrades!: UpgradesState;

  private playerX = 0;
  private playerZ = 3;
  private playerYaw = 0;
  private playerVx = 0;
  private playerVz = 0;
  private playerHp = 100;
  private playerMaxHp = 100;
  private invulnTimer = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  private dashDirX = 0;
  private dashDirZ = 0;
  private walkPhase = 0;

  private strobeCooldown = 0;
  private strobeVisualTimer = 0;
  private surgeCharge = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;

  private currentRoomId = 'porch';
  private mansionKeys = 0;
  private capturedCount = 0;
  private ectoCollectedInMission = 0;
  private damageTaken = 0;
  private elapsedSeconds = 0;
  private nextGhostId = 1;
  private radioMessageKey: string | null = null;
  private radioTimer = 0;
  private hasShownStunHint = false;
  private hasShownPullHint = false;

  private ghosts: GhostEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private hazards: HazardCircle[] = [];
  private traps: ActiveTrap[] = [];
  private pickups: EctoPickup[] = [];
  private particles: Particle[] = [];
  private trapCharges: Record<TrapType, number> = { snare: 2, decoy: 0, cryo: 0 };

  // Input state
  private keysHeld = new Set<string>();
  private pointerNdcX = 0;
  private pointerNdcY = 0;
  private pointerMoved = false;
  private isVacuumHeld = false;
  private virtualJoyX = 0;
  private virtualJoyY = 0;
  private virtualVacuumHeld = false;
  private hudEmitTimer = 0;

  // Camera smooth state
  private camTargetX = 0;
  private camTargetZ = 0;

  // Shared Particle Geometry
  private particleGeo = new THREE.OctahedronGeometry(0.14, 0);
  private pickupGeo = new THREE.OctahedronGeometry(0.24, 0);
  private projGeo = new THREE.SphereGeometry(0.22, 10, 10);

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.audio = new AudioEngine();

    // Probe Software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || 1280, container.clientHeight || 720);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0e17);
    this.scene.fog = new THREE.FogExp2(0x0b0e17, 0.018);

    // Studio Environment Reflection (PMREM RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const aspect = (container.clientWidth || 1280) / (container.clientHeight || 720);
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.5, 120);
    this.camera.position.set(13, 16.5, 13);
    this.camera.lookAt(0, 0.8, 0);

    // 3-Point Stylized Mansion Lighting Rig
    const hemi = new THREE.HemisphereLight(0x60a5fa, 0x1e1b2e, 0.72);
    this.scene.add(hemi);

    this.keyLight = new THREE.DirectionalLight(0xffedd5, 1.45);
    this.keyLight.position.set(10, 18, 9);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 45;
    const d = 14;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.65);
    rimLight.position.set(-12, 8, -10);
    this.scene.add(rimLight);

    this.flashPointLight = new THREE.PointLight(0xfef08a, 0, 14, 1.5);
    this.scene.add(this.flashPointLight);

    this.contactTex = createContactShadowTexture();
    this.hero = createKidHero(this.contactTex);
    this.scene.add(this.hero.group);

    this.vacSpotLight = new THREE.SpotLight(0x7dd3fc, 2.2, 12, Math.PI / 5, 0.55, 1.2);
    this.vacSpotLight.position.set(0.34, 1.0, 0.5);
    this.vacSpotLight.target.position.set(0.34, 0.4, 5.0);
    this.hero.group.add(this.vacSpotLight);
    this.hero.group.add(this.vacSpotLight.target);

    this.loadDioramaScene();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.lastTime = performance.now();
    this.tick();
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('contextmenu', this.onContextMenu);
  }

  private unbindEvents() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('contextmenu', this.onContextMenu);
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onBlur = () => {
    this.keysHeld.clear();
    this.isVacuumHeld = false;
    this.audio.setVacuumActive(false, false);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    if (code === 'Escape' && (this.mode === 'playing' || this.mode === 'paused')) {
      e.preventDefault();
      this.callbacks.onTogglePause();
      return;
    }

    if (this.mode !== 'playing') return;

    if (!this.keysHeld.has(code)) {
      // Edge-triggered actions
      if (code === 'KeyF' || code === 'KeyE') {
        this.triggerStrobeFlash();
      } else if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') {
        e.preventDefault();
        this.triggerSpaceAction();
      } else if (code === 'Digit1') {
        this.deployTrap('snare');
      } else if (code === 'Digit2') {
        this.deployTrap('decoy');
      } else if (code === 'Digit3') {
        this.deployTrap('cryo');
      }
    }

    if (code === 'KeyJ') {
      this.isVacuumHeld = true;
    }
    this.keysHeld.add(code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
    if (e.code === 'KeyJ') {
      this.isVacuumHeld = false;
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerMoved = true;
  };

  private onPointerDown = (e: PointerEvent) => {
    this.audio.unlock();
    if (this.mode !== 'playing') return;
    if (e.pointerType !== 'mouse') return;
    this.onPointerMove(e);
    if (e.button === 0) {
      this.isVacuumHeld = true;
    } else if (e.button === 2) {
      this.triggerStrobeFlash();
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button === 0) {
      this.isVacuumHeld = false;
    }
  };

  public setVirtualJoystick(x: number, y: number) {
    this.audio.unlock();
    this.virtualJoyX = THREE.MathUtils.clamp(x, -1, 1);
    this.virtualJoyY = THREE.MathUtils.clamp(y, -1, 1);
    if (Math.hypot(x, y) > 0.1) {
      // Touch play uses joystick / auto-aim rather than stale mouse cursor
      this.pointerMoved = false;
    }
  }

  public setVirtualVacuum(active: boolean) {
    this.audio.unlock();
    this.virtualVacuumHeld = active;
    if (active) {
      this.pointerMoved = false;
    }
  }

  public loadDioramaScene() {
    this.clearDynamicEntities();
    this.clearCinematicProps();
    this.disposeFloorState();
    this.mode = 'diorama';
    this.audio.setVacuumActive(false, false);
    this.audio.setMusicTheme('title');
    this.buildRoom('foyer');

    this.playerX = 0;
    this.playerZ = 1.5;
    this.playerYaw = 0.2;
    this.hero.group.position.set(this.playerX, 0, this.playerZ);
    this.hero.group.rotation.y = this.playerYaw;
    this.hero.suctionCone.visible = false;
    this.hero.flashCone.visible = false;

    // Spawn a few atmospheric diorama ghosts floating around
    const dioramaTypes: GhostType[] = ['lurker', 'sneak', 'dasher', 'spitter'];
    dioramaTypes.forEach((t, i) => {
      const a = (i / dioramaTypes.length) * Math.PI * 2;
      const g = this.spawnGhostEntity(t, Math.cos(a) * 4.5, Math.sin(a) * 4.2, 1);
      g.rig.coreMat.opacity = t === 'sneak' ? 0.55 : 0.9;
    });
  }

  public startCinematic(onBeatChange: (beat: number) => void, onComplete: () => void) {
    this.audio.unlock();
    this.clearDynamicEntities();
    this.clearCinematicProps();
    this.disposeFloorState();
    this.buildRoom('observatory');
    this.mode = 'cinematic';
    this.cineTimer = 0;
    this.cineBeat = 0;
    this.cineMeteorCrashed = false;
    this.cineBeamFired = false;
    this.cineOnBeat = onBeatChange;
    this.cineOnDone = onComplete;
    this.audio.setVacuumActive(false, false);
    this.audio.setMusicTheme('cinematic');

    this.playerX = 0;
    this.playerZ = 3.2;
    this.playerYaw = Math.PI;
    this.hero.group.position.set(this.playerX, 0, this.playerZ);
    this.hero.group.rotation.y = this.playerYaw;
    this.hero.suctionCone.visible = false;
    this.hero.flashCone.visible = false;
    this.hero.nozzleGroup.visible = false;
    this.hero.tankLiquid.visible = false;

    // 4 friendly floating mansion ghosts
    const colors = [0x34d399, 0x38bdf8, 0xa78bfa, 0x34d399];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const g = this.spawnGhostEntity('lurker', Math.cos(a) * 4.2, Math.sin(a) * 4.2, 1);
      g.rig.coreMat.color.setHex(colors[i]);
      g.rig.coreMat.emissive.setHex(colors[i]);
    }

    // Create Sky Meteorite Group (starts high above scene)
    const meteor = new THREE.Group();
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.15, 0),
      new THREE.MeshStandardMaterial({
        color: 0x312e81,
        emissive: 0x7c3aed,
        emissiveIntensity: 1.4,
        roughness: 0.35,
        metalness: 0.4,
      }),
    );
    const halo = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.45, 0),
      new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.4,
        wireframe: true,
      }),
    );
    meteor.add(rock, halo);
    meteor.position.set(0, 22, -1.5);
    meteor.visible = false;
    this.scene.add(meteor);
    this.cineMeteor = meteor;

    // Create Cyan Teleport Beam (hidden until Beat 3/4)
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 16, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    beam.position.set(this.playerX, 8, this.playerZ);
    beam.visible = false;
    this.scene.add(beam);
    this.cineBeam = beam;

    onBeatChange(0);
  }

  public advanceCinematicBeat() {
    if (this.mode !== 'cinematic') return;
    if (this.cineBeat < 3) {
      this.cineTimer = (this.cineBeat + 1) * 4.0;
    } else {
      this.finishCinematic();
    }
  }

  public skipCinematic() {
    if (this.mode !== 'cinematic') return;
    this.finishCinematic();
  }

  private finishCinematic() {
    this.clearCinematicProps();
    this.hero.nozzleGroup.visible = true;
    this.hero.tankLiquid.visible = true;
    const cb = this.cineOnDone;
    this.cineOnDone = undefined;
    cb?.();
  }

  private clearCinematicProps() {
    if (this.cineMeteor) {
      this.scene.remove(this.cineMeteor);
      this.cineMeteor = null;
    }
    if (this.cineBeam) {
      this.scene.remove(this.cineBeam);
      this.cineBeam = null;
    }
    this.cineShards.forEach((s) => this.scene.remove(s.mesh));
    this.cineShards = [];
    this.hero.nozzleGroup.visible = true;
    this.hero.tankLiquid.visible = true;
  }

  public startMission(
    mission: MissionDef,
    difficulty: DifficultyId,
    upgrades: UpgradesState,
  ) {
    this.audio.unlock();
    this.clearCinematicProps();
    this.clearDynamicEntities();
    this.mission = mission;
    this.difficulty = difficulty;
    this.upgrades = upgrades;

    this.buildFloor(mission.id, mission.theme);
    this.audio.setMusicTheme('mansion');

    const startRoom =
      this.floorState?.rooms.find((r) => r.blueprint.isStart) || this.floorState?.rooms[0];

    this.playerX = startRoom ? startRoom.cx : 0;
    this.playerZ = startRoom ? startRoom.cz + 1.8 : 2.0;
    this.playerVx = 0;
    this.playerVz = 0;
    this.playerYaw = Math.PI;
    this.playerMaxHp = getPlayerMaxHp(upgrades);
    this.playerHp = this.playerMaxHp;
    this.invulnTimer = 0.8;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.strobeCooldown = 0;
    this.strobeVisualTimer = 0;
    this.surgeCharge = 0;
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;

    this.currentRoomId = startRoom ? startRoom.blueprint.id : 'porch';
    this.mansionKeys = 0;
    this.capturedCount = 0;
    this.ectoCollectedInMission = 0;
    this.damageTaken = 0;
    this.elapsedSeconds = 0;
    this.hasShownStunHint = false;
    this.hasShownPullHint = false;

    this.trapCharges = {
      snare: upgrades.traps.snare > 0 ? 2 + (upgrades.traps.snare - 1) : 0,
      decoy: upgrades.traps.decoy > 0 ? 2 + (upgrades.traps.decoy - 1) : 0,
      cryo: upgrades.traps.cryo > 0 ? 2 + (upgrades.traps.cryo - 1) : 0,
    };

    this.hero.group.position.set(this.playerX, 0, this.playerZ);
    this.hero.group.rotation.y = this.playerYaw;
    this.camTargetX = this.playerX;
    this.camTargetZ = this.playerZ;

    if (startRoom?.blueprint.ambushOnEnter && !startRoom.ambushTriggered) {
      this.triggerRoomAmbush(startRoom);
    }

    if (mission.id === 1) {
      this.showRadio('radioExploreHint', 6.0);
    } else if (mission.id === 10) {
      this.showRadio('radioFinalHint', 5.0);
    } else {
      this.radioMessageKey = null;
    }

    this.mode = 'playing';
    this.emitHud();
  }

  public setPaused(paused: boolean) {
    if (this.mode === 'ended' || this.mode === 'diorama' || this.mode === 'cinematic') return;
    this.mode = paused ? 'paused' : 'playing';
    if (paused) {
      this.isVacuumHeld = false;
      this.virtualVacuumHeld = false;
      this.virtualJoyX = 0;
      this.virtualJoyY = 0;
      this.keysHeld.clear();
      this.audio.setVacuumActive(false, false);
    }
  }

  private showRadio(key: string, duration = 4.5) {
    this.radioMessageKey = key;
    this.radioTimer = duration;
    this.audio.playRadioBeep();
  }

  private disposeSingleRoom() {
    if (this.currentRoom) {
      this.scene.remove(this.currentRoom.group);
      this.currentRoom.disposables.forEach((d) => d.dispose());
      this.currentRoom = null;
    }
  }

  private disposeFloorState() {
    if (this.floorState) {
      this.scene.remove(this.floorState.group);
      this.floorState.disposables.forEach((d) => d.dispose());
      this.floorState = null;
    }
  }

  private buildRoom(theme: MissionDef['theme']) {
    this.disposeSingleRoom();
    this.disposeFloorState();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.currentRoom = createMansionRoom(theme, this.roomHalfSize, maxAniso, this.contactTex);
    this.scene.add(this.currentRoom.group);
  }

  private buildFloor(missionId: number, theme: MissionDef['theme']) {
    this.disposeSingleRoom();
    this.disposeFloorState();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const plan = getFloorPlanForMission(missionId, theme);
    this.floorState = buildMansionFloor(plan, maxAniso, this.contactTex);
    this.scene.add(this.floorState.group);
  }

  private clearDynamicEntities() {
    this.ghosts.forEach((g) => this.scene.remove(g.rig.group));
    this.ghosts = [];
    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.projectiles = [];
    this.hazards.forEach((h) => this.scene.remove(h.mesh));
    this.hazards = [];
    this.traps.forEach((t) => this.scene.remove(t.mesh));
    this.traps = [];
    this.pickups.forEach((p) => this.scene.remove(p.mesh));
    this.pickups = [];
    this.particles.forEach((pt) => this.scene.remove(pt.mesh));
    this.particles = [];
    this.isVacuumHeld = false;
    this.keysHeld.clear();
  }

  private spawnGhostEntity(
    type: GhostType,
    x: number,
    z: number,
    hpMult = 1,
    speedMult = 1,
    dmgMult = 1,
  ): GhostEntity {
    const rig = createGhostMesh(type, this.contactTex);
    rig.group.position.set(x, 0, z);
    this.scene.add(rig.group);

    const stats: Record<GhostType, { hp: number; speed: number; dmg: number; r: number }> = {
      lurker: { hp: 58, speed: 2.5, dmg: 12, r: 0.65 },
      dasher: { hp: 72, speed: 3.4, dmg: 18, r: 0.68 },
      sneak: { hp: 65, speed: 2.8, dmg: 16, r: 0.65 },
      spitter: { hp: 68, speed: 2.0, dmg: 14, r: 0.72 },
      armored: { hp: 115, speed: 2.1, dmg: 20, r: 0.85 },
      boss_clang: { hp: 380, speed: 2.3, dmg: 24, r: 1.25 },
      boss_grimoire: { hp: 460, speed: 2.6, dmg: 22, r: 1.25 },
      boss_thorn: { hp: 540, speed: 2.4, dmg: 26, r: 1.3 },
      boss_aetherion: { hp: 680, speed: 2.8, dmg: 30, r: 1.4 },
    };

    const s = stats[type];
    const entity: GhostEntity = {
      id: this.nextGhostId++,
      type,
      isBoss: type.startsWith('boss_'),
      rig,
      x,
      z,
      vx: 0,
      vz: 0,
      yaw: 0,
      hp: Math.round(s.hp * hpMult),
      maxHp: Math.round(s.hp * hpMult),
      radius: s.r,
      speed: s.speed * speedMult,
      damage: Math.round(s.dmg * dmgMult),
      state: 'chase',
      stateTimer: 0,
      attackCooldown: 1.4 + Math.random() * 1.1,
      hitFlashTimer: 0,
      phase: 1,
      targetX: x,
      targetZ: z,
      beingPulled: false,
    };

    this.ghosts.push(entity);
    return entity;
  }

  public triggerStrobeFlash() {
    if (this.mode !== 'playing' || this.strobeCooldown > 0) return;

    // Smart auto-aim on touch / keyboard-only if pointer hasn't aimed via mouse
    if (!this.pointerMoved) {
      const nearest = this.findNearestGhost(8.5);
      if (nearest) {
        this.playerYaw = Math.atan2(nearest.x - this.playerX, nearest.z - this.playerZ);
        this.hero.group.rotation.y = this.playerYaw;
      } else {
        const sw = this.findNearestProp(7.5, true);
        if (sw) {
          this.playerYaw = Math.atan2(sw.x - this.playerX, sw.z - this.playerZ);
          this.hero.group.rotation.y = this.playerYaw;
        }
      }
    }

    const strobe = getStrobeStats(this.upgrades);
    this.strobeCooldown = strobe.cooldown;
    this.strobeVisualTimer = 0.22;
    this.hero.flashCone.visible = true;
    (this.hero.flashCone.material as THREE.MeshBasicMaterial).opacity = 0.72;
    this.flashPointLight.position.set(
      this.playerX + Math.sin(this.playerYaw) * 2.5,
      1.6,
      this.playerZ + Math.cos(this.playerYaw) * 2.5,
    );
    this.flashPointLight.color.setHex(0xfef08a);
    this.flashPointLight.intensity = 6.5;

    this.audio.playStrobeFlash();
    this.shakeIntensity = Math.max(this.shakeIntensity, 0.14);

    const aimX = Math.sin(this.playerYaw);
    const aimZ = Math.cos(this.playerYaw);
    const cosHalf = Math.cos(strobe.angleRad);

    for (const g of this.ghosts) {
      const dx = g.x - this.playerX;
      const dz = g.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist > strobe.range + g.radius) continue;

      const nx = dist > 0.01 ? dx / dist : aimX;
      const nz = dist > 0.01 ? dz / dist : aimZ;
      const dot = nx * aimX + nz * aimZ;

      if (dot >= cosHalf || dist < 1.35) {
        // Check directional shield on Armored / Sir Clang
        const ghostFaceX = Math.sin(g.yaw);
        const ghostFaceZ = Math.cos(g.yaw);
        const facingPlayer = ghostFaceX * -nx + ghostFaceZ * -nz > 0.35;

        const shieldActive =
          (g.type === 'armored' && g.state !== 'recover' && g.state !== 'stunned' && facingPlayer) ||
          (g.type === 'boss_clang' && g.state !== 'recover' && g.state !== 'stunned' && facingPlayer);

        if (shieldActive) {
          // Sparks clang off shield!
          this.spawnBurst(g.x, 1.1, g.z, 0xfbbf24, 6);
          if (!this.hasShownPullHint) {
            this.showRadio('radioBossHint', 3.5);
          }
        } else {
          this.stunGhost(g, strobe.stunDuration);
          g.hp -= 6;
          this.spawnBurst(g.x, 1.1, g.z, 0xfef08a, 10);
          if (this.mission?.id === 1 && !this.hasShownPullHint) {
            this.hasShownPullHint = true;
            this.showRadio('radioPullHint', 4.5);
          }
        }
      }
    }

    // Activate any Strobe Sensor switches inside the flash cone
    if (this.floorState) {
      for (const prop of this.floorState.props) {
        if (prop.opened || prop.kind !== 'strobe_switch') continue;
        const dx = prop.x - this.playerX;
        const dz = prop.z - this.playerZ;
        const dist = Math.hypot(dx, dz);
        if (dist > strobe.range + 0.8) continue;
        const nx = dist > 0.01 ? dx / dist : aimX;
        const nz = dist > 0.01 ? dz / dist : aimZ;
        const dot = nx * aimX + nz * aimZ;
        if (dot >= cosHalf || dist < 2.2) {
          prop.opened = true;
          if (prop.lidOrOrb && prop.lidOrOrb instanceof THREE.Mesh) {
            const mat = prop.lidOrOrb.material as THREE.MeshStandardMaterial;
            mat.color.setHex(0xfef08a);
            mat.emissive.setHex(0xf59e0b);
            mat.emissiveIntensity = 2.4;
          }
          this.spawnBurst(prop.x, 1.3, prop.z, 0xfef08a, 18);
          this.audio.playCapture(false);
          if (prop.unlocksDoorId) {
            this.unlockDoorById(prop.unlocksDoorId);
            this.showRadio('radioDoorUnlocked', 3.8);
          }
        }
      }
    }
  }

  private findNearestGhost(maxDist: number): GhostEntity | null {
    let best: GhostEntity | null = null;
    let bestD = maxDist;
    for (const g of this.ghosts) {
      const d = Math.hypot(g.x - this.playerX, g.z - this.playerZ);
      if (d < bestD) {
        bestD = d;
        best = g;
      }
    }
    return best;
  }

  private findNearestProp(maxDist: number, switchesOnly: boolean): MansionPropRuntime | null {
    if (!this.floorState) return null;
    let best: MansionPropRuntime | null = null;
    let bestD = maxDist;
    for (const p of this.floorState.props) {
      if (p.opened) continue;
      if (switchesOnly && p.kind !== 'strobe_switch') continue;
      if (!switchesOnly && p.kind === 'strobe_switch') continue;
      const d = Math.hypot(p.x - this.playerX, p.z - this.playerZ);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  private stunGhost(g: GhostEntity, duration: number) {
    g.state = 'stunned';
    g.stateTimer = g.isBoss ? duration * 0.82 : duration;
    g.rig.stunStars.visible = true;
    g.rig.telegraphMat.opacity = 0;
    g.hitFlashTimer = 0.16;
    if (g.type === 'sneak') {
      g.rig.coreMat.opacity = 0.92;
    }
  }

  public triggerSpaceAction() {
    if (this.mode !== 'playing') return;

    // Check if pulling a ghost and Surge is full -> POWER SLAM!
    const pulled = this.ghosts.filter((g) => g.beingPulled);
    if (pulled.length > 0 && this.surgeCharge >= 95) {
      this.surgeCharge = 0;
      const slamDmg = getSlamDamage(this.upgrades);
      this.audio.playPowerSlam();
      this.hitstopTimer = 0.055;
      this.shakeIntensity = 0.42;

      const center = pulled[0];
      this.spawnBurst(center.x, 1.0, center.z, 0x34d399, 24);
      this.flashPointLight.position.set(center.x, 1.8, center.z);
      this.flashPointLight.color.setHex(0x34d399);
      this.flashPointLight.intensity = 7.0;

      // Expanding ring hazard visual for player slam
      this.spawnShockwaveVisual(center.x, center.z, 4.2, 0x34d399);

      for (const g of this.ghosts) {
        const d = Math.hypot(g.x - center.x, g.z - center.z);
        if (d <= 4.3 + g.radius) {
          const dealt = g === center ? slamDmg : Math.round(slamDmg * 0.65);
          g.hp -= dealt;
          g.hitFlashTimer = 0.2;
          if (!g.isBoss && g.state !== 'stunned') {
            this.stunGhost(g, 1.8);
          }
          // Knockback away from player
          const kx = g.x - this.playerX;
          const kz = g.z - this.playerZ;
          const kl = Math.hypot(kx, kz) || 1;
          g.vx += (kx / kl) * 4.5;
          g.vz += (kz / kl) * 4.5;
        }
      }
      return;
    }

    // Otherwise -> Dodge Dash!
    if (this.dashCooldown <= 0 && this.dashTimer <= 0) {
      const move = this.getMoveVector();
      let dx = move.x;
      let dz = move.z;
      if (Math.hypot(dx, dz) < 0.1) {
        dx = Math.sin(this.playerYaw);
        dz = Math.cos(this.playerYaw);
      }
      this.dashDirX = dx;
      this.dashDirZ = dz;
      this.dashTimer = 0.18;
      this.dashCooldown = 0.72;
      this.invulnTimer = Math.max(this.invulnTimer, 0.26);
      this.audio.playDash();
      this.spawnBurst(this.playerX, 0.3, this.playerZ, 0x7dd3fc, 8);
    }
  }

  public deployTrap(type: TrapType) {
    if (this.mode !== 'playing') return;
    const level = this.upgrades.traps[type];
    if (level <= 0 || this.trapCharges[type] <= 0) return;

    this.trapCharges[type]--;
    const mesh = createTrapMesh(type);
    mesh.position.set(this.playerX, 0, this.playerZ);
    this.scene.add(mesh);

    this.traps.push({
      type,
      mesh,
      x: this.playerX,
      z: this.playerZ,
      life: type === 'snare' ? 18 : type === 'decoy' ? 3.5 : 8.0,
      level,
      tickTimer: 0,
    });
    this.audio.playTrapDeploy();
    this.emitHud();
  }

  private getMoveVector(): { x: number; z: number } {
    // Camera sits at (+13, +16.5, +13), so screen-up is (-1, -1) and screen-right is (+1, -1)
    let forwardInput = -this.virtualJoyY; // virtualJoyY up is negative screen Y
    let rightInput = this.virtualJoyX;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) forwardInput += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) forwardInput -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) rightInput += 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) rightInput -= 1;

    // Project onto world X, Z aligned with isometric camera view
    let wx = -forwardInput * 0.7071 + rightInput * 0.7071;
    let wz = -forwardInput * 0.7071 - rightInput * 0.7071;
    const len = Math.hypot(wx, wz);
    if (len > 1) {
      wx /= len;
      wz /= len;
    }
    return { x: wx, z: wz };
  }

  private resolveCollisions(x: number, z: number, radius: number): { x: number; z: number } {
    let nx = x;
    let nz = z;
    let boxes: ObstacleBox[] = [];

    if (this.floorState) {
      boxes = this.floorState.obstacles;
    } else {
      const limit = this.roomHalfSize - radius - 0.35;
      nx = THREE.MathUtils.clamp(nx, -limit, limit);
      nz = THREE.MathUtils.clamp(nz, -limit, limit);
      if (this.currentRoom) boxes = this.currentRoom.obstacles;
    }

    for (let pass = 0; pass < 2; pass++) {
      for (const box of boxes) {
        const closestX = THREE.MathUtils.clamp(nx, box.minX, box.maxX);
        const closestZ = THREE.MathUtils.clamp(nz, box.minZ, box.maxZ);
        const dx = nx - closestX;
        const dz = nz - closestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = radius - dist;
            nx += (dx / dist) * push;
            nz += (dz / dist) * push;
          } else {
            nx += radius;
          }
        }
      }
    }
    return { x: nx, z: nz };
  }

  private findRoomAt(x: number, z: number): MansionRoomRuntime | null {
    if (!this.floorState) return null;
    let best: MansionRoomRuntime | null = null;
    let bestDist = Infinity;
    for (const r of this.floorState.rooms) {
      const dx = Math.abs(x - r.cx);
      const dz = Math.abs(z - r.cz);
      if (dx <= ROOM_GRID_STEP / 2 && dz <= ROOM_GRID_STEP / 2) {
        return r;
      }
      const d = dx + dz;
      if (d < bestDist) {
        bestDist = d;
        best = r;
      }
    }
    return best;
  }

  private triggerRoomAmbush(room: MansionRoomRuntime) {
    room.ambushTriggered = true;
    const spawns = room.blueprint.ambushOnEnter;
    if (!spawns || spawns.length === 0) {
      room.cleared = true;
      return;
    }
    room.cleared = false;
    const diff = DIFFICULTIES[this.difficulty];
    let hasBoss = false;
    let idx = 0;

    for (const group of spawns) {
      for (let i = 0; i < group.count; i++) {
        const isBoss = group.type.startsWith('boss_');
        if (isBoss) hasBoss = true;
        const angle = idx * 1.65 + 0.5;
        idx++;
        const dist = isBoss ? 1.5 : 2.6 + (i % 2) * 1.1;
        let sx = room.cx + Math.cos(angle) * dist;
        let sz = room.cz + Math.sin(angle) * dist - (isBoss ? 1.2 : 0);
        if (Math.hypot(sx - this.playerX, sz - this.playerZ) < 2.6) {
          sx = room.cx + (this.playerX <= room.cx ? 2.6 : -2.6);
          sz = room.cz + (this.playerZ <= room.cz ? 2.6 : -2.6);
        }
        const safe = this.resolveCollisions(sx, sz, 0.85);
        this.spawnGhostEntity(group.type, safe.x, safe.z, diff.hpMult, diff.speedMult, diff.damageMult);
        this.spawnBurst(safe.x, 1.0, safe.z, isBoss ? 0xf43f5e : 0x34d399, isBoss ? 20 : 10);
      }
    }

    if (hasBoss) {
      this.audio.setMusicTheme('boss');
      this.showRadio(this.mission?.id === 10 ? 'radioFinalHint' : 'radioBossHint', 5.0);
    } else if (!this.hasShownStunHint && this.mission?.id === 1) {
      this.hasShownStunHint = true;
      this.showRadio('radioStunHint', 5.0);
    } else {
      this.audio.playBossTelegraph();
    }
  }

  private unlockDoor(door: MansionDoorRuntime) {
    if (door.lockType === 'open') return;
    door.lockType = 'open';
    if (door.gateMesh && this.floorState) {
      this.floorState.group.remove(door.gateMesh);
      door.gateMesh = null;
    }
    if (door.collider && this.floorState) {
      const idx = this.floorState.obstacles.indexOf(door.collider);
      if (idx >= 0) this.floorState.obstacles.splice(idx, 1);
      door.collider = null;
    }
    this.spawnBurst(door.x, 1.3, door.z, 0xfef08a, 20);
    this.spawnShockwaveVisual(door.x, door.z, 2.8, 0xfef08a);
    this.audio.playCapture(false);
  }

  private unlockDoorById(doorId: string) {
    if (!this.floorState) return;
    const door = this.floorState.doors.find((d) => d.id === doorId);
    if (door) this.unlockDoor(door);
  }

  private openInteractiveProp(prop: MansionPropRuntime) {
    if (prop.opened) return;
    prop.opened = true;
    prop.mesh.rotation.z = 0;

    if (prop.lidOrOrb) {
      if (prop.kind === 'chest') {
        prop.lidOrOrb.rotation.x = -0.85;
        prop.lidOrOrb.position.y += 0.14;
      } else {
        prop.lidOrOrb.scale.set(0.95, 0.9, 0.95);
      }
    }

    const diffMult = DIFFICULTIES[this.difficulty].rewardMult;
    this.audio.playTrapDeploy();

    if (prop.reward === 'key') {
      this.mansionKeys++;
      this.spawnBurst(prop.x, 1.1, prop.z, 0xfacc15, 22);
      this.spawnShockwaveVisual(prop.x, prop.z, 2.5, 0xfacc15);
      this.audio.playCapture(false);
      this.showRadio('radioKeyFound', 4.8);
    } else if (prop.reward === 'heart') {
      this.spawnBurst(prop.x, 0.9, prop.z, 0xf43f5e, 14);
      this.spawnPickup(prop.x, prop.z, 'heart', 30);
    } else if (prop.reward === 'trap') {
      this.spawnBurst(prop.x, 0.9, prop.z, 0x38bdf8, 16);
      const unlocked: TrapType[] = (['snare', 'decoy', 'cryo'] as TrapType[]).filter(
        (k) => this.upgrades.traps[k] > 0,
      );
      const targetTrap =
        unlocked.sort((a, b) => this.trapCharges[a] - this.trapCharges[b])[0] || 'snare';
      this.trapCharges[targetTrap]++;
      this.spawnPickup(prop.x, prop.z, 'ecto', Math.round(14 * diffMult));
      this.audio.playPickup();
    } else if (prop.reward === 'ambush') {
      const diff = DIFFICULTIES[this.difficulty];
      const room = this.findRoomAt(prop.x, prop.z);
      const toCenterX = room ? room.cx - prop.x : 0;
      const toCenterZ = room ? room.cz - prop.z : 1;
      const len = Math.hypot(toCenterX, toCenterZ) || 1;
      const sx = prop.x + (toCenterX / len) * 1.65;
      const sz = prop.z + (toCenterZ / len) * 1.65;
      const safe = this.resolveCollisions(sx, sz, 0.72);
      this.spawnGhostEntity(
        prop.ambushGhost || 'lurker',
        safe.x,
        safe.z,
        diff.hpMult,
        diff.speedMult,
        diff.damageMult,
      );
      this.spawnBurst(safe.x, 1.0, safe.z, 0xa855f7, 18);
      this.audio.playBossTelegraph();
    } else {
      // ecto
      this.spawnBurst(prop.x, 0.9, prop.z, 0x34d399, 14);
      for (let k = 0; k < 3; k++) {
        this.spawnPickup(prop.x, prop.z, 'ecto', Math.round(16 * diffMult));
      }
    }
    this.emitHud();
  }

  private tick = () => {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    if (this.mode === 'diorama') {
      this.updateDiorama(dt);
    } else if (this.mode === 'cinematic') {
      this.updateCinematic(dt);
    } else if (this.mode === 'playing') {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.updateGameplay(dt);
      }
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateDiorama(dt: number) {
    this.dioramaAngle += dt * 0.24;
    const t = performance.now() * 0.001;
    this.hero.bodyGroup.position.y = Math.sin(t * 2.2) * 0.03;

    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      const orbit = this.dioramaAngle * 1.4 + i * (Math.PI / 2);
      g.x = Math.cos(orbit) * 4.4;
      g.z = Math.sin(orbit) * 4.2;
      g.rig.group.position.set(g.x, Math.sin(t * 2.8 + i) * 0.22, g.z);
      g.rig.group.rotation.y = -orbit;
    }

    if (this.currentRoom) {
      this.currentRoom.animatedObjects.forEach((obj, idx) => {
        obj.scale.setScalar(0.92 + Math.sin(t * 9 + idx) * 0.12);
      });
    }
  }

  private updateCinematic(dt: number) {
    this.cineTimer += dt;
    const t = this.cineTimer;
    const nextBeat = Math.min(3, Math.floor(t / 4.0));
    if (nextBeat !== this.cineBeat) {
      this.cineBeat = nextBeat;
      this.cineOnBeat?.(nextBeat);
    }

    this.flashPointLight.intensity = THREE.MathUtils.damp(this.flashPointLight.intensity, 0, 6, dt);

    // Beat 0 (0..4s): Friendly ghosts dance playfully around the kid
    if (t < 4.0) {
      this.hero.bodyGroup.position.y = Math.abs(Math.sin(t * 3.5)) * 0.08;
      this.ghosts.forEach((g, i) => {
        const a = t * 1.2 + (i / 4) * Math.PI * 2;
        g.x = Math.cos(a) * 3.6;
        g.z = Math.sin(a) * 3.4;
        g.rig.group.position.set(g.x, Math.sin(t * 4 + i) * 0.25, g.z);
        g.rig.group.rotation.y = Math.atan2(-g.x, 3.2 - g.z);
      });
    }

    // Beat 1 (4..8s): Meteorite streaks down from the sky and shatters into 4 shards!
    if (t >= 4.0 && this.cineMeteor) {
      if (!this.cineMeteorCrashed) {
        this.cineMeteor.visible = true;
        const fallProgress = Math.min(1, (t - 4.0) / 1.15);
        this.cineMeteor.position.y = THREE.MathUtils.lerp(22, 1.15, fallProgress * fallProgress);
        this.cineMeteor.rotation.y += dt * 4;
        this.cineMeteor.rotation.x += dt * 3;
        if (fallProgress >= 1) {
          this.cineMeteorCrashed = true;
          this.shakeIntensity = 0.65;
          this.audio.playMeteorCrash();
          this.flashPointLight.position.set(0, 2.5, -1.5);
          this.flashPointLight.color.setHex(0xc084fc);
          this.flashPointLight.intensity = 10.0;
          this.spawnBurst(0, 1.2, -1.5, 0xc084fc, 32);
          this.spawnShockwaveVisual(0, -1.5, 7.5, 0xa855f7);
          this.cineMeteor.scale.setScalar(0.55);

          // Launch 4 Astral Shards toward mansion wings
          const shardDirs = [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ];
          shardDirs.forEach(([sx, sz]) => {
            const shard = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.42, 0),
              new THREE.MeshStandardMaterial({
                color: 0xa855f7,
                emissive: 0x7c3aed,
                emissiveIntensity: 1.8,
              }),
            );
            shard.position.set(0, 1.2, -1.5);
            this.scene.add(shard);
            this.cineShards.push({ mesh: shard, vx: sx * 5.2, vy: 5.5, vz: sz * 5.2 });
          });
        }
      } else {
        this.cineMeteor.rotation.y += dt * 1.5;
        this.cineShards.forEach((s) => {
          s.mesh.position.x += s.vx * dt;
          s.mesh.position.y = Math.max(0.4, s.mesh.position.y + s.vy * dt);
          s.mesh.position.z += s.vz * dt;
          s.vy -= 9 * dt;
          s.mesh.rotation.y += dt * 5;
        });
      }
    }

    // Beat 2 (8..12s): Ghosts turn hostile crimson/orange and close in!
    if (t >= 8.0) {
      this.ghosts.forEach((g, i) => {
        g.rig.coreMat.color.setHex(i % 2 === 0 ? 0xef4444 : 0xf97316);
        g.rig.coreMat.emissive.setHex(0x991b1b);
        const a = t * 1.8 + (i / 4) * Math.PI * 2;
        const rad = THREE.MathUtils.damp(Math.hypot(g.x, g.z - 3.2), 2.4, 3, dt);
        g.x = Math.cos(a) * rad;
        g.z = 3.2 + Math.sin(a) * rad;
        g.rig.group.position.set(g.x, 0.15 + Math.sin(t * 7 + i) * 0.18, g.z);
        g.rig.group.rotation.y = Math.atan2(this.playerX - g.x, this.playerZ - g.z);
      });
    }

    // Beat 3 (12..16s): Dr. Volt beams the SpectroVac-3000 onto the kid!
    if (t >= 12.0 && this.cineBeam) {
      if (!this.cineBeamFired) {
        this.cineBeamFired = true;
        this.cineBeam.visible = true;
        this.hero.nozzleGroup.visible = true;
        this.hero.tankLiquid.visible = true;
        this.audio.playTeleportBeam();
        this.flashPointLight.position.set(this.playerX, 2.2, this.playerZ);
        this.flashPointLight.color.setHex(0x38bdf8);
        this.flashPointLight.intensity = 8.0;
        this.spawnBurst(this.playerX, 1.1, this.playerZ, 0x38bdf8, 22);
      }
      const beamAge = t - 12.0;
      const mat = this.cineBeam.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.55 - beamAge * 0.22);
      this.hero.suctionCone.visible = beamAge > 0.6;
      this.hero.suctionCone.rotation.z += dt * 10;
    }

    this.updateParticles(dt);

    if (t >= 16.0) {
      this.finishCinematic();
    }
  }

  private updateGameplay(dt: number) {
    this.elapsedSeconds += dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.strobeCooldown > 0) this.strobeCooldown -= dt;
    if (this.radioTimer > 0) {
      this.radioTimer -= dt;
      if (this.radioTimer <= 0) this.radioMessageKey = null;
    }

    // Fade strobe visual & point light
    if (this.strobeVisualTimer > 0) {
      this.strobeVisualTimer -= dt;
      const mat = this.hero.flashCone.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (this.strobeVisualTimer / 0.22) * 0.72);
      if (this.strobeVisualTimer <= 0) this.hero.flashCone.visible = false;
    }
    this.flashPointLight.intensity = THREE.MathUtils.damp(
      this.flashPointLight.intensity,
      0,
      10,
      dt,
    );

    const vacActive = this.isVacuumHeld || this.virtualVacuumHeld;

    // Hero Movement
    const move = this.getMoveVector();
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.playerVx = this.dashDirX * 14.5;
      this.playerVz = this.dashDirZ * 14.5;
      this.hero.bodyGroup.scale.set(0.88, 1.12, 0.88);
    } else {
      const moveSpeed = vacActive ? 4.3 : 6.4;
      this.playerVx = THREE.MathUtils.damp(this.playerVx, move.x * moveSpeed, 14, dt);
      this.playerVz = THREE.MathUtils.damp(this.playerVz, move.z * moveSpeed, 14, dt);
      this.hero.bodyGroup.scale.x = THREE.MathUtils.damp(this.hero.bodyGroup.scale.x, 1, 14, dt);
      this.hero.bodyGroup.scale.y = THREE.MathUtils.damp(this.hero.bodyGroup.scale.y, 1, 14, dt);
      this.hero.bodyGroup.scale.z = THREE.MathUtils.damp(this.hero.bodyGroup.scale.z, 1, 14, dt);
    }

    const nextPos = this.resolveCollisions(
      this.playerX + this.playerVx * dt,
      this.playerZ + this.playerVz * dt,
      0.52,
    );
    this.playerX = nextPos.x;
    this.playerZ = nextPos.z;

    // Aiming via mouse raycast, smart touch auto-lock when vacuuming, or movement direction
    if (this.pointerMoved) {
      _ndc.set(this.pointerNdcX, this.pointerNdcY);
      _raycaster.setFromCamera(_ndc, this.camera);
      if (_raycaster.ray.intersectPlane(_floorPlane, _v1)) {
        const dx = _v1.x - this.playerX;
        const dz = _v1.z - this.playerZ;
        if (dx * dx + dz * dz > 0.04) {
          const targetYaw = Math.atan2(dx, dz);
          this.playerYaw = this.dampAngle(this.playerYaw, targetYaw, 18, dt);
        }
      }
    } else if (this.virtualVacuumHeld) {
      const nearest = this.findNearestGhost(7.5);
      if (nearest) {
        const targetYaw = Math.atan2(nearest.x - this.playerX, nearest.z - this.playerZ);
        this.playerYaw = this.dampAngle(this.playerYaw, targetYaw, 14, dt);
      } else {
        const nearProp = this.findNearestProp(4.4, false);
        if (nearProp) {
          const targetYaw = Math.atan2(nearProp.x - this.playerX, nearProp.z - this.playerZ);
          this.playerYaw = this.dampAngle(this.playerYaw, targetYaw, 14, dt);
        } else if (Math.hypot(move.x, move.z) > 0.1) {
          this.playerYaw = this.dampAngle(this.playerYaw, Math.atan2(move.x, move.z), 14, dt);
        }
      }
    } else if (Math.hypot(move.x, move.z) > 0.1) {
      const targetYaw = Math.atan2(move.x, move.z);
      this.playerYaw = this.dampAngle(this.playerYaw, targetYaw, 14, dt);
    }

    this.hero.group.position.set(this.playerX, 0, this.playerZ);
    this.hero.group.rotation.y = this.playerYaw;

    // Walk animation + Hurt blink
    const speedMag = Math.hypot(this.playerVx, this.playerVz);
    if (speedMag > 0.4) {
      this.walkPhase += dt * speedMag * 2.5;
      this.hero.leftLeg.rotation.x = Math.sin(this.walkPhase) * 0.55;
      this.hero.rightLeg.rotation.x = -Math.sin(this.walkPhase) * 0.55;
      this.hero.bodyGroup.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.06;
    } else {
      this.hero.leftLeg.rotation.x = THREE.MathUtils.damp(this.hero.leftLeg.rotation.x, 0, 10, dt);
      this.hero.rightLeg.rotation.x = THREE.MathUtils.damp(this.hero.rightLeg.rotation.x, 0, 10, dt);
      this.hero.bodyGroup.position.y = THREE.MathUtils.damp(this.hero.bodyGroup.position.y, 0, 10, dt);
    }
    this.hero.group.visible =
      this.invulnTimer <= 0 || Math.floor(this.invulnTimer * 18) % 2 === 0;

    // Vacuum Suction Logic
    let anyPulling = false;
    this.hero.suctionCone.visible = vacActive;
    if (vacActive) {
      this.hero.suctionCone.rotation.z += dt * 12;
      this.hero.nozzleGroup.position.z = 0.34 + Math.sin(this.elapsedSeconds * 42) * 0.02;
      anyPulling = this.processVacuumSuction(dt);
    } else {
      this.hero.nozzleGroup.position.z = 0.34;
      this.surgeCharge = Math.max(0, this.surgeCharge - dt * 18);
      for (const g of this.ghosts) g.beingPulled = false;
    }
    this.audio.setVacuumActive(vacActive, anyPulling);

    // Update backpack tank glow with Surge charge
    const chargeNorm = this.surgeCharge / 100;
    this.hero.tankLiquid.scale.y = 0.25 + chargeNorm * 0.75;
    this.hero.tankMat.emissiveIntensity = 0.7 + chargeNorm * 1.6;
    this.hero.tankMat.color.setHex(chargeNorm >= 0.95 ? 0xfacc15 : 0x34d399);

    // Update Traps, Ghosts, Projectiles, Hazards, Pickups, Particles
    this.updateTraps(dt);
    this.updateGhosts(dt);
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);

    // Room exploration, unvisited fog fade, door unlocks & animated fixtures
    if (this.floorState) {
      for (const r of this.floorState.rooms) {
        if (r.visited && r.fogMesh.visible) {
          r.fogMat.opacity = THREE.MathUtils.damp(r.fogMat.opacity, 0, 6, dt);
          if (r.fogMat.opacity <= 0.02) {
            r.fogMat.opacity = 0;
            r.fogMesh.visible = false;
          }
        }
      }

      const activeRoom = this.findRoomAt(this.playerX, this.playerZ);
      if (activeRoom) {
        this.currentRoomId = activeRoom.blueprint.id;
        if (!activeRoom.visited) {
          activeRoom.visited = true;
          this.audio.playPickup();
          if (activeRoom.blueprint.ambushOnEnter && !activeRoom.ambushTriggered) {
            this.triggerRoomAmbush(activeRoom);
          } else {
            // Check if room has an unhit strobe switch to cue player
            const hasSwitch = this.floorState.props.some(
              (p) => p.roomId === activeRoom.blueprint.id && !p.opened && p.kind === 'strobe_switch',
            );
            if (hasSwitch) this.showRadio('radioSwitchHint', 4.5);
          }
          this.emitHud();
        }
      }

      // Check room clear -> unlock seal doors
      for (const r of this.floorState.rooms) {
        if (r.visited && !r.cleared && this.ghosts.length === 0) {
          r.cleared = true;
          if (r.blueprint.clearSealDoorId) {
            this.unlockDoorById(r.blueprint.clearSealDoorId);
            this.showRadio('radioDoorUnlocked', 3.8);
          }
        }
      }

      // Check key doors when player approaches with a key
      if (this.mansionKeys > 0) {
        for (const d of this.floorState.doors) {
          if (d.lockType === 'key' && Math.hypot(this.playerX - d.x, this.playerZ - d.z) <= 2.35) {
            this.mansionKeys--;
            this.unlockDoor(d);
            this.showRadio('radioDoorUnlocked', 3.8);
            break;
          }
        }
      }

      // Subtle eerie rattle on unopened key/ambush props + candle/emblem animations
      for (const p of this.floorState.props) {
        if (!p.opened && (p.reward === 'key' || p.reward === 'ambush')) {
          const pulse = Math.sin(this.elapsedSeconds * 2.2 + p.x);
          if (pulse > 0.85) {
            p.mesh.rotation.z = Math.sin(this.elapsedSeconds * 42) * 0.045;
          } else if (p.shakeProgress <= 0) {
            p.mesh.rotation.z = 0;
          }
        }
      }

      this.floorState.animatedObjects.forEach((obj, idx) => {
        obj.scale.setScalar(0.92 + Math.sin(this.elapsedSeconds * 8 + idx) * 0.12);
      });

      // Check Goal Victory
      const goalRoom = this.floorState.rooms.find((r) => r.blueprint.isGoal);
      if (goalRoom && goalRoom.visited && goalRoom.cleared && this.ghosts.length === 0) {
        this.completeMission();
        return;
      }
    } else if (this.currentRoom) {
      this.currentRoom.animatedObjects.forEach((obj, idx) => {
        obj.scale.setScalar(0.92 + Math.sin(this.elapsedSeconds * 9 + idx) * 0.12);
      });
    }

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.06) {
      this.hudEmitTimer = 0;
      this.emitHud();
    }
  }

  private processVacuumSuction(dt: number): boolean {
    const vacDps = getVacuumDps(this.upgrades);
    const vacRange = 5.8 + (this.upgrades.suction - 1) * 0.35;
    const vacCos = Math.cos((44 * Math.PI) / 180);

    const aimX = Math.sin(this.playerYaw);
    const aimZ = Math.cos(this.playerYaw);
    let pullingAny = false;

    for (const g of this.ghosts) {
      g.beingPulled = false;
      const dx = g.x - this.playerX;
      const dz = g.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist > vacRange + g.radius) continue;

      const nx = dist > 0.01 ? dx / dist : aimX;
      const nz = dist > 0.01 ? dz / dist : aimZ;
      if (nx * aimX + nz * aimZ < vacCos && dist > 1.2) continue;

      // Shielded check
      const gx = Math.sin(g.yaw);
      const gz = Math.cos(g.yaw);
      const facingPlayer = gx * -nx + gz * -nz > 0.3;
      const blocked =
        (g.type === 'armored' || g.type === 'boss_clang') &&
        g.state !== 'stunned' &&
        g.state !== 'recover' &&
        facingPlayer;

      if (blocked) {
        if (Math.random() < 0.15) this.spawnBurst(g.x, 0.9, g.z, 0x94a3b8, 1);
        continue;
      }

      const isVulnerable = g.state === 'stunned' || g.state === 'recover';
      const mult = isVulnerable ? 1.0 : g.isBoss ? 0.18 : 0.32;
      g.hp -= vacDps * mult * dt;
      g.hitFlashTimer = Math.max(g.hitFlashTimer, 0.05);

      if (isVulnerable) {
        g.beingPulled = true;
        pullingAny = true;
        this.surgeCharge = Math.min(100, this.surgeCharge + dt * 36);
        // Pull ghost toward nozzle (keep minimum spacing of 1.35m)
        if (dist > 1.35) {
          const pullForce = g.isBoss ? 2.6 : 4.6;
          g.x -= nx * pullForce * dt;
          g.z -= nz * pullForce * dt;
        }
        // Struggle vibration
        g.rig.visualGroup.position.x = (Math.random() - 0.5) * 0.14;
      } else {
        // Gentle pull on active normal ghosts
        if (!g.isBoss && dist > 1.5) {
          g.x -= nx * 1.4 * dt;
          g.z -= nz * 1.4 * dt;
        }
      }
    }

    // Vacuum interactive furniture (chests, wardrobes, clocks, crates)
    if (this.floorState) {
      for (const prop of this.floorState.props) {
        if (prop.opened || prop.kind === 'strobe_switch') continue;
        const dx = prop.x - this.playerX;
        const dz = prop.z - this.playerZ;
        const dist = Math.hypot(dx, dz);
        if (dist > 4.0) continue;
        const nx = dist > 0.01 ? dx / dist : aimX;
        const nz = dist > 0.01 ? dz / dist : aimZ;
        if (nx * aimX + nz * aimZ >= vacCos || dist < 1.9) {
          pullingAny = true;
          prop.shakeProgress += dt * 1.45;
          prop.mesh.rotation.z = Math.sin(this.elapsedSeconds * 38) * 0.11;
          if (Math.random() < 0.25) {
            this.spawnBurst(prop.x, 0.75, prop.z, 0x38bdf8, 1);
          }
          if (prop.shakeProgress >= 1.0) {
            this.openInteractiveProp(prop);
          }
        }
      }
    }

    if (!pullingAny) {
      this.surgeCharge = Math.max(0, this.surgeCharge - dt * 10);
    }
    return pullingAny;
  }

  private updateTraps(dt: number) {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i];
      t.life -= dt;
      t.tickTimer -= dt;

      if (t.type === 'snare') {
        t.mesh.rotation.y += dt * 1.5;
        for (const g of this.ghosts) {
          if (Math.hypot(g.x - t.x, g.z - t.z) <= 1.65 + g.radius * 0.5) {
            this.stunGhost(g, 3.8 + t.level * 0.8);
            g.hp -= 24 + t.level * 12;
            this.spawnBurst(t.x, 0.4, t.z, 0x34d399, 16);
            this.audio.playStrobeFlash();
            t.life = 0;
            break;
          }
        }
      } else if (t.type === 'decoy') {
        t.mesh.position.y = Math.sin(this.elapsedSeconds * 8) * 0.08;
        // Lure non-boss ghosts toward decoy
        for (const g of this.ghosts) {
          if (!g.isBoss && g.state !== 'stunned') {
            const dx = t.x - g.x;
            const dz = t.z - g.z;
            const d = Math.hypot(dx, dz);
            if (d > 0.6 && d < 7.5) {
              g.x += (dx / d) * g.speed * 0.85 * dt;
              g.z += (dz / d) * g.speed * 0.85 * dt;
            }
          }
        }
        if (t.life <= 0) {
          // Detonate flash burst!
          this.spawnShockwaveVisual(t.x, t.z, 4.5, 0xfef08a);
          this.spawnBurst(t.x, 0.9, t.z, 0xfef08a, 22);
          this.audio.playStrobeFlash();
          for (const g of this.ghosts) {
            if (Math.hypot(g.x - t.x, g.z - t.z) <= 4.6 + g.radius) {
              this.stunGhost(g, 3.4 + t.level * 0.6);
              g.hp -= 35 + t.level * 15;
            }
          }
        }
      } else if (t.type === 'cryo') {
        t.mesh.children.forEach((c, idx) => {
          if (idx === 1) c.rotation.y += dt * 3.5;
        });
        for (const g of this.ghosts) {
          const dx = t.x - g.x;
          const dz = t.z - g.z;
          const d = Math.hypot(dx, dz);
          if (d <= 3.6 + g.radius) {
            g.hp -= (12 + t.level * 6) * dt;
            if (!g.isBoss && d > 0.7 && g.state !== 'stunned') {
              g.x += (dx / d) * 1.4 * dt;
              g.z += (dz / d) * 1.4 * dt;
            }
          }
        }
      }

      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        this.traps.splice(i, 1);
      }
    }
  }

  private updateGhosts(dt: number) {
    const diff = DIFFICULTIES[this.difficulty];

    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i];

      if (g.hp <= 0) {
        this.handleGhostCapture(g);
        this.ghosts.splice(i, 1);
        continue;
      }

      // Hit flash decay
      if (g.hitFlashTimer > 0) {
        g.hitFlashTimer -= dt;
        g.rig.coreMat.emissiveIntensity = 2.4;
      } else {
        g.rig.coreMat.emissiveIntensity = g.isBoss ? 0.75 : 0.65;
      }

      // Check Boss phase transitions
      if (g.isBoss) {
        const hpRatio = g.hp / g.maxHp;
        if (g.phase === 1 && hpRatio < 0.55) {
          g.phase = 2;
          this.spawnBurst(g.x, 1.5, g.z, 0xf43f5e, 24);
          this.shakeIntensity = 0.25;
          // Phase 2 helper spawn inside boss's current room
          const bossRoom = this.findRoomAt(g.x, g.z);
          const hx = (bossRoom ? bossRoom.cx : 0) + (g.x > (bossRoom ? bossRoom.cx : 0) ? -2.8 : 2.8);
          const hz = (bossRoom ? bossRoom.cz : 0) + (g.z > (bossRoom ? bossRoom.cz : 0) ? -2.4 : 2.4);
          const safeH = this.resolveCollisions(hx, hz, 0.72);
          if (g.type === 'boss_clang') this.spawnGhostEntity('lurker', safeH.x, safeH.z, diff.hpMult, diff.speedMult, diff.damageMult);
          if (g.type === 'boss_grimoire') this.spawnGhostEntity('sneak', safeH.x, safeH.z, diff.hpMult, diff.speedMult, diff.damageMult);
          if (g.type === 'boss_thorn') this.spawnGhostEntity('spitter', safeH.x, safeH.z, diff.hpMult, diff.speedMult, diff.damageMult);
          if (g.type === 'boss_aetherion') this.spawnGhostEntity('dasher', safeH.x, safeH.z, diff.hpMult, diff.speedMult, diff.damageMult);
        }
      }

      const dx = this.playerX - g.x;
      const dz = this.playerZ - g.z;
      const dist = Math.hypot(dx, dz) || 0.001;
      const toPlayerX = dx / dist;
      const toPlayerZ = dz / dist;

      // Apply knockback decay
      g.x += g.vx * dt;
      g.z += g.vz * dt;
      g.vx = THREE.MathUtils.damp(g.vx, 0, 8, dt);
      g.vz = THREE.MathUtils.damp(g.vz, 0, 8, dt);

      if (g.state === 'stunned') {
        g.stateTimer -= dt;
        g.rig.stunStars.visible = true;
        g.rig.stunStars.rotation.y += dt * 6;
        g.rig.telegraphMat.opacity = 0;
        if (g.stateTimer <= 0) {
          g.state = 'chase';
          g.rig.stunStars.visible = false;
          g.rig.visualGroup.position.x = 0;
          if (g.type === 'sneak') g.rig.coreMat.opacity = 0.24;
        }
      } else if (g.state === 'recover') {
        g.stateTimer -= dt;
        g.rig.telegraphMat.opacity = 0;
        if (g.stateTimer <= 0) g.state = 'chase';
      } else if (g.state === 'windup') {
        g.stateTimer -= dt;
        g.rig.telegraphMat.opacity = 0.65 + Math.sin(this.elapsedSeconds * 24) * 0.25;
        const pulse = 1.0 + Math.sin(this.elapsedSeconds * 18) * 0.08;
        g.rig.telegraphRing.scale.setScalar(pulse);
        g.yaw = this.dampAngle(g.yaw, Math.atan2(toPlayerX, toPlayerZ), 6, dt);

        if (g.stateTimer <= 0) {
          g.rig.telegraphMat.opacity = 0;
          this.executeGhostAttack(g);
        }
      } else if (g.state === 'attack') {
        g.stateTimer -= dt;
        g.x += g.targetX * dt;
        g.z += g.targetZ * dt;
        if (dist < g.radius + 0.55) {
          this.damagePlayer(g.damage, g.x, g.z);
        }
        if (g.stateTimer <= 0) {
          g.state = 'recover';
          g.stateTimer = g.isBoss ? 2.6 : 1.0;
          g.attackCooldown = (g.isBoss ? 2.0 : 1.8) * diff.telegraphMult;
        }
      } else {
        // CHASE AI
        g.attackCooldown -= dt;
        g.yaw = this.dampAngle(g.yaw, Math.atan2(toPlayerX, toPlayerZ), 9, dt);

        // Cryo slow check
        const slowed = this.traps.some(
          (t) => t.type === 'cryo' && Math.hypot(t.x - g.x, t.z - g.z) <= 3.6 + g.radius,
        );
        const effSpeed = g.speed * (slowed ? 0.42 : 1.0);

        if (g.type === 'spitter' || g.type === 'boss_grimoire') {
          const desired = g.isBoss ? 5.2 : 4.8;
          if (dist > desired + 0.6) {
            g.x += toPlayerX * effSpeed * dt;
            g.z += toPlayerZ * effSpeed * dt;
          } else if (dist < desired - 1.2) {
            g.x -= toPlayerX * effSpeed * 0.6 * dt;
            g.z -= toPlayerZ * effSpeed * 0.6 * dt;
          } else {
            // Strafe
            g.x += -toPlayerZ * effSpeed * 0.65 * dt;
            g.z += toPlayerX * effSpeed * 0.65 * dt;
          }
        } else {
          if (dist > g.radius + 0.7) {
            g.x += toPlayerX * effSpeed * dt;
            g.z += toPlayerZ * effSpeed * dt;
          }
        }

        // Trigger Attack Telegraph
        const attackRange = g.type === 'spitter' || g.type === 'boss_grimoire' || g.type === 'boss_thorn' || g.type === 'boss_aetherion' ? 9.5 : 4.4;
        if (g.attackCooldown <= 0 && dist <= attackRange) {
          g.state = 'windup';
          g.stateTimer = (g.isBoss ? 0.95 : 0.72) * diff.telegraphMult;
          if (g.isBoss) this.audio.playBossTelegraph();
        }
      }

      // Resolve mansion walls and locked doors
      if (this.floorState) {
        const safeG = this.resolveCollisions(g.x, g.z, g.radius);
        g.x = safeG.x;
        g.z = safeG.z;
      } else {
        const lim = this.roomHalfSize - g.radius - 0.3;
        g.x = THREE.MathUtils.clamp(g.x, -lim, lim);
        g.z = THREE.MathUtils.clamp(g.z, -lim, lim);
      }

      // Visual hover & limbs animation
      const hover = Math.sin(this.elapsedSeconds * 3.4 + g.id) * 0.16;
      g.rig.group.position.set(g.x, 0, g.z);
      g.rig.group.rotation.y = g.yaw;
      if (!g.beingPulled) g.rig.visualGroup.position.x = 0;
      g.rig.visualGroup.position.y = g.rig.baseHeight + hover;

      if (g.rig.armLeft && g.rig.armRight) {
        if (g.type === 'boss_grimoire') {
          const flap = Math.sin(this.elapsedSeconds * 5) * 0.35;
          g.rig.armLeft.rotation.y = flap;
          g.rig.armRight.rotation.y = -flap;
        } else if (g.type === 'boss_aetherion') {
          g.rig.armLeft.rotation.z += dt * 1.6;
          g.rig.armRight.rotation.x += dt * 2.1;
        } else {
          g.rig.armLeft.rotation.x = Math.sin(this.elapsedSeconds * 4 + g.id) * 0.25;
          g.rig.armRight.rotation.x = -Math.sin(this.elapsedSeconds * 4 + g.id) * 0.25;
        }
      }
    }
  }

  private executeGhostAttack(g: GhostEntity) {
    const dx = this.playerX - g.x;
    const dz = this.playerZ - g.z;
    const dist = Math.hypot(dx, dz) || 1;
    const nx = dx / dist;
    const nz = dz / dist;

    if (g.type === 'spitter') {
      this.spawnProjectile(g.x, g.z, nx * 6.8, nz * 6.8, g.damage, 0xa3e635);
      g.state = 'recover';
      g.stateTimer = 1.1;
      g.attackCooldown = 2.4;
      return;
    }

    if (g.type === 'boss_grimoire') {
      // Fan of 3 arcane bolts (5 in phase 2)
      const count = g.phase === 2 ? 5 : 3;
      const baseAngle = Math.atan2(nx, nz);
      for (let k = 0; k < count; k++) {
        const offset = (k - (count - 1) / 2) * 0.28;
        const a = baseAngle + offset;
        this.spawnProjectile(g.x, g.z, Math.sin(a) * 6.5, Math.cos(a) * 6.5, g.damage, 0xc084fc);
      }
      g.state = 'recover';
      g.stateTimer = 2.0;
      g.attackCooldown = 2.2;
      return;
    }

    if (g.type === 'boss_thorn') {
      // Spawn 3 erupting thorn circles around player
      for (let k = 0; k < (g.phase === 2 ? 4 : 3); k++) {
        const ox = k === 0 ? 0 : (Math.random() - 0.5) * 4.5;
        const oz = k === 0 ? 0 : (Math.random() - 0.5) * 4.5;
        this.spawnHazardCircle(this.playerX + ox, this.playerZ + oz, 1.85, 0.95, g.damage, 0xf43f5e);
      }
      g.state = 'recover';
      g.stateTimer = 2.2;
      g.attackCooldown = 2.4;
      return;
    }

    if (g.type === 'boss_aetherion') {
      // Radial bolts + targeted meteor hazard
      const bolts = g.phase === 2 ? 8 : 6;
      for (let k = 0; k < bolts; k++) {
        const a = (k / bolts) * Math.PI * 2 + this.elapsedSeconds;
        this.spawnProjectile(g.x, g.z, Math.sin(a) * 6.2, Math.cos(a) * 6.2, g.damage, 0x22d3ee);
      }
      this.spawnHazardCircle(this.playerX, this.playerZ, 2.2, 0.9, g.damage, 0xa855f7);
      g.state = 'recover';
      g.stateTimer = 2.2;
      g.attackCooldown = 2.1;
      return;
    }

    // Melee lunge / charge (Lurker, Dasher, Sneak, Armored, Sir Clang)
    const lungeSpeed = g.type === 'dasher' ? 12.0 : g.isBoss ? 10.5 : 8.5;
    g.targetX = nx * lungeSpeed;
    g.targetZ = nz * lungeSpeed;
    g.state = 'attack';
    g.stateTimer = g.isBoss ? 0.42 : 0.32;
  }

  private spawnProjectile(x: number, z: number, vx: number, vz: number, damage: number, color: number) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(this.projGeo, mat);
    mesh.position.set(x, 0.95, z);
    this.scene.add(mesh);
    this.projectiles.push({ mesh, x, z, vx, vz, radius: 0.28, damage, life: 3.5 });
  }

  private spawnHazardCircle(
    x: number,
    z: number,
    radius: number,
    duration: number,
    damage: number,
    color: number,
  ) {
    let cx = x;
    let cz = z;
    if (this.floorState) {
      const r = this.findRoomAt(x, z);
      if (r) {
        const lim = ROOM_INNER_HALF - radius;
        cx = THREE.MathUtils.clamp(x, r.cx - lim, r.cx + lim);
        cz = THREE.MathUtils.clamp(z, r.cz - lim, r.cz + lim);
      }
    } else {
      const lim = this.roomHalfSize - radius;
      cx = THREE.MathUtils.clamp(x, -lim, lim);
      cz = THREE.MathUtils.clamp(z, -lim, lim);
    }

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(cx, 0.04, cz);
    this.scene.add(mesh);

    this.hazards.push({
      mesh,
      mat,
      x: cx,
      z: cz,
      radius,
      timer: duration,
      duration,
      damage,
      triggered: false,
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, 0.95, p.z);

      if (Math.hypot(p.x - this.playerX, p.z - this.playerZ) < p.radius + 0.48) {
        this.damagePlayer(p.damage, p.x, p.z);
        p.life = 0;
      }

      let hitWall = false;
      if (this.floorState) {
        for (const box of this.floorState.obstacles) {
          if (
            p.x >= box.minX - p.radius &&
            p.x <= box.maxX + p.radius &&
            p.z >= box.minZ - p.radius &&
            p.z <= box.maxZ + p.radius
          ) {
            hitWall = true;
            this.spawnBurst(p.x, 0.9, p.z, 0xa3e635, 4);
            break;
          }
        }
      } else if (Math.abs(p.x) > this.roomHalfSize || Math.abs(p.z) > this.roomHalfSize) {
        hitWall = true;
      }

      if (p.life <= 0 || hitWall) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateHazards(dt: number) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.timer -= dt;
      const progress = 1 - Math.max(0, h.timer) / h.duration;
      h.mat.opacity = 0.22 + progress * 0.55;
      h.mesh.scale.setScalar(0.5 + progress * 0.5);

      if (h.timer <= 0) {
        this.spawnBurst(h.x, 0.4, h.z, h.mat.color.getHex(), 14);
        if (Math.hypot(this.playerX - h.x, this.playerZ - h.z) <= h.radius + 0.35) {
          this.damagePlayer(h.damage, h.x, h.z);
        }
        this.scene.remove(h.mesh);
        h.mesh.geometry.dispose();
        h.mat.dispose();
        this.hazards.splice(i, 1);
      }
    }
  }

  private handleGhostCapture(g: GhostEntity) {
    this.scene.remove(g.rig.group);
    this.capturedCount++;
    this.hitstopTimer = g.isBoss ? 0.08 : 0.04;
    this.shakeIntensity = Math.max(this.shakeIntensity, g.isBoss ? 0.45 : 0.22);
    this.audio.playCapture(g.isBoss);

    this.spawnBurst(g.x, 1.0, g.z, g.isBoss ? 0xfbbf24 : 0x34d399, g.isBoss ? 32 : 16);
    this.spawnShockwaveVisual(g.x, g.z, g.isBoss ? 4.5 : 2.2, 0x34d399);

    // Drop Ecto-Energy Orbs (+ Heart if injured)
    const orbCount = g.isBoss ? 10 : g.type === 'armored' ? 4 : 2;
    const diffMult = DIFFICULTIES[this.difficulty].rewardMult;
    const orbVal = Math.round((g.isBoss ? 18 : 12) * diffMult);
    for (let k = 0; k < orbCount; k++) {
      this.spawnPickup(g.x, g.z, 'ecto', orbVal);
    }
    if (this.playerHp < this.playerMaxHp * 0.85 && (g.isBoss || Math.random() < 0.35)) {
      this.spawnPickup(g.x, g.z, 'heart', 22);
    }
  }

  private spawnPickup(x: number, z: number, kind: 'ecto' | 'heart', value: number) {
    const color = kind === 'heart' ? 0xf43f5e : 0x34d399;
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(this.pickupGeo, mat);
    const ox = x + (Math.random() - 0.5) * 1.4;
    const oz = z + (Math.random() - 0.5) * 1.4;
    mesh.position.set(ox, 0.7, oz);
    this.scene.add(mesh);

    this.pickups.push({
      mesh,
      x: ox,
      z: oz,
      y: 0.65,
      vy: 3.5 + Math.random() * 2,
      kind,
      value,
      life: 14,
    });
  }

  private updatePickups(dt: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= dt;
      p.vy -= 12 * dt;
      p.y = Math.max(0.4, p.y + p.vy * dt);
      if (p.y <= 0.41) p.vy = 0;

      p.mesh.rotation.y += dt * 3.5;

      const dx = this.playerX - p.x;
      const dz = this.playerZ - p.z;
      const dist = Math.hypot(dx, dz);
      // Magnetically zip into player when close or vacuuming
      const vacHeld = this.isVacuumHeld || this.virtualVacuumHeld;
      const magnetRange = vacHeld ? 7.5 : 3.2;
      if (dist < magnetRange && dist > 0.01) {
        const pull = vacHeld ? 11.5 : 6.5;
        p.x += (dx / dist) * pull * dt;
        p.z += (dz / dist) * pull * dt;
      }

      p.mesh.position.set(p.x, p.y + Math.sin(this.elapsedSeconds * 5 + i) * 0.08, p.z);

      if (dist < 0.85) {
        if (p.kind === 'ecto') {
          this.ectoCollectedInMission += p.value;
        } else {
          this.playerHp = Math.min(this.playerMaxHp, this.playerHp + p.value);
        }
        this.audio.playPickup();
        p.life = 0;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.pickups.splice(i, 1);
      }
    }
  }

  private damagePlayer(amount: number, srcX: number, srcZ: number) {
    if (this.invulnTimer > 0 || this.mode !== 'playing') return;
    this.playerHp = Math.max(0, this.playerHp - amount);
    this.damageTaken += amount;
    this.invulnTimer = 0.85;
    this.shakeIntensity = 0.32;
    this.audio.playPlayerHurt();
    this.spawnBurst(this.playerX, 0.9, this.playerZ, 0xef4444, 14);

    // Knockback
    const dx = this.playerX - srcX;
    const dz = this.playerZ - srcZ;
    const len = Math.hypot(dx, dz) || 1;
    this.playerVx = (dx / len) * 9;
    this.playerVz = (dz / len) * 9;

    this.emitHud();

    if (this.playerHp <= 0) {
      this.mode = 'ended';
      this.audio.setVacuumActive(false, false);
      this.callbacks.onMissionFailed();
    }
  }

  private spawnBurst(x: number, y: number, z: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const spd = 2.0 + Math.random() * 5.0;
      this.particles.push({
        mesh,
        mat,
        vx: Math.cos(angle) * spd,
        vy: 1.5 + Math.random() * 4.5,
        vz: Math.sin(angle) * spd,
        life: 0.42 + Math.random() * 0.25,
        maxLife: 0.6,
        scaleRate: -1.4,
      });
    }
  }

  private spawnShockwaveVisual(x: number, z: number, radius: number, color: number) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.7, 28), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.08, z);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      mat,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0.35,
      maxLife: 0.35,
      scaleRate: radius * 3.8,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.vy -= 9 * dt;

      if (pt.scaleRate > 0) {
        pt.mesh.scale.addScalar(pt.scaleRate * dt);
      } else {
        const s = Math.max(0.05, pt.life / pt.maxLife);
        pt.mesh.scale.setScalar(s);
      }
      pt.mat.opacity = Math.max(0, pt.life / pt.maxLife);

      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        if (pt.mesh.geometry !== this.particleGeo) pt.mesh.geometry.dispose();
        pt.mat.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  private updateCamera(dt: number) {
    if (this.mode === 'diorama') {
      const r = 17.5;
      const cx = Math.cos(this.dioramaAngle + Math.PI / 4) * r;
      const cz = Math.sin(this.dioramaAngle + Math.PI / 4) * r;
      this.camera.position.set(cx, 13.5, cz);
      this.camera.lookAt(0, 1.2, 0);
      return;
    }

    if (this.mode === 'cinematic') {
      let sx = 0;
      let sy = 0;
      if (this.shakeIntensity > 0.005) {
        sx = (Math.random() - 0.5) * this.shakeIntensity;
        sy = (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 8, dt);
      }
      const orbit = this.cineTimer * 0.14;
      const camX = Math.sin(orbit + 0.65) * 14.5 + sx;
      const camZ = Math.cos(orbit + 0.65) * 14.5;
      this.camera.position.set(camX, 11.5 + sy, camZ);
      this.camera.lookAt(0, 1.2, 0.8);
      return;
    }

    // Smooth isometric camera follow across multi-room floor
    const followScale = this.floorState ? 1.0 : 0.65;
    this.camTargetX = THREE.MathUtils.damp(this.camTargetX, this.playerX * followScale, 6, dt);
    this.camTargetZ = THREE.MathUtils.damp(this.camTargetZ, this.playerZ * followScale, 6, dt);

    let sx = 0;
    let sy = 0;
    if (this.shakeIntensity > 0.005) {
      sx = (Math.random() - 0.5) * this.shakeIntensity;
      sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 12, dt);
    }

    this.camera.position.set(this.camTargetX + 11.8 + sx, 15.6 + sy, this.camTargetZ + 11.8);
    this.camera.lookAt(this.camTargetX, 0.7, this.camTargetZ);
  }

  private completeMission() {
    if (!this.mission) return;
    this.mode = 'ended';
    this.audio.setVacuumActive(false, false);

    // Collect any remaining floating pickups automatically
    for (const p of this.pickups) {
      if (p.kind === 'ecto') this.ectoCollectedInMission += p.value;
    }

    const diff = DIFFICULTIES[this.difficulty];
    const totalEcto = Math.round(this.mission.baseReward * diff.rewardMult) + this.ectoCollectedInMission;

    let rank: 'S' | 'A' | 'B' = 'B';
    if (this.damageTaken <= 20 && this.elapsedSeconds < 110) rank = 'S';
    else if (this.damageTaken <= 60) rank = 'A';

    this.emitHud();
    this.callbacks.onMissionComplete({
      missionId: this.mission.id,
      rank,
      ectoEarned: totalEcto,
      ghostsCaptured: this.capturedCount,
      timeSeconds: Math.round(this.elapsedSeconds),
      damageTaken: this.damageTaken,
      isFinalVictory: this.mission.id === 10,
    });
  }

  private emitHud() {
    const strobe = getStrobeStats(this.upgrades);
    const boss = this.ghosts.find((g) => g.isBoss);
    const currentRoom = this.floorState?.rooms.find((r) => r.blueprint.id === this.currentRoomId);
    const totalRooms = this.floorState?.rooms.length || 1;
    const roomsVisited = this.floorState?.rooms.filter((r) => r.visited).length || 1;

    let objectiveKey: HudSnapshot['objectiveKey'] = 'explore';
    if (boss) {
      objectiveKey = 'defeatBoss';
    } else if (this.ghosts.length > 0) {
      objectiveKey = 'clearRoom';
    } else if (this.floorState) {
      const hasLockedKeyDoor = this.floorState.doors.some((d) => d.lockType === 'key');
      const hasUnhitSwitch = this.floorState.props.some(
        (p) => !p.opened && p.kind === 'strobe_switch',
      );
      if (hasLockedKeyDoor && this.mansionKeys === 0) {
        objectiveKey = 'findKey';
      } else if (hasUnhitSwitch && this.floorState.doors.some((d) => d.lockType === 'seal')) {
        objectiveKey = 'hitSwitch';
      } else {
        objectiveKey = 'reachGoal';
      }
    }

    const minimapRooms: MinimapRoomInfo[] = this.floorState
      ? this.floorState.rooms.map((r) => ({
          id: r.blueprint.id,
          gx: r.blueprint.gx,
          gz: r.blueprint.gz,
          visited: r.visited,
          isGoal: Boolean(r.blueprint.isGoal),
          hasLockedDoor: this.floorState!.doors.some(
            (d) => d.lockType !== 'open' && (d.roomA === r.blueprint.id || d.roomB === r.blueprint.id),
          ),
        }))
      : [];

    this.callbacks.onHudUpdate({
      hp: Math.ceil(this.playerHp),
      maxHp: this.playerMaxHp,
      ectoCollectedInMission: this.ectoCollectedInMission,
      surgeCharge: Math.round(this.surgeCharge),
      strobeCooldownRatio: Math.max(0, this.strobeCooldown / strobe.cooldown),
      dashCooldownRatio: Math.max(0, this.dashCooldown / 0.72),
      waveIndex: roomsVisited,
      totalWaves: totalRooms,
      ghostsRemaining: this.ghosts.length,
      totalGhostsInWave: this.ghosts.length,
      capturedCount: this.capturedCount,
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      isPulling: this.ghosts.some((g) => g.beingPulled),
      bossNameKey: boss ? boss.type : null,
      bossHp: boss ? Math.max(0, Math.ceil(boss.hp)) : 0,
      bossMaxHp: boss ? boss.maxHp : 1,
      bossPhase: boss ? boss.phase : 1,
      trapCharges: { ...this.trapCharges },
      radioMessageKey: this.radioMessageKey,
      currentRoomId: this.currentRoomId,
      currentRoomNameKey: currentRoom ? currentRoom.blueprint.nameKey : 'foyer',
      objectiveKey,
      keysHeld: this.mansionKeys,
      roomsVisited,
      totalRooms,
      minimapRooms,
    });
  }

  private dampAngle(current: number, target: number, lambda: number, dt: number): number {
    let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * (1 - Math.exp(-lambda * dt));
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.unbindEvents();
    this.clearDynamicEntities();
    this.disposeSingleRoom();
    this.disposeFloorState();
    this.audio.dispose();
    this.contactTex.dispose();
    this.particleGeo.dispose();
    this.pickupGeo.dispose();
    this.projGeo.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
