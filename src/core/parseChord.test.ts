import { describe, expect, it } from 'vitest';
import { parseChord } from './parseChord';
import type { Letter, Note, ParsedChord } from './types';

const note = (letter: Letter, accidental: Note['accidental'] = 0): Note => ({ letter, accidental });

const chord = (root: Note, suffix = '', bass?: Note): ParsedChord =>
  bass === undefined ? { root, suffix } : { root, suffix, bass };

describe('parseChord: spec scenarios (Chord token grammar)', () => {
  it('Extended chord parses', () => {
    const parsed = parseChord('F#m7b5');
    expect(parsed).toEqual(chord(note('F', 1), 'm7b5'));
    expect(parsed?.bass).toBeUndefined();
  });

  it('Slash chord parses', () => {
    expect(parseChord('D/F#')).toEqual(chord(note('D'), '', note('F', 1)));
  });

  it('Parenthesised suffix parses', () => {
    expect(parseChord('C(add9)')).toEqual(chord(note('C'), '(add9)'));
  });

  it.each(['Dad', 'Be', 'Hm', 'Hello'])('Ordinary words are not chords: %s', (token) => {
    expect(parseChord(token)).toBeNull();
  });

  it('Symbol qualities parse', () => {
    expect(parseChord('C°7')).toEqual(chord(note('C'), '°7'));
    expect(parseChord('Bø7')).toEqual(chord(note('B'), 'ø7'));
    expect(parseChord('FΔ7')).toEqual(chord(note('F'), 'Δ7'));
    expect(parseChord('A-7')).toEqual(chord(note('A'), '-7'));
  });

  it('Alterations in parentheses parse', () => {
    expect(parseChord('G7(b9,#11)/B')).toEqual(chord(note('G'), '7(b9,#11)', note('B')));
  });

  it('Six-nine is a suffix', () => {
    expect(parseChord('C6/9/E')).toEqual(chord(note('C'), '6/9', note('E')));
  });

  it.each(['Emma', 'Go', 'Do', 'C-'])(
    'Loose spellings that make words are rejected: %s',
    (token) => {
      expect(parseChord(token)).toBeNull();
    },
  );
});

describe('parseChord: accept table', () => {
  const ACCEPT: ReadonlyArray<readonly [token: string, expected: ParsedChord]> = [
    // Bare roots: every letter, each accidental spelling.
    ['A', chord(note('A'))],
    ['B', chord(note('B'))],
    ['C', chord(note('C'))],
    ['D', chord(note('D'))],
    ['E', chord(note('E'))],
    ['F', chord(note('F'))],
    ['G', chord(note('G'))],
    ['C#', chord(note('C', 1))],
    ['Bb', chord(note('B', -1))],
    ['Ab', chord(note('A', -1))],
    ['F♯', chord(note('F', 1))],
    ['E♭', chord(note('E', -1))],
    // Spellings that are enharmonic to a natural are still valid roots.
    ['Cb', chord(note('C', -1))],
    ['Fb', chord(note('F', -1))],
    ['E#', chord(note('E', 1))],
    ['B#', chord(note('B', 1))],

    // Suffixes are copied verbatim, including case.
    ['Am', chord(note('A'), 'm')],
    ['G7', chord(note('G'), '7')],
    ['Dm7', chord(note('D'), 'm7')],
    ['Fmaj7', chord(note('F'), 'maj7')],
    ['CM7', chord(note('C'), 'M7')],
    ['Cmaj', chord(note('C'), 'maj')],
    ['C6', chord(note('C'), '6')],
    ['Am6', chord(note('A'), 'm6')],
    ['D9', chord(note('D'), '9')],
    ['Em9', chord(note('E'), 'm9')],
    ['Gmaj9', chord(note('G'), 'maj9')],
    ['A11', chord(note('A'), '11')],
    ['G13', chord(note('G'), '13')],
    ['E5', chord(note('E'), '5')],
    ['D2', chord(note('D'), '2')],
    ['Asus', chord(note('A'), 'sus')],
    ['Dsus2', chord(note('D'), 'sus2')],
    ['Gsus4', chord(note('G'), 'sus4')],
    ['A7sus4', chord(note('A'), '7sus4')],
    ['Bdim', chord(note('B'), 'dim')],
    ['Bdim7', chord(note('B'), 'dim7')],
    ['Caug', chord(note('C'), 'aug')],
    ['C+', chord(note('C'), '+')],
    ['Cadd9', chord(note('C'), 'add9')],
    ['Dadd9', chord(note('D'), 'add9')],
    ['Emadd9', chord(note('E'), 'madd9')],
    ['Fadd11', chord(note('F'), 'add11')],
    ['E7#9', chord(note('E'), '7#9')],
    ['G7b9', chord(note('G'), '7b9')],
    ['C7#5', chord(note('C'), '7#5')],
    ['Cmaj7#11', chord(note('C'), 'maj7#11')],
    ['AmMaj7', chord(note('A'), 'mMaj7')],
    ['Am(maj7)', chord(note('A'), 'm(maj7)')],
    ['G7(b9)', chord(note('G'), '7(b9)')],

    // Accidental root followed by a suffix.
    ['F#m', chord(note('F', 1), 'm')],
    ['Bbmaj7', chord(note('B', -1), 'maj7')],
    ['C#m7', chord(note('C', 1), 'm7')],
    ['Ebsus4', chord(note('E', -1), 'sus4')],
    ['B♭m', chord(note('B', -1), 'm')],
    ['F♯m7b5', chord(note('F', 1), 'm7b5')],
    // A flat root whose suffix itself starts with an accidental.
    ['Bbb5', chord(note('B', -1), 'b5')],

    // Slash chords: bass in root syntax.
    ['G/B', chord(note('G'), '', note('B'))],
    ['C/E', chord(note('C'), '', note('E'))],
    ['Am/G', chord(note('A'), 'm', note('G'))],
    ['Am7/G', chord(note('A'), 'm7', note('G'))],
    ['C/Bb', chord(note('C'), '', note('B', -1))],
    ['Bb/D', chord(note('B', -1), '', note('D'))],
    ['F#m7/C#', chord(note('F', 1), 'm7', note('C', 1))],
    ['Cmaj7/E', chord(note('C'), 'maj7', note('E'))],
    ['C(add9)/E', chord(note('C'), '(add9)', note('E'))],
    ['D/F♯', chord(note('D'), '', note('F', 1))],
    ['E♭/G', chord(note('E', -1), '', note('G'))],
    ['Bb/A♭', chord(note('B', -1), '', note('A', -1))],

    // `6/9` is a suffix, not a slash bass.
    ['C6/9', chord(note('C'), '6/9')],
    ['Dm6/9', chord(note('D'), 'm6/9')],
    ['C6/9/E', chord(note('C'), '6/9', note('E'))],
  ];

  it.each(ACCEPT)('parses %s', (token, expected) => {
    expect(parseChord(token)).toEqual(expected);
  });
});

