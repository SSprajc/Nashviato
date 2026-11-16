import { describe, expect, it } from 'vitest';
import { parseKeyHint } from './keyHints';
import { ALL_KEYS, keyName } from './keyName';

describe('keyName', () => {
  it('names keys by their usual spelling per mode', () => {
    expect(keyName({ tonic: 7, mode: 'major' })).toBe('G major');
    expect(keyName({ tonic: 1, mode: 'major' })).toBe('Db major');
    expect(keyName({ tonic: 1, mode: 'minor' })).toBe('C# minor');
    expect(keyName({ tonic: 8, mode: 'minor' })).toBe('G# minor');
  });

  it('lists 24 keys whose names read back as the same key', () => {
    expect(ALL_KEYS).toHaveLength(24);
    for (const key of ALL_KEYS) expect(parseKeyHint(`Key: ${keyName(key)}`)).toEqual(key);
  });
});
