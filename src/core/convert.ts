import { classifyLine } from './classifyLine';
import type { Key, Letter, NotationStyle, ParsedChord } from './types';

// Still narrow in two places until later task groups:
// - only natural roots without a slash bass, on the major scale of the tonic,
//   convert; a chord line holding any other chord passes through unchanged
//   (accidentals and slash basses are group 4);
// - converted chords replace source chords in place, spacing untouched
//   (alignment is group 6).

const LETTER_PITCH: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Per style: semitones above the tonic -> degree numeral, for tones of the major scale. */
const NUMERALS: Record<NotationStyle, Record<number, string>> = {
  roman: { 0: 'I', 2: 'II', 4: 'III', 5: 'IV', 7: 'V', 9: 'VI', 11: 'VII' },
};

function convertChord(chord: ParsedChord, key: Key, style: NotationStyle): string | null {
  if (chord.root.accidental !== 0 || chord.bass) return null;
  const pitch = LETTER_PITCH[chord.root.letter];
  const numeral = NUMERALS[style][(pitch - key.tonic + 12) % 12];
  return numeral === undefined ? null : numeral + chord.suffix;
}

function convertLine(line: string, key: Key, style: NotationStyle): string {
  const classified = classifyLine(line);
  if (classified.kind === 'text') return line;
  let out = '';
  let copied = 0;
  for (const token of classified.tokens) {
    if (token.kind !== 'chord') continue;
    const converted = convertChord(token.chord, key, style);
    if (converted === null) return line;
    out += line.slice(copied, token.column) + converted;
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