describe('parseChord: reject table', () => {
  const REJECT: ReadonlyArray<readonly [token: string, why: string]> = [
    ['', 'empty token'],

    // German notation is out of scope.
    ['H', 'H is not a root'],
    ['H7', 'H is not a root'],
    ['Hm', 'H is not a root'],
    ['C/H', 'H is not a bass'],

    // Roots are upper case.
    ['a', 'lower-case root'],
    ['am', 'lower-case root'],
    ['c#m', 'lower-case root'],

    // Words that start with a note letter.
    ['Dad', 'word'],
    ['Be', 'word'],
    ['Hello', 'word'],
    ['Add', 'word'],
    ['Bad', 'word'],
    ['Bed', 'word'],
    ['Cab', 'word'],
    ['Ace', 'word'],
    ['Age', 'word'],
    ['Egg', 'word'],
    ['Ebb', 'word'],
    ['Abba', 'word'],
    ['Face', 'word'],
    ['Fade', 'word'],
    ['Dead', 'word'],
    ['Cage', 'word'],
    ['Go', 'word'],
    ['Do', 'word'],
    ['Feel', 'word'],
    ['Free', 'word'],
    ['Gone', 'word'],
    ['Baby', 'word'],
    ['Dream', 'word'],
    ['Calm', 'word'],
    ['Emma', 'word'],
    ['Dim', 'word, not D plus a suffix'],
    ['Aug', 'word, not A plus a suffix'],
    ['Amen', 'word starting with a valid chord'],
    ['Am7th', 'trailing letters after a valid chord'],
    // Section names that start with a note letter.
    ['Bridge', 'section name'],
    ['Chorus', 'section name'],
    ['Coda', 'section name'],
    ['End', 'section name'],
    ['Bass', 'section name'],

    // Other alphabets and symbols.
    ['I', 'not a note letter'],
    ['X', 'not a note letter'],
    ['7', 'no root'],
    ['m7', 'no root'],
    ['#', 'no root'],
    ['N.C.', 'marker, not a chord'],
    ['|', 'marker, not a chord'],
    ['%', 'marker, not a chord'],
    ['x2', 'marker, not a chord'],

    // Double accidentals are not root syntax.
    ['C##', 'double sharp'],
    ['Bbb', 'double flat'],
    ['C#b', 'mixed accidentals'],

    // Malformed slash chords.
    ['C/X', 'bass is not a note'],
    ['C/', 'empty bass'],
    ['/C', 'no root'],
    ['/', 'no root'],
    ['C//E', 'empty segment'],
    ['C/g', 'lower-case bass'],
    ['C/Em', 'bass carries a suffix'],
    ['C/E/G', 'two basses'],
    ['C/F##', 'double-sharp bass'],

    // Decoration around a chord belongs to other input formats.
    ['[C]', 'ChordPro brackets'],
    ['(C)', 'wrapped in parentheses'],
    ['C,', 'trailing punctuation'],
    ['C.', 'trailing punctuation'],
    ['C:', 'trailing punctuation'],
    ['C|', 'bar line glued to chord'],
    ['C-G', 'two chords joined by a dash'],
    ['C(add9', 'unbalanced parenthesis'],
    ['Cadd9)', 'unbalanced parenthesis'],
    [' C', 'leading whitespace'],
    ['C ', 'trailing whitespace'],
    ['C G', 'two tokens'],
  ];

  it.each(REJECT)('rejects %j (%s)', (token) => {
    expect(parseChord(token)).toBeNull();
  });
});
