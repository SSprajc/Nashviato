import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { chordQuality } from './chordQuality';
import { detectKey } from './detectKey';
import { parseCapo, parseKeyHint } from './keyHints';
import { KEY_WEIGHTS, rankKeys } from './keyScore';
import type { Key, Mode, PitchClass } from './types';

const key = (tonic: number, mode: Mode = 'major'): Key => ({ tonic: tonic as PitchClass, mode });

const C = key(0);
const D = key(2);
const E_MINOR = key(4, 'minor');
const G = key(7);
const A = key(9);
const A_MINOR = key(9, 'minor');

describe('detectKey: spec scenarios (Explicit key hint)', () => {
  it('Key line present', () => {
    const detected = detectKey('Key: Em\n\nG D Em C');
    expect(detected?.key).toEqual(E_MINOR);
    expect(detected?.guessed).toBe(false);
    expect(detected?.runnerUp).toBeUndefined();
  });

  it('Key line after the chords', () => {
    const detected = detectKey('C G Am F\nC G F C\n\nKey: Am');
    expect(detected?.key).toEqual(A_MINOR);
    expect(detected?.guessed).toBe(false);
    expect(detected?.regions).toHaveLength(1);
  });

  it('Stated key with a capo', () => {
    const detected = detectKey('Capo: 2\nKey: A\n\nG C D G\nEm C D G');
    expect(detected?.key).toEqual(G);
    expect(detected?.guessed).toBe(true);
    expect(detected?.runnerUp).toEqual(A);
  });
});

describe('detectKey: spec scenarios (Capo and the stated key)', () => {
  it('Stated key agrees with the shapes', () => {
    const detected = detectKey('Capo 3\nKey: G\n\nG C D G\nEm C D G');
    expect(detected?.key).toEqual(G);
    expect(detected?.guessed).toBe(false);
  });
});

describe('chordQuality: spec scenarios (Chord quality reading)', () => {
  it('Suffix classes', () => {
    expect(['m7b5', '7sus4', 'maj9', '6/9', '5', '-7'].map(chordQuality)).toEqual([
      'dim',
      'dom',
      'maj7',
      'maj',
      'sus',
      'min',
    ]);
  });
});

describe('detectKey: spec scenarios (Scored detection)', () => {
  it('Plain major progression', () => {
    expect(detectKey('G D Em C G D C G')?.key).toEqual(G);
  });

  it('Relative minor decided by first and last chord', () => {
    expect(detectKey('Em C G D Em C D Em')?.key).toEqual(E_MINOR);
  });

  it('Cadence decides', () => {
    expect(detectKey('Am Dm E7 Am')?.key).toEqual(A_MINOR);
  });

  it('is deterministic', () => {
    const sheet = 'Am F C G\nAm F C G';
    expect(detectKey(sheet)).toEqual(detectKey(sheet));
  });
});

describe('detectKey: spec scenarios (Tie-break and confidence)', () => {
  it('Unresolvable tie prefers major', () => {
    // No first or last chord, no cadence, same chords: C major and A minor tie.
    const ranked = rankKeys([
      { root: 5, quality: 'maj' },
      { root: 7, quality: 'maj' },
      { root: 5, quality: 'maj' },
    ]);
    const cMajor = ranked.findIndex((entry) => entry.key.tonic === 0 && entry.key.mode === 'major');
    const aMinor = ranked.findIndex((entry) => entry.key.tonic === 9 && entry.key.mode === 'minor');
    expect(ranked[cMajor]!.score).toBeCloseTo(ranked[aMinor]!.score);
    expect(cMajor).toBeLessThan(aMinor);
    expect(detectKey('C Am F G\nC Am F G\nC Am F G\nC Am F G')?.key).toEqual(C);
  });

  it('Close result is marked guessed', () => {
    const detected = detectKey('Am F C G\nAm F C G\n\nC G Am F\nC G F C');
    expect(detected?.guessed).toBe(true);
    expect(detected?.runnerUp).toBeDefined();
  });

  it('Clear result is not marked guessed', () => {
    const detected = detectKey('G C D G\nG C D G\nEm C D G');
    expect(detected?.key).toEqual(G);
    expect(detected?.guessed).toBe(false);
  });

  it('Runner-up has a different tonic', () => {
    // C minor would give the same numbers as C major, so it is never the runner-up.
    for (const sheet of ['C F G C', 'Am Dm E7 Am', 'E5 G5 A5 E5', 'A7 D7 E7 A7']) {
      const detected = detectKey(sheet);
      expect(detected?.runnerUp?.tonic).not.toBe(detected?.key.tonic);
    }
  });
});

