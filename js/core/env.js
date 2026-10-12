'use strict';

// Preferências e capacidades do dispositivo, lidas uma vez das media queries nativas
const matches = query => window.matchMedia(query).matches;

export const REDUCED_MOTION = matches('(prefers-reduced-motion: reduce)');
export const IS_TOUCH = matches('(hover: none) and (pointer: coarse)');
