'use strict';

// Preferências e capacidades do dispositivo, lidas uma vez das media queries nativas
const matches = query => window.matchMedia(query).matches;

export const REDUCED_MOTION = matches('(prefers-reduced-motion: reduce)');
export const IS_TOUCH = matches('(hover: none) and (pointer: coarse)');

// Aparelho fraco (até 2 núcleos ou até 2 GB de memória): efeitos que não são essenciais ficam de fora.
// deviceMemory só existe no Chromium; nos outros navegadores vale só a contagem de núcleos.
export const LOW_POWER = (navigator.hardwareConcurrency || 4) <= 2 || (navigator.deviceMemory || 4) <= 2;