describe('detectKey: spec scenarios (No chords)', () => {
  it('Lyrics only', () => {
    expect(detectKey('Placeholder words go here\nMore placeholder words')).toBeNull();
  });

  it('returns no key for empty input and for a hint without chords', () => {
    expect(detectKey('')).toBeNull();
    expect(detectKey('Key: G\n\nPlaceholder words')).toBeNull();
  });
});

describe('detectKey: spec scenarios (Key regions)', () => {
  it('Sheet in one key has one region', () => {
    expect(detectKey('[Verse]\nG D Em C\n\n[Chorus]\nC G D G')?.regions).toEqual([
      { startLine: 0, key: G, reason: 'start' },
    ]);
  });

  it('Section repeated in a new key', () => {
    const sheet = '[Chorus]\nC F G Am\nC F G C\n\n[Chorus]\nD G A Bm\nD G A D';
    expect(detectKey(sheet)?.regions).toEqual([
      { startLine: 0, key: C, reason: 'start' },
      { startLine: 4, key: D, reason: 'repeat' },
    ]);
  });

  it('Key stated in the middle of the sheet', () => {
    const sheet = 'Key: C\nC F G C\n\nKey: D\nBm G A D';
    expect(detectKey(sheet)?.regions).toEqual([
      { startLine: 0, key: C, reason: 'start' },
      { startLine: 3, key: D, reason: 'hint' },
    ]);
  });

  it('Diatonic sequence is not a key change', () => {
    const sheet = '[Verse]\nEm C G Em\n\n[Chorus]\nBm G D Bm\n\n[Outro]\nC D G G';
    expect(detectKey(sheet)?.regions).toHaveLength(1);
  });

  it('Borrowed chords are not a key change', () => {
    const sheet = '[Verse]\nC G Am F\n\n[Bridge]\nAb Bb C C\n\n[Verse]\nC G Am F';
    expect(detectKey(sheet)?.regions).toHaveLength(1);
  });

  it('Home key is scored with the repeat moved back', () => {
    // Two of three sections are in D; the home key is still C.
    const sheet = 'C F G C\n\nD G A D\n\nD G A D';
    expect(detectKey(sheet)?.key).toEqual(C);
  });
});

describe('parseKeyHint', () => {
  const HINTS: ReadonlyArray<readonly [line: string, expected: Key]> = [
    ['Key: G', G],
    ['key: G', G],
    ['KEY: G', G],
    ['Key:G', G],
    ['Key G', G],
    ['Key - G', G],
    ['Key = G', G],
    ['Key of G', G],
    ['Key is G', G],
    ['Key: G major', G],
    ['Key: G Major', G],
    ['Key: Gmaj', G],
    ['Key: GM', G],
    ['Tonality: G', G],
    ['Original key: G', G],
    ['New key: G', G],
    ['Key change: G', G],
    ['Key change to G', G],
    ['[Key: G]', G],
    ['(Key: G)', G],
    ['  Key: G', G],
    ['Key: G (capo 3)', G],
    ['Key: G - Capo: 2', G],
    ['Key: G, 4/4', G],
    ['Key: Em', E_MINOR],
    ['Key: E minor', E_MINOR],
    ['Key: E Minor', E_MINOR],
    ['Key: Emin', E_MINOR],
    ['Key: E min', E_MINOR],
    ['Key of E minor', E_MINOR],
    ['Tonality: Em', E_MINOR],
    ['Key: Bb', key(10)],
    ['Key: B♭', key(10)],
    ['Key: B flat', key(10)],
    ['Key: Bbm', key(10, 'minor')],
    ['Key: B flat minor', key(10, 'minor')],
    ['Key: F#', key(6)],
    ['Key: F♯m', key(6, 'minor')],
    ['Key: F sharp minor', key(6, 'minor')],
    ['Key: C#m', key(1, 'minor')],
    ['Key: Cb', key(11)],
  ];

  it.each(HINTS)('reads %j', (line, expected) => {
    expect(parseKeyHint(line)).toEqual(expected);
  });

  const NOT_HINTS: ReadonlyArray<readonly [line: string, why: string]> = [
    ['', 'empty'],
    ['G D Em C', 'chord line'],
    ['Key:', 'no note'],
    ['Key: H', 'German H'],
    ['Key: g', 'lower-case note'],
    ['Key of Dreams', 'a word that starts with a note letter'],
    ['Key: Gmajor7', 'not a mode'],
    ['Key: G7', 'a chord, not a key'],
    ['Keyboard: G', 'another label'],
    ['Keys: G', 'another label'],
    ['The key of G', 'label not at the start'],
    ['Monkey: G', 'label not at the start'],
    ['Key change up a tone', 'no note'],
    ['Capo: 3', 'capo line'],
    ['Tuning: D A D G B E', 'tuning line'],
  ];

  it.each(NOT_HINTS)('finds no key in %j (%s)', (line) => {
    expect(parseKeyHint(line)).toBeNull();
  });
});

