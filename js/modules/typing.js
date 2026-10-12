'use strict';

import { REDUCED_MOTION } from '../core/env.js';

export function initTypingEffect() {
  const titleEl = document.querySelector('.hero-title');
  const descEl = document.querySelector('.hero-description');

  if (!titleEl || !descEl) return;

  if (REDUCED_MOTION) {
    titleEl.classList.add('is-revealed');
    descEl.classList.add('is-revealed');
    return;
  }

  const titleChars = splitIntoChars(titleEl);
  const descChars = splitIntoChars(descEl);

  setTimeout(() => {
    typeChars(titleChars, 60, () => {
      titleChars[titleChars.length - 1]?.classList.remove('is-caret');
      setTimeout(() => {
        typeChars(descChars, 40, () => {
          // O cursor pisca mais um pouco no fim e some
          setTimeout(() => descChars[descChars.length - 1]?.classList.remove('is-caret'), 1500);
        });
      }, 300);
    });
  }, 500);
}

// Cada letra vira um span invisível, então o texto já ocupa o espaço final e a digitação
// não mexe no layout. Leitores de tela recebem o texto inteiro numa cópia oculta.
function splitIntoChars(element) {
  const fullText = element.textContent.replace(/\s+/g, ' ').trim();

  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(...element.childNodes);

  const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  const chars = [];
  textNodes.forEach((node, i) => {
    let text = node.textContent.replace(/\s+/g, ' ');
    if (i === 0) text = text.trimStart();
    if (i === textNodes.length - 1) text = text.trimEnd();

    const fragment = document.createDocumentFragment();
    for (const char of text) {
      const span = document.createElement('span');
      span.className = 'typing-char';
      span.textContent = char;
      fragment.append(span);
      chars.push(span);
    }
    node.replaceWith(fragment);
  });

  const srText = document.createElement('span');
  srText.className = 'u-visually-hidden';
  srText.textContent = fullText;

  element.append(srText, visual);
  element.classList.add('is-revealed');
  return chars;
}

function typeChars(chars, speed, onDone) {
  let index = 0;

  function typeNext() {
    if (index >= chars.length) {
      onDone();
      return;
    }

    chars[index - 1]?.classList.remove('is-caret');
    chars[index].classList.add('is-typed', 'is-caret');
    index++;

    const variedSpeed = speed + (Math.random() - 0.5) * 30;
    setTimeout(typeNext, variedSpeed);
  }

  typeNext();
}
