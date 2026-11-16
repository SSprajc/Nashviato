import { classifyLine } from './classifyLine';
import { renderChord } from './render';
import type { Key, NotationStyle } from './types';

// Converted chords still replace source chords in place, spacing untouched;
// alignment is task group 6.

function convertLine(line: string, key: Key, style: NotationStyle): string {
  const classified = classifyLine(line);
  if (classified.kind === 'text') return line;
  let out = '';
  let copied = 0;
  for (const token of classified.tokens) {
    if (token.kind !== 'chord') continue;
    out += line.slice(copied, token.column) + renderChord(token.chord, key, style);
    copied = token.column + token.text.length;
  }
  return out + line.slice(copied);
}

/**
 * Converts the chord lines of a sheet to number notation in the given key.
 * Never detects the key; non-chord lines are returned byte-for-byte.
 */
export function convert(sheet: string, key: Key, style: NotationStyle): string {
  return sheet
    .split('\n')
    .map((line) => {
      const hasCr = line.endsWith('\r');
      const body = hasCr ? line.slice(0, -1) : line;
      const converted = convertLine(body, key, style);
      return hasCr ? converted + '\r' : converted;
    })
    .join('\n');
}
