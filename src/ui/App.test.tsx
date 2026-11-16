// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

const paste = (text: string) =>
  fireEvent.change(screen.getByLabelText('Chord sheet'), { target: { value: text } });
const output = () => screen.getByLabelText('Converted sheet').textContent;

/** Picks a key by its visible name, as a user would in the select. */
function pickKey(name: string) {
  const select = screen.getByLabelText<HTMLSelectElement>('Key');
  const option = [...select.options].find((candidate) => candidate.textContent === name);
  if (!option) throw new Error(`no such key in the picker: ${name}`);
  fireEvent.change(select, { target: { value: option.value } });
}

describe('App', () => {
  it('Paste shows numbers', () => {
    render(<App />);
    paste('C G Am F\nPlaceholder words here');
    expect(output()).toBe('I V VIm IV\nPlaceholder words here');
  });

  it('starts with empty output', () => {
    render(<App />);
    expect(output()).toBe('');
  });

  it('offers 12 roots in major and in minor', () => {
    render(<App />);
    const names = [...screen.getByLabelText<HTMLSelectElement>('Key').options].map(
      (option) => option.textContent,
    );
    expect(names.filter((name) => name.endsWith(' major'))).toHaveLength(12);
    expect(names.filter((name) => name.endsWith(' minor'))).toHaveLength(12);
  });

  it('Manual override', () => {
    render(<App />);
    paste('D G A Bm');
    pickKey('D major');
    expect(output()).toBe('I IV V VIm');

    paste('D G A Bm\nE');
    expect(output()).toBe('I IV V VIm\nII');
  });

  it('numbers a minor key from its own tonic', () => {
    render(<App />);
    paste('Am F C/E G');
    pickKey('A minor');
    expect(output()).toBe('Im bVI bIII/V bVII');
  });
});
