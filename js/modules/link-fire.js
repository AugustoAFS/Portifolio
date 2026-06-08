'use strict';

const fireColors = ['255, 65, 108', '255, 75, 43', '235, 87, 87', '197, 160, 89'];

// Detecta se é dispositivo touch (sem hover real)
const IS_TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const MAX_PARTICLES = IS_TOUCH ? 60 : 150;

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = Math.random() * 4 + 1;
    this.life = Math.random() * 15 + 15;
    this.maxLife = this.life;
    this.color = fireColors[Math.floor(Math.random() * fireColors.length)];
    this.size = Math.random() * 4 + 2;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.4;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.size *= 0.94;
    this.life--;
    this.angle += this.spin;
  }
  draw(ctx, blur = 10) {
    const progress = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = progress;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowBlur = IS_TOUCH ? 4 : blur;
    ctx.shadowColor = `rgb(${this.color})`;
    ctx.fillStyle = `rgb(${this.color})`;
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 1.5);
    ctx.lineTo(this.size * 0.5, 0);
    ctx.lineTo(0, this.size * 1.5);
    ctx.lineTo(-this.size * 0.5, 0);
    ctx.fill();
    ctx.restore();
  }
}

function createFireEngine(container, getActiveBox, options = {}) {
  const padding = 120;
  const spawnRate = options.spawnRate ?? 5;
  const glowBlur  = options.glowBlur  ?? 10;
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  container.style.position = 'relative';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let rafId = null;
  let particles = [];
  let resizeTimer = null;

  // Aplica will-change para dar hint à GPU
  canvas.style.willChange = 'transform';

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0) return;
    canvas.style.top = `-${padding}px`;
    canvas.style.left = `-${padding}px`;
    canvas.style.width = `${w + padding * 2}px`;
    canvas.style.height = `${h + padding * 2}px`;
    const dpr = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1 : 2);
    canvas.width = (w + padding * 2) * dpr;
    canvas.height = (h + padding * 2) * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.translate(padding, padding);
    // Descarta partículas acumuladas durante o resize para não desenhar em posições erradas
    particles = [];
  }

  function debouncedResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150); // Aguarda a transição CSS terminar
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(debouncedResize).observe(container);
  } else {
    window.addEventListener('resize', debouncedResize);
  }
  setTimeout(resize, 0);

  function animate() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    ctx.clearRect(-padding, -padding, w + padding * 2, h + padding * 2);

    const box = getActiveBox();
    if (box && particles.length < MAX_PARTICLES) {
      const rate = IS_TOUCH ? Math.ceil(spawnRate * 0.6) : spawnRate;
      for (let i = 0; i < rate; i++) {
        particles.push(new Particle(
          box.left + Math.random() * box.width,
          box.bottom + (Math.random() * 2 - 1)
        ));
      }
    }

    if (particles.length > 0) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx, glowBlur);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    if (!box && particles.length === 0) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(animate);
  }

  return function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(animate);
  };
}

export function initLinkFire() {
  // Sem hover em touch — efeito não faz sentido no mobile
  if (IS_TOUCH) return;

  const navContainer = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!navContainer || !navLinks.length) return;

  let activeBox = null;
  const startLoop = createFireEngine(navContainer, () => activeBox);

  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const navRect = navContainer.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      activeBox = {
        left: linkRect.left - navRect.left,
        width: linkRect.width,
        bottom: linkRect.bottom - navRect.top - 2
      };
      startLoop();
    });
    link.addEventListener('mouseleave', () => { activeBox = null; });
  });
}

export function initContactFire() {
  const contactContainer = document.querySelector('.js-contact-container');
  const contactButtons = document.querySelectorAll('.contact-button');
  if (!contactContainer || !contactButtons.length) return;

  let activeBox = null;
  // Reduz shadowBlur e taxa de partículas para o container grande de contato
  const startLoop = createFireEngine(contactContainer, () => activeBox, { spawnRate: 3, glowBlur: 5 });

  contactButtons.forEach(btn => {
    const setBox = () => {
      const containerRect = contactContainer.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      activeBox = {
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        bottom: btnRect.bottom - containerRect.top
      };
      startLoop();
    };
    const clearBox = () => { activeBox = null; };

    if (IS_TOUCH) {
      // Touch: cancela timer anterior e agenda novo a cada toque
      let clearTimer = null;
      btn.addEventListener('touchstart', () => {
        clearTimeout(clearTimer);
        setBox();
        clearTimer = setTimeout(clearBox, 800);
      }, { passive: true });
    } else {
      btn.addEventListener('mouseenter', setBox);
      btn.addEventListener('mouseleave', clearBox);
    }
  });
}
