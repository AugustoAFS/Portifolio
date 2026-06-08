'use strict';

export function initNav() {
  const toggleBtn = document.querySelector('.js-nav-toggle');
  const navList = document.querySelector('.js-nav-list');
  const navLinks = document.querySelectorAll('.js-nav-link');
  const header = document.querySelector('.js-header');

  if (!toggleBtn || !navList || !header) return;

  function openMenu() {
    navList.classList.add('nav-list--open');
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    navList.classList.remove('nav-list--open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    isExpanded ? closeMenu() : openMenu();
  });

  // Fecha ao clicar fora
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) closeMenu();
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const offset = header.offsetHeight + 16;
          window.scrollTo({
            top: targetElement.getBoundingClientRect().top + window.scrollY - offset,
            behavior: 'smooth'
          });
        }
        closeMenu();
      }
    });
  });

  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', window.scrollY > 50);
  }, { passive: true });
}
