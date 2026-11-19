import * as THREE from 'three';
import { ROOM_GRID_STEP } from './layouts';
import {
  FloorPlan,
  GhostType,
  PropKind,
  PropReward,
  RoomBlueprint,
  TrapType,
  WingTheme,
} from './types';
import {
  createFloorTexture,
  createRugTexture,
  createWallpaperTexture,
} from './textures';

export interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface KidHeroRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  nozzleGroup: THREE.Group;
  suctionCone: THREE.Mesh;
  flashCone: THREE.Mesh;
  tankLiquid: THREE.Mesh;
  tankMat: THREE.MeshStandardMaterial;
}

export function createContactShadow(
  contactTex: THREE.Texture,
  radius: number,
  opacity = 0.48,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: contactTex,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.025;
  mesh.renderOrder = 1;
  return mesh;
}

export function createKidHero(contactTex: THREE.Texture): KidHeroRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  group.add(createContactShadow(contactTex, 0.72, 0.5));

  // Materials with distinct roughness/metalness contrast
  const jacketMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Vibrant emerald Luigi-inspired hoodie/vest
    roughness: 0.78,
    metalness: 0.05,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.05,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xfad2b4,
    roughness: 0.65,
    metalness: 0.02,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.45,
    metalness: 0.12,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.85,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.28,
    metalness: 0.82,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.75,
    metalness: 0.05,
  });

  // Boots / Legs (pivoted near hips)
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.22, 4, 10);
  const leftLeg = new THREE.Mesh(legGeo, bootMat);
  leftLeg.position.set(-0.17, 0.22, 0);
  leftLeg.castShadow = true;
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, bootMat);
  rightLeg.position.set(0.17, 0.22, 0);
  rightLeg.castShadow = true;
  bodyGroup.add(rightLeg);

  // Torso (chunky rounded sweater)
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.62, 16),
    jacketMat,
  );
  torso.position.y = 0.68;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Scarf collar
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.08, 10, 20),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.88, metalness: 0.0 }),
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.99;
  bodyGroup.add(scarf);

  // Stylized big cartoon Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), skinMat);
  head.position.y = 1.28;
  head.castShadow = true;
  bodyGroup.add(head);

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), skinMat);
  nose.position.set(0, 1.24, 0.31);
  bodyGroup.add(nose);

  // Expressive Cartoon Eyes
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
  [-0.11, 0.11].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), eyeWhiteMat);
    eye.scale.set(0.85, 1.2, 0.6);
    eye.position.set(ex, 1.31, 0.27);
    bodyGroup.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), pupilMat);
    pupil.position.set(ex, 1.31, 0.305);
    bodyGroup.add(pupil);
  });

  // Cap Dome + Brim + Glowing Ghost-Hunter Emblem
  const capDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.335, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    capMat,
  );
  capDome.position.y = 1.33;
  capDome.rotation.x = -0.15;
  capDome.castShadow = true;
  bodyGroup.add(capDome);

  const capBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.36, 0.05, 18, 1, false, -Math.PI * 0.38, Math.PI * 0.76),
    capMat,
  );
  capBrim.position.set(0, 1.38, 0.16);
  capBrim.rotation.x = 0.15;
  bodyGroup.add(capBrim);

  const badge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    }),
  );
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, 1.48, 0.31);
  bodyGroup.add(badge);

  // SpectroVac-3000 Backpack
  const packGroup = new THREE.Group();
  packGroup.position.set(0, 0.74, -0.34);
  bodyGroup.add(packGroup);

  const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.28), steelMat);
  packBody.castShadow = true;
  packGroup.add(packBody);

  const packTop = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.14, 14), brassMat);
  packTop.position.set(-0.08, 0.32, 0);
  packGroup.add(packTop);

  // Glowing Ecto-Tank glass & inner liquid
  const tankGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.38, 14),
    new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );
  tankGlass.position.set(0.12, 0.06, -0.14);
  tankGlass.renderOrder = 3;
  packGroup.add(tankGlass);

  const tankMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.1,
    roughness: 0.3,
  });
  const tankLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.34, 12), tankMat);
  tankLiquid.position.set(0.12, 0.06, -0.14);
  packGroup.add(tankLiquid);

  // Coiled Hose connecting pack to nozzle
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.85, -0.35),
    new THREE.Vector3(0.32, 0.78, -0.15),
    new THREE.Vector3(0.36, 0.68, 0.25),
  ]);
  const hoseMesh = new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 14, 0.055, 8, false),
    shirtMat,
  );
  bodyGroup.add(hoseMesh);

  // Vacuum Nozzle + Strobe Flashlight Group (front-right)
  const nozzleGroup = new THREE.Group();
  nozzleGroup.position.set(0.34, 0.68, 0.34);
  bodyGroup.add(nozzleGroup);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.09, 0.56, 14),
    steelMat,
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.2;
  barrel.castShadow = true;
  nozzleGroup.add(barrel);

  const bellMouth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.085, 0.2, 16),
    brassMat,
  );
  bellMouth.rotation.x = Math.PI / 2;
  bellMouth.position.z = 0.54;
  nozzleGroup.add(bellMouth);

  // Strobe emitter ring on top of nozzle
  const strobeEmitter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.06, 0.14, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    }),
  );
  strobeEmitter.rotation.x = Math.PI / 2;
  strobeEmitter.position.set(0, 0.11, 0.36);
  nozzleGroup.add(strobeEmitter);

  // Suction Vortex Cone (visible when vacuuming)
  const suctionConeGeo = new THREE.ConeGeometry(1.15, 3.8, 18, 1, true);
  suctionConeGeo.translate(0, -1.9, 0);
  suctionConeGeo.rotateX(Math.PI / 2);
  const suctionCone = new THREE.Mesh(
    suctionConeGeo,
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  suctionCone.position.set(0, 0, 0.6);
  suctionCone.visible = false;
  suctionCone.renderOrder = 4;
  nozzleGroup.add(suctionCone);

  // Strobe Flash Cone (visible briefly on flash!)
  const flashConeGeo = new THREE.ConeGeometry(2.6, 6.2, 20, 1, true);
  flashConeGeo.translate(0, -3.1, 0);
  flashConeGeo.rotateX(-Math.PI / 2);
  const flashCone = new THREE.Mesh(
    flashConeGeo,
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  flashCone.position.set(0, 0.08, 0.5);
  flashCone.visible = false;
  flashCone.renderOrder = 5;
  nozzleGroup.add(flashCone);

  return {
    group,
    bodyGroup,
    leftLeg,
    rightLeg,
    nozzleGroup,
    suctionCone,
    flashCone,
    tankLiquid,
    tankMat,
  };
}

export interface GhostRig {
  group: THREE.Group;
  visualGroup: THREE.Group;
  coreMat: THREE.MeshStandardMaterial;
  telegraphRing: THREE.Mesh;
  telegraphMat: THREE.MeshBasicMaterial;
  stunStars: THREE.Group;
  shieldMesh: THREE.Mesh | null;
  armLeft: THREE.Object3D | null;
  armRight: THREE.Object3D | null;
  baseHeight: number;
}

export function createGhostMesh(type: GhostType, contactTex: THREE.Texture): GhostRig {
  const group = new THREE.Group();
  const visualGroup = new THREE.Group();
  group.add(visualGroup);

  const isBoss = type.startsWith('boss_');
  const shadowRadius = isBoss ? 1.55 : type === 'armored' ? 0.95 : 0.72;
  group.add(createContactShadow(contactTex, shadowRadius, isBoss ? 0.6 : 0.42));

  // Telegraph ring on ground (hidden until ghost winds up attack)
  const teleRadius = isBoss ? 2.4 : 1.05;
  const telegraphMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const telegraphRing = new THREE.Mesh(
    new THREE.RingGeometry(teleRadius * 0.65, teleRadius, 28),
    telegraphMat,
  );
  telegraphRing.rotation.x = -Math.PI / 2;
  telegraphRing.position.y = 0.04;
  group.add(telegraphRing);

  // Stunned orbiting stars group
  const stunStars = new THREE.Group();
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  for (let i = 0; i < 3; i++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), starMat);
    const angle = (i / 3) * Math.PI * 2;
    star.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
    stunStars.add(star);
  }
  stunStars.visible = false;
  group.add(stunStars);

  let shieldMesh: THREE.Mesh | null = null;
  let armLeft: THREE.Object3D | null = null;
  let armRight: THREE.Object3D | null = null;
  let baseHeight = 1.05;

  const palette: Record<GhostType, { body: number; glow: number; eye: number }> = {
    lurker: { body: 0x34d399, glow: 0x059669, eye: 0xfef08a },
    dasher: { body: 0xf97316, glow: 0xdc2626, eye: 0xffffff },
    sneak: { body: 0x8b5cf6, glow: 0x6d28d9, eye: 0x38bdf8 },
    spitter: { body: 0xa3e635, glow: 0x4d7c0f, eye: 0xf43f5e },
    armored: { body: 0x38bdf8, glow: 0x0284c7, eye: 0xfef08a },
    boss_clang: { body: 0xef4444, glow: 0x991b1b, eye: 0xfef08a },
    boss_grimoire: { body: 0xa855f7, glow: 0x6b21a8, eye: 0x22d3ee },
    boss_thorn: { body: 0xec4899, glow: 0x9d174d, eye: 0xa3e635 },
    boss_aetherion: { body: 0x06b6d4, glow: 0x7c3aed, eye: 0xfef08a },
  };

  const pal = palette[type];
  const coreMat = new THREE.MeshStandardMaterial({
    color: pal.body,
    emissive: pal.glow,
    emissiveIntensity: isBoss ? 0.75 : 0.65,
    roughness: 0.35,
    metalness: 0.1,
    transparent: true,
    opacity: type === 'sneak' ? 0.24 : 0.9,
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: pal.eye,
    emissive: pal.eye,
    emissiveIntensity: 1.4,
    roughness: 0.15,
  });

  if (!isBoss) {
    // Stylized Lathe wispy ghost silhouette
    const points = [
      new THREE.Vector2(0.01, -0.55),
      new THREE.Vector2(0.22, -0.35),
      new THREE.Vector2(0.45, -0.05),
      new THREE.Vector2(0.5, 0.35),
      new THREE.Vector2(0.38, 0.68),
      new THREE.Vector2(0.01, 0.8),
    ];
    const ghostGeo = new THREE.LatheGeometry(points, 18);
    const body = new THREE.Mesh(ghostGeo, coreMat);
    if (type === 'spitter') body.scale.set(1.25, 0.95, 1.25);
    if (type === 'dasher') body.scale.set(0.92, 1.15, 0.95);
    body.castShadow = true;
    visualGroup.add(body);

    // Expressive eyes + grin
    [-0.16, 0.16].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), eyeMat);
      eye.scale.set(0.9, 1.25, 0.5);
      eye.position.set(ex, 0.38, 0.42);
      visualGroup.add(eye);
    });

    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.09, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x0f172a }),
    );
    mouth.position.set(0, 0.18, 0.45);
    visualGroup.add(mouth);

    // Floating claw/mitt arms
    const armGeo = new THREE.CapsuleGeometry(0.09, 0.24, 4, 8);
    const lArm = new THREE.Mesh(armGeo, coreMat);
    lArm.position.set(-0.55, 0.22, 0.12);
    lArm.rotation.z = 0.55;
    visualGroup.add(lArm);
    armLeft = lArm;

    const rArm = new THREE.Mesh(armGeo, coreMat);
    rArm.position.set(0.55, 0.22, 0.12);
    rArm.rotation.z = -0.55;
    visualGroup.add(rArm);
    armRight = rArm;

    // Type-specific silhouettes (horns, spitter cheeks, armor helmet & shield)
    if (type === 'dasher') {
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
      [-0.2, 0.2].forEach((hx) => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), hornMat);
        horn.position.set(hx, 0.8, 0.05);
        horn.rotation.z = hx > 0 ? -0.3 : 0.3;
        visualGroup.add(horn);
      });
    } else if (type === 'spitter') {
      [-0.36, 0.36].forEach((cx) => {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), coreMat);
        cheek.position.set(cx, 0.2, 0.3);
        visualGroup.add(cheek);
      });
    } else if (type === 'armored') {
      const armorMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.25,
        metalness: 0.85,
      });
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.46, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
        armorMat,
      );
      helm.position.y = 0.38;
      visualGroup.add(helm);

      shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.9, 0.12), armorMat);
      shieldMesh.position.set(0, 0.2, 0.56);
      visualGroup.add(shieldMesh);
    }
  } else if (type === 'boss_clang') {
    baseHeight = 1.5;
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.28,
      metalness: 0.88,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.22,
      metalness: 0.9,
    });
    // Spectral core torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.35, 1.5, 12), coreMat);
    torso.castShadow = true;
    visualGroup.add(torso);

    // Ornate Breastplate & Helmet
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.8), armorMat);
    plate.position.y = 0.35;
    visualGroup.add(plate);

    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.65, 10), armorMat);
    helm.position.y = 1.15;
    visualGroup.add(helm);

    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 8), eyeMat);
    plume.position.set(0, 1.65, -0.1);
    visualGroup.add(plume);

    // Glowing Visor Slit
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.12), eyeMat);
    visor.position.set(0, 1.12, 0.44);
    visualGroup.add(visor);

    // Great Shield (blocks front unless stunned!)
    shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.16), goldMat);
    shieldMesh.position.set(-0.35, 0.35, 0.72);
    visualGroup.add(shieldMesh);
    armLeft = shieldMesh;

    // Spectral Halberd Arm
    const halberdGroup = new THREE.Group();
    halberdGroup.position.set(0.85, 0.45, 0.2);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), armorMat);
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.75, 4), eyeMat);
    blade.position.y = 1.1;
    halberdGroup.add(shaft, blade);
    visualGroup.add(halberdGroup);
    armRight = halberdGroup;
  } else if (type === 'boss_grimoire') {
    baseHeight = 1.65;
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x3b0764,
      roughness: 0.65,
      metalness: 0.15,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const pageMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.85,
    });

    // Left & Right Flapping Book Wings
    const leftWing = new THREE.Group();
    const lCover = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.45, 0.12), coverMat);
    lCover.position.x = -0.58;
    const lPages = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.32, 0.14), pageMat);
    lPages.position.set(-0.55, 0, 0.08);
    leftWing.add(lCover, lPages);
    visualGroup.add(leftWing);
    armLeft = leftWing;

    const rightWing = new THREE.Group();
    const rCover = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.45, 0.12), coverMat);
    rCover.position.x = 0.58;
    const rPages = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.32, 0.14), pageMat);
    rPages.position.set(0.55, 0, 0.08);
    rightWing.add(rCover, rPages);
    visualGroup.add(rightWing);
    armRight = rightWing;

    // Spine + Central All-Seeing Astral Eye
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.5, 12), brassMat);
    visualGroup.add(spine);

    const eyeOrb = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 16), coreMat);
    eyeOrb.position.set(0, 0.05, 0.22);
    visualGroup.add(eyeOrb);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), eyeMat);
    pupil.position.set(0, 0.05, 0.48);
    visualGroup.add(pupil);
  } else if (type === 'boss_thorn') {
    baseHeight = 1.4;
    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      roughness: 0.65,
      metalness: 0.08,
    });
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    });

    // Blossom gown base
    const gown = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.65, 10), coreMat);
    gown.position.y = 0.25;
    gown.castShadow = true;
    visualGroup.add(gown);

    // Crown of petals
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 6), petalMat);
      petal.position.set(Math.cos(a) * 0.48, 1.15, Math.sin(a) * 0.48);
      petal.rotation.z = -Math.cos(a) * 0.6;
      petal.rotation.x = Math.sin(a) * 0.6;
      visualGroup.add(petal);
    }

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), coreMat);
    head.position.y = 1.12;
    visualGroup.add(head);

    [-0.15, 0.15].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), eyeMat);
      eye.position.set(ex, 1.16, 0.36);
      visualGroup.add(eye);
    });

    // Vine whip arms
    const lVine = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.25, 8), vineMat);
    lVine.position.set(-0.92, 0.55, 0.15);
    lVine.rotation.z = 0.65;
    visualGroup.add(lVine);
    armLeft = lVine;

    const rVine = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.25, 8), vineMat);
    rVine.position.set(0.92, 0.55, 0.15);
    rVine.rotation.z = -0.65;
    visualGroup.add(rVine);
    armRight = rVine;
  } else {
    // boss_aetherion: Sky-Fallen Meteorite Core
    baseHeight = 1.7;
    const meteorMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      roughness: 0.4,
      metalness: 0.55,
    });
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.9,
    });

    const coreCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), coreMat);
    coreCrystal.castShadow = true;
    visualGroup.add(coreCrystal);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.08, 10, 28), goldRingMat);
    ring1.rotation.x = Math.PI / 3;
    visualGroup.add(ring1);
    armLeft = ring1;

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 10, 28), eyeMat);
    ring2.rotation.y = Math.PI / 3;
    visualGroup.add(ring2);
    armRight = ring2;

    // Orbiting meteor shards
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), meteorMat);
      shard.position.set(Math.cos(a) * 1.15, Math.sin(a * 2) * 0.35, Math.sin(a) * 1.15);
      visualGroup.add(shard);
    }

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), eyeMat);
    eye.position.set(0, 0.1, 0.72);
    visualGroup.add(eye);
  }

  visualGroup.position.y = baseHeight;
  stunStars.position.y = baseHeight + (isBoss ? 1.55 : 0.95);

  return {
    group,
    visualGroup,
    coreMat,
    telegraphRing,
    telegraphMat,
    stunStars,
    shieldMesh,
    armLeft,
    armRight,
    baseHeight,
  };
}

