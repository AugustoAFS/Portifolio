'use strict';

import { REDUCED_MOTION } from '../core/env.js';
import { readStorage, writeStorage } from '../core/storage.js';

const STORAGE_KEY = 'afs-theme';
const DARK = 'dark';
const LIGHT = 'light';
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

export function initTheme() {
  const button = document.querySelector('.js-theme-toggle');
  if (!button) return;

  // O script inline do <head> já aplicou o tema antes da primeira pintura; aqui só sincroniza
  syncControls(currentTheme(), button);

  button.addEventListener('click', () => {
    const next = currentTheme() === DARK ? LIGHT : DARK;
    writeStorage(STORAGE_KEY, next);
    switchTheme(next, button);
  });

  // Sem escolha salva, acompanha o tema do sistema em tempo real
  systemPrefersDark.addEventListener('change', event => {
    if (isTheme(readStorage(STORAGE_KEY))) return;
    switchTheme(event.matches ? DARK : LIGHT, button);
  });
}

function currentTheme() {
  const applied = document.documentElement.getAttribute('data-theme');
  if (isTheme(applied)) return applied;
  return systemPrefersDark.matches ? DARK : LIGHT;
}

function isTheme(value) {
  return value === DARK || value === LIGHT;
}

// Troca com a View Transitions API: o navegador faz um cross-fade da página inteira, em vez de
// animar a cor de cada elemento. Sem suporte (ou com movimento reduzido), a troca é instantânea.
function switchTheme(theme, button) {
  const apply = () => {
    document.documentElement.setAttribute('data-theme', theme);
    syncControls(theme, button);
  };

  if (document.startViewTransition && !REDUCED_MOTION) document.startViewTransition(apply);
  else apply();
}

// Rótulo do botão e cor da barra do navegador no celular
function syncControls(theme, button) {
  button.setAttribute('aria-label', theme === DARK ? 'Ativar modo claro' : 'Ativar modo escuro');

  const background = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-deep').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
}
