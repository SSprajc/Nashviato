import { useState } from 'react';
import { convert } from '../core/convert';
import type { Key } from '../core/types';
import { KeyPicker } from './KeyPicker';
import './app.css';

// The picker starts on C major until `Auto` lands (task 7.6).
const C_MAJOR: Key = { tonic: 0, mode: 'major' };

export function App() {
  const [sheet, setSheet] = useState('');
  const [key, setKey] = useState<Key>(C_MAJOR);
  const output = convert(sheet, key, 'roman');

  return (
    <main className="app">
      <header className="app-header">
        <h1>Nashviato</h1>
        <KeyPicker value={key} onChange={setKey} />
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