export function createTrapMesh(type: TrapType): THREE.Group {
  const g = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.8,
  });

  if (type === 'snare') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.07, 8, 28),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 1.2,
        roughness: 0.25,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    g.add(ring);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 8), baseMat);
      post.position.set(Math.cos(a) * 1.55, 0.17, Math.sin(a) * 1.55);
      g.add(post);
    }
  } else if (type === 'decoy') {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.35, 0.65, 10), baseMat);
    stand.position.y = 0.32;
    g.add(stand);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.6,
        roughness: 0.15,
      }),
    );
    orb.position.y = 0.82;
    g.add(orb);
  } else {
    // cryo vortex coil
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.45, 12), baseMat);
    ped.position.y = 0.22;
    g.add(ped);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.4,
        roughness: 0.15,
      }),
    );
    crystal.position.y = 0.78;
    g.add(crystal);

    const aura = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 2.8, 32),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;
    g.add(aura);
  }

  return g;
}

export interface RoomBuildResult {
  group: THREE.Group;
  obstacles: ObstacleBox[];
  disposables: { dispose: () => void }[];
  animatedObjects: THREE.Object3D[];
}

export function createMansionRoom(
  theme: WingTheme,
  halfSize: number,
  anisotropy: number,
  contactTex: THREE.Texture,
): RoomBuildResult {
  const group = new THREE.Group();
  const obstacles: ObstacleBox[] = [];
  const disposables: { dispose: () => void }[] = [];
  const animatedObjects: THREE.Object3D[] = [];

  const size = halfSize * 2;
  const floorTex = createFloorTexture(theme, anisotropy);
  const wallTex = createWallpaperTexture(theme, anisotropy);
  const rugTex = createRugTexture(theme, anisotropy);
  disposables.push(floorTex, wallTex, rugTex);

  // Main Floor
  const floorGeo = new THREE.PlaneGeometry(size, size);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.62,
    metalness: 0.08,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  disposables.push(floorGeo, floorMat);

  // Ornate Center Rug (offset by 0.015 on Y to prevent Z-fighting)
  const rugGeo = new THREE.PlaneGeometry(size * 0.56, size * 0.44);
  const rugMat = new THREE.MeshStandardMaterial({
    map: rugTex,
    roughness: 0.92,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.015;
  rug.receiveShadow = true;
  group.add(rug);
  disposables.push(rugGeo, rugMat);

  // Isometric Cutaway Walls (Back North -Z and Back West -X so camera at +X,+Y,+Z sees straight in!)
  const wallH = 5.4;
  const wallThick = 0.6;
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.8,
    metalness: 0.05,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x291812,
    roughness: 0.55,
    metalness: 0.12,
  });
  disposables.push(wallMat, trimMat);

  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(size + wallThick, wallH, wallThick),
    wallMat,
  );
  northWall.position.set(0, wallH / 2, -halfSize - wallThick / 2);
  northWall.receiveShadow = true;
  northWall.castShadow = true;
  group.add(northWall);

  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick, wallH, size + wallThick),
    wallMat,
  );
  westWall.position.set(-halfSize - wallThick / 2, wallH / 2, 0);
  westWall.receiveShadow = true;
  westWall.castShadow = true;
  group.add(westWall);

  // Low cutaway front/right rail ledges so arena bounds read cleanly without blocking view
  const railH = 0.48;
  const southRail = new THREE.Mesh(
    new THREE.BoxGeometry(size + wallThick, railH, 0.35),
    trimMat,
  );
  southRail.position.set(0, railH / 2, halfSize + 0.18);
  group.add(southRail);

  const eastRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, railH, size + wallThick),
    trimMat,
  );
  eastRail.position.set(halfSize + 0.18, railH / 2, 0);
  group.add(eastRail);

  // Moonlight Arched Windows along North wall
  const windowGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x1d4ed8,
    emissiveIntensity: 1.1,
    roughness: 0.2,
  });
  [-5.2, 0, 5.2].forEach((wx) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.9, 0.2), trimMat);
    frame.position.set(wx, 3.1, -halfSize + 0.05);
    group.add(frame);

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.5), windowGlowMat);
    glass.position.set(wx, 3.1, -halfSize + 0.17);
    group.add(glass);

    // Moonlight floor pool
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 3.8),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(wx, 0.02, -halfSize + 2.2);
    group.add(pool);
  });

  // Wall Sconces / Candelabras
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.0,
    roughness: 0.1,
  });
  [-7.5, -2.6, 2.6, 7.5].forEach((sx) => {
    const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.28), trimMat);
    sconce.position.set(sx, 2.9, -halfSize + 0.16);
    group.add(sconce);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), flameMat);
    flame.position.set(sx, 3.25, -halfSize + 0.24);
    group.add(flame);
    animatedObjects.push(flame);
  });

  // Theme-specific 3D Mansion Props + Colliders (placed away from center spawn (0,0))
  const addFurniture = (mesh: THREE.Group, x: number, z: number, halfW: number, halfD: number) => {
    mesh.position.set(x, 0, z);
    mesh.add(createContactShadow(contactTex, Math.max(halfW, halfD) * 1.15, 0.45));
    group.add(mesh);
    obstacles.push({
      minX: x - halfW,
      maxX: x + halfW,
      minZ: z - halfD,
      maxZ: z + halfD,
    });
  };

  const makePillarOrBookcase = (isBookcase: boolean) => {
    const fg = new THREE.Group();
    const wood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.6, 1.1), trimMat);
    wood.position.y = 1.3;
    wood.castShadow = true;
    wood.receiveShadow = true;
    fg.add(wood);
    if (isBookcase) {
      const bookColors = [0x991b1b, 0x1e40af, 0x065f46, 0x92400e];
      for (let shelf = 0; shelf < 3; shelf++) {
        for (let b = 0; b < 4; b++) {
          const book = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.46, 0.3),
            new THREE.MeshStandardMaterial({
              color: bookColors[(shelf + b) % bookColors.length],
              roughness: 0.75,
            }),
          );
          book.position.set(-0.48 + b * 0.32, 0.65 + shelf * 0.7, 0.48);
          fg.add(book);
        }
      }
    } else {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.25, 1.3),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.75 }),
      );
      cap.position.y = 2.65;
      fg.add(cap);
    }
    return fg;
  };

  const makeTableWithLamp = () => {
    const tg = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 1.4), trimMat);
    top.position.y = 0.95;
    top.castShadow = true;
    tg.add(top);
    [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.9, 8), trimMat);
      leg.position.set(lx, 0.45, lz);
      tg.add(leg);
    });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), flameMat);
    lamp.position.set(0, 1.25, 0);
    tg.add(lamp);
    animatedObjects.push(lamp);
    return tg;
  };

  const makePlanter = () => {
    const pg = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.45, 0.85, 12),
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8 }),
    );
    pot.position.y = 0.42;
    pot.castShadow = true;
    pg.add(pot);
    const bush = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.68, 1),
      new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.75 }),
    );
    bush.position.y = 1.2;
    bush.castShadow = true;
    pg.add(bush);
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.7,
      }),
    );
    bloom.position.set(0, 1.85, 0);
    pg.add(bloom);
    return pg;
  };

  const makeAstralPylon = () => {
    const ag = new THREE.Group();
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.82, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.75 }),
    );
    ped.position.y = 0.55;
    ped.castShadow = true;
    ag.add(ped);
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7c3aed,
        emissiveIntensity: 1.5,
        roughness: 0.15,
      }),
    );
    crystal.position.y = 1.65;
    ag.add(crystal);
    animatedObjects.push(crystal);
    return ag;
  };

  if (theme === 'foyer') {
    addFurniture(makePillarOrBookcase(false), -5.8, -5.8, 0.9, 0.65);
    addFurniture(makePillarOrBookcase(false), 5.8, -5.8, 0.9, 0.65);
    addFurniture(makeTableWithLamp(), -5.5, 4.8, 0.95, 0.75);
    addFurniture(makeTableWithLamp(), 5.5, 4.8, 0.95, 0.75);
  } else if (theme === 'library') {
    addFurniture(makePillarOrBookcase(true), -5.6, -5.4, 0.9, 0.6);
    addFurniture(makePillarOrBookcase(true), 5.6, -5.4, 0.9, 0.6);
    addFurniture(makePillarOrBookcase(true), -5.6, 4.8, 0.9, 0.6);
    addFurniture(makeTableWithLamp(), 5.5, 4.8, 0.95, 0.75);
  } else if (theme === 'conservatory') {
    addFurniture(makePlanter(), -5.6, -5.4, 0.75, 0.75);
    addFurniture(makePlanter(), 5.6, -5.4, 0.75, 0.75);
    addFurniture(makePlanter(), -5.6, 5.2, 0.75, 0.75);
    addFurniture(makePlanter(), 5.6, 5.2, 0.75, 0.75);
  } else {
    addFurniture(makeAstralPylon(), -5.8, -5.6, 0.78, 0.78);
    addFurniture(makeAstralPylon(), 5.8, -5.6, 0.78, 0.78);
    addFurniture(makeAstralPylon(), -5.8, 5.4, 0.78, 0.78);
    addFurniture(makeAstralPylon(), 5.8, 5.4, 0.78, 0.78);
  }

  return { group, obstacles, disposables, animatedObjects };
}

