import type { Key, Letter, Note, PitchClass } from './types';

const LETTER_PITCH: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Wraps any integer onto 0..11. */
export function toPitchClass(semitones: number): PitchClass {
  return (((semitones % 12) + 12) % 12) as PitchClass;
}

/** The pitch class of a spelled note: `Cb` is 11, `E#` is 5. */
export function notePitch(note: Note): PitchClass {
  return toPitchClass(LETTER_PITCH[note.letter] + note.accidental);
}

/** The key the given number of semitones above `key`, in the same mode. */
export function transposeKey(key: Key, semitones: number): Key {
  return { tonic: toPitchClass(key.tonic + semitones), mode: key.mode };
}

export function sameKey(a: Key, b: Key): boolean {
  return a.tonic === b.tonic && a.mode === b.mode;
}
