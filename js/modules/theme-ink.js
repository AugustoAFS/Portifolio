'use strict';

import { whenIdle } from '../core/lazy.js';
import { setThemeTransition } from './theme.js';

// Troca de tema com mancha de tinta: o tema novo aparece por uma mancha que nasce no botão e cobre a página.
// Os quadros da mancha saem de um Web Worker (js/workers/ink-mask.js) enquanto a página está ociosa, então
// gerá-los não pesa na thread principal. O clique nunca espera: sem mancha pronta (ou se a tela mudou de
// formato desde que ela foi gerada), a troca usa o cross-fade e uma mancha nova é pedida.

const INK_CLASS = 'is-ink-transition';
const DURATION = 900;

// Num PC comum (Core i5 de 12ª geração) a mancha sai em ~300 ms, e com a CPU até 4× mais lenta a troca com
// tinta pesa o mesmo que o cross-fade; acima disso, cada passo da máscara (que repinta a camada da transição)
// começa a custar quadros. Aparelho que leva mais que isto duas vezes seguidas fica no cross-fade pela visita.
const SLOW_DEVICE_MS = 1200;

// Quanto a tela pode mudar sem gerar outra mancha (a barra do navegador do celular aparecendo, por exemplo)
const ASPECT_TOLERANCE = 0.12;
const ORIGIN_TOLERANCE = 0.04;

let worker = null;
let pending = false;
let ready = null;
let active = null;
let slowRuns = 0;

export function initThemeInk() {
  const button = document.querySelector('.js-theme-toggle');
  if (!button || !isSupported()) return;

  worker = new Worker(new URL('../workers/ink-mask.js', import.meta.url));
  worker.addEventListener('message', event => receiveInk(event.data));
  worker.addEventListener('error', stopWorker);

  // Se a tela mudou desde a última mancha, o mouse ou o foco chegando ao botão já pedem outra
  button.addEventListener('pointerenter', () => refreshInk(button));
  button.addEventListener('focus', () => refreshInk(button));

  requestInk(button);
  setThemeTransition(startInk);
}

function isSupported() {
  return typeof Worker === 'function' &&
    typeof OffscreenCanvas === 'function' &&
    typeof document.startViewTransition === 'function' &&
    'adoptedStyleSheets' in document &&
    CSS.supports('mask-image', 'none');
}

// Durante uma troca o worker não gera nada, para não disputar CPU com a animação
function requestInk(button) {
  if (!worker || pending || ready || active) return;
  pending = true;
  worker.postMessage(currentGeometry(button));
}

// Tudo o que a troca usa fica pronto antes do clique: o PNG decodificado (o primeiro quadro não pisca) e
// a folha de estilo com a máscara. A URL da máscara só existe em tempo de execução e vai nessa folha, que
// só vale para o pseudo-elemento da transição: uma variável no <html> seria herdada pela página inteira
// e forçaria o recálculo de todo o estilo (cerca de 50 ms em CPU lenta, duas vezes por troca).
// O pedido só termina quando a mancha está pronta (ou foi recusada): até lá, nenhum outro sai para o worker.
async function receiveInk({ blob, elapsed, ...sprite }) {
  if (!blob) {
    stopWorker();
    return;
  }

  // Uma geração lenta pode ser só a máquina ocupada naquela hora; duas seguidas, o aparelho é lento mesmo.
  // A próxima é pedida quando o mouse, o foco ou um clique voltarem ao botão.
  if (elapsed > SLOW_DEVICE_MS) {
    slowRuns++;
    if (slowRuns >= 2) stopWorker();
    else pending = false;
    return;
  }
  slowRuns = 0;

  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.src = url;

  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(url);
    pending = false;
    return;
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`:root::view-transition-new(root) {
    mask-image: url("${url}");
    mask-size: ${sprite.columns * 100}% ${sprite.rows * 100}%;
  }`);
  if (ready) discardInk();
  ready = { ...sprite, url, image, sheet, keyframes: spriteKeyframes(sprite) };
  pending = false;
}

function refreshInk(button) {
  if (ready && !fitsScreen(ready.geometry, currentGeometry(button))) discardInk();
  requestInk(button);
}

function discardInk() {
  URL.revokeObjectURL(ready.url);
  ready = null;
}

// Sem worker (erro ou sem suporte a canvas nele), a troca fica no cross-fade de vez
function stopWorker() {
  worker?.terminate();
  worker = null;
  pending = false;
}

// Chamada pelo theme.js na troca: true quando a mancha assume a transição
function startInk(apply, button) {
  if (active) return false;
  if (ready && !fitsScreen(ready.geometry, currentGeometry(button))) discardInk();
  if (!ready) {
    whenIdle(() => requestInk(button));
    return false;
  }

  const ink = ready;
  ready = null;

  const root = document.documentElement;
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ink.sheet];
  root.classList.add(INK_CLASS);

  const transition = document.startViewTransition(apply);
  active = transition;

  transition.ready
    .then(() => root.animate(ink.keyframes, {
      duration: DURATION,
      fill: 'both',
      pseudoElement: '::view-transition-new(root)',
    }))
    .catch(() => {});

  transition.finished.finally(() => {
    active = null;
    root.classList.remove(INK_CLASS);
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(sheet => sheet !== ink.sheet);
    URL.revokeObjectURL(ink.url);
    whenIdle(() => requestInk(button));
  });

  return true;
}

function currentGeometry(button) {
  const box = button.getBoundingClientRect();
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    originX: box.left + box.width / 2,
    originY: box.top + box.height / 2,
  };
}

function fitsScreen(prepared, current) {
  const aspect = (prepared.width / prepared.height) / (current.width / current.height);
  return Math.abs(aspect - 1) <= ASPECT_TOLERANCE &&
    Math.abs(prepared.originX / prepared.width - current.originX / current.width) <= ORIGIN_TOLERANCE &&
    Math.abs(prepared.originY / prepared.height - current.originY / current.height) <= ORIGIN_TOLERANCE;
}

// Uma posição de máscara por quadro do sprite, sem interpolar entre elas (step-end)
function spriteKeyframes({ frames, columns, rows }) {
  const percent = (cell, cells) => (cells > 1 ? (cell / (cells - 1)) * 100 : 0);
  const position = index => `${percent(index % columns, columns)}% ${percent(Math.floor(index / columns), rows)}%`;
  const keyframes = [];

  for (let index = 0; index < frames; index++) {
    keyframes.push({ offset: index / frames, maskPosition: position(index), easing: 'step-end' });
  }
  keyframes.push({ offset: 1, maskPosition: position(frames - 1) });
  return keyframes;
}