export interface MansionDoorRuntime {
  id: string;
  roomA: string;
  roomB: string;
  lockType: 'open' | 'key' | 'seal';
  x: number;
  z: number;
  axis: 'x' | 'z'; // 'z' = connects north-south, 'x' = connects east-west
  gateMesh: THREE.Group | null;
  collider: ObstacleBox | null;
}

export interface MansionPropRuntime {
  id: string;
  roomId: string;
  kind: PropKind;
  reward: PropReward;
  ambushGhost?: GhostType;
  unlocksDoorId?: string;
  x: number;
  z: number;
  mesh: THREE.Group;
  lidOrOrb: THREE.Object3D | null;
  opened: boolean;
  shakeProgress: number;
  collider: ObstacleBox;
}

export interface MansionRoomRuntime {
  blueprint: RoomBlueprint;
  cx: number;
  cz: number;
  visited: boolean;
  cleared: boolean;
  ambushTriggered: boolean;
  fogMesh: THREE.Mesh;
  fogMat: THREE.MeshBasicMaterial;
  roomLight: THREE.PointLight | null;
}

export interface MansionFloorBuildResult {
  group: THREE.Group;
  rooms: MansionRoomRuntime[];
  doors: MansionDoorRuntime[];
  props: MansionPropRuntime[];
  obstacles: ObstacleBox[];
  animatedObjects: THREE.Object3D[];
  disposables: { dispose: () => void }[];
}

