'use strict';

import { REDUCED_MOTION } from '../core/env.js';

const REVEAL_RATIO = 0.15;

// Entrada suave dos blocos .js-animate quando aparecem na tela. O que já está visível quando o
// módulo roda fica como está (sem "piscar"); com movimento reduzido nada é animado.
export function initReveal() {
  const elements = document.querySelectorAll('.js-animate');
  if (!elements.length || REDUCED_MOTION) return;

  const pending = new WeakSet();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
      // Primeira leitura: decide se o bloco anima ou se já está na tela
      if (!pending.has(target)) {
        if (isIntersecting) {
          observer.unobserve(target);
        } else {
          pending.add(target);
          hide(target);
        }
        return;
      }

      if (intersectionRatio >= REVEAL_RATIO) {
        reveal(target);
        observer.unobserve(target);
      }
    });
  }, { threshold: [0, REVEAL_RATIO] });

  elements.forEach(element => observer.observe(element));
}

// Estado inicial da animação (a transição está no CSS de .js-animate)
function hide(element) {
  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
}

function reveal(element) {
  element.classList.add('is-visible');
  element.style.opacity = '';
  element.style.transform = '';
}
