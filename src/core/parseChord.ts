import type { Letter, Note, ParsedChord } from './types';

const ROOT = '([A-G])([#b♯♭]?)';
const ACCIDENTAL = '[#b♯♭]';

// The suffix is copied verbatim, but it must be built from chord vocabulary so
// that words such as `Dad`, `Be` or `Amen` are not read as root plus suffix.
// Longer alternatives come first so `maj` is not consumed as `m` + `aj`.
// Three items are deliberately narrow because the loose form makes words:
// `ma` needs a number (`Emma`), `o` needs a 7 (`Go`, `Do`), and `-` needs a
// number (`C-G` is two chords, `G-man` is a word).
const SUFFIX_ITEM = [
  'maj|Maj|MAJ|ma(?=\\d)|min|Min|mi|dim|aug|sus|alt|M|m|\\+|-(?=\\d)', // quality
  '[°ºøØΔ△]|o(?=7)', // quality symbols
  `add${ACCIDENTAL}?(?:2|4|6|9|11|13)`, // added tone
  '(?:no|omit)[35]', // omitted tone
  `${ACCIDENTAL}(?:5|6|9|11|13)`, // alteration
  '6\\/9', // the one suffix that contains a slash
  '13|11|[245679]', // extension
].join('|');

const ITEMS = `(?:${SUFFIX_ITEM})+`;
const PARENTHESISED = `\\(${ITEMS}(?:,${ITEMS})*\\)`;
const SUFFIX = `((?:${SUFFIX_ITEM}|${PARENTHESISED})*)`;

const CHORD = new RegExp(`^${ROOT}${SUFFIX}(?:\\/${ROOT})?$`);

function toNote(letter: string, accidental: string): Note {
  return {
    letter: letter as Letter,
    accidental: accidental === '' ? 0 : accidental === '#' || accidental === '♯' ? 1 : -1,
  };
}

/**
 * Parses a single whitespace-delimited token as a chord.
 * Returns `null` when the token is not a chord.
 */
export function parseChord(token: string): ParsedChord | null {
  const match = CHORD.exec(token);
  if (!match) return null;
  const [, rootLetter = '', rootAccidental = '', suffix = '', bassLetter, bassAccidental = ''] =
    match;
  const root = toNote(rootLetter, rootAccidental);
  return bassLetter === undefined
    ? { root, suffix }
    : { root, suffix, bass: toNote(bassLetter, bassAccidental) };
}
