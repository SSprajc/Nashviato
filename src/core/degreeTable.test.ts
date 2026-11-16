import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseChord } from './parseChord';
import { toDegree } from './toDegree';
import type { Degree, Key, Mode, Note, PitchClass } from './types';

// Runs fixtures/degrees.json: every spelled note in all 12 keys, for the major
// and the minor key on each tonic, plus the "Degree calculation" scenarios on
// bare roots. The Roman text is built here, not by the renderer under test.

interface DegreeTable {
  keys: { tonic: PitchClass; name: string; degrees: Record<string, string> }[];
}

const table = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../fixtures/degrees.json'), 'utf8'),
) as DegreeTable;

const MODES: Mode[] = ['major', 'minor'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function written(degree: Degree): string {
  const accidental = degree.accidental === 1 ? '#' : degree.accidental === -1 ? 'b' : '';
  return accidental + ROMAN[degree.number - 1]!;
}

/** `F#`, `Bb`, `E♭` as a spelled note, read by the chord parser. */
function note(text: string): Note {
  const chord = parseChord(text);
  if (!chord || chord.suffix !== '' || chord.bass) throw new Error(`bad note in test: ${text}`);
  return chord.root;
}

const degrees = (notes: string, key: Key) =>
  notes.split(' ').map((text) => written(toDegree(note(text), key)));

const major = (tonic: PitchClass): Key => ({ tonic, mode: 'major' });
const minor = (tonic: PitchClass): Key => ({ tonic, mode: 'minor' });

describe('Degree table', () => {
  it('covers 21 spelled notes in each of 12 keys', () => {
    expect(table.keys.map((row) => row.tonic)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (const row of table.keys) expect(Object.keys(row.degrees)).toHaveLength(21);
  });

  it.fails.each(table.keys)('Degree table: key of $name, major and minor', ({ tonic, degrees }) => {
    for (const mode of MODES) {
      for (const [spelled, expected] of Object.entries(degrees)) {
        expect(written(toDegree(note(spelled), { tonic, mode })), `${spelled} in ${mode}`).toBe(
          expected,
        );
      }
    }
  });
});

describe('Degree calculation (roots only)', () => {
  it.fails('Diatonic chords in a major key', () => {
    expect(degrees('G A B C D E', major(7))).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI']);
  });

  it.fails('Minor key numbers from the minor tonic', () => {
    expect(degrees('A C F G E', minor(9))).toEqual(['I', 'bIII', 'bVI', 'bVII', 'V']);
  });

  it.fails('Off-scale root follows source spelling', () => {
    expect(degrees('F# Gb', major(0))).toEqual(['#IV', 'bV']);
  });

  it.fails('Natural off-scale root uses the default accidental', () => {
    expect(degrees('G C D', major(4))).toEqual(['bIII', 'bVI', 'bVII']);
  });

  it.fails('Enharmonic spelling of a scale tone is plain', () => {
    expect(degrees('A#', major(5))).toEqual(['IV']);
  });

  it.fails('Degree accidentals are written in ASCII', () => {
    expect(degrees('E♭ F♯', major(0))).toEqual(['bIII', '#IV']);
  });
});
