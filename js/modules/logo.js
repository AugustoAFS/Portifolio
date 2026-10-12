'use strict';

import { IS_TOUCH, REDUCED_MOTION } from '../core/env.js';
import { whenVisible } from '../core/lazy.js';
import { FIRE_COLORS, pixelRatio, clearCanvas, glowSprite } from '../core/canvas.js';

const CYCLE_MS = 6000;
const VIEWBOX = 500;            // as partículas usam as coordenadas do viewBox do SVG
const FRAME_MS = 1000 / 60;     // física medida em quadros de 60 fps...
const TICK_MS = 1000 / 30;      // ...mas o dragão é desenhado a 30 fps: o logo tem ~45px na tela
const MAX_PARTICLES = IS_TOUCH ? 30 : 100;
const GLOW = IS_TOUCH ? 5 : 20; // brilho das partículas, em px do canvas
const AMBIENT_GLOW = IS_TOUCH ? 5 : 8;
const SPRITE_CORE = 1.5;        // tamanho da faísca dentro do sprite (px do canvas)
const MOUTH_X = 250;            // de onde sai o sopro de fogo
const MOUTH_Y = 245;

// Pose do dragão ao longo de um ciclo (offset 0–1). Fonte única: vira animação nativa
// (Web Animations API) e também diz onde está a boca para o sopro de fogo.
const TIMELINE = {
  body:      { offsets: [0, 0.15, 0.4, 0.5, 0.65, 0.95, 1], values: [1, 1.02, 1.06, 1.04, 0.98, 1, 1] },
  headY:     { offsets: [0, 0.15, 0.4, 0.5, 0.65, 0.95, 1], values: [0, 8, -18, -12, 6, 0, 0] },
  wingRot:   { offsets: [0, 0.15, 0.4, 0.5, 0.75, 0.95, 1], values: [0, -2, -30, -40, -40, 0, 0] },
  wingScale: { offsets: [0, 0.15, 0.4, 0.5, 0.75, 0.95, 1], values: [0.8, 0.8, 1.15, 1.3, 1.3, 0.8, 0.8] },
  eyes:      { offsets: [0, 0.15, 0.25, 0.75, 0.95, 1], values: [0.1, 0.1, 1, 1, 0.1, 0.1] },
  veins:     { offsets: [0, 0.3, 0.45, 0.65, 0.85, 1], values: [0, 0, 1, 1, 0, 0] },
  tail:      { offsets: [0, 0.4, 0.55, 0.9, 1], values: [0.1, 0.6, 1.2, 0.1, 0.1] },
  breath:    { offsets: [0, 0.35, 0.48, 0.6, 0.75, 1], values: [0, 0.2, 0.9, 0.8, 0, 0] },
};

// ease-in-out entre os quadros-chave equivale à suavização usada em sample()
const keyframes = (track, toStyle) =>
  track.offsets.map((offset, i) => ({ offset, easing: 'ease-in-out', ...toStyle(track.values[i], i) }));

// Parte do SVG → quadros-chave (as transform-origin ficam no logo.css)
const POSE = [
  ['.dragon-body', keyframes(TIMELINE.body, v => ({ transform: `scale(${v})` }))],
  ['.dragon-head', keyframes(TIMELINE.headY, v => ({ transform: `translateY(${v}px)` }))],
  ['.dragon-wing-left', keyframes(TIMELINE.wingRot, (v, i) => ({ transform: `rotate(${v}deg) scale(${TIMELINE.wingScale.values[i]})` }))],
  ['.dragon-wing-right', keyframes(TIMELINE.wingRot, (v, i) => ({ transform: `rotate(${-v}deg) scale(${TIMELINE.wingScale.values[i]})` }))],
  ['.dragon-eyes', keyframes(TIMELINE.eyes, v => ({ opacity: v }))],
  ['.vein', keyframes(TIMELINE.veins, v => ({ opacity: v, strokeDashoffset: `${200 - 200 * v}px` }))],
  ['.dragon-tail-tip', keyframes(TIMELINE.tail, v => ({ opacity: Math.min(v, 1), transform: `scale(${0.5 + v})` }))],
  ['.dragon-core-glow', keyframes(TIMELINE.breath, v => ({ opacity: v }))],
];

