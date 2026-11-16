import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { classifyLine } from './classifyLine';
import { convert } from './convert';
import { renderChord } from './render';
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

  it('line terminators are preserved', () => {
    fc.assert(
      fc.property(sheet, key, (text, k) => {
        const input = text.split('\n');
        const output = convert(text, k, 'roman').split('\n');
        input.forEach((line, i) => {
          expect(output[i]!.endsWith('\r')).toBe(line.endsWith('\r'));
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

/** A chord line's tokens with the text each one is converted to. */
function renderedTokens(line: string, k: Key) {
  const classified = classifyLine(line);
  if (classified.kind === 'text') return null;
  return classified.tokens.map((token) => ({
    column: token.column,
    source: token.text,
    text: token.kind === 'chord' ? renderChord(token.chord, k, 'roman') : token.text,
  }));
}

/**
 * Where each converted token starts in the output line, reading left to right
 * and skipping whitespace; `null` when the output is not those tokens in order.
 */
function outputColumns(output: string, texts: readonly string[]): number[] | null {
  const columns: number[] = [];
  let at = 0;
  for (const text of texts) {
    while (at < output.length && /\s/.test(output[at]!)) at++;
    if (!output.startsWith(text, at)) return null;
    columns.push(at);
    at += text.length;
  }
  return output.slice(at).trim() === '' ? columns : null;
}

const bodies = (text: string) =>
  text.split('\n').map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));

// In Bb major none of these gets longer: `Bb` is `I`, `Eb7` is `IV7`, `F/Eb` is `V/IV`.
const B_FLAT_MAJOR: Key = { tonic: 10, mode: 'major' };
const compactWord = fc.constantFrom(
  ...['Bb', 'Eb', 'F', 'Bbmaj7', 'Eb7', 'F/Eb', 'Bbsus4'],
  ...['|Bb', 'Eb|', 'Bb-F', '(Eb)', 'F,', 'Bb*', '|', '%', 'x2', 'N.C.'],
);
const compactLine = fc
  .tuple(
    fc.constantFrom('', '  ', 'Intro: ', '[Chorus]  '),
    fc.array(fc.tuple(compactWord, fc.constantFrom(' ', '  ', '     ')), {
      minLength: 1,
      maxLength: 8,
    }),
  )
  // Every line opens with a chord, so it is a chord line whatever follows.
  .map(([lead, parts]) => `${lead}Bb  ` + parts.map(([word, space]) => word + space).join(''));

describe('convert: alignment properties', () => {
  it('output tokens are in source order', () => {
    fc.assert(
      fc.property(sheet, key, (text, k) => {
        const output = bodies(convert(text, k, 'roman'));
        bodies(text).forEach((line, i) => {
          const tokens = renderedTokens(line, k);
          if (!tokens) return;
          const texts = tokens.map((token) => token.text);
          expect(outputColumns(output[i]!, texts), `${line} -> ${output[i]}`).not.toBeNull();
        });
      }),
    );
  });

  it('glued tokens stay glued, and tokens apart stay apart', () => {
    fc.assert(
      fc.property(fc.oneof(sheet, compactLine), key, (text, k) => {
        const output = bodies(convert(text, k, 'roman'));
        bodies(text).forEach((line, i) => {
          const tokens = renderedTokens(line, k);
          if (!tokens) return;
          const columns = outputColumns(
            output[i]!,
            tokens.map((token) => token.text),
          )!;
          for (let t = 1; t < tokens.length; t++) {
            const before = tokens[t - 1]!;
            const glued = tokens[t]!.column === before.column + before.source.length;
            const touching = columns[t] === columns[t - 1]! + before.text.length;
            expect(touching, `${line} -> ${output[i]}`).toBe(glued);
          }
        });
      }),
    );
  });

  // Columns are kept per unit: inside a unit a shorter chord pulls the tokens
  // glued after it to the left (`Bb-F` is `I-V`), because they must stay adjacent.
  it('a line whose converted chords are no longer than their sources keeps the column of every unit', () => {
    const keepsColumns = (line: string, output: string, k: Key) => {
      const tokens = renderedTokens(line, k);
      // A tab gap is copied as written, so string columns after it are not comparable.
      if (!tokens || line.includes('\t')) return;
      if (tokens.some((token) => token.text.length > token.source.length)) return;
      const columns = outputColumns(
        output,
        tokens.map((token) => token.text),
      )!;
      const startsUnit = (t: number) =>
        t === 0 || tokens[t]!.column > tokens[t - 1]!.column + tokens[t - 1]!.source.length;
      const unitStarts = tokens.map((_, t) => t).filter(startsUnit);
      expect(
        unitStarts.map((t) => columns[t]),
        `${line} -> ${output}`,
      ).toEqual(unitStarts.map((t) => tokens[t]!.column));
    };

    fc.assert(
      fc.property(compactLine, (line) => {
        expect(classifyLine(line).kind).toBe('chords');
        keepsColumns(line, convert(line, B_FLAT_MAJOR, 'roman'), B_FLAT_MAJOR);
      }),
    );
    fc.assert(
      fc.property(sheet, key, (text, k) => {
        const output = bodies(convert(text, k, 'roman'));
        bodies(text).forEach((line, i) => keepsColumns(line, output[i]!, k));
      }),
    );
  });

  it('a line grows by no more than its chords grew', () => {
    fc.assert(
      fc.property(sheet, key, (text, k) => {
        const output = bodies(convert(text, k, 'roman'));
        bodies(text).forEach((line, i) => {
          if (classifyLine(line).kind === 'text') return;
          expect(output[i]!.trimEnd().length).toBeLessThanOrEqual(
            line.trimEnd().length +
              renderedTokens(line, k)!.reduce(
                (grown, token) => grown + Math.max(0, token.text.length - token.source.length),
                0,
              ),
          );
        });
      }),
    );
  });
});
