import { classifyLine } from './classifyLine';
import { renderChord } from './render';
import type { Key, KeyRegion, NotationStyle } from './types';

/**
 * Converts one line. On a chord line every token keeps its source column when
 * it can: a unit (a run of glued tokens, such as `|C` or `Am-G`) starts at the
 * source column of its first token, or exactly one space after the previous
 * unit when the output has already reached that column. A gap that contains a
 * tab is copied as written, because tab stops cannot be shifted by a column;
 * columns are then counted afresh from the unit after it.
 */
function convertLine(line: string, key: Key, style: NotationStyle): string {
  const classified = classifyLine(line);
  if (classified.kind === 'text') return line;

  let out = '';
  // Where the previous token ended in the source.
  let sourceEnd = 0;
  // Output column minus source column for a unit that has not been shifted.
  let offset = 0;

  for (const token of classified.tokens) {
    const text = token.kind === 'chord' ? renderChord(token.chord, key, style) : token.text;
    const gap = line.slice(sourceEnd, token.column);
    sourceEnd = token.column + token.text.length;

    // No gap: the token is glued to the one before it (or starts the line).
    if (gap !== '') {
      const target = token.column + offset;
      if (gap.includes('\t')) {
        out += gap;
        offset = out.length - token.column;
      } else if (out.length + gap.length === target) {
        // Nothing before this unit moved: keep the gap exactly as written.
        out += gap;
      } else if (out.length < target) {
        out += ' '.repeat(target - out.length);
      } else {
        out += ' ';
      }
    }
    out += text;
  }
  return out + line.slice(sourceEnd);
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
