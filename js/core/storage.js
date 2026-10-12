'use strict';

// localStorage lança SecurityError quando o navegador bloqueia dados do site:
// a leitura vira null e a escrita é ignorada (o valor vale só para a visita atual)
export function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // armazenamento bloqueado: segue sem persistir
  }
}
