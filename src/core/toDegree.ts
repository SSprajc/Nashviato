import type { Degree, Key, Note } from './types';

/**
 * The degree of a spelled note in a key, measured against the major scale of
 * the tonic in both modes. Arrives in task 4.2; the table test in
 * `degreeTable.test.ts` is marked as failing until then.
 */
export function toDegree(note: Note, key: Key): Degree {
  throw new Error(`toDegree is not built yet: ${note.letter} in ${key.tonic}`);
}
