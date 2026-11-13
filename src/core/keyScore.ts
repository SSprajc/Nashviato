import type { ChordQuality } from './chordQuality';
import type { Key, Mode, PitchClass } from './types';

/** A chord as key detection sees it: where its root is and what kind it is. */
export type ScoredChord = { root: PitchClass; quality: ChordQuality };

type FitTable = Partial<Record<number, Partial<Record<ChordQuality, number>>>>;

/**
 * Every number key detection depends on, in one place. Tuned against
 * `fixtures/key-corpus.json`; change a value only together with a corpus run.
 *
 * `fit[mode][interval][quality]` is how well a chord whose root lies `interval`
 * semitones above the tonic, with that quality, belongs to a key of that mode.
 * 1 is a plain diatonic chord. Missing entries score 0.
 */
export const KEY_WEIGHTS = {
  fit: {
    major: {
      0: { maj: 1, maj7: 1, dom: 0.8, sus: 0.9, aug: 0.3 },
      1: { dim: 0.3 },
      2: { min: 1, sus: 0.7, dom: 0.4, maj: 0.3 },
      3: { maj: 0.4, maj7: 0.4, dim: 0.2 },
      4: { min: 1, sus: 0.5, dom: 0.4, maj: 0.3 },
      5: { maj: 1, maj7: 1, sus: 0.8, dom: 0.6, min: 0.4 },
      6: { dim: 0.3 },
      7: { maj: 1, dom: 1.1, sus: 1, aug: 0.4, min: 0.2 },
      8: { maj: 0.4, maj7: 0.4, dim: 0.2 },
      9: { min: 1, sus: 0.7, dom: 0.4, maj: 0.3 },
      10: { maj: 0.5, maj7: 0.5, sus: 0.4, dom: 0.3 },
      11: { dim: 1 },
    } satisfies FitTable,
    minor: {
      0: { min: 1, sus: 0.9, maj: 0.2, dom: 0.2 },
      1: { maj: 0.4, maj7: 0.4 },
      2: { dim: 1, min: 0.4, sus: 0.4 },
      3: { maj: 1, maj7: 1, sus: 0.8, aug: 0.4 },
      5: { min: 1, sus: 0.8, maj: 0.5, dom: 0.5 },
      7: { maj: 1, dom: 1.1, min: 0.9, sus: 1 },
      8: { maj: 1, maj7: 1, sus: 0.7, dom: 0.6 },
      9: { dim: 0.4 },
      10: { maj: 1, sus: 0.8, dom: 0.7, maj7: 0.5 },
      11: { dim: 0.7 },
    } satisfies FitTable,
  },
  /** Added for every occurrence of the tonic chord. */
  tonic: 0.5,
  /** Added for every V or V7 that moves straight to the tonic chord. */
  cadence: 0.5,
  /** Added once, on the per-chord scale, when the first chord is the tonic chord. */
  first: 0.25,
  /** Added once when the last chord is the tonic chord. */
  last: 0.25,
  /** A chord counts as the tonic chord when it sits on the tonic and fits at least this well. */
  tonicFit: 0.8,
  /** Results closer than this to the runner-up are reported as guessed. */
  margin: 0.3,
} as const;

export type KeyWeights = {
  fit: Record<Mode, FitTable>;
  tonic: number;
  cadence: number;
  first: number;
  last: number;
  tonicFit: number;
  margin: number;
};

export type KeyScore = { key: Key; score: number };

const MODES: readonly Mode[] = ['major', 'minor'];

function fit(key: Key, chord: ScoredChord, weights: KeyWeights): number {
  const table = weights.fit[key.mode];
  const interval = (chord.root - key.tonic + 12) % 12;
  return table[interval]?.[chord.quality] ?? 0;
}

function isTonicChord(key: Key, chord: ScoredChord, weights: KeyWeights): boolean {
  return chord.root === key.tonic && fit(key, chord, weights) >= weights.tonicFit;
}

function isDominant(key: Key, chord: ScoredChord): boolean {
  return (
    (chord.root - key.tonic + 12) % 12 === 7 &&
    (chord.quality === 'maj' || chord.quality === 'dom' || chord.quality === 'sus')
  );
}

/** Score of one key for a chord sequence, per chord, so that length does not matter. */
export function scoreKey(
  key: Key,
  chords: readonly ScoredChord[],
  weights: KeyWeights = KEY_WEIGHTS,
): number {
  if (chords.length === 0) return 0;
  let sum = 0;
  chords.forEach((chord, i) => {
    sum += fit(key, chord, weights);
    if (!isTonicChord(key, chord, weights)) return;
    sum += weights.tonic;
    // A cadence is counted once, where the tonic arrives from its dominant.
    const before = chords[i - 1];
    if (before && isDominant(key, before)) sum += weights.cadence;
  });

  let score = sum / chords.length;
  if (isTonicChord(key, chords[0]!, weights)) score += weights.first;
  if (isTonicChord(key, chords[chords.length - 1]!, weights)) score += weights.last;
  return score;
}

/**
 * All 24 keys, best first. Equal scores keep major before minor, and then the
 * tonic closest above the first chord's root. That order is deterministic and
 * does not depend on which key the sheet is written in.
 */
export function rankKeys(
  chords: readonly ScoredChord[],
  weights: KeyWeights = KEY_WEIGHTS,
): KeyScore[] {
  const origin = chords[0]?.root ?? 0;
  const scores: KeyScore[] = [];
  for (const mode of MODES) {
    for (let step = 0; step < 12; step++) {
      const key: Key = { tonic: ((origin + step) % 12) as PitchClass, mode };
      scores.push({ key, score: scoreKey(key, chords, weights) });
    }
  }
  // Array.prototype.sort is stable, so ties stay in generation order.
  return scores.sort((a, b) => (Math.abs(a.score - b.score) < 1e-9 ? 0 : b.score - a.score));
}
