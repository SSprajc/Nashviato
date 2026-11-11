/** Semitones above C, 0..11. */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type Mode = 'major' | 'minor';

export type Key = { tonic: PitchClass; mode: Mode };

export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

/** A spelled note: `accidental` is -1 for flat, 0 for natural, 1 for sharp. */
export type Note = { letter: Letter; accidental: -1 | 0 | 1 };

/** A chord token split into its parts. `suffix` is opaque and copied verbatim. */
export type ParsedChord = { root: Note; suffix: string; bass?: Note };

/** `'arabic'` is added with its renderer in task 8.1. */
export type NotationStyle = 'roman';
