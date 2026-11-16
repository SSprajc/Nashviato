import { ALL_KEYS, keyName } from '../core/keyName';
import type { Key } from '../core/types';

const toValue = (key: Key) => `${key.tonic}-${key.mode}`;

const OPTIONS = ALL_KEYS.map((key) => ({ key, value: toValue(key), name: keyName(key) }));
const MAJOR = OPTIONS.filter((option) => option.key.mode === 'major');
const MINOR = OPTIONS.filter((option) => option.key.mode === 'minor');

type Props = { value: Key; onChange: (key: Key) => void };

/** One native select with the 12 major and the 12 minor keys: a single tap on a phone. */
export function KeyPicker({ value, onChange }: Props) {
  return (
    <label className="key-picker">
      <span>Key</span>
      <select
        value={toValue(value)}
        onChange={(event) => {
          const picked = OPTIONS.find((option) => option.value === event.target.value);
          if (picked) onChange(picked.key);
        }}
      >
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
