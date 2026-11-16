import { matchHeader } from '../core/classifyLine';
import type { KeyDetection } from '../core/detectKey';
import { keyName } from '../core/keyName';
import type { Key, KeyRegion } from '../core/types';

type Props = {
  sheet: string;
  /** The result of detection, or `null` when the sheet has no chords. */
  detection: KeyDetection | null;
  onPick: (key: Key) => void;
};

/** Where a key change happens: its 1-based line, and the section header on that line if any. */
function place(lines: readonly string[], region: KeyRegion): string {
  const line = `line ${region.startLine + 1}`;
  if (region.reason !== 'repeat') return line;
  const header = matchHeader(lines[region.startLine] ?? '');
  return header ? `${line}, ${header.text}` : line;
}

/**
 * The key display while the picker is on `Auto`: the detected key, whether it
 * is a guess (with the runner-up one tap away), and every key change.
 */
export function KeyStatus({ sheet, detection, onPick }: Props) {
  if (sheet.trim() === '') return null;
  if (!detection) {
    return (
      <p className="key-status" role="status">
        No chords found
      </p>
    );
  }

  const lines = sheet.split('\n');
  const changes = detection.regions.slice(1);
  const runnerUp = detection.guessed ? detection.runnerUp : undefined;

  return (
    <div className="key-status" role="status">
      <p>
        Detected key: <strong>{keyName(detection.key)}</strong>
        {detection.guessed && ' (guess)'}
        {runnerUp && (
          <button type="button" onClick={() => onPick(runnerUp)}>
            Try {keyName(runnerUp)}
          </button>
        )}
      </p>
      {changes.length > 0 && (
        <ul aria-label="Key changes">
          {changes.map((region) => (
            <li key={region.startLine}>
              Changes to <strong>{keyName(region.key)}</strong> at {place(lines, region)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
