import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { classifyLine } from './classifyLine';
import { convert } from './convert';
import type { Key, KeyRegion, PitchClass } from './types';

const key: fc.Arbitrary<Key> = fc.record({
  tonic: fc.integer({ min: 0, max: 11 }).map((n) => n as PitchClass),
  mode: fc.constantFrom('major' as const, 'minor' as const),
});

/** Tokens that look like sheet content, so chord lines are actually generated. */
const sheetToken = fc.constantFrom(
  ...['C', 'G', 'Am', 'F', 'D/F#', 'Bb', 'F#m7b5', 'E7#9', 'Gsus4', 'C/X', 'Hm'],
  ...['|', '-', '%', '/', 'N.C.', 'x2', '(x2)'],
  ...['Intro:', '[Chorus]', 'Key:', 'Capo:', '3'],
  ...['words', 'Dad', 'a', 'A', 'e|---3---|'],
);

const gap = fc.constantFrom(' ', '  ', '    ', '\t');

const sheetLine = fc
  .tuple(fc.constantFrom('', ' ', '  '), fc.array(fc.tuple(sheetToken, gap), { maxLength: 8 }))
  .map(([indent, parts]) => indent + parts.map(([token, space]) => token + space).join(''));

const lineEnding = fc.constantFrom('\n', '\r\n');

const sheet = fc
  .array(fc.tuple(fc.oneof(sheetLine, fc.string()), lineEnding), { maxLength: 12 })
  .map((lines) => lines.map(([line, ending]) => line + ending).join(''));

const anyText = fc.oneof(sheet, fc.string(), fc.string({ unit: 'binary' }));

describe('convert: properties', () => {
  it('never throws', () => {
    fc.assert(
      fc.property(anyText, key, (text, k) => {
        expect(() => convert(text, k, 'roman')).not.toThrow();
        expect(() => classifyLine(text)).not.toThrow();
      }),
    );
  });

  it('line count preserved', () => {
    fc.assert(
      fc.property(anyText, key, (text, k) => {
        expect(convert(text, k, 'roman').split('\n')).toHaveLength(text.split('\n').length);
      }),
    );
  });

  it('non-chord lines unchanged', () => {
    fc.assert(
      fc.property(anyText, key, (text, k) => {
        const input = text.split('\n');
        const output = convert(text, k, 'roman').split('\n');
        input.forEach((line, i) => {
          const body = line.endsWith('\r') ? line.slice(0, -1) : line;
          if (classifyLine(body).kind === 'text') expect(output[i]).toBe(line);
        });
      }),
    );
  });

  it('a line holding a lyric word is unchanged whatever surrounds it', () => {
    fc.assert(
      fc.property(sheetLine, sheetLine, key, (before, after, k) => {
        const line = `${before} words ${after}`;
        expect(convert(line, k, 'roman')).toBe(line);
      }),
    );
  });

  it('line terminators and everything outside chord tokens are preserved', () => {
    fc.assert(
      fc.property(sheet, key, (text, k) => {
        const input = text.split('\n');
        const output = convert(text, k, 'roman').split('\n');
        input.forEach((line, i) => {
          expect(output[i]!.endsWith('\r')).toBe(line.endsWith('\r'));
          // Whitespace runs are untouched until alignment (group 6) lands.
          expect(output[i]!.split(/\S+/)).toEqual(line.split(/\S+/));
        });
      }),
    );
  });
});

const regions: fc.Arbitrary<KeyRegion[]> = fc
  .array(fc.tuple(fc.integer({ min: 0, max: 14 }), key), { minLength: 1, maxLength: 4 })
  .map((rows) =>
    rows
      .sort(([a], [b]) => a - b)
      .map(([startLine, k], index) => ({
        startLine,
        key: k,
        reason: index === 0 ? ('start' as const) : ('repeat' as const),
      })),
  );

describe('convert: key regions', () => {
  it('a one-region list equals the single key', () => {
    fc.assert(
      fc.property(anyText, key, (text, k) => {
        const one: KeyRegion[] = [{ startLine: 0, key: k, reason: 'start' }];
        expect(convert(text, one, 'roman')).toBe(convert(text, k, 'roman'));
      }),
    );
  });

  it('regions change neither the line count nor which lines are chord lines', () => {
    fc.assert(
      fc.property(sheet, regions, (text, list) => {
        const input = text.split('\n');
        const output = convert(text, list, 'roman').split('\n');
        expect(output).toHaveLength(input.length);
        input.forEach((line, i) => {
          const body = line.endsWith('\r') ? line.slice(0, -1) : line;
          if (classifyLine(body).kind === 'text') expect(output[i]).toBe(line);
        });
      }),
    );
  });

  it('every line is numbered as the single key of its region would number it', () => {
    fc.assert(
      fc.property(sheet, regions, (text, list) => {
        const output = convert(text, list, 'roman').split('\n');
        text.split('\n').forEach((line, i) => {
          const region = list.filter((candidate) => candidate.startLine <= i).at(-1) ?? list[0]!;
          expect(output[i]).toBe(convert(line, region.key, 'roman'));
        });
      }),
    );
  });
});
