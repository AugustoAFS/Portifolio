'use strict';

// Worker da troca de tema com tinta (js/modules/theme-ink.js): gera, fora da thread principal, os quadros
// de uma mancha que nasce no botão de tema e se espalha até cobrir a tela, num sprite PNG para o mask-image.
//
// A forma vem de um "campo de chegada": para cada pixel, o instante em que a tinta chega a ele (distância
// até a origem, deformada por ruído). Cada quadro só corta esse campo num instante, então o ruído é
// calculado uma vez e os quadros saem baratos. Cada pedido usa uma semente nova: a mancha nunca se repete.

const FRAMES = 30;
const COLUMNS = 6;
const LONG_SIDE = 560;

// Borda nítida da tinta e a faixa de "fumaça" translúcida que corre um pouco à frente dela
const EDGE = 0.012;
const SMOKE_LEAD = 0.07;
const SMOKE_ALPHA = 0.6;

// O tempo de geração vai junto: é a medida real da CPU do aparelho (theme-ink.js desliga a tinta se for lento)
self.addEventListener('message', async ({ data: geometry }) => {
  try {
    const started = performance.now();
    const blob = await renderInk(geometry, Math.floor(Math.random() * 2 ** 32));
    const elapsed = performance.now() - started;
    self.postMessage({ blob, elapsed, frames: FRAMES, columns: COLUMNS, rows: Math.ceil(FRAMES / COLUMNS), geometry });
  } catch {
    self.postMessage({ blob: null });
  }
});

async function renderInk({ width, height, originX, originY }, seed) {
  const scale = LONG_SIDE / Math.max(width, height);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const rows = Math.ceil(FRAMES / COLUMNS);

  const field = arrivalField(w, h, originX * scale, originY * scale, seed);
  const canvas = new OffscreenCanvas(w * COLUMNS, h * rows);
  const context = canvas.getContext('2d');
  const frame = context.createImageData(w, h);
  const pixels = frame.data;
  const start = field.min + 0.03;
  const end = field.max + EDGE;

  for (let index = 0; index < FRAMES; index++) {
    const last = index === FRAMES - 1;
    const time = start + (end - start) * easeOut(index / (FRAMES - 1));

    for (let p = 0, a = 3; p < field.time.length; p++, a += 4) {
      const arrival = field.time[p];
      const solid = clamp01((time - arrival) / EDGE);
      const smoke = field.smoke[p] * clamp01((time - arrival + SMOKE_LEAD) / SMOKE_LEAD) * SMOKE_ALPHA;
      pixels[a] = last ? 255 : Math.max(solid, smoke) * 255;
    }

    context.putImageData(frame, (index % COLUMNS) * w, Math.floor(index / COLUMNS) * h);
  }

  return canvas.convertToBlob({ type: 'image/png' });
}

function arrivalField(w, h, originX, originY, seed) {
  const random = mulberry32(seed);
  const warp = createNoise(random);
  const lobes = createNoise(random);
  const detail = createNoise(random);
  const fingers = createNoise(random);
  const wisps = createNoise(random);

  const size = Math.max(w, h);
  const ox = originX / size;
  const oy = originY / size;
  const farthest = Math.max(
    Math.hypot(ox, oy),
    Math.hypot(w / size - ox, oy),
    Math.hypot(ox, h / size - oy),
    Math.hypot(w / size - ox, h / size - oy),
  );

  const time = new Float32Array(w * h);
  const smoke = new Float32Array(w * h);
  let min = Infinity;
  let max = -Infinity;

  for (let py = 0, p = 0; py < h; py++) {
    for (let px = 0; px < w; px++, p++) {
      const x = px / size;
      const y = py / size;
      const dx = x - ox;
      const dy = y - oy;
      const length = Math.hypot(dx, dy) || 1e-6;
      const distance = length / farthest;

      // Perto do botão o ruído some aos poucos: a tinta chega primeiro à origem e a mancha nasce nele
      const settle = Math.min(1, distance * 4);

      // Deformação do domínio: as bordas viram lóbulos e redemoinhos em vez de um círculo
      const wx = fbm(warp, x * 2.5, y * 2.5, 3);
      const wy = fbm(warp, x * 2.5 + 5.2, y * 2.5 + 1.3, 3);
      const lobe = fbm(lobes, x * 2.2 + 1.4 * wx, y * 2.2 + 1.4 * wy, 4);
      const grain = fbm(detail, x * 10 + 2 * wx, y * 10 + 2 * wy, 3);

      // Dedos que escapam na direção radial: o ruído varia rápido com o ângulo e devagar com a distância
      const stretch = 3.2 * (1 + distance * 0.5);
      const finger = Math.max(0, fbm(fingers, (dx / length) * stretch, (dy / length) * stretch, 3)) ** 1.5;

      const arrival = distance + settle * (0.17 * lobe + 0.045 * grain - 0.14 * finger);
      time[p] = arrival;
      smoke[p] = smoothstep(0.05, 0.55, fbm(wisps, x * 14 + 3 * wx, y * 14 + 3 * wy, 3));

      if (arrival < min) min = arrival;
      if (arrival > max) max = arrival;
    }
  }

  return { time, smoke, min, max };
}

// Ruído simplex 2D (Gustavson), com a permutação embaralhada pela semente
function createNoise(random) {
  const source = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [source[i], source[j]] = [source[j], source[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = source[i & 255];

  const gx = [1, -1, 1, -1, 1, -1, 0, 0];
  const gy = [1, 1, -1, -1, 0, 0, 1, -1];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  const corner = (hash, x, y) => {
    let t = 0.5 - x * x - y * y;
    if (t <= 0) return 0;
    t *= t;
    const g = hash & 7;
    return t * t * (gx[g] * x + gy[g] * y);
  };

  return (x, y) => {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = 1 - i1;
    const ii = i & 255;
    const jj = j & 255;

    return 70 * (
      corner(perm[ii + perm[jj]], x0, y0) +
      corner(perm[ii + i1 + perm[jj + j1]], x0 - i1 + G2, y0 - j1 + G2) +
      corner(perm[ii + 1 + perm[jj + 1]], x0 - 1 + 2 * G2, y0 - 1 + 2 * G2)
    );
  };
}

function fbm(noise, x, y, octaves) {
  let sum = 0;
  let amplitude = 1;
  let total = 0;
  for (let octave = 0; octave < octaves; octave++) {
    sum += amplitude * noise(x, y);
    total += amplitude;
    amplitude *= 0.5;
    x *= 2;
    y *= 2;
  }
  return sum / total;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Começa rápido e desacelera, como tinta que cai na água
function easeOut(x) {
  return 1 - (1 - x) ** 1.6;
}

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
