import { notePitch, toPitchClass } from './pitch';
import type { Degree, Key, Note } from './types';

type DegreeNumber = Degree['number'];

/** Semitones above the tonic -> degree, for the tones of the major scale. */
const SCALE_DEGREE: Partial<Record<number, DegreeNumber>> = {
  0: 1,
  2: 2,
  4: 3,
  5: 4,
  7: 5,
  9: 6,
  11: 7,
};

/** Off-scale tones spelled natural: `bII`, `bIII`, `#IV`, `bVI`, `bVII` (ADR 0003). */
const NATURAL_DEFAULT: Partial<Record<number, Degree>> = {
  1: { number: 2, accidental: -1 },
  3: { number: 3, accidental: -1 },
  6: { number: 4, accidental: 1 },
  8: { number: 6, accidental: -1 },
  10: { number: 7, accidental: -1 },
};

/**
 * The degree of a spelled note in a key, measured against the major scale of
 * the tonic in both modes. A note on that scale is the plain degree whatever
 * its spelling. Off the scale, a sharp spelling is `#` of the degree below, a
 * flat spelling is `b` of the degree above, and a natural spelling takes the
 * fixed default. Serves roots and slash-chord basses alike.
 */
export function toDegree(note: Note, key: Key): Degree {
  const interval = toPitchClass(notePitch(note) - key.tonic);
  const onScale = SCALE_DEGREE[interval];
  if (onScale !== undefined) return { number: onScale, accidental: 0 };
  // Every off-scale tone has a scale tone a semitone below and one above.
  if (note.accidental === 1) return { number: SCALE_DEGREE[interval - 1]!, accidental: 1 };
  if (note.accidental === -1) return { number: SCALE_DEGREE[interval + 1]!, accidental: -1 };
  return NATURAL_DEFAULT[interval]!;
}
