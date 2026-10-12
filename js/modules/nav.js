'use strict';

const SUPPORTS_POPOVER = 'popover' in HTMLElement.prototype;
const DESKTOP = window.matchMedia('(min-width: 768px)');

export function initNav() {
  const header = document.querySelector('.js-header');
  const menu = document.querySelector('.js-nav-list');
  const toggle = document.querySelector('.js-nav-toggle');
  if (!header || !menu || !toggle) return;

  observeScroll(header);
  if (SUPPORTS_POPOVER) setupPopoverMenu(menu);
  else setupFallbackMenu(menu, toggle);
}

// header--scrolled sem listener de scroll: um marcador invisível a 50px do topo é observado pelo
// IntersectionObserver; quando ele sai da tela, a página foi rolada
function observeScroll(header) {
  const sentinel = document.createElement('div');
  sentinel.className = 'header-sentinel';
  document.body.prepend(sentinel);

  new IntersectionObserver(([entry]) => {
    header.classList.toggle('header--scrolled', !entry.isIntersecting);
  }).observe(sentinel);
}

// Menu mobile é um popover nativo: abrir pelo botão, fechar com Escape ou clique fora, devolver o
// foco e o aria-expanded do botão são feitos pelo navegador. Aqui só fecha ao escolher uma seção
// e quando a tela vira desktop.
function setupPopoverMenu(menu) {
  const close = () => {
    if (menu.matches(':popover-open')) menu.hidePopover();
  };

  menu.addEventListener('click', event => {
    if (event.target.closest('a')) close();
  });
  DESKTOP.addEventListener('change', close);
}

// Navegadores sem Popover API: alterna uma classe e o aria-expanded manualmente
function setupFallbackMenu(menu, toggle) {
  menu.removeAttribute('popover');
  toggle.removeAttribute('popovertarget');

  const setOpen = open => {
    menu.classList.toggle('nav-list--open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  setOpen(false);
  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('nav-list--open')));
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
}
