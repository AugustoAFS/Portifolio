'use strict';

import { IS_TOUCH, REDUCED_MOTION } from './core/env.js';
import { run, load, afterFirstPaint, whenIdle, whenVisible, onFirstPointer } from './core/lazy.js';
import { initTheme } from './modules/theme.js';
import { initNav } from './modules/nav.js';
import { initTypingEffect } from './modules/typing.js';
import { initReveal } from './modules/reveal.js';

// Essenciais: logo depois da primeira pintura, para não atrasar a foto do hero (LCP).
// O tema já foi aplicado pelo script inline do <head> e o texto do hero espera escondido pelo CSS.
afterFirstPaint(() => {
  run(initTheme);
  run(initNav);
  run(initTypingEffect);
  run(initReveal);
});

// O resto só é baixado e executado quando passa a ser necessário

// Dragão do logo: quando o navegador fica ocioso (até lá o SVG aparece parado)
whenIdle(() => load(() => import('./modules/logo.js'), 'initLogo'));

// Menu de contato: quando a seção se aproxima da tela
whenVisible('#contact', () => load(() => import('./modules/contact.js'), 'initContact'), '300px');

// Efeitos de movimento: nem são baixados com prefers-reduced-motion
if (!REDUCED_MOTION) {
  whenVisible('video.card-preview', () => load(() => import('./modules/video.js'), 'initVideoAutoplay'), '200px');
  whenVisible('.js-contact-container', () => load(() => import('./modules/link-fire.js'), 'initContactFire'), '300px');

  // Fogo nos links da navbar: no primeiro mouse sobre ela (não existe em telas touch)
  if (!IS_TOUCH) onFirstPointer('.nav', () => load(() => import('./modules/link-fire.js'), 'initLinkFire'));
}
