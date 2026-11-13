import { chordQuality, type ChordQuality } from './chordQuality';
import { classifyLine, matchHeader } from './classifyLine';
import { parseCapo, parseKeyHint } from './keyHints';
import { KEY_WEIGHTS, rankKeys, scoreKey, type KeyWeights, type ScoredChord } from './keyScore';
import { notePitch, sameKey, toPitchClass, transposeKey } from './pitch';
import type { Key } from './types';

/**
 * A stretch of the sheet in one key, from `startLine` (0-based) to the next
 * region. `reason` says why the region starts: `start` for the first one,
 * `hint` for a key stated in the sheet, `repeat` for a section that repeats an
 * earlier one in another key (or returns to it).
 */
export type KeyRegion = { startLine: number; key: Key; reason: 'start' | 'hint' | 'repeat' };

export type KeyDetection = {
  /** The home key: the key of the first region. */
  key: Key;
  /** True when the home key was scored and the runner-up is close, or was adjusted for a capo. */
  guessed: boolean;
  /** The best key with a different tonic; absent when the sheet states its key. */
  runnerUp?: Key;
  /** Sorted by `startLine`; the first region starts at line 0 in the home key. */
  regions: KeyRegion[];
};

/** Fewest chords, and fewest distinct roots among them, for two sections to count as a repeat. */
const REPEAT_MIN_CHORDS = 3;
const REPEAT_MIN_ROOTS = 3;

type Section = { startLine: number; chords: ScoredChord[]; hint?: Key };

const METADATA_LABEL = /^(?:key|tonality|tuning|capo):$/i;
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const TRIAD: Record<ChordQuality, readonly number[]> = {
  maj: [0, 4, 7],
  maj7: [0, 4, 7],
  dom: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus: [0, 7],
};

function isSectionHeader(line: string): boolean {
  const header = matchHeader(line);
  return header !== null && !METADATA_LABEL.test(header.text);
}

/**
 * Splits the sheet into sections. Headers divide the sheet when it has any;
 * otherwise blank lines do. A key hint always starts a section of its own.
 */
function readSections(lines: readonly string[]): { sections: Section[]; capo: number | null } {
  const headers = lines.map(isSectionHeader);
  const useHeaders = headers.includes(true);
  const sections: Section[] = [{ startLine: 0, chords: [] }];
  let capo: number | null = null;
  let afterBlank = false;

  lines.forEach((line, index) => {
    const hint = parseKeyHint(line);
    const blank = line.trim() === '';
    const boundary = hint !== null || (useHeaders ? headers[index]! : afterBlank && !blank);
    if (boundary && index > 0) sections.push({ startLine: index, chords: [] });
    afterBlank = blank;

    const section = sections[sections.length - 1]!;
    if (hint) section.hint = hint;
    capo ??= parseCapo(line);

    const classified = classifyLine(line);
    if (classified.kind !== 'chords') return;
    for (const token of classified.tokens) {
      if (token.kind !== 'chord') continue;
      section.chords.push({
        root: notePitch(token.chord.root),
        quality: chordQuality(token.chord.suffix),
      });
    }
  });

  return { sections, capo };
}

/**
 * The interval by which `later` repeats `earlier`, or `null`. The shorter
 * section must match the start of the longer one chord for chord: every root
 * moved by the same interval, every quality unchanged.
 */
function repeatInterval(earlier: readonly ScoredChord[], later: readonly ScoredChord[]) {
  const length = Math.min(earlier.length, later.length);
  if (length < REPEAT_MIN_CHORDS) return null;
  const interval = toPitchClass(later[0]!.root - earlier[0]!.root);
  const roots = new Set<number>();
  for (let i = 0; i < length; i++) {
    const a = earlier[i]!;
    const b = later[i]!;
    if (toPitchClass(b.root - a.root) !== interval || a.quality !== b.quality) return null;
    roots.add(a.root);
  }
  if (roots.size < REPEAT_MIN_ROOTS) return null;
  if (interval !== 0 && fitsOneScale(earlier.slice(0, length), interval)) return null;
  return interval;
}

/**
 * True when the chords and their copy `interval` semitones up all use notes of
 * one major scale. Such a repeat is a diatonic sequence inside one key (`Em C G`
 * then `Bm G D` in G major), not a key change.
 */
