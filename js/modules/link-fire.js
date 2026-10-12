'use strict';

import { IS_TOUCH } from '../core/env.js';
import { FIRE_COLORS, pixelRatio, clearCanvas, glowSprite } from '../core/canvas.js';

const MAX_SPARKS = IS_TOUCH ? 60 : 150;
// Velocidades e duração medidas em "quadros de 60 fps": o efeito anda igual em 60, 120 ou 144 Hz
const FRAME_MS = 1000 / 60;
// Ao tirar o mouse, as faíscas que sobraram se apagam esse tanto de vezes mais rápido
const FADE_OUT_SPEED = 3;
// Tamanho da faísca dentro do sprite (px); o brilho é desenhado em volta dela
const SPRITE_CORE = 8;

class Spark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = Math.random() * 4 + 1;
    this.life = Math.random() * 15 + 15;
    this.maxLife = this.life;
    this.color = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)];
    this.size = Math.random() * 4 + 2;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.4;
  }

  // Avança a física e diz se a faísca continua viva
  update(step, decay) {
    this.x += this.vx * step;
    this.y += this.vy * step;
    this.size *= 0.94 ** step;
    this.life -= step * decay;
    this.angle += this.spin * step;
    return this.life > 0;
  }

  // Sempre entre 0 e 1: o canvas ignora globalAlpha fora disso e desenharia com opacidade total
  get alpha() {
    return Math.min(this.life / this.maxLife, 1);
  }
}

// Motor de faíscas de um container. O canvas só é criado no primeiro hover: nada é alocado
// no carregamento da página. O tamanho em CSS vem de .fire-canvas (inset negativo).
function createFireEngine(container, getActiveBox, { spawnRate = 5, glow = 10 } = {}) {
  let canvas = null;
  let ctx = null;
  let bleed = 0;           // quanto o canvas sobra em volta do container (definido no CSS)
  let sparks = [];
  let rafId = null;
  let lastTime = null;
  let spawnBudget = 0;
  let resizeTimer = null;

  function mountCanvas() {
    canvas = document.createElement('canvas');
    canvas.className = 'fire-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.append(canvas);
    ctx = canvas.getContext('2d');

    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitCanvas, 150); // espera a transição CSS do container terminar
    }).observe(container);
    fitCanvas();
  }

  // Buffer no tamanho real × densidade de pixels; coordenadas passam a ser as do container
  function fitCanvas() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width) return;

    const dpr = pixelRatio();
    bleed = (width - container.clientWidth) / 2;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, bleed * dpr, bleed * dpr);
    sparks = []; // posições antigas não valem mais
  }

  function spawn(box, step) {
    spawnBudget += (IS_TOUCH ? Math.ceil(spawnRate * 0.6) : spawnRate) * step;
    while (spawnBudget >= 1) {
      if (sparks.length < MAX_SPARKS) {
        sparks.push(new Spark(box.left + Math.random() * box.width, box.bottom + (Math.random() * 2 - 1)));
      }
      spawnBudget--;
    }
  }

  // Brilho do sprite compensado pela densidade de pixels: fica igual ao shadowBlur original
  const spriteBlur = (IS_TOUCH ? 4 : glow) * 2 / pixelRatio();

  function draw() {
    clearCanvas(ctx);
    if (!sparks.length) return;

    const base = ctx.getTransform();
    ctx.globalCompositeOperation = 'lighter';
    for (const spark of sparks) {
      const sprite = glowSprite(spark.color, spriteBlur, SPRITE_CORE);
      const scale = spark.size / SPRITE_CORE;
      ctx.setTransform(base);
      ctx.translate(spark.x, spark.y);
      ctx.rotate(spark.angle);
      ctx.scale(scale, scale);
      ctx.globalAlpha = spark.alpha;
      ctx.drawImage(sprite.canvas, -sprite.extent, -sprite.extent);
    }
    ctx.setTransform(base);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    // Quadros de 60 fps desde o último desenho (limitado: depois de uma aba em segundo plano não dá salto)
    const step = lastTime === null ? 1 : Math.min((now - lastTime) / FRAME_MS, 3);
    lastTime = now;

    const box = getActiveBox();
    if (box) spawn(box, step);
    else spawnBudget = 0;

    const decay = box ? 1 : FADE_OUT_SPEED;
    sparks = sparks.filter(spark => spark.update(step, decay));
    draw();

    // Fogo apagado e canvas já limpo neste quadro: o loop para sem deixar vestígio
    if (!box && !sparks.length) {
      rafId = null;
      lastTime = null;
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  return function ignite() {
    if (!canvas) mountCanvas();
    if (rafId === null) rafId = requestAnimationFrame(frame);
  };
}

// Posição de um elemento em relação ao container (recalculada a cada quadro: o header muda de
// tamanho ao rolar e os botões de contato crescem no hover)
function boxWithin(container, element, offsetBottom = 0) {
  const containerRect = container.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left - containerRect.left,
    width: rect.width,
    bottom: rect.bottom - containerRect.top + offsetBottom
  };
}

// Faíscas que caem dos links da navbar no hover
export function initLinkFire() {
  const nav = document.querySelector('.nav');
  const links = nav?.querySelectorAll('.nav-link');
  if (!links?.length) return;

  let hovered = null;
  const ignite = createFireEngine(nav, () => (hovered ? boxWithin(nav, hovered, -2) : null));

  const start = link => {
    hovered = link;
    ignite();
  };

  links.forEach(link => {
    link.addEventListener('mouseenter', () => start(link));
    link.addEventListener('mouseleave', () => {
      if (hovered === link) hovered = null;
    });
  });

  // O módulo carrega no primeiro mouse sobre a navbar: o link pode já estar com hover
  const alreadyHovered = nav.querySelector('.nav-link:hover');
  if (alreadyHovered) start(alreadyHovered);
}

// Faíscas nos botões do menu de contato (hover no desktop, toque no celular)
export function initContactFire() {
  const container = document.querySelector('.js-contact-container');
  const actions = document.querySelector('.js-contact-actions');
  const buttons = document.querySelectorAll('.contact-button');
  if (!container || !actions || !buttons.length) return;

  let hovered = null;
  // Com o menu fechado não há fogo, mesmo com o mouse parado onde havia um botão
  const getActiveBox = () => (hovered && actions.classList.contains('active') ? boxWithin(container, hovered) : null);
  const ignite = createFireEngine(container, getActiveBox, { spawnRate: 3, glow: 5 });

  const start = button => {
    hovered = button;
    ignite();
  };
  const stop = button => {
    if (hovered === button) hovered = null;
  };

  buttons.forEach(button => {
    if (IS_TOUCH) {
      // Toque: acende e apaga sozinho depois de um instante
      let stopTimer = null;
      button.addEventListener('touchstart', () => {
        clearTimeout(stopTimer);
        start(button);
        stopTimer = setTimeout(() => stop(button), 800);
      }, { passive: true });
    } else {
      button.addEventListener('mouseenter', () => start(button));
      button.addEventListener('mouseleave', () => stop(button));
    }
  });
}
