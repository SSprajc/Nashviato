import { useState } from 'react';
import { convert } from '../core/convert';
import type { Key } from '../core/types';
import './app.css';

// Skeleton: the key is fixed until the key picker lands (task group 5).
const C_MAJOR: Key = { tonic: 0, mode: 'major' };

export function App() {
  const [sheet, setSheet] = useState('');
  const output = convert(sheet, C_MAJOR, 'roman');

  return (
    <main className="app">
      <header className="app-header">
        <h1>Nashviato</h1>
        <span className="key">Key: C major</span>
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
