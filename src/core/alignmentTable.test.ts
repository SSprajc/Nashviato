import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convert } from './convert';
import { parseKeyHint } from './keyHints';
import type { Key } from './types';

// Runs fixtures/alignment.json: one chord line per row, with the exact output
// line. The rows named after the "Column alignment" scenarios are those scenarios.

type Row = [key: string, input: string, expected: string, shows: string];

const rows = (
  JSON.parse(readFileSync(join(import.meta.dirname, '../../fixtures/alignment.json'), 'utf8')) as {
    rows: Row[];
  }
).rows;

function key(name: string): Key {
  const parsed = parseKeyHint(`Key: ${name}`);
  if (!parsed) throw new Error(`bad key name in alignment.json: ${name}`);
  return parsed;
}

const SCENARIOS = [
  'Shorter output keeps columns',
  'Longer output avoids collision',
  'Glued tokens stay glued',
  'Dash-joined chords stay joined',
  'Gap with a tab is copied',
];

describe('Column alignment table', () => {
  it('holds a row for every Column alignment scenario', () => {
    const shown = rows.map((row) => row[3]);
    for (const scenario of SCENARIOS) expect(shown).toContain(scenario);
  });

  // Alignment arrives in task 6.2; until then chords are replaced in place and
  // the table as a whole is an expected failure.
  it.fails('every row converts to exactly its expected line', () => {
    for (const [keyName, input, expected, shows] of rows) {
      expect(convert(input, key(keyName), 'roman'), shows).toBe(expected);
    }
  });
});