function createInteractivePropMesh(kind: PropKind): {
  mesh: THREE.Group;
  lidOrOrb: THREE.Object3D | null;
} {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.68, metalness: 0.08 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x2e1306, roughness: 0.75 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 });

  if (kind === 'chest') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.55, 0.85), woodMat);
    base.position.y = 0.275;
    base.castShadow = true;
    g.add(base);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.3, 0.88), darkWoodMat);
    lid.position.y = 0.7;
    lid.castShadow = true;
    g.add(lid);

    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.14), brassMat);
    lock.position.set(0, 0.55, 0.45);
    g.add(lock);
    return { mesh: g, lidOrOrb: lid };
  }

  if (kind === 'wardrobe') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.25, 0.9), darkWoodMat);
    body.position.y = 1.125;
    body.castShadow = true;
    g.add(body);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.18, 1.0), woodMat);
    trim.position.y = 2.28;
    g.add(trim);

    [-0.14, 0.14].forEach((hx) => {
      const handle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), brassMat);
      handle.position.set(hx, 1.1, 0.48);
      g.add(handle);
    });
    return { mesh: g, lidOrOrb: body };
  }

  if (kind === 'clock') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.35, 0.7), woodMat);
    base.position.y = 1.175;
    base.castShadow = true;
    g.add(base);

    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xf59e0b, emissiveIntensity: 0.35 }),
    );
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 1.85, 0.35);
    g.add(face);
    return { mesh: g, lidOrOrb: face };
  }

  if (kind === 'strobe_switch') {
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.46, 0.95, 10),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.8 }),
    );
    ped.position.y = 0.475;
    ped.castShadow = true;
    g.add(ped);

    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.4,
      roughness: 0.15,
    });
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), sensorMat);
    orb.position.y = 1.25;
    g.add(orb);
    return { mesh: g, lidOrOrb: orb };
  }

  // crate
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), woodMat);
  crate.position.y = 0.475;
  crate.castShadow = true;
  g.add(crate);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.99, 0.16, 0.99), brassMat);
  strap.position.y = 0.48;
  g.add(strap);
  return { mesh: g, lidOrOrb: crate };
}

