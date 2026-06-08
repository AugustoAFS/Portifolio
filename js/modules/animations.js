'use strict';

export function initAnimations() {
  const animateElements = document.querySelectorAll('.js-animate');

  if (!animateElements.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.style.opacity = '';
        entry.target.style.transform = '';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';

    observer.observe(el);
  });

  // Autoplay de vídeos quando entram no viewport
  const videos = document.querySelectorAll('video.card-preview');
  if (!videos.length) return;

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.play().catch(() => {});
      } else {
        entry.target.pause();
      }
    });
  }, { threshold: 0.3 });

  videos.forEach(video => videoObserver.observe(video));
}
