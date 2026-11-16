import { describe, expect, it } from 'vitest';
import { convert } from './convert';
import type { Key, KeyRegion } from './types';

const C_MAJOR: Key = { tonic: 0, mode: 'major' };
const G_MAJOR: Key = { tonic: 7, mode: 'major' };
const D_MAJOR: Key = { tonic: 2, mode: 'major' };

/** Chord tokens of a single output line, ignoring spacing (alignment is task group 6). */
const tokens = (line: string) => line.trim().split(/\s+/);

describe('convert', () => {
  it('Chord line is converted', () => {
    expect(tokens(convert('C   G   Am  F', C_MAJOR, 'roman'))).toEqual(['I', 'V', 'VIm', 'IV']);
  });

  it('Single chord on a line is a chord line', () => {
    expect(convert('Am', C_MAJOR, 'roman')).toBe('VIm');
  });

  it('Diatonic chords in a major key', () => {
    expect(tokens(convert('G Am Bm C D Em', G_MAJOR, 'roman'))).toEqual([
      'I',
      'IIm',
      'IIIm',
      'IV',
      'V',
      'VIm',
    ]);
  });

  it('converts accidentals and slash chords on a chord line', () => {
    expect(convert('Bb  D/F#  Ebmaj7', C_MAJOR, 'roman')).toBe('bVII  II/#IV  bIIImaj7');
  });

  it('Non-diatonic major chord stays major', () => {
    expect(convert('D', C_MAJOR, 'roman')).toBe('II');
  });

  it('Lyric line containing chord-like words is unchanged', () => {
    const line = 'A Dad and a G-man';
    expect(convert(line, C_MAJOR, 'roman')).toBe(line);
  });

  it('Tab line is unchanged', () => {
    const line = 'e|---3---2---0---|';
    expect(convert(line, C_MAJOR, 'roman')).toBe(line);
  });

  it('Header with trailing chords', () => {
    expect(convert('Intro: G  D  Em  C', G_MAJOR, 'roman')).toBe('Intro: I  V  VIm  IV');
  });

  it('Markers pass through', () => {
    expect(convert('| C  | N.C. | G  x2', C_MAJOR, 'roman')).toBe('| I  | N.C. | V  x2');
  });

  it('Malformed bass', () => {
    const line = 'C/X  G';
    expect(convert(line, C_MAJOR, 'roman')).toBe(line);
  });

  it('Capo line passes through', () => {
    expect(convert('Capo: 3\nC  G', C_MAJOR, 'roman')).toBe('Capo: 3\nI  V');
  });

  it('leaves key and tuning lines unchanged', () => {
    const sheet = 'Key: G\nTuning: D A D G B E';
    expect(convert(sheet, G_MAJOR, 'roman')).toBe(sheet);
  });

  it('Empty input', () => {
    expect(convert('', C_MAJOR, 'roman')).toBe('');
  });

  it('Sheet without chords', () => {
    const sheet = 'Verse 1\nPlaceholder words go here\n\n  indented placeholder line\n';
    expect(convert(sheet, C_MAJOR, 'roman')).toBe(sheet);
  });

  it('converts chord lines and leaves lyric lines alone in a mixed sheet', () => {
    const sheet = 'C       G\nPlaceholder words go here\nAm      F\nMore placeholder words\n';
    const lines = convert(sheet, C_MAJOR, 'roman').split('\n');
    expect(lines).toHaveLength(sheet.split('\n').length);
    expect(tokens(lines[0]!)).toEqual(['I', 'V']);
    expect(lines[1]).toBe('Placeholder words go here');
    expect(tokens(lines[2]!)).toEqual(['VIm', 'IV']);
    expect(lines[3]).toBe('More placeholder words');
  });

  it('keeps CRLF line endings', () => {
    expect(convert('C\r\nwords\r\nG\r\n', C_MAJOR, 'roman')).toBe('I\r\nwords\r\nV\r\n');
  });

  it('Chords after a key change are numbered in the new key', () => {
    const regions: KeyRegion[] = [
      { startLine: 0, key: C_MAJOR, reason: 'start' },
      { startLine: 2, key: D_MAJOR, reason: 'repeat' },
    ];
    expect(convert('C  F  G\n\nD  G  A', regions, 'roman')).toBe('I  IV  V\n\nI  IV  V');
  });

  it('Single key is one region', () => {
    expect(convert('C  F  G\n\nD  G  A', C_MAJOR, 'roman')).toBe('I  IV  V\n\nII  V  VI');
  });

  it('uses the first region for lines before it, and returns the sheet for an empty list', () => {
    const late: KeyRegion[] = [{ startLine: 1, key: D_MAJOR, reason: 'start' }];
    expect(convert('D\nA', late, 'roman')).toBe('I\nV');
    expect(convert('D\nA', [], 'roman')).toBe('D\nA');
  });
});
