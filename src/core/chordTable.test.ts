import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chordQuality, type ChordQuality } from './chordQuality';
import { parseChord } from './parseChord';
import type { Letter, Note, ParsedChord } from './types';

// Runs fixtures/chord-tokens.json: the cross product of roots, suffixes and
// basses, the single accept cases, and the reject list.

type RootRow = [text: string, letter: Letter, accidental: Note['accidental']];
type AcceptRow = [token: string, root: string, suffix: string, bass: string, quality: ChordQuality];

interface ChordTable {
  roots: RootRow[];
  basses: string[];
  suffixes: [suffix: string, quality: ChordQuality][];
  accept: AcceptRow[];
  reject: [token: string, why: string][];
}

const table = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../fixtures/chord-tokens.json'), 'utf8'),
) as ChordTable;

function note(text: string): Note {
  const accidental = text.length === 1 ? 0 : text[1] === '#' || text[1] === '♯' ? 1 : -1;
  return { letter: text[0] as Letter, accidental };
}

function expected(root: Note, suffix: string, bass: string): ParsedChord {
  return bass === '' ? { root, suffix } : { root, suffix, bass: note(bass) };
}

describe('Chord token table: cross product', () => {
  it('is large enough to mean something', () => {
    expect(table.roots.length * table.suffixes.length * table.basses.length).toBeGreaterThan(40000);
  });

  it.each(table.suffixes)('suffix %j parses on every root and bass', (suffix) => {
    for (const [rootText, letter, accidental] of table.roots) {
      for (const bass of table.basses) {
        const token = rootText + suffix + (bass === '' ? '' : `/${bass}`);
        expect(parseChord(token), token).toEqual(expected({ letter, accidental }, suffix, bass));
      }
    }
  });

  it.each(table.suffixes)('suffix %j reads as %s', (suffix, quality) => {
    expect(chordQuality(suffix)).toBe(quality);
  });
});

describe('Chord token table: accept', () => {
  it.each(table.accept)('parses %s', (token, root, suffix, bass, quality) => {
    expect(parseChord(token)).toEqual(expected(note(root), suffix, bass));
    expect(chordQuality(suffix)).toBe(quality);
  });
});

describe('Chord token table: reject', () => {
  it.each(table.reject)('rejects %j (%s)', (token) => {
    expect(parseChord(token)).toBeNull();
  });
});
