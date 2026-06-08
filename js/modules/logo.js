'use strict';

const IS_TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const MAX_PARTICLES = IS_TOUCH ? 30 : 100;

export function initLogo() {
  const containers = document.querySelectorAll('.js-dragon-logo, .nav-logo__dragon');
  if (!containers.length) return;

  const fullContainer = Array.from(containers).find(c => c.querySelector('svg'));
  if (fullContainer) {
    const svgHTML = fullContainer.querySelector('svg').outerHTML;
    containers.forEach(container => {
      if (!container.querySelector('svg')) {
        container.innerHTML = svgHTML + '<canvas></canvas>';
      }
    });
  }

  const BASE_SIZE = 500;

  function getVal(t, keyframes) {
    if (t <= keyframes[0].t) return keyframes[0].v;
    if (t >= keyframes[keyframes.length - 1].t) return keyframes[keyframes.length - 1].v;
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].t && t <= keyframes[i + 1].t) {
        const s = keyframes[i], e = keyframes[i + 1];
        const p = (t - s.t) / (e.t - s.t);
        return s.v + (e.v - s.v) * (p * p * (3 - 2 * p));
      }
    }
    return keyframes[0].v;
  }

  const animCycles = {
    bodyScale: [{t:0,v:1},{t:0.15,v:1.02},{t:0.4,v:1.06},{t:0.5,v:1.04},{t:0.65,v:0.98},{t:0.95,v:1},{t:1,v:1}],
    headY:     [{t:0,v:0},{t:0.15,v:8},{t:0.4,v:-18},{t:0.5,v:-12},{t:0.65,v:6},{t:0.95,v:0},{t:1,v:0}],
    wingRot:   [{t:0,v:0},{t:0.15,v:-2},{t:0.4,v:-30},{t:0.5,v:-40},{t:0.75,v:-40},{t:0.95,v:0},{t:1,v:0}],
    wingScale: [{t:0,v:0.8},{t:0.15,v:0.8},{t:0.4,v:1.15},{t:0.5,v:1.3},{t:0.75,v:1.3},{t:0.95,v:0.8},{t:1,v:0.8}],
    eyeOp:     [{t:0,v:0.1},{t:0.15,v:0.1},{t:0.25,v:1},{t:0.75,v:1},{t:0.95,v:0.1},{t:1,v:0.1}],
    veinOp:    [{t:0,v:0},{t:0.3,v:0},{t:0.45,v:1},{t:0.65,v:1},{t:0.85,v:0},{t:1,v:0}],
    tail:      [{t:0,v:0.1},{t:0.4,v:0.6},{t:0.55,v:1.2},{t:0.9,v:0.1},{t:1,v:0.1}],
    breathInt: [{t:0,v:0},{t:0.35,v:0.2},{t:0.48,v:0.9},{t:0.6,v:0.8},{t:0.75,v:0},{t:1,v:0}]
  };

  const fireColors = ['255, 65, 108', '255, 75, 43', '235, 87, 87', '197, 160, 89'];
  const duration = 6000;

  class Particle {
    constructor(type, x, y, vx, vy, life, color, size) {
      this.type = type; this.x = x; this.y = y;
      this.vx = vx; this.vy = vy; this.life = life;
      this.maxLife = life; this.color = color; this.size = size;
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.2;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.life--; this.angle += this.spin;
      if (this.type === 'smoke') { this.size += 0.4; this.vx += (Math.random()-0.5)*0.15; }
      else if (this.type === 'fire') { this.size *= 0.93; this.vy += 0.2; }
      else if (this.type === 'ember') { this.size *= 0.97; this.vx += (Math.random()-0.5)*1.5; this.vy += 0.08; }
      else if (this.type === 'ambient') { this.y -= 0.8; this.x += Math.sin(Date.now()/800+this.life)*0.8; }
    }
    draw(ctx) {
      const progress = this.life / this.maxLife;
      const alpha = this.type === 'smoke' ? progress * 0.3 :
                    this.type === 'ambient' ? Math.sin(progress * Math.PI) * 0.8 : progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      if (this.type !== 'smoke') {
        ctx.shadowBlur = IS_TOUCH ? 5 : (this.type === 'ambient' ? 8 : 20);
        ctx.shadowColor = `rgb(${this.color})`;
      }
      ctx.fillStyle = `rgb(${this.color})`;
      ctx.beginPath();
      if (this.type === 'smoke') {
        ctx.moveTo(0,-this.size); ctx.lineTo(this.size,0); ctx.lineTo(0,this.size); ctx.lineTo(-this.size,0);
      } else {
        ctx.moveTo(0,-this.size*1.5); ctx.lineTo(this.size*0.5,0); ctx.lineTo(0,this.size*1.5); ctx.lineTo(-this.size*0.5,0);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  containers.forEach(container => {
    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    // Limita DPR no mobile para poupar memória de GPU
    const dprCap = IS_TOUCH ? 1 : 2;
    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let visible = true;

    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(container);

    function resizeCanvas() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0) return;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale((w * dpr) / BASE_SIZE, (h * dpr) / BASE_SIZE);
    }

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 50);

    function animate(time) {
      requestAnimationFrame(animate);
      if (!visible) return;

      const t = (time % duration) / duration;

      container.style.setProperty('--body-scale', getVal(t, animCycles.bodyScale));
      const headY = getVal(t, animCycles.headY);
      container.style.setProperty('--head-y', `${headY}px`);
      const wingRot = getVal(t, animCycles.wingRot);
      container.style.setProperty('--wing-rot-l', `${wingRot}deg`);
      container.style.setProperty('--wing-rot-r', `${-wingRot}deg`);
      container.style.setProperty('--wing-scale', getVal(t, animCycles.wingScale));
      container.style.setProperty('--eye-opacity', getVal(t, animCycles.eyeOp));
      container.style.setProperty('--vein-opacity', getVal(t, animCycles.veinOp));
      container.style.setProperty('--tail-glow', getVal(t, animCycles.tail));
      container.style.setProperty('--breath-intensity', getVal(t, animCycles.breathInt));

      if (particles.length < MAX_PARTICLES) {
        let smokeRate = 0, fireRate = 0, emberRate = 0;
        if (t > 0.35 && t < 0.42) smokeRate = IS_TOUCH ? 1 : 3;
        if (t > 0.48 && t < 0.65) fireRate = IS_TOUCH ? (t < 0.52 ? 5 : 3) : (t < 0.52 ? 14 : t < 0.60 ? 8 : 3);
        if (t > 0.60 && t < 0.72) emberRate = IS_TOUCH ? 2 : 5;

        // Ambientes: desabilitados no mobile (poupam CPU)
        if (!IS_TOUCH && Math.random() < 0.1) {
          particles.push(new Particle('ambient', Math.random()*BASE_SIZE, Math.random()*BASE_SIZE+100, (Math.random()-0.5)*1.5, -(Math.random()*2+0.5), Math.random()*100+40, '255, 65, 108', Math.random()*2+1));
        }

        const ex = 250, ey = 245 + headY;
        for (let i = 0; i < smokeRate; i++) particles.push(new Particle('smoke', ex+(Math.random()-0.5)*15, ey, (Math.random()-0.5)*4, Math.random()*4+1, Math.random()*30+30, '11, 12, 16', Math.random()*5+8));
        for (let i = 0; i < fireRate; i++) particles.push(new Particle('fire', ex+(Math.random()-0.5)*10, ey, (Math.random()-0.5)*6, Math.random()*12+8, Math.random()*25+10, fireColors[Math.floor(Math.random()*fireColors.length)], Math.random()*6+6));
        for (let i = 0; i < emberRate; i++) particles.push(new Particle('ember', ex+(Math.random()-0.5)*25, ey+15, (Math.random()-0.5)*10, Math.random()*8+4, Math.random()*40+20, '255, 75, 43', Math.random()*3+1.5));
      }

      ctx.clearRect(0, 0, BASE_SIZE, BASE_SIZE);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].type === 'smoke') { particles[i].update(); particles[i].draw(ctx); }
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].type !== 'smoke') { particles[i].update(); particles[i].draw(ctx); }
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    requestAnimationFrame(animate);
  });
}
