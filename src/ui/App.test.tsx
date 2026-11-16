// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

/** Unmounts the app and mounts it again, as a page reload would. */
function reload() {
  cleanup();
  render(<App />);
}

const paste = (text: string) =>
  fireEvent.change(screen.getByLabelText('Chord sheet'), { target: { value: text } });
const output = () => screen.getByLabelText('Converted sheet').textContent;
const status = () => screen.queryByRole('status')?.textContent ?? '';
const keyChanges = () => screen.queryByRole('list', { name: 'Key changes' });

const keySelect = () => screen.getByLabelText<HTMLSelectElement>('Key');
const pickedKey = () => keySelect().selectedOptions[0]!.textContent;

/** Picks a key (or `Auto`) by its visible name, as a user would in the select. */
function pickKey(name: string) {
  const option = [...keySelect().options].find((candidate) => candidate.textContent === name);
  if (!option) throw new Error(`no such key in the picker: ${name}`);
  fireEvent.change(keySelect(), { target: { value: option.value } });
}

/** The chords of one output line, ignoring spacing. */
const chords = (line: string | undefined) => line!.trim().split(/\s+/);

const CLEAR_G_MAJOR = 'G C D G\nG C D G\nEm C D G';

// Verses and choruses in C major, then the last chorus a tone up from line 25.
const KEY_CHANGE_SHEET = readFileSync(
  join(import.meta.dirname, '../../fixtures/last-chorus-up-a-tone.input.txt'),
  'utf8',
);

describe('App', () => {
  it('Paste shows numbers', () => {
    render(<App />);
    paste('C G Am F\nPlaceholder words here');
    expect(output()).toBe('I V VIm IV\nPlaceholder words here');
  });

  it('Empty input shows no key', () => {
    render(<App />);
    expect(pickedKey()).toBe('Auto');
    expect(output()).toBe('');
    expect(status()).toBe('');
  });

  it('offers 12 roots in major and in minor', () => {
    render(<App />);
    const names = [...keySelect().options].map((option) => option.textContent);
    expect(names.filter((name) => name.endsWith(' major'))).toHaveLength(12);
    expect(names.filter((name) => name.endsWith(' minor'))).toHaveLength(12);
  });

  it('Manual override', () => {
    render(<App />);
    paste('D G A Bm');
    pickKey('D major');
    expect(output()).toBe('I IV V VIm');

    paste('D G A Bm\nE');
    expect(pickedKey()).toBe('D major');
    expect(output()).toBe('I IV V VIm\nII');
  });

  it('numbers a minor key from its own tonic', () => {
    render(<App />);
    paste('Am F C/E G');
    pickKey('A minor');
    expect(output()).toBe('Im bVI bIII/V bVII');
  });

  it('Auto key shown', () => {
    render(<App />);
    paste(CLEAR_G_MAJOR);
    expect(pickedKey()).toBe('Auto');
    expect(status()).toBe('Detected key: G major');
    expect(output()).toBe('I IV V I\nI IV V I\nVIm IV V I');
  });

  it('Guessed key offers the runner-up', () => {
    render(<App />);
    paste('G C G C\nG C G C');
    expect(status()).toContain('C major (guess)');
    expect(output()).toBe('V I V I\nV I V I');

    fireEvent.click(screen.getByRole('button', { name: 'Try G major' }));
    expect(pickedKey()).toBe('G major');
    expect(output()).toBe('I IV I IV\nI IV I IV');
  });

  it('Key change shown', () => {
    render(<App />);
    paste(KEY_CHANGE_SHEET);
    expect(status()).toContain('Detected key: C major');
    expect(keyChanges()?.textContent).toBe('Changes to D major at line 25, [Chorus]');

    const lines = output()!.split('\n');
    expect(lines[24]).toBe('[Chorus]');
    for (const header of [6, 18, 24]) {
      expect(chords(lines[header + 1])).toEqual(['IV', 'I/III', 'V', 'VIm']);
      expect(chords(lines[header + 3])).toEqual(['IV', 'V', 'I', 'I']);
    }
  });

  it('names the line of a key change stated in the sheet', () => {
    render(<App />);
    paste('Key: C\nC F G C\n\nKey: D\nBm G A D');
    expect(keyChanges()?.textContent).toBe('Changes to D major at line 4');
  });

  it('Manual key ignores key changes', () => {
    render(<App />);
    paste(KEY_CHANGE_SHEET);
    pickKey('C major');
    expect(status()).toBe('');
    expect(keyChanges()).toBeNull();
    expect(chords(output()!.split('\n')[25])).toEqual(['V', 'II/#IV', 'VI', 'VIIm']);
  });

  it('goes back to detection when Auto is picked again', () => {
    render(<App />);
    paste(CLEAR_G_MAJOR);
    pickKey('C major');
    expect(output()).toBe('V I II V\nV I II V\nIIIm I II V');
    pickKey('Auto');
    expect(status()).toBe('Detected key: G major');
    expect(output()).toBe('I IV V I\nI IV V I\nVIm IV V I');
  });

  it('Switch to Arabic', () => {
    render(<App />);
    paste('C  Am  F  G/B');
    expect(output()).toBe('I  VIm IV V/VII');

    fireEvent.change(screen.getByLabelText('Numerals'), { target: { value: 'arabic' } });
    expect(output()).toBe('1  6m  4  5/7');

    reload();
    expect(screen.getByLabelText<HTMLSelectElement>('Numerals').value).toBe('arabic');
    paste('C  Am  F  G/B');
    expect(output()).toBe('1  6m  4  5/7');
  });

  it('starts in Roman when nothing usable is stored', () => {
    window.localStorage.setItem('nashviato.style', 'klingon');
    render(<App />);
    expect(screen.getByLabelText<HTMLSelectElement>('Numerals').value).toBe('roman');
  });

  it('No chords found', () => {
    render(<App />);
    const lyrics = 'Placeholder words only\nand a second line of them';
    paste(lyrics);
    expect(status().toLowerCase()).toBe('no chords found');
    expect(output()).toBe(lyrics);
  });
});
