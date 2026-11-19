import * as THREE from 'three';
import { WingTheme } from './types';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createFloorTexture(theme: WingTheme, anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 512);

  if (theme === 'foyer') {
    // Rich dark Victorian hardwood planks
    ctx.fillStyle = '#2d1b14';
    ctx.fillRect(0, 0, 512, 512);
    const plankH = 64;
    for (let row = 0; row < 8; row++) {
      const y = row * plankH;
      const offset = (row % 2) * 128;
      for (let col = -1; col < 3; col++) {
        const x = col * 256 + offset;
        const shade = 28 + ((row * 7 + col * 13) % 18);
        ctx.fillStyle = `rgb(${shade + 22}, ${shade + 5}, ${shade - 4})`;
        ctx.fillRect(x + 2, y + 2, 252, plankH - 4);
        // Wood grain streaks
        ctx.strokeStyle = 'rgba(15, 8, 5, 0.28)';
        ctx.lineWidth = 2;
        for (let g = 0; g < 4; g++) {
          ctx.beginPath();
          const gy = y + 12 + g * 14;
          ctx.moveTo(x + 6, gy);
          ctx.bezierCurveTo(x + 80, gy + 3, x + 170, gy - 3, x + 246, gy);
          ctx.stroke();
        }
      }
    }
    return finalizeTexture(c, anisotropy, 4, 4);
  }

  if (theme === 'library') {
    // Warm herringbone / checkerboard mahogany parquet
    ctx.fillStyle = '#24171d';
    ctx.fillRect(0, 0, 512, 512);
    const tile = 128;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const dark = (x + y) % 2 === 0;
        ctx.fillStyle = dark ? '#2a1a22' : '#3b242c';
        ctx.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
        ctx.strokeStyle = 'rgba(255, 215, 160, 0.06)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * tile + 8, y * tile + 8, tile - 16, tile - 16);
      }
    }
    return finalizeTexture(c, anisotropy, 4, 4);
  }

  if (theme === 'conservatory') {
    // Mossy moonlit conservatory flagstones
    ctx.fillStyle = '#182422';
    ctx.fillRect(0, 0, 512, 512);
    const tile = 128;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const alt = (x * 3 + y * 5) % 3;
        ctx.fillStyle = alt === 0 ? '#1e2f2b' : alt === 1 ? '#243832' : '#1b2b27';
        ctx.fillRect(x * tile + 4, y * tile + 4, tile - 8, tile - 8);
        // Subtle moss corner
        ctx.fillStyle = 'rgba(52, 211, 153, 0.09)';
        ctx.beginPath();
        ctx.arc(x * tile + 14, y * tile + 14, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return finalizeTexture(c, anisotropy, 4, 4);
  }

  // Observatory: Dark obsidian & brass celestial tiles
  ctx.fillStyle = '#121326';
  ctx.fillRect(0, 0, 512, 512);
  const tile = 128;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#171933' : '#1d2040';
      ctx.fillRect(x * tile + 3, y * tile + 3, tile - 6, tile - 6);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * tile + 6, y * tile + 6, tile - 12, tile - 12);
    }
  }
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.stroke();
  return finalizeTexture(c, anisotropy, 3, 3);
}

export function createWallpaperTexture(theme: WingTheme, anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 256);
  const baseMap: Record<WingTheme, [string, string]> = {
    foyer: ['#2e1d36', '#24152b'],
    library: ['#331c24', '#27131a'],
    conservatory: ['#1b312d', '#132522'],
    observatory: ['#191c3b', '#12142d'],
  };
  const [colA, colB] = baseMap[theme];
  ctx.fillStyle = colA;
  ctx.fillRect(0, 0, 256, 256);

  // Vertical damask stripes
  ctx.fillStyle = colB;
  for (let x = 0; x < 256; x += 32) {
    ctx.fillRect(x, 0, 14, 256);
  }
  // Subtle diamond motif
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let y = 16; y < 256; y += 64) {
    for (let x = 16; x < 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 8, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Lower wood wainscot trim
  ctx.fillStyle = '#1b1110';
  ctx.fillRect(0, 185, 256, 71);
  ctx.fillStyle = '#472c21';
  ctx.fillRect(0, 182, 256, 6);

  return finalizeTexture(c, anisotropy, 5, 1);
}

export function createRugTexture(theme: WingTheme, anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 384);
  const palette: Record<WingTheme, [string, string, string]> = {
    foyer: ['#5c1728', '#d97706', '#3d0d19'],
    library: ['#4b1d3f', '#f59e0b', '#2e1027'],
    conservatory: ['#15463a', '#34d399', '#0d2e26'],
    observatory: ['#251f59', '#a78bfa', '#16123a'],
  };
  const [main, trim, inner] = palette[theme];
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = trim;
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 472, 344);
  ctx.strokeStyle = trim;
  ctx.lineWidth = 4;
  ctx.strokeRect(38, 38, 436, 308);
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(256, 192, 130, 82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = 5;
  ctx.stroke();

  return finalizeTexture(c, anisotropy, 1, 1);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
