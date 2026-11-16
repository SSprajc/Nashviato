import type { Key, Mode, PitchClass } from './types';

// The usual spelling of each tonic: the key with fewer accidentals in its
// signature, per mode (`Db` major but `C#` minor, `Ab` major but `G#` minor).
const TONIC_NAMES: Record<Mode, readonly string[]> = {
  major: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  minor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'],
};

/** All 24 keys: the 12 major keys from C upwards, then the 12 minor keys. */
export const ALL_KEYS: readonly Key[] = (['major', 'minor'] as const).flatMap((mode) =>
  Array.from({ length: 12 }, (_, tonic) => ({ tonic: tonic as PitchClass, mode })),
);

/** A key for display: `G major`, `C# minor`. */
export function keyName(key: Key): string {
  return `${TONIC_NAMES[key.mode][key.tonic]!} ${key.mode}`;
}
