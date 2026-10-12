'use strict';

// Autoplay dos vídeos de projeto enquanto estão na tela (o main.js só carrega este módulo sem
// prefers-reduced-motion). Um vídeo pausado pela pessoa nos controles não volta a tocar sozinho.
export function initVideoAutoplay() {
  const videos = document.querySelectorAll('video.card-preview');
  if (!videos.length) return;

  const pausedByScroll = new WeakSet();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) {
        if (!video.dataset.userPaused) video.play().catch(() => {});
      } else if (!video.paused) {
        pausedByScroll.add(video);
        video.pause();
      }
    });
  }, { threshold: 0.3 });

  videos.forEach(video => {
    video.addEventListener('pause', () => {
      if (pausedByScroll.delete(video)) return;
      video.dataset.userPaused = 'true';
    });
    video.addEventListener('play', () => {
      delete video.dataset.userPaused;
    });
    observer.observe(video);
  });
}
