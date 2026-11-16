import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convert } from './convert';
import { detectKey } from './detectKey';
import { parseKeyHint } from './keyHints';
import type { Key, KeyRegion } from './types';

// Golden-file runner: every fixtures/<name>.input.txt must convert to exactly
// fixtures/<name>.expected.txt, in the key fixtures/golden.json lists for it.

const FIXTURES_DIR = join(import.meta.dirname, '../../fixtures');
const INPUT_SUFFIX = '.input.txt';

const read = (file: string) => readFileSync(join(FIXTURES_DIR, file), 'utf8');

const names = readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith(INPUT_SUFFIX))
  .map((file) => file.slice(0, -INPUT_SUFFIX.length))
  .sort();

const keys = (JSON.parse(read('golden.json')) as { sheets: Record<string, string> }).sheets;

/** `G`, `Dm`, `F#m` as a key, read as the hints are; `auto` is what detectKey finds in the sheet. */
function keyFor(name: string, sheet: string): Key | KeyRegion[] {
  if (name === 'auto') {
    const detected = detectKey(sheet);
    if (!detected) throw new Error('no key detected in a golden sheet marked auto');
    return detected.regions;
  }
  const parsed = parseKeyHint(`Key: ${name}`);
  if (!parsed) throw new Error(`bad key name in golden.json: ${name}`);
  return parsed;
}

describe('golden fixtures', () => {
  it('finds at least one fixture', () => {
    expect(names.length).toBeGreaterThan(0);
  });

  it('lists a key for every sheet, and no sheet that does not exist', () => {
    expect(Object.keys(keys).sort()).toEqual(names);
  });

  it.each(names)('%s', (name) => {
    const sheet = read(name + INPUT_SUFFIX);
    expect(convert(sheet, keyFor(keys[name]!, sheet), 'roman')).toBe(read(`${name}.expected.txt`));
  });
});
