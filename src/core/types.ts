/** Semitones above C, 0..11. */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type Mode = 'major' | 'minor';

export type Key = { tonic: PitchClass; mode: Mode };

export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

/** A spelled note: `accidental` is -1 for flat, 0 for natural, 1 for sharp. */
export type Note = { letter: Letter; accidental: -1 | 0 | 1 };

/** A chord token split into its parts. `suffix` is opaque and copied verbatim. */
export type ParsedChord = { root: Note; suffix: string; bass?: Note };

/** A scale degree of the tonic's major scale; `accidental` is -1 for `b`, 1 for `#`. */
export type Degree = { number: 1 | 2 | 3 | 4 | 5 | 6 | 7; accidental: -1 | 0 | 1 };

/**
 * A stretch of the sheet in one key, from `startLine` (0-based) to the next
 * region. `reason` says why the region starts: `start` for the first one,
 * `hint` for a key stated in the sheet, `repeat` for a section that repeats an
 * earlier one in another key (or returns to it).
 */
export type KeyRegion = { startLine: number; key: Key; reason: 'start' | 'hint' | 'repeat' };

/** `'arabic'` is added with its renderer in task 8.1. */
export type NotationStyle = 'roman';
