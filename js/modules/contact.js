'use strict';

export function initContact() {
  const contactToggle = document.querySelector('.js-contact-toggle');
  const contactContainer = document.querySelector('.js-contact-container');
  const contactActions = document.querySelector('.js-contact-actions');

  if (!contactToggle || !contactContainer || !contactActions) return;

  // Garante que o estado inicial seja sempre fechado
  contactToggle.classList.remove('active');
  contactContainer.classList.remove('expanded');
  contactActions.classList.remove('active');
  contactToggle.setAttribute('aria-expanded', 'false');

  function openContact() {
    contactToggle.classList.add('active');
    contactContainer.classList.add('expanded');
    contactActions.classList.add('active');
    contactToggle.setAttribute('aria-expanded', 'true');
  }

  function closeContact() {
    contactToggle.classList.remove('active');
    contactContainer.classList.remove('expanded');
    contactActions.classList.remove('active');
    contactToggle.setAttribute('aria-expanded', 'false');
  }

  contactToggle.addEventListener('click', () => {
    const isExpanded = contactToggle.getAttribute('aria-expanded') === 'true';
    isExpanded ? closeContact() : openContact();
  });

  // Fecha ao pressionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactToggle.getAttribute('aria-expanded') === 'true') {
      closeContact();
      contactToggle.focus();
    }
  });
}