function fitsOneScale(chords: readonly ScoredChord[], interval: number): boolean {
  const notes = new Set<number>();
  for (const chord of chords) {
    for (const step of TRIAD[chord.quality]) {
      notes.add((chord.root + step) % 12);
      notes.add((chord.root + step + interval) % 12);
    }
  }
  for (let tonic = 0; tonic < 12; tonic++) {
    const scale = new Set(MAJOR_SCALE.map((step) => (tonic + step) % 12));
    if ([...notes].every((note) => scale.has(note))) return true;
  }
  return false;
}

/** For each section, the earlier section it repeats and by what interval. */
function findRepeats(sections: readonly Section[]): ({ of: number; interval: number } | null)[] {
  return sections.map((section, index) => {
    let transposed: { of: number; interval: number } | null = null;
    for (let earlier = 0; earlier < index; earlier++) {
      const interval = repeatInterval(sections[earlier]!.chords, section.chords);
      if (interval === 0) return { of: earlier, interval };
      if (interval !== null) transposed ??= { of: earlier, interval };
    }
    return transposed;
  });
}

/**
 * Detects the key of a chord sheet, and any key changes in it.
 * Returns `null` when the sheet has no chords. Deterministic.
 */
export function detectKey(sheet: string, weights: KeyWeights = KEY_WEIGHTS): KeyDetection | null {
  const lines = sheet.split('\n').map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));
  const { sections, capo } = readSections(lines);
  if (sections.every((section) => section.chords.length === 0)) return null;

  // Semitones of each section above the first, from repeats alone.
  const repeats = findRepeats(sections);
  const shifts: number[] = [];
  sections.forEach((_, index) => {
    const repeat = repeats[index];
    shifts.push(repeat ? shifts[repeat.of]! + repeat.interval : (shifts[index - 1] ?? 0));
  });

  // The home key comes from a hint that precedes every chord (or follows them
  // all, as a footer), or from scoring the chords that no later hint governs,
  // moved back to the first section's key.
  const firstHint = sections.findIndex((section) => section.hint !== undefined);
  const firstChords = sections.findIndex((section) => section.chords.length > 0);
  const chordsFollow = sections.slice(firstHint).some((section) => section.chords.length > 0);
  const hintIsHome = firstHint !== -1 && (firstHint <= firstChords || !chordsFollow);
  const scoredUpTo = firstHint === -1 || hintIsHome ? sections.length : firstHint;
  const evidence = sections.slice(0, scoredUpTo).flatMap((section, index) =>
    section.chords.map((chord) => ({
      root: toPitchClass(chord.root - shifts[index]!),
      quality: chord.quality,
    })),
  );

  let home: Key;
  let guessed: boolean;
  let runnerUp: Key | undefined;
  // A stated key can be the sounding key while the chords are capo shapes.
  let capoShift = 0;

  if (hintIsHome) {
    const stated = sections[firstHint]!.hint!;
    const shapes = capo === null ? stated : transposeKey(stated, -capo);
    const useShapes =
      capo !== null && scoreKey(shapes, evidence, weights) > scoreKey(stated, evidence, weights);
    capoShift = useShapes ? -capo : 0;
    home = transposeKey(stated, capoShift);
    guessed = useShapes;
    runnerUp = useShapes ? stated : undefined;
  } else {
    const ranked = rankKeys(evidence, weights);
    const best = ranked[0]!;
    const next = ranked.find((candidate) => candidate.key.tonic !== best.key.tonic)!;
    home = best.key;
    guessed = best.score - next.score < weights.margin;
    runnerUp = next.key;
  }

  // Walk the sections: a hint sets the key, a repeat follows the section it
  // repeats, and anything else stays in the key before it.
  const keys: Key[] = [];
  const regions: KeyRegion[] = [{ startLine: 0, key: home, reason: 'start' }];
  sections.forEach((section, index) => {
    const repeat = repeats[index];
    const hinted = section.hint !== undefined && !(hintIsHome && index === firstHint);
    let key: Key;
    if (hinted) key = transposeKey(section.hint!, capoShift);
    else if (repeat) key = transposeKey(keys[repeat.of]!, repeat.interval);
    else key = keys[index - 1] ?? home;
    keys.push(key);

    const current = regions[regions.length - 1]!;
    if (sameKey(key, current.key)) return;
    if (section.chords.length === 0 && !hinted) return;
    regions.push({ startLine: section.startLine, key, reason: hinted ? 'hint' : 'repeat' });
  });

  return runnerUp ? { key: home, guessed, runnerUp, regions } : { key: home, guessed, regions };
}
