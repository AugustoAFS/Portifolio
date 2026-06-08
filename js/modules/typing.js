'use strict';

export function initTypingEffect() {
  const titleEl = document.querySelector('.hero-title');
  const descEl = document.querySelector('.hero-description');

  if (!titleEl || !descEl) return;

  const titleContent = titleEl.innerHTML.replace(/\s+/g, ' ').trim();
  const descText = descEl.innerHTML.replace(/\s+/g, ' ').trim();

  titleEl.innerHTML = '';
  descEl.innerHTML = '';
  
  const createCursor = () => {
    const cursor = document.createElement('span');
    cursor.textContent = '|';
    cursor.style.color = 'var(--color-primary-base)';
    cursor.style.animation = 'blink 1s step-end infinite';
    return cursor;
  }

  if (!document.getElementById('typing-styles')) {
    const style = document.createElement('style');
    style.id = 'typing-styles';
    style.innerHTML = `@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
    document.head.appendChild(style);
  }

  function typeHTML(element, htmlString, speed, callback) {
    let index = 0;
    let currentHTML = "";
    const cursor = createCursor();
    element.style.visibility = 'visible';
    
    function type() {
      if (index < htmlString.length) {
        if (htmlString.charAt(index) === '<') {
          const closeBracket = htmlString.indexOf('>', index);
          if (closeBracket !== -1) {
            currentHTML += htmlString.substring(index, closeBracket + 1);
            index = closeBracket + 1;
            type();
            return;
          }
        }
        currentHTML += htmlString.charAt(index);
        element.innerHTML = currentHTML;
        element.appendChild(cursor);
        index++;
        
        const variedSpeed = speed + (Math.random() - 0.5) * 30;
        setTimeout(type, variedSpeed);
      } else {
        element.removeChild(cursor);
        if (callback) callback();
      }
    }
    
    element.appendChild(cursor);
    setTimeout(type, speed);
  }

  setTimeout(() => {
    typeHTML(titleEl, titleContent, 60, () => {
      setTimeout(() => {
        typeHTML(descEl, descText, 40, () => {
          const finalCursor = createCursor();
          descEl.appendChild(finalCursor);
          setTimeout(() => finalCursor.remove(), 1500); // O cursor pisca algumas vezes e some
        });
      }, 300);
    });
  }, 500);
}
