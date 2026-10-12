'use strict';

// Roda uma inicialização isolada: um módulo com erro não derruba os outros
export function run(init) {
  try {
    init();
  } catch (error) {
    console.error(`[${init.name}]`, error);
  }
}

// Baixa o módulo só quando é chamado (import() dinâmico nativo) e roda a função de init indicada
export function load(importModule, initName) {
  return importModule()
    .then(module => run(module[initName]))
    .catch(error => console.error(`[${initName}]`, error));
}

// Logo depois da próxima pintura: o conteúdo (e a foto do LCP) aparece antes do JS rodar
export function afterFirstPaint(callback) {
  requestAnimationFrame(() => setTimeout(callback, 0));
}

// Quando o navegador estiver ocioso (requestIdleCallback; sem suporte, um pequeno atraso)
export function whenIdle(callback, timeout = 2000) {
  if ('requestIdleCallback' in window) requestIdleCallback(() => callback(), { timeout });
  else setTimeout(callback, 300);
}

// Uma única vez, quando o elemento chega perto da área visível
export function whenVisible(target, callback, rootMargin = '0px') {
  const element = resolve(target);
  if (!element) return;

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    callback(element);
  }, { rootMargin });

  observer.observe(element);
}

// Uma única vez, no primeiro ponteiro (mouse ou caneta) que entra no elemento
export function onFirstPointer(target, callback) {
  const element = resolve(target);
  element?.addEventListener('pointerenter', () => callback(element), { once: true });
}

function resolve(target) {
  return typeof target === 'string' ? document.querySelector(target) : target;
}
