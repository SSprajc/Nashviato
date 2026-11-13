/**
 * What a chord suffix says about the chord's function. Read by key detection
 * only: conversion never looks inside a suffix and copies it verbatim.
 *
 * - `maj`  major triad, sixth and added-tone chords
 * - `maj7` major chord with a major seventh
 * - `min`  minor chord of any extension
 * - `dom`  dominant seventh family, including altered and `7sus`
 * - `dim`  diminished and half-diminished
 * - `aug`  augmented triad
 * - `sus`  no third: suspended, power chord, `no3`
 */
export type ChordQuality = 'maj' | 'maj7' | 'min' | 'dom' | 'dim' | 'aug' | 'sus';

const DOMINANT_NUMBER = /^(?:7|9|11|13)/;

/** Reads the quality class of a suffix accepted by `parseChord`. */
export function chordQuality(suffix: string): ChordQuality {
  const s = suffix.replace(/[(),]/g, '');

  if (/no3|omit3/.test(s)) return 'sus';
  if (/^(?:dim|[°ºøØ]|o7)/.test(s)) return 'dim';

  // Minor: `m`, `min`, `Min`, `mi` or `-`, but not `maj` or `ma7`.
  if (/^(?:m(?!aj|a\d)|Min|-)/.test(s)) return /[b♭-]5/.test(s) ? 'dim' : 'min';

  const augmented = /^(?:aug|\+)/.exec(s);
  if (augmented) return DOMINANT_NUMBER.test(s.slice(augmented[0].length)) ? 'dom' : 'aug';
  if (/^[#♯]5/.test(s)) return 'aug';

  if (/^(?:(?:maj|Maj|MAJ|ma|M)(?:7|9|11|13)|[Δ△]|7M)/.test(s)) return 'maj7';
  if (DOMINANT_NUMBER.test(s) || s.startsWith('alt')) return 'dom';
  if (s.includes('sus') || /^[45]/.test(s)) return 'sus';
  return 'maj';
}
