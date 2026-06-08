'use strict';

import { initNav } from './modules/nav.js';
import { initAnimations } from './modules/animations.js';
import { initContact } from './modules/contact.js';
import { initLogo } from './modules/logo.js';
import { initTypingEffect } from './modules/typing.js';
import { initLinkFire, initContactFire } from './modules/link-fire.js';
import { initTheme } from './modules/theme.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initAnimations();
  initContact();
  initLogo();
  initTypingEffect();
  initLinkFire();
  initContactFire();
});