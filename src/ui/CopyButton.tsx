import { useEffect, useState } from 'react';

type Props = { text: string };

type State = 'idle' | 'copied' | 'failed';

const LABEL: Record<State, string> = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' };

/** Copies `text` to the clipboard as plain text on one tap, and says whether it worked. */
export function CopyButton({ text }: Props) {
  const [state, setState] = useState<State>('idle');

  // The confirmation goes back to "Copy" after a moment.
  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 1500);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      // No clipboard permission, or an insecure origin.
      setState('failed');
    }
  };

  return (
    <button type="button" className="copy" onClick={copy} disabled={text === ''}>
      <span aria-live="polite">{LABEL[state]}</span>
    </button>
  );
}
