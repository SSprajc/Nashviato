import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classifyLine } from './classifyLine';

// Runs fixtures/chord-lines.json: line shapes that are chord lines, with their
// tokens, and line shapes that pass through.

interface LineTable {
  chords: [line: string, tokens: string[]][];
  text: [line: string, why: string][];
}

const table = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../fixtures/chord-lines.json'), 'utf8'),
) as LineTable;

const PREFIX = { chord: 'c:', marker: 'm:', header: 'h:' } as const;

describe('Line shape table: chord lines', () => {
  it.each(table.chords)('classifies %j', (line, expected) => {
    const classified = classifyLine(line);
    expect(classified.kind).toBe('chords');
    if (classified.kind !== 'chords') return;

    expect(classified.tokens.map((token) => PREFIX[token.kind] + token.text)).toEqual(expected);

    // Tokens sit where their text is, in order, with only whitespace between.
    let end = 0;
    for (const token of classified.tokens) {
      expect(token.column).toBeGreaterThanOrEqual(end);
      expect(line.slice(end, token.column)).toMatch(/^\s*$/);
      expect(line.slice(token.column, token.column + token.text.length)).toBe(token.text);
      end = token.column + token.text.length;
    }
    expect(line.slice(end)).toMatch(/^\s*$/);
  });
});

describe('Line shape table: pass-through lines', () => {
  it.each(table.text)('passes %j through (%s)', (line) => {
    expect(classifyLine(line).kind).toBe('text');
  });
});
