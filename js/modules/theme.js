'use strict';

const STORAGE_KEY = 'afs-theme';
const DARK = 'dark';
const LIGHT = 'light';

export function initTheme() {
  const btn = document.querySelector('.js-theme-toggle');
  if (!btn) return;

  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved ?? (prefersDark ? DARK : LIGHT);

  applyTheme(initial, btn);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') ?? DARK;
    const next = current === DARK ? LIGHT : DARK;
    applyTheme(next, btn);
    localStorage.setItem(STORAGE_KEY, next);
  });
}

function applyTheme(theme, btn) {
  document.documentElement.setAttribute('data-theme', theme);
  btn.setAttribute('aria-label', theme === DARK ? 'Ativar modo claro' : 'Ativar modo escuro');
  btn.setAttribute('aria-pressed', String(theme === LIGHT));
}
