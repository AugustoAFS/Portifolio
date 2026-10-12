'use strict';

import { IS_TOUCH } from './env.js';

// Cores das partículas de fogo (rosa, laranja, vermelho e dourado do tema)
export const FIRE_COLORS = ['255, 65, 108', '255, 75, 43', '235, 87, 87', '197, 160, 89'];

// Densidade de pixels do canvas (limitada no celular para poupar memória de GPU)
export function pixelRatio() {
  return Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1 : 2);
}

// Limpa o buffer inteiro, independente da transformação atual
export function clearCanvas(ctx) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

// Losango alongado: a forma das faíscas
export function traceSpark(ctx, size) {
  ctx.beginPath();
  ctx.moveTo(0, -size * 1.5);
  ctx.lineTo(size * 0.5, 0);
  ctx.lineTo(0, size * 1.5);
  ctx.lineTo(-size * 0.5, 0);
  ctx.closePath();
}

// Sprite com a faísca e o brilho já desenhados. shadowBlur é caro e seria recalculado para cada
// partícula, a cada quadro; assim ele é feito uma vez por cor e depois só copiado com drawImage.
const sprites = new Map();

export function glowSprite(color, blur, core) {
  const key = `${color}/${blur}/${core}`;
  if (!sprites.has(key)) sprites.set(key, createGlowSprite(color, blur, core));
  return sprites.get(key);
}

function createGlowSprite(color, blur, core) {
  const extent = Math.ceil(core * 1.5 + blur * 2); // meia-altura da faísca + alcance do brilho
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = extent * 2;

  const ctx = canvas.getContext('2d');
  ctx.translate(extent, extent);
  ctx.fillStyle = `rgb(${color})`;
  ctx.shadowColor = `rgb(${color})`;
  ctx.shadowBlur = blur;
  traceSpark(ctx, core);
  ctx.fill();

  return { canvas, extent, core };
}
