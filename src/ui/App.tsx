import { useState } from 'react';
import { convert } from '../core/convert';
import { detectKey } from '../core/detectKey';
import { KeyPicker, type KeyChoice } from './KeyPicker';
import { KeyStatus } from './KeyStatus';
import './app.css';

export function App() {
  const [sheet, setSheet] = useState('');
  const [choice, setChoice] = useState<KeyChoice>('auto');

  // Detection runs only on Auto. A manual key converts the whole sheet in that
  // key and drops the detected key changes; no chords means nothing to convert.
  const detection = choice === 'auto' ? detectKey(sheet) : null;
  const output =
    choice === 'auto'
      ? detection
        ? convert(sheet, detection.regions, 'roman')
        : sheet
      : convert(sheet, choice, 'roman');

  return (
    <main className="app">
      <header className="app-header">
        <h1>Nashviato</h1>
        <KeyPicker value={choice} onChange={setChoice} />
        {choice === 'auto' && <KeyStatus sheet={sheet} detection={detection} onPick={setChoice} />}
      </header>
      <label className="pane">
        <span className="pane-title">Chord sheet</span>
        <textarea
          value={sheet}
          onChange={(event) => setSheet(event.target.value)}
          placeholder="Paste a chord sheet here"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>
      <section className="pane">
        <h2 className="pane-title" id="output-title">
          Converted sheet
        </h2>
        <pre aria-labelledby="output-title" tabIndex={0}>
          {output}
        </pre>
      </section>
    </main>
  );
}
