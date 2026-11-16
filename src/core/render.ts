import { toDegree } from './toDegree';
import type { Degree, Key, NotationStyle, ParsedChord } from './types';

/** Per style: the numeral of each degree, 1 to 7. */
const NUMERALS: Record<NotationStyle, readonly string[]> = {
  roman: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'],
  arabic: ['1', '2', '3', '4', '5', '6', '7'],
};

/** A degree as text. The accidental is always ASCII `b` or `#`, before the numeral. */
export function renderDegree(degree: Degree, style: NotationStyle): string {
  const accidental = degree.accidental === 1 ? '#' : degree.accidental === -1 ? 'b' : '';
  return accidental + NUMERALS[style][degree.number - 1]!;
}

/**
 * A chord in number notation: the root's degree, the suffix exactly as
 * written, and the bass of a slash chord as a degree by the same rules.
 */
export function renderChord(chord: ParsedChord, key: Key, style: NotationStyle): string {
  const root = renderDegree(toDegree(chord.root, key), style);
  const bass = chord.bass ? `/${renderDegree(toDegree(chord.bass, key), style)}` : '';
  return root + chord.suffix + bass;
}