describe('parseCapo', () => {
  const CAPOS: ReadonlyArray<readonly [line: string, expected: number | null]> = [
    ['Capo: 3', 3],
    ['Capo 3', 3],
    ['capo 3', 3],
    ['CAPO: 3', 3],
    ['Capo: 3rd fret', 3],
    ['Capo on 2nd fret', 2],
    ['Capo: fret 5', 5],
    ['Key: A, capo 2', 2],
    ['Capo: 11', 11],
    ['Capo: 0', null],
    ['Capo: 12', null],
    ['Capo: 123', null],
    ['No capo', null],
    ['Capo: none', null],
    ['Capo: G', null],
    ['Capon 3', null],
    ['G C D G', null],
  ];

  it.each(CAPOS)('reads %j', (line, expected) => {
    expect(parseCapo(line)).toBe(expected);
  });
});

describe('detectKey: properties', () => {
  const token = fc.constantFrom(
    ...['C', 'G', 'Am', 'F', 'D/F#', 'Bb', 'F#m7b5', 'E7', 'Gsus4', 'Dm', 'A', 'B7'],
    ...['|', 'x2', 'Key:', 'Capo:', '3', '[Chorus]', 'Verse:', 'words', ''],
  );
  const line = fc.array(token, { maxLength: 8 }).map((tokens) => tokens.join(' '));
  const sheet = fc.array(line, { maxLength: 16 }).map((lines) => lines.join('\n'));
  const anyText = fc.oneof(sheet, fc.string(), fc.string({ unit: 'binary' }));

  it('never throws', () => {
    fc.assert(fc.property(anyText, (text) => void detectKey(text)));
  });

  it('regions start at line 0 in the home key, in order, with no repeated key', () => {
    fc.assert(
      fc.property(sheet, (text) => {
        const detected = detectKey(text);
        if (!detected) return;
        const { regions } = detected;
        expect(regions[0]).toEqual({ startLine: 0, key: detected.key, reason: 'start' });
        const lineCount = text.split('\n').length;
        regions.slice(1).forEach((region, i) => {
          expect(region.startLine).toBeGreaterThan(regions[i]!.startLine);
          expect(region.startLine).toBeLessThan(lineCount);
          expect(region.key).not.toEqual(regions[i]!.key);
        });
      }),
    );
  });

  it('a sheet moved up by any interval is detected that interval higher', () => {
    const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const degrees = fc.array(fc.constantFrom(0, 2, 4, 5, 7, 9), { minLength: 1, maxLength: 12 });
    const QUALITY: Record<number, string> = { 0: '', 2: 'm', 4: 'm', 5: '', 7: '', 9: 'm' };
    const spell = (steps: number[], shift: number) =>
      steps.map((step) => NAMES[(step + shift) % 12]! + QUALITY[step]!).join(' ');
    fc.assert(
      fc.property(degrees, fc.integer({ min: 1, max: 11 }), (steps, shift) => {
        const base = detectKey(spell(steps, 0))!;
        const moved = detectKey(spell(steps, shift))!;
        expect(moved.key).toEqual(key((base.key.tonic + shift) % 12, base.key.mode));
        expect(moved.guessed).toBe(base.guessed);
      }),
    );
  });
});

describe('KEY_WEIGHTS', () => {
  it('keeps every fit weight above 0 and at most 1.1', () => {
    for (const mode of ['major', 'minor'] as const) {
      for (const row of Object.values(KEY_WEIGHTS.fit[mode])) {
        for (const value of Object.values(row)) {
          expect(value).toBeGreaterThan(0);
          expect(value).toBeLessThanOrEqual(1.1);
        }
      }
    }
  });
});
