import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convert } from './convert';
import type { Key } from './types';

// Golden-file runner: every fixtures/<name>.input.txt must convert to exactly
// fixtures/<name>.expected.txt. All fixtures are in C major for now; a per-fixture
// key arrives with the minor-key fixture in task 4.3.

const FIXTURES_DIR = join(import.meta.dirname, '../../fixtures');
const INPUT_SUFFIX = '.input.txt';
const C_MAJOR: Key = { tonic: 0, mode: 'major' };

const names = readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith(INPUT_SUFFIX))
  .map((file) => file.slice(0, -INPUT_SUFFIX.length))
  .sort();

const read = (file: string) => readFileSync(join(FIXTURES_DIR, file), 'utf8');

describe('golden fixtures', () => {
  it('finds at least one fixture', () => {
    expect(names.length).toBeGreaterThan(0);
  });

  it.each(names)('%s', (name) => {
    expect(convert(read(name + INPUT_SUFFIX), C_MAJOR, 'roman')).toBe(read(`${name}.expected.txt`));
  });
});
