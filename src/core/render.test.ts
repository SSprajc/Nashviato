import { describe, expect, it } from 'vitest';
import { parseChord } from './parseChord';
import { renderChord, renderDegree } from './render';
import type { Key } from './types';

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
