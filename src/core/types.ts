/** Semitones above C, 0..11. */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type Mode = 'major' | 'minor';

export type Key = { tonic: PitchClass; mode: Mode };

/** `'arabic'` is added with its renderer in task 8.1. */
export type NotationStyle = 'roman';