export function initLogo() {
  const containers = [...document.querySelectorAll('.js-dragon')];
  const source = containers.map(container => container.querySelector('svg')).find(Boolean);
  if (!source) return;

  containers.forEach(container => {
    if (container.querySelector('svg')) {
      startDragon(container);
      return;
    }
    // O dragão do footer só é montado quando o footer se aproxima da tela
    whenVisible(container, () => {
      cloneDragon(source, container);
      startDragon(container);
    }, '300px');
  });
}

// O clone usa os <defs> (gradientes e filtros) do original: assim não há IDs duplicados
function cloneDragon(source, container) {
  const clone = source.cloneNode(true);
  clone.querySelector('defs')?.remove();
  container.append(clone, document.createElement('canvas'));
}

// Anima o dragão enquanto ele está na tela. Com movimento reduzido ele fica parado (pose do CSS).
function startDragon(container) {
  if (REDUCED_MOTION) return;

  const loop = createDragonLoop(animatePose(container.querySelector('svg')), createBreathLayer(container));

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) loop.start();
    else loop.stop();
  }).observe(container);
}

// Pose: animações nativas (Web Animations API) com a interpolação feita pelo navegador.
// Ficam pausadas porque quem avança o tempo é o relógio de 30 fps do dragão.
function animatePose(svg) {
  return POSE.flatMap(([selector, frames]) => [...svg.querySelectorAll(selector)].map(part => {
    const animation = part.animate(frames, { duration: CYCLE_MS, iterations: Infinity });
    animation.pause();
    return animation;
  }));
}

// Relógio único a 30 fps: avança a pose e o sopro juntos, desenhando metade dos quadros de 60 fps
function createDragonLoop(poses, breath) {
  let rafId = null;
  let lastTick = null;
  let elapsed = 0;

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (lastTick !== null && now - lastTick < TICK_MS - 1) return;

    const delta = lastTick === null ? 0 : Math.min(now - lastTick, 100); // sem salto depois de uma pausa
    lastTick = now;
    elapsed = (elapsed + delta) % CYCLE_MS;

    poses.forEach(animation => {
      animation.currentTime = elapsed;
    });
    breath.update(elapsed / CYCLE_MS, Math.max(delta, TICK_MS) / FRAME_MS, now);
  }

  return {
    start() {
      if (rafId === null) rafId = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(rafId);
      rafId = null;
      lastTick = null;
    },
  };
}

// Valor de uma trilha no instante t (0–1), com suavização smoothstep (≈ ease-in-out)
function sample({ offsets, values }, t) {
  for (let i = 0; i < offsets.length - 1; i++) {
    if (t <= offsets[i + 1]) {
      const p = (t - offsets[i]) / (offsets[i + 1] - offsets[i]);
      return values[i] + (values[i + 1] - values[i]) * p * p * (3 - 2 * p);
    }
  }
  return values[values.length - 1];
}

// Quantidade inteira a criar neste quadro, mantendo a média por quadro de 60 fps
function countFor(ratePerFrame, step) {
  const amount = ratePerFrame * step;
  return Math.floor(amount) + (Math.random() < amount % 1 ? 1 : 0);
}

const random = (min, max) => min + Math.random() * (max - min);
const randomFireColor = () => FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)];

// ---------- partículas do sopro (canvas) ----------

class Particle {
  constructor(type, x, y, vx, vy, life, color, size) {
    Object.assign(this, { type, x, y, vx, vy, life, color, size });
    this.maxLife = life;
    this.startSize = size;
  }

  // Avança a física (em quadros de 60 fps) e diz se a partícula continua viva
  update(step, now) {
    this.x += this.vx * step;
    this.y += this.vy * step;
    this.life -= step;
    if (this.type === 'smoke') {
      this.size += 0.4 * step;
      this.vx += (Math.random() - 0.5) * 0.15 * step;
    } else if (this.type === 'fire') {
      this.size *= 0.93 ** step;
      this.vy += 0.2 * step;
    } else if (this.type === 'ember') {
      this.size *= 0.97 ** step;
      this.vx += (Math.random() - 0.5) * 1.5 * step;
      this.vy += 0.08 * step;
    } else {
      this.y -= 0.8 * step;
      this.x += Math.sin(now / 800 + this.life) * 0.8 * step;
    }
    return this.life > 0;
  }

