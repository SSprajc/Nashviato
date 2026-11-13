import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectKey, type KeyRegion } from './detectKey';
import { parseKeyHint } from './keyHints';
import type { Key } from './types';

// Runs fixtures/key-corpus.json (home key accuracy against a recorded baseline)
// and fixtures/key-changes.json (exact key regions).

const FIXTURES = join(import.meta.dirname, '../../fixtures');
const load = <T>(file: string) => JSON.parse(readFileSync(join(FIXTURES, file), 'utf8')) as T;

interface CorpusEntry {
  id: string;
  key: string;
  anyMode?: boolean;
  hard?: boolean;
  sheet: string[];
}

interface ChangeEntry {
  id: string;
  regions: [startLine: number, key: string, reason: KeyRegion['reason']][];
  guessed?: boolean;
  sheet: string[];
}

const corpus = load<{ entries: CorpusEntry[] }>('key-corpus.json').entries;
const changes = load<{ entries: ChangeEntry[] }>('key-changes.json').entries;

/** `G`, `Em`, `Bb`, `F#m` as a key; the same reader the hints use. */
function key(name: string): Key {
  const parsed = parseKeyHint(`Key: ${name}`);
  if (!parsed) throw new Error(`bad key name in fixture: ${name}`);
  return parsed;
}

function isCorrect(entry: CorpusEntry): boolean {
  const detected = detectKey(entry.sheet.join('\n'));
  const wanted = key(entry.key);
  if (!detected || detected.key.tonic !== wanted.tonic) return false;
  return entry.anyMode === true || detected.key.mode === wanted.mode;
}

/**
 * Recorded baseline: the corpus entries detection gets wrong today. Detection
 * may only get better. If a change fixes one of these, remove it from the list;
 * if a change breaks any other entry, the change is wrong or the weights need
 * retuning.
 */
const KNOWN_MISSES: readonly string[] = ['two-chord-vamp-in-G', 'mixolydian-three-chord-loop-in-D'];

describe('key corpus', () => {
  it('has unique ids', () => {
    expect(new Set(corpus.map((entry) => entry.id)).size).toBe(corpus.length);
  });

  it('Corpus run', () => {
    const misses = corpus.filter((entry) => !isCorrect(entry)).map((entry) => entry.id);
    expect(misses).toEqual([...KNOWN_MISSES]);
    expect(1 - misses.length / corpus.length).toBeGreaterThanOrEqual(0.9);
  });

  it('misses only entries marked hard', () => {
    const hard = new Set(corpus.filter((entry) => entry.hard).map((entry) => entry.id));
    expect(KNOWN_MISSES.filter((id) => !hard.has(id))).toEqual([]);
  });

  it('reports every miss as guessed, with the labelled key as runner-up', () => {
    for (const entry of corpus.filter((candidate) => KNOWN_MISSES.includes(candidate.id))) {
      const detected = detectKey(entry.sheet.join('\n'));
      expect(detected?.guessed, entry.id).toBe(true);
      expect(detected?.runnerUp, entry.id).toEqual(key(entry.key));
    }
  });

  it('never returns a single-region sheet with a key change', () => {
    for (const entry of corpus) {
      expect(detectKey(entry.sheet.join('\n'))?.regions, entry.id).toHaveLength(1);
    }
  });
});

describe('Key change table', () => {
  it.each(changes.map((entry) => [entry.id, entry] as const))('%s', (_, entry) => {
    const detected = detectKey(entry.sheet.join('\n'));
    expect(detected).not.toBeNull();
    if (!detected) return;
    expect(detected.regions).toEqual(
      entry.regions.map(([startLine, name, reason]) => ({ startLine, key: key(name), reason })),
    );
    expect(detected.key).toEqual(detected.regions[0]!.key);
    if (entry.guessed !== undefined) expect(detected.guessed).toBe(entry.guessed);
  });
});
