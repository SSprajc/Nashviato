import { describe, expect, it } from 'vitest';
import { classifyLine } from './classifyLine';
import { parseChord } from './parseChord';

type Shape = readonly [kind: 'header' | 'marker' | 'chord', text: string, column: number];

/** Tokens of a chord line as `[kind, text, column]`, or `null` for a pass-through line. */
function shape(line: string): Shape[] | null {
  const classified = classifyLine(line);
  if (classified.kind === 'text') return null;
  return classified.tokens.map((token) => [token.kind, token.text, token.column] as const);
}

describe('classifyLine: spec scenarios (Line classification)', () => {
  it('Chord line is converted', () => {
    expect(shape('C   G   Am  F')).toEqual([
      ['chord', 'C', 0],
      ['chord', 'G', 4],
      ['chord', 'Am', 8],
      ['chord', 'F', 12],
    ]);
  });

  it('Lyric line containing chord-like words is unchanged', () => {
    expect(shape('A Dad and a G-man')).toBeNull();
  });

  it('Single chord on a line is a chord line', () => {
    expect(shape('Am')).toEqual([['chord', 'Am', 0]]);
  });

  it('Header with trailing chords', () => {
    expect(shape('Intro: G  D  Em  C')).toEqual([
      ['header', 'Intro:', 0],
      ['chord', 'G', 7],
      ['chord', 'D', 10],
      ['chord', 'Em', 13],
      ['chord', 'C', 17],
    ]);
  });

  it('Tab line is unchanged', () => {
    expect(shape('e|---3---2---0---|')).toBeNull();
  });

  it('Markers pass through', () => {
    expect(shape('| C  | N.C. | G  x2')).toEqual([
      ['marker', '|', 0],
      ['chord', 'C', 2],
      ['marker', '|', 5],
      ['marker', 'N.C.', 7],
      ['marker', '|', 12],
      ['chord', 'G', 14],
      ['marker', 'x2', 17],
    ]);
  });

  it('Malformed bass', () => {
    expect(shape('C/X  G')).toBeNull();
  });
});

describe('classifyLine: chord lines', () => {
  const CHORD_LINES: ReadonlyArray<readonly [line: string, expected: Shape[]]> = [
    [
      '  C  G',
      [
        ['chord', 'C', 2],
        ['chord', 'G', 5],
      ],
    ],
    [
      'C\tG',
      [
        ['chord', 'C', 0],
        ['chord', 'G', 2],
      ],
    ],
    [
      'C  G  ',
      [
        ['chord', 'C', 0],
        ['chord', 'G', 3],
      ],
    ],
    [
      'D/F# Gsus4',
      [
        ['chord', 'D/F#', 0],
        ['chord', 'Gsus4', 5],
      ],
    ],
    [
      'C - G',
      [
        ['chord', 'C', 0],
        ['marker', '-', 2],
        ['chord', 'G', 4],
      ],
    ],
    [
      'C % G',
      [
        ['chord', 'C', 0],
        ['marker', '%', 2],
        ['chord', 'G', 4],
      ],
    ],
    [
      'C / / /',
      [
        ['chord', 'C', 0],
        ['marker', '/', 2],
        ['marker', '/', 4],
        ['marker', '/', 6],
      ],
    ],
    [
      'C G (x2)',
      [
        ['chord', 'C', 0],
        ['chord', 'G', 2],
        ['marker', '(x2)', 4],
      ],
    ],
    [
      'C x4',
      [
        ['chord', 'C', 0],
        ['marker', 'x4', 2],
      ],
    ],
    [
      'C X3',
      [
        ['chord', 'C', 0],
        ['marker', 'X3', 2],
      ],
    ],
    [
      'C 2x',
      [
        ['chord', 'C', 0],
        ['marker', '2x', 2],
      ],
    ],
    [
      'C (2x)',
      [
        ['chord', 'C', 0],
        ['marker', '(2x)', 2],
      ],
    ],
    // Headers: one word ending in a colon, a word plus a number, or a bracketed label.
    [
      'Verse 1: C G',
      [
        ['header', 'Verse 1:', 0],
        ['chord', 'C', 9],
        ['chord', 'G', 11],
      ],
    ],
    [
      '[Verse 1] C G',
      [
        ['header', '[Verse 1]', 0],
        ['chord', 'C', 10],
        ['chord', 'G', 12],
      ],
    ],
    [
      '  Outro: Am | G',
      [
        ['header', 'Outro:', 2],
        ['chord', 'Am', 9],
        ['marker', '|', 12],
        ['chord', 'G', 14],
      ],
    ],
  ];

  it.each(CHORD_LINES)('classifies %j as a chord line', (line, expected) => {
    expect(shape(line)).toEqual(expected);
  });

  it('attaches the parsed chord to each chord token', () => {
    const classified = classifyLine('Intro: D/F# | Gsus4');
    expect(classified.kind).toBe('chords');
    if (classified.kind !== 'chords') return;
    const chords = classified.tokens.flatMap((token) => (token.kind === 'chord' ? [token] : []));
    expect(chords.map((token) => token.chord)).toEqual([parseChord('D/F#'), parseChord('Gsus4')]);
  });
});

describe('classifyLine: pass-through lines', () => {
  const TEXT_LINES: ReadonlyArray<readonly [line: string, why: string]> = [
    ['', 'empty line'],
    ['   ', 'whitespace only'],
    ['Placeholder words go here', 'lyric line'],
    ['C G and', 'one non-chord token'],
    ['Hm G', 'German H is not a chord'],
    ['C, G', 'chord with glued punctuation'],
    ['[C] [G]', 'ChordPro brackets'],
    // Markers alone carry nothing to convert.
    ['| | |', 'markers only'],
    ['- - -', 'markers only'],
    ['N.C.', 'markers only'],
    ['x2', 'markers only'],
    // Headers alone, or followed by anything but chords.
    ['Intro:', 'header only'],
    ['[Chorus]', 'header only'],
    ['Intro: | |', 'header and markers only'],
    ['Intro: words here', 'header followed by words'],
    ['And then they said: A', 'a sentence is not a header'],
    ['Verse one: C G', 'second header word must be a number'],
    ['[Verse 1 C G', 'unclosed bracket'],
    // Metadata lines whose values look like chords but name notes, not chords.
    ['Capo: 3', 'capo line'],
    ['Key: G', 'key hint'],
    ['Key: Am', 'key hint'],
    ['key: G', 'key hint, lower case'],
    ['Tonality: C', 'key hint'],
    ['Tuning: D A D G B E', 'tuning line'],
    ['Capo: G', 'capo line'],
  ];

  it.each(TEXT_LINES)('passes %j through (%s)', (line) => {
    expect(shape(line)).toBeNull();
  });
});
