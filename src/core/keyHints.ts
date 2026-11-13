import { notePitch } from './pitch';
import type { Key, Letter, Mode, Note } from './types';

// `Key: G`, `Key of Bb`, `Tonality: Em`, `Key - A`, `Key change: D`,
// `New key: D`, `Original key: C`, optionally opened by a bracket.
const LABEL =
  /^\s*[[(]?\s*(?:(?:original|new)\s+)?(?:key|tonality)(?:\s+change)?(?:\s+(?:of|to|is|in))?\s*[:=–-]?\s*/i;

// The note is case-sensitive: `Am` is A minor and `AM` is A major.
const NOTE = /^([A-G])([#b♯♭]?)/;
const GLUED = /^[A-Za-z0-9#♯♭]+/;
const NEXT_WORD = /^[\s-]+([A-Za-z]+)/;

function wordMode(word: string): Mode | null {
  if (/^min(?:or)?$/i.test(word)) return 'minor';
  if (/^maj(?:or)?$/i.test(word)) return 'major';
  return null;
}

/** The key stated on a line, or `null` when the line states none. */
export function parseKeyHint(line: string): Key | null {
  const label = LABEL.exec(line);
  if (!label) return null;
  let rest = line.slice(label[0].length);
  const note = NOTE.exec(rest);
  if (!note) return null;
  rest = rest.slice(note[0].length);

  let accidental: Note['accidental'] = note[2] === '' ? 0 : /[#♯]/.test(note[2]!) ? 1 : -1;
  let mode: Mode = 'major';

  // Characters glued to the note must spell a mode: `Am`, `AM`, `Amin`.
  // Anything else (`Key of Dreams`) means this is not a key hint.
  const glued = GLUED.exec(rest);
  if (glued) {
    const word = glued[0];
    const spelled = word === 'm' ? 'minor' : word === 'M' ? 'major' : wordMode(word);
    if (!spelled) return null;
    mode = spelled;
  } else {
    // Separate words: `A flat`, `B minor`, `F sharp minor`. Other words are ignored.
    let next = NEXT_WORD.exec(rest);
    if (next && accidental === 0 && /^(?:flat|sharp)$/i.test(next[1]!)) {
      accidental = next[1]!.toLowerCase() === 'sharp' ? 1 : -1;
      rest = rest.slice(next[0].length);
      next = NEXT_WORD.exec(rest);
    }
    if (next) mode = wordMode(next[1]!) ?? 'major';
  }

  return { tonic: notePitch({ letter: note[1] as Letter, accidental }), mode };
}

const CAPO = /\bcapo\b[^0-9]{0,16}?(\d{1,2})(?!\d)/i;

/** The capo fret stated on a line (1 to 11), or `null`. */
export function parseCapo(line: string): number | null {
  const match = CAPO.exec(line);
  if (!match) return null;
  const fret = Number(match[1]);
  return fret >= 1 && fret <= 11 ? fret : null;
}
