import { parseChord } from './parseChord';
import type { ParsedChord } from './types';

/**
 * One piece of a chord line. `column` is the UTF-16 offset where `text` starts.
 * Tokens never overlap and everything between them is whitespace. Two tokens
 * with no whitespace between them (`|C`, `(Am`, `G,`, `C-G`) are glued: they
 * came from one word of the source and must stay adjacent in the output.
 */
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

// At most two digits, so a chord diagram such as `x32010` is not a repeat count.
const REPEAT_COUNT = /^(?:\((?:[xX×]\d{1,2}|\d{1,2}[xX×])\)|[xX×]\d{1,2}|\d{1,2}[xX×])$/;
const NO_CHORD = ['N.C.', 'n.c.', 'N.C', 'NC'];
const MARKERS = new Set([...NO_CHORD, '|', '-', '–', '—', '%', '/', '.', '(', ')', '>', '→']);

// Bar lines, with optional repeat dots: `|`, `||`, `|:`, `:|`, `:||:`.
const BAR = /^:?\|{1,2}:?/;

// No chord or marker is longer than this; longer words are never decomposed.
const MAX_WORD = 48;

function isMarker(word: string): boolean {
  return MARKERS.has(word) || REPEAT_COUNT.test(word);
}

/** The header at the start of a line, or `null`: `[Chorus]`, `Intro:`, `Verse 2:`. */
export function matchHeader(line: string): { text: string; column: number; end: number } | null {
  const header = HEADER.exec(line);
  if (!header) return null;
  const text = header[1]!;
  // A label has letters; `|:` is a repeat bar, not a header.
  if (!/\p{L}/u.test(text)) return null;
  return { text, column: header[0].length - text.length, end: header[0].length };
}

/** The longest chord or no-chord marker that `rest` starts with. */
function leadingChord(rest: string): LineToken | null {
  for (let length = rest.length; length > 0; length--) {
    const text = rest.slice(0, length);
    if (NO_CHORD.includes(text)) return { kind: 'marker', text, column: 0 };
    const chord = parseChord(text);
    if (chord) return { kind: 'chord', text, column: 0, chord };
  }
  return null;
}

/**
 * Splits one word that is neither a chord nor a marker into glued tokens:
 * bar lines touching chords (`|C`, `G|`), wrapping parentheses (`(C`, `Am)`),
 * a trailing comma (`C,`), footnote stars (`C*`) and dash-joined chords
 * (`C-G-Am`). Returns `null` when the word is anything else.
 */
function splitWord(word: string, column: number): LineToken[] | null {
  if (word.length > MAX_WORD) return null;
  const tokens: LineToken[] = [];
  let at = 0;
  // What the previous piece was decides which decoration may follow.
  let previous: Piece = 'start';

  while (at < word.length) {
    const rest = word.slice(at);
    const piece = nextPiece(rest, previous);
    if (!piece) return null;
    tokens.push({ ...piece.token, column: column + at });
    at += piece.token.text.length;
    previous = piece.kind;
  }

  // An opening parenthesis or a dash must lead to a chord.
  return previous === 'open' || previous === 'dash' ? null : tokens;
}

type Piece = 'start' | 'bar' | 'open' | 'chord' | 'close' | 'comma' | 'star' | 'dash';

/** The piece that `rest` starts with, given what came before it in the word. */
function nextPiece(rest: string, previous: Piece): { token: LineToken; kind: Piece } | null {
  const marker = (text: string, kind: Piece) => ({
    token: { kind: 'marker' as const, text, column: 0 },
    kind,
  });

  if (previous !== 'dash') {
    const bar = BAR.exec(rest);
    if (bar) return marker(bar[0], 'bar');
    if (rest[0] === '(') return marker('(', 'open');
  }
  const chord = leadingChord(rest);
  if (chord) return { token: chord, kind: 'chord' };

  const afterChord = previous === 'chord' || previous === 'close' || previous === 'star';
  if (rest[0] === ')' && afterChord) return marker(')', 'close');
  if (rest[0] === ',' && afterChord) return marker(',', 'comma');
  if (rest[0] === '*' && previous === 'chord') return marker(/^\*+/.exec(rest)![0], 'star');
  if (rest[0] === '-' && previous === 'chord') return marker('-', 'dash');
  return null;
}

/**
 * Classifies one line (without its line terminator). A line is a chord line
 * only when, after an optional header, every word is a chord, an allowed
 * marker, or chords glued to allowed decoration, and at least one is a chord.
 */
export function classifyLine(line: string): ClassifiedLine {
  const tokens: LineToken[] = [];
  let rest = 0;

  const header = matchHeader(line);
  if (header) {
    if (METADATA_LABELS.has(header.text.toLowerCase())) return TEXT;
    tokens.push({ kind: 'header', text: header.text, column: header.column });
    rest = header.end;
  }

  const wordPattern = /\S+/g;
  wordPattern.lastIndex = rest;
  for (let match = wordPattern.exec(line); match; match = wordPattern.exec(line)) {
    const text = match[0];
    const column = match.index;
    if (isMarker(text)) {
      tokens.push({ kind: 'marker', text, column });
      continue;
    }
    const chord = parseChord(text);
    if (chord) {
      tokens.push({ kind: 'chord', text, column, chord });
      continue;
    }
    const pieces = splitWord(text, column);
    if (!pieces) return TEXT;
    tokens.push(...pieces);
  }

  return tokens.some((token) => token.kind === 'chord') ? { kind: 'chords', tokens } : TEXT;
}