  // Sempre entre 0 e 1 (o canvas ignora globalAlpha fora disso e desenharia com opacidade total)
  get alpha() {
    const progress = this.life / this.maxLife;
    const raw = this.type === 'smoke' ? progress * 0.3
      : this.type === 'ambient' ? Math.sin(progress * Math.PI) * 0.8
      : progress * Math.min(this.size / this.startSize, 1); // brilho diminui junto com a faísca
    return Math.min(Math.max(raw, 0), 1);
  }
}

function spawnParticles(particles, t, headY, step) {
  if (particles.length >= MAX_PARTICLES) return;
  const add = (count, factory) => {
    for (let i = 0; i < count; i++) particles.push(factory());
  };
  const mouthY = MOUTH_Y + headY;

  // Brilho ambiente: só no desktop
  if (!IS_TOUCH) {
    add(countFor(0.1, step), () => new Particle('ambient', random(0, VIEWBOX), random(100, VIEWBOX + 100),
      random(-0.75, 0.75), -random(0.5, 2.5), random(40, 140), FIRE_COLORS[0], random(1, 3)));
  }
  if (t > 0.35 && t < 0.42) {
    add(countFor(IS_TOUCH ? 1 : 3, step), () => new Particle('smoke', MOUTH_X + random(-7.5, 7.5), mouthY,
      random(-2, 2), random(1, 5), random(30, 60), '11, 12, 16', random(8, 13)));
  }
  if (t > 0.48 && t < 0.65) {
    const rate = IS_TOUCH ? (t < 0.52 ? 5 : 3) : (t < 0.52 ? 14 : t < 0.6 ? 8 : 3);
    add(countFor(rate, step), () => new Particle('fire', MOUTH_X + random(-5, 5), mouthY,
      random(-3, 3), random(8, 20), random(10, 35), randomFireColor(), random(6, 12)));
  }
  if (t > 0.6 && t < 0.72) {
    add(countFor(IS_TOUCH ? 2 : 5, step), () => new Particle('ember', MOUTH_X + random(-12.5, 12.5), mouthY + 15,
      random(-5, 5), random(4, 12), random(20, 60), FIRE_COLORS[1], random(1.5, 4.5)));
  }
}

function drawParticles(ctx, particles, scale) {
  clearCanvas(ctx);

  // Fumaça: losango escuro, sem brilho
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgb(11, 12, 16)';
  for (const particle of particles) {
    if (particle.type !== 'smoke') continue;
    ctx.globalAlpha = particle.alpha;
    ctx.setTransform(scale, 0, 0, scale, particle.x * scale, particle.y * scale);
    ctx.beginPath();
    ctx.moveTo(0, -particle.size);
    ctx.lineTo(particle.size, 0);
    ctx.lineTo(0, particle.size);
    ctx.lineTo(-particle.size, 0);
    ctx.fill();
  }

  // Fogo, brasas e brilho ambiente: sprite com o brilho pronto, somando luz
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const particle of particles) {
    if (particle.type === 'smoke') continue;
    const sprite = glowSprite(particle.color, particle.type === 'ambient' ? AMBIENT_GLOW : GLOW, SPRITE_CORE);
    ctx.globalAlpha = particle.alpha;
    ctx.drawImage(sprite.canvas, particle.x * scale - sprite.extent, particle.y * scale - sprite.extent);
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// Camada de partículas do sopro: recebe o instante do ciclo (t, 0–1) e quantos quadros de 60 fps passaram
function createBreathLayer(container) {
  const canvas = container.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let scale = 1; // px do canvas por unidade do viewBox

  new ResizeObserver(() => {
    canvas.width = canvas.height = Math.round(container.clientWidth * pixelRatio());
    scale = canvas.width / VIEWBOX;
  }).observe(container);

  return {
    update(t, step, now) {
      spawnParticles(particles, t, sample(TIMELINE.headY, t), step);
      particles = particles.filter(particle => particle.update(step, now));
      drawParticles(ctx, particles, scale);
    },
  };
}