export function buildMansionFloor(
  plan: FloorPlan,
  anisotropy: number,
  contactTex: THREE.Texture,
): MansionFloorBuildResult {
  const group = new THREE.Group();
  const rooms: MansionRoomRuntime[] = [];
  const doors: MansionDoorRuntime[] = [];
  const props: MansionPropRuntime[] = [];
  const obstacles: ObstacleBox[] = [];
  const animatedObjects: THREE.Object3D[] = [];
  const disposables: { dispose: () => void }[] = [];

  const floorTex = createFloorTexture(plan.theme, anisotropy);
  const wallTex = createWallpaperTexture(plan.theme, anisotropy);
  const rugTex = createRugTexture(plan.theme, anisotropy);
  disposables.push(floorTex, wallTex, rugTex);

  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.65, metalness: 0.08 });
  const porchFloorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 });
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });
  const lowWallMat = new THREE.MeshStandardMaterial({ color: 0x291812, roughness: 0.65, metalness: 0.1 });
  const rugMat = new THREE.MeshStandardMaterial({
    map: rugTex,
    roughness: 0.92,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.9,
  });
  const windowGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x1d4ed8,
    emissiveIntensity: 1.1,
  });
  disposables.push(floorMat, porchFloorMat, wallMat, lowWallMat, rugMat, flameMat, windowGlowMat);

  const roomMap = new Map<string, RoomBlueprint>();
  plan.rooms.forEach((r) => roomMap.set(r.id, r));

  // Helper to check if a doorway exists on a side of room (dir: 'N'|'S'|'E'|'W')
  const hasNeighborRoom = (r: RoomBlueprint, dx: number, dz: number) =>
    plan.rooms.find((other) => other.gx === r.gx + dx && other.gz === r.gz + dz);

  const getDoorBetween = (idA: string, idB: string) =>
    plan.doors.find(
      (d) => (d.roomA === idA && d.roomB === idB) || (d.roomA === idB && d.roomB === idA),
    );

  const cellSize = ROOM_GRID_STEP; // 12m
  const half = cellSize / 2; // 6m
  const doorGap = 3.4;
  const segLen = (cellSize - doorGap) / 2; // 4.3m
  const wallThick = 0.55;

  const addWallBox = (
    cx: number,
    cz: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(cx, h / 2, cz);
    m.receiveShadow = true;
    m.castShadow = h > 2;
    group.add(m);
    obstacles.push({
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
    });
  };

  for (const r of plan.rooms) {
    const cx = r.gx * cellSize;
    const cz = r.gz * cellSize;

    // Room Floor
    const fGeo = new THREE.PlaneGeometry(cellSize, cellSize);
    const fMesh = new THREE.Mesh(fGeo, r.isPorch ? porchFloorMat : floorMat);
    fMesh.rotation.x = -Math.PI / 2;
    fMesh.position.set(cx, 0, cz);
    fMesh.receiveShadow = true;
    group.add(fMesh);
    disposables.push(fGeo);

    // Ornate Center Rug (non-porch) or Mansion Entrance Steps
    if (!r.isPorch) {
      const rugGeo = new THREE.PlaneGeometry(6.6, 5.2);
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(cx, 0.015, cz);
      rug.receiveShadow = true;
      group.add(rug);
      disposables.push(rugGeo);
    } else {
      // Porch entrance carpet runner leading north into mansion door
      const runner = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.06, 6.5),
        new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.9 }),
      );
      runner.position.set(cx, 0.03, cz - 1.5);
      group.add(runner);
    }

    // Dark unvisited shroud above room (fades out once player enters)
    const fogGeo = new THREE.PlaneGeometry(cellSize - 0.4, cellSize - 0.4);
    const fogMat = new THREE.MeshBasicMaterial({
      color: 0x05070e,
      transparent: true,
      opacity: r.isStart ? 0 : 0.84,
      depthWrite: false,
    });
    const fogMesh = new THREE.Mesh(fogGeo, fogMat);
    fogMesh.rotation.x = -Math.PI / 2;
    fogMesh.position.set(cx, 2.8, cz);
    fogMesh.visible = !r.isStart;
    fogMesh.renderOrder = 6;
    group.add(fogMesh);
    disposables.push(fogGeo, fogMat);

    // Build 4 perimeter edges (North -Z, West -X, South +Z, East +X)
    // Back edges (-Z, -X) get tall walls if outer boundary; shared or front edges get low 1.05m cutaway walls so player is never hidden!
    const northNeighbor = hasNeighborRoom(r, 0, -1);
    const westNeighbor = hasNeighborRoom(r, -1, 0);
    const southNeighbor = hasNeighborRoom(r, 0, 1);
    const eastNeighbor = hasNeighborRoom(r, 1, 0);

    const northDoor = northNeighbor ? getDoorBetween(r.id, northNeighbor.id) : undefined;
    const westDoor = westNeighbor ? getDoorBetween(r.id, westNeighbor.id) : undefined;
    const southDoor = southNeighbor ? getDoorBetween(r.id, southNeighbor.id) : undefined;
    const eastDoor = eastNeighbor ? getDoorBetween(r.id, eastNeighbor.id) : undefined;

    // North Edge (-Z)
    if (!northNeighbor) {
      addWallBox(cx, cz - half, cellSize + wallThick, 3.6, wallThick, wallMat);
      // Moonlight Window & Sconce on outer North wall
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.0), windowGlowMat);
      win.position.set(cx, 2.2, cz - half + wallThick / 2 + 0.02);
      group.add(win);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), flameMat);
      flame.position.set(cx - 2.6, 2.3, cz - half + wallThick / 2 + 0.18);
      group.add(flame);
      animatedObjects.push(flame);
    } else if (!northDoor) {
      addWallBox(cx, cz - half, cellSize, 1.15, wallThick, lowWallMat);
    } else {
      addWallBox(cx - half + segLen / 2, cz - half, segLen, 1.35, wallThick, lowWallMat);
      addWallBox(cx + half - segLen / 2, cz - half, segLen, 1.35, wallThick, lowWallMat);
      // Tall Door Pillars
      [-doorGap / 2 - 0.15, doorGap / 2 + 0.15].forEach((px) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 0.7), lowWallMat);
        pillar.position.set(cx + px, 1.4, cz - half);
        group.add(pillar);
      });
    }

    // West Edge (-X)
    if (!westNeighbor) {
      addWallBox(cx - half, cz, wallThick, 3.6, cellSize + wallThick, wallMat);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), flameMat);
      flame.position.set(cx - half + wallThick / 2 + 0.18, 2.3, cz);
      group.add(flame);
      animatedObjects.push(flame);
    } else if (!westDoor) {
      addWallBox(cx - half, cz, wallThick, 1.15, cellSize, lowWallMat);
    } else {
      addWallBox(cx - half, cz - half + segLen / 2, wallThick, 1.35, segLen, lowWallMat);
      addWallBox(cx - half, cz + half - segLen / 2, wallThick, 1.35, segLen, lowWallMat);
      [-doorGap / 2 - 0.15, doorGap / 2 + 0.15].forEach((pz) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.8, 0.35), lowWallMat);
        pillar.position.set(cx - half, 1.4, cz + pz);
        group.add(pillar);
      });
    }

    // South Edge (+Z) - only build outer low rail if no south neighbor (shared doors/walls already built by south neighbor's North edge)
    if (!southNeighbor) {
      addWallBox(cx, cz + half, cellSize + wallThick, 0.55, 0.38, lowWallMat);
    }

    // East Edge (+X) - only build outer low rail if no east neighbor
    if (!eastNeighbor) {
      addWallBox(cx + half, cz, 0.38, 0.55, cellSize + wallThick, lowWallMat);
    }

    // Build Interactive Props in Room
    for (const p of r.props) {
      const px = cx + p.localX;
      const pz = cz + p.localZ;
      const built = createInteractivePropMesh(p.kind);
      built.mesh.position.set(px, 0, pz);
      built.mesh.add(createContactShadow(contactTex, 0.72, 0.45));
      group.add(built.mesh);

      const box: ObstacleBox = {
        minX: px - 0.65,
        maxX: px + 0.65,
        minZ: pz - 0.55,
        maxZ: pz + 0.55,
      };
      obstacles.push(box);
      if (p.kind === 'strobe_switch' && built.lidOrOrb) {
        animatedObjects.push(built.lidOrOrb);
      }

      props.push({
        id: p.id,
        roomId: r.id,
        kind: p.kind,
        reward: p.reward,
        ambushGhost: p.ambushGhost,
        unlocksDoorId: p.unlocksDoorId,
        x: px,
        z: pz,
        mesh: built.mesh,
        lidOrOrb: built.lidOrOrb,
        opened: false,
        shakeProgress: 0,
        collider: box,
      });
    }

    rooms.push({
      blueprint: r,
      cx,
      cz,
      visited: Boolean(r.isStart),
      cleared: !r.ambushOnEnter || r.ambushOnEnter.length === 0,
      ambushTriggered: false,
      fogMesh,
      fogMat,
      roomLight: null,
    });
  }

  // Build Door Gates & Colliders
  for (const d of plan.doors) {
    const rA = roomMap.get(d.roomA);
    const rB = roomMap.get(d.roomB);
    if (!rA || !rB) continue;

    const dx = ((rA.gx + rB.gx) / 2) * cellSize;
    const dz = ((rA.gz + rB.gz) / 2) * cellSize;
    const axis: 'x' | 'z' = rA.gx !== rB.gx ? 'x' : 'z';

    let gateMesh: THREE.Group | null = null;
    let collider: ObstacleBox | null = null;

    if (d.lockType !== 'open') {
      gateMesh = new THREE.Group();
      const gateColor = d.lockType === 'key' ? 0xf59e0b : 0xa855f7;
      const barMat = new THREE.MeshStandardMaterial({
        color: gateColor,
        emissive: gateColor,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.78,
        roughness: 0.25,
      });
      const panel = new THREE.Mesh(
        axis === 'z'
          ? new THREE.BoxGeometry(doorGap - 0.1, 2.2, 0.24)
          : new THREE.BoxGeometry(0.24, 2.2, doorGap - 0.1),
        barMat,
      );
      panel.position.y = 1.1;
      gateMesh.add(panel);

      const emblem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.38, 0),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: gateColor,
          emissiveIntensity: 1.6,
        }),
      );
      emblem.position.y = 1.5;
      gateMesh.add(emblem);
      animatedObjects.push(emblem);

      gateMesh.position.set(dx, 0, dz);
      group.add(gateMesh);

      collider =
        axis === 'z'
          ? { minX: dx - doorGap / 2, maxX: dx + doorGap / 2, minZ: dz - 0.35, maxZ: dz + 0.35 }
          : { minX: dx - 0.35, maxX: dx + 0.35, minZ: dz - doorGap / 2, maxZ: dz + doorGap / 2 };
      obstacles.push(collider);
    }

    doors.push({
      id: d.id,
      roomA: d.roomA,
      roomB: d.roomB,
      lockType: d.lockType,
      x: dx,
      z: dz,
      axis,
      gateMesh,
      collider,
    });
  }

  return { group, rooms, doors, props, obstacles, animatedObjects, disposables };
}

