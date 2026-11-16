import type { NotationStyle } from '../core/types';

// Everything the app remembers between visits lives here, in localStorage.
// Storage can be missing or refuse writes (private mode, quota); the app then
// simply starts fresh, so every access is guarded.

const STYLE_KEY = 'nashviato.style';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Nothing to do: the value just will not survive a reload.
  }
}

export function loadStyle(): NotationStyle {
  return read(STYLE_KEY) === 'arabic' ? 'arabic' : 'roman';
}

export function saveStyle(style: NotationStyle): void {
  write(STYLE_KEY, style);
}
