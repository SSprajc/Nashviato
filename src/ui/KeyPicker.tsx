import { ALL_KEYS, keyName } from '../core/keyName';
import type { Key } from '../core/types';

/** What the picker holds: `auto` (detect the key from the sheet) or a manual key. */
export type KeyChoice = 'auto' | Key;

const AUTO = 'auto';
const toValue = (choice: KeyChoice) => (choice === AUTO ? AUTO : `${choice.tonic}-${choice.mode}`);

const OPTIONS = ALL_KEYS.map((key) => ({ key, value: toValue(key), name: keyName(key) }));
const MAJOR = OPTIONS.filter((option) => option.key.mode === 'major');
const MINOR = OPTIONS.filter((option) => option.key.mode === 'minor');

type Props = { value: KeyChoice; onChange: (choice: KeyChoice) => void };

/** One native select: `Auto`, then the 12 major and the 12 minor keys. A single tap on a phone. */
export function KeyPicker({ value, onChange }: Props) {
  return (
    <label className="picker">
      <span>Key</span>
      <select
        value={toValue(value)}
        onChange={(event) => {
          const picked = OPTIONS.find((option) => option.value === event.target.value);
          onChange(picked ? picked.key : AUTO);
        }}
      >
        <option value={AUTO}>Auto</option>
        <optgroup label="Major">
          {MAJOR.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Minor">
          {MINOR.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
