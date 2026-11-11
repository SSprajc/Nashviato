import { parseChord } from './parseChord';
import type { Key, Letter, NotationStyle } from './types';

// Walking skeleton (task 1.2). Deliberately narrow:
// - tokens are parsed by `parseChord`, but only natural roots without a slash
//   bass convert; the suffix is copied verbatim;
// - a line converts only if every token is such a chord whose root is on the
//   major scale of the tonic; anything else passes through unchanged;
// - converted tokens replace source tokens in place, spacing untouched.
// Classification, accidentals, slash basses and alignment are groups 3-6.

const LETTER_PITCH: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Per style: semitones above the tonic -> degree numeral, for tones of the major scale. */
const NUMERALS: Record<NotationStyle, Record<number, string>> = {
  roman: { 0: 'I', 2: 'II', 4: 'III', 5: 'IV', 7: 'V', 9: 'VI', 11: 'VII' },
};

function convertToken(token: string, key: Key, style: NotationStyle): string | null {
  const chord = parseChord(token);
  if (!chord || chord.root.accidental !== 0 || chord.bass) return null;
  const pitch = LETTER_PITCH[chord.root.letter];
  const numeral = NUMERALS[style][(pitch - key.tonic + 12) % 12];
  return numeral === undefined ? null : numeral + chord.suffix;
}

function convertLine(line: string, key: Key, style: NotationStyle): string {
  // Odd indices are the whitespace runs captured by the split.
  const parts = line.split(/(\s+)/);
  let chordCount = 0;
  for (let i = 0; i < parts.length; i += 2) {
    const token = parts[i]!;
    if (token === '') continue;
    const converted = convertToken(token, key, style);
    if (converted === null) return line;
    parts[i] = converted;
    chordCount++;
  }
  return chordCount === 0 ? line : parts.join('');
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
