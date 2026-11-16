import { classifyLine } from './classifyLine';
import { renderChord } from './render';
import type { Key, KeyRegion, NotationStyle } from './types';

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
 * The key of a line: that of the last region starting at or before it. Lines
 * before the first region take the first region's key.
 */
function keyAt(regions: readonly KeyRegion[], line: number): Key | undefined {
  let key = regions[0]?.key;
  for (const region of regions) {
    if (region.startLine > line) break;
    key = region.key;
  }
  return key;
}

/**
 * Converts the chord lines of a sheet to number notation, in one key or in a
 * list of key regions sorted by `startLine` (as `detectKey` returns them):
 * each chord line is numbered in the key of the region that contains it.
 * Never detects the key; non-chord lines are returned byte-for-byte. An empty
 * region list names no key, so the sheet is returned unchanged.
 */
export function convert(
  sheet: string,
  key: Key | readonly KeyRegion[],
  style: NotationStyle,
): string {
  const regions: readonly KeyRegion[] =
    'tonic' in key ? [{ startLine: 0, key, reason: 'start' }] : key;
  if (regions.length === 0) return sheet;
  return sheet
    .split('\n')
    .map((line, index) => {
      const hasCr = line.endsWith('\r');
      const body = hasCr ? line.slice(0, -1) : line;
      const converted = convertLine(body, keyAt(regions, index)!, style);
      return hasCr ? converted + '\r' : converted;
    })
    .join('\n');
}
