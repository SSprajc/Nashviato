import { parseChord } from './parseChord';
import type { ParsedChord } from './types';

/** One piece of a chord line. `column` is the UTF-16 offset where `text` starts. */
export type LineToken =
  | { kind: 'header'; text: string; column: number }
  | { kind: 'marker'; text: string; column: number }
  | { kind: 'chord'; text: string; column: number; chord: ParsedChord };

/** A `text` line passes through byte-for-byte; a `chords` line is converted. */
export type ClassifiedLine = { kind: 'text' } | { kind: 'chords'; tokens: LineToken[] };

const TEXT: ClassifiedLine = { kind: 'text' };

// A header is a bracketed label (`[Verse 1]`), or one word with an optional
// number, ending in a colon (`Intro:`, `Verse 1:`). Anything looser would let
// ordinary sentences that end in a chord-like word be converted.
const HEADER = /^\s*(\[[^\]]*\]|[^\s:[\]]+(?: \d+)?:)(?=\s|$)/;

// Labels whose values name notes or positions, not chords to be numbered.
const METADATA_LABELS = new Set(['key:', 'tonality:', 'tuning:', 'capo:']);

const REPEAT_COUNT = /^(?:\((?:[xX]\d+|\d+[xX])\)|[xX]\d+|\d+[xX])$/;
const MARKERS = new Set(['N.C.', '|', '-', '%', '/']);

function isMarker(token: string): boolean {
  return MARKERS.has(token) || REPEAT_COUNT.test(token);
}

/**
 * Classifies one line (without its line terminator). A line is a chord line
 * only when, after an optional header, every token is a chord or an allowed
 * marker and at least one is a chord.
 */
export function classifyLine(line: string): ClassifiedLine {
  const tokens: LineToken[] = [];
  let rest = 0;

  const header = HEADER.exec(line);
  if (header) {
    const text = header[1]!;
    if (METADATA_LABELS.has(text.toLowerCase())) return TEXT;
    tokens.push({ kind: 'header', text, column: header[0].length - text.length });
    rest = header[0].length;
  }

  let chordCount = 0;
  const tokenPattern = /\S+/g;
  tokenPattern.lastIndex = rest;
  for (let match = tokenPattern.exec(line); match; match = tokenPattern.exec(line)) {
    const text = match[0];
    const column = match.index;
    if (isMarker(text)) {
      tokens.push({ kind: 'marker', text, column });
      continue;
    }
    const chord = parseChord(text);
    if (!chord) return TEXT;
    tokens.push({ kind: 'chord', text, column, chord });
    chordCount++;
  }

  return chordCount === 0 ? TEXT : { kind: 'chords', tokens };
}
