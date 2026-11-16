import type { NotationStyle } from '../core/types';

type Props = { value: NotationStyle; onChange: (style: NotationStyle) => void };

/** Roman (`VIm`) or Arabic (`6m`) numerals. */
export function StylePicker({ value, onChange }: Props) {
  return (
    <label className="picker">
      <span>Numerals</span>
      <select value={value} onChange={(event) => onChange(event.target.value as NotationStyle)}>
        <option value="roman">Roman (VIm)</option>
        <option value="arabic">Arabic (6m)</option>
      </select>
    </label>
  );
}
