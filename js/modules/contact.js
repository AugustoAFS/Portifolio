'use strict';

export function initContact() {
  const contactToggle = document.querySelector('.js-contact-toggle');
  const contactContainer = document.querySelector('.js-contact-container');
  const contactActions = document.querySelector('.js-contact-actions');

  if (!contactToggle || !contactContainer || !contactActions) return;

  const isOpen = () => contactToggle.getAttribute('aria-expanded') === 'true';

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

  // Garante que o estado inicial seja sempre fechado
  closeContact();

  contactToggle.addEventListener('click', () => {
    isOpen() ? closeContact() : openContact();
  });

  // Fecha com Escape quando o foco está no menu de contato
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen() && contactContainer.contains(document.activeElement)) {
      closeContact();
      contactToggle.focus();
    }
  });

  // Abre sozinho quando a seção aparece: os contatos não ficam escondidos atrás de um clique.
  // Depois disso o botão continua funcionando para fechar e abrir.
  const observer = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      openContact();
      observer.disconnect();
    }
  }, { threshold: 0.4 });

  observer.observe(contactContainer);
}
