import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convert } from './convert';
import { parseChord } from './parseChord';
import { renderChord, renderDegree } from './render';
import type { Key, PitchClass } from './types';

const C_MAJOR: Key = { tonic: 0, mode: 'major' };
const A_MINOR: Key = { tonic: 9, mode: 'minor' };

const roman = (tokens: string, key: Key) =>
  tokens.split(' ').map((token) => {
    const chord = parseChord(token);
    if (!chord) throw new Error(`bad chord in test: ${token}`);
    return renderChord(chord, key, 'roman');
  });

describe('renderDegree', () => {
  it('writes the accidental before the numeral, in ASCII', () => {
    expect(renderDegree({ number: 7, accidental: -1 }, 'roman')).toBe('bVII');
    expect(renderDegree({ number: 4, accidental: 1 }, 'roman')).toBe('#IV');
    expect(renderDegree({ number: 3, accidental: 0 }, 'roman')).toBe('III');
  });
});

describe('renderChord', () => {
  it('Roman style', () => {
    expect(roman('Am Bb G/B', C_MAJOR)).toEqual(['VIm', 'bVII', 'V/VII']);
  });

  it('Suffix is copied verbatim', () => {
    expect(roman('Fmaj7 Gsus4 E7#9', C_MAJOR)).toEqual(['IVmaj7', 'Vsus4', 'III7#9']);
  });

  it('Non-diatonic major chord stays major', () => {
    expect(roman('D', C_MAJOR)).toEqual(['II']);
  });

  it('Minor key numbers from the minor tonic', () => {
    expect(roman('Am C F G E7', A_MINOR)).toEqual(['Im', 'bIII', 'bVI', 'bVII', 'V7']);
  });

  it('Off-scale root follows source spelling', () => {
    expect(roman('F#dim Gb', C_MAJOR)).toEqual(['#IVdim', 'bV']);
  });

  it('Degree accidentals are written in ASCII', () => {
    expect(roman('E♭ F♯m7♭5', C_MAJOR)).toEqual(['bIII', '#IVm7♭5']);
  });

  it('Bass follows its own spelling', () => {
    expect(roman('C/Bb C/A#', C_MAJOR)).toEqual(['I/bVII', 'I/#VI']);
  });

  it('Bass in a minor key', () => {
    expect(roman('Am/G Am/G#', A_MINOR)).toEqual(['Im/bVII', 'Im/VII']);
  });

  it('Suffix that contains a slash', () => {
    expect(roman('C6/9 C6/9/E', C_MAJOR)).toEqual(['I6/9', 'I6/9/III']);
  });
});

// The degree table again, through the renderer in both styles. The Arabic
// column is the Roman entry with its numeral replaced, so both styles share
// accidentals by construction of the expectation, not of the code.
describe('renderers over the degree table', () => {
  interface DegreeTable {
    keys: { tonic: PitchClass; name: string; degrees: Record<string, string> }[];
  }
  const table = JSON.parse(
    readFileSync(join(import.meta.dirname, '../../fixtures/degrees.json'), 'utf8'),
  ) as DegreeTable;

  const ARABIC: Record<string, string> = {
    I: '1',
    II: '2',
    III: '3',
    IV: '4',
    V: '5',
    VI: '6',
    VII: '7',
  };
  const toArabic = (romanDegree: string) => {
    const [, accidental, numeral] = /^([b#]?)([IV]+)$/.exec(romanDegree)!;
    return accidental + ARABIC[numeral!]!;
  };

  it.each(table.keys)('key of $name in Roman and Arabic', ({ tonic, degrees }) => {
    const key: Key = { tonic, mode: 'major' };
    for (const [spelled, expected] of Object.entries(degrees)) {
      const chord = parseChord(`${spelled}m7/${spelled}`)!;
      expect(renderChord(chord, key, 'roman')).toBe(`${expected}m7/${expected}`);
      expect(renderChord(chord, key, 'arabic')).toBe(
        `${toArabic(expected)}m7/${toArabic(expected)}`,
      );
    }
  });
});

describe('Notation style', () => {
  const arabic = (tokens: string, key: Key) =>
    tokens.split(' ').map((token) => renderChord(parseChord(token)!, key, 'arabic'));

  it('Arabic style', () => {
    expect(arabic('Am Bb G/B', C_MAJOR)).toEqual(['6m', 'b7', '5/7']);
  });

  it('renders accidentals, suffixes and basses the same way in both styles', () => {
    expect(arabic('F#m7b5 C6/9/E E♭', C_MAJOR)).toEqual(['#4m7b5', '16/9/3', 'b3']);
    expect(arabic('Am/G# E7', A_MINOR)).toEqual(['1m/7', '57']);
  });

  it('converts a sheet in Arabic numerals', () => {
    expect(convert('Intro: C   Am   F   G\nwords', C_MAJOR, 'arabic')).toBe(
      'Intro: 1   6m   4   5\nwords',
    );
  });
});
