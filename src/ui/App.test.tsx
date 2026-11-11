// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it('Paste shows numbers', () => {
    render(<App />);
    const input = screen.getByLabelText('Chord sheet');
    const output = screen.getByLabelText('Converted sheet');

    fireEvent.change(input, { target: { value: 'C G Am F\nPlaceholder words here' } });

    expect(output.textContent).toBe('I V VIm IV\nPlaceholder words here');
  });

  it('starts with empty output', () => {
    render(<App />);
    expect(screen.getByLabelText('Converted sheet').textContent).toBe('');
  });
});
