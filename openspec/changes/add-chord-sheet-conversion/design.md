# Design: Add chord sheet conversion (MVP)

## Context

Greenfield, solo. The value is in the conversion rules; the UI is one screen. Decisions and their reasons are in `docs/adr/`; this file covers how the pieces fit.

## Goals / Non-Goals

**Goals**
- A pure, deterministic core that can be tested without a browser and reused under a different shell later.
- Every spec scenario backed by a test.
- A deployed walking skeleton before any rule gets sophisticated.

**Non-Goals**
- Anything listed under Out of Scope in the proposal.
- Abstractions for future input sources or output modes beyond keeping the core's data model degree-based.

## Decisions

### Decision: Pipeline of pure functions

```
text ─► classifyLines ─► parseChords ─► (detectKey) ─► toDegrees ─► render ─► text
```

```ts
type Mode = 'major' | 'minor';
type Key = { tonic: PitchClass; mode: Mode };          // PitchClass = 0..11
type Chord = { root: Note; suffix: string; bass?: Note; column: number };
type Note = { letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G'; accidental: -1 | 0 | 1 };
type Degree = { number: 1|2|3|4|5|6|7; accidental: -1 | 0 | 1 };
type NotationStyle = 'roman' | 'arabic';

detectKey(sheet: string): { key: Key; guessed: boolean; runnerUp?: Key } | null
convert(sheet: string, key: Key, style: NotationStyle): string
```

`convert` takes the key as an argument and never detects it. The UI calls `detectKey` only when the picker is on `Auto`. This keeps conversion testable independently of the least certain piece.

### Decision: Degrees are the internal model

Chords are reduced to `Degree` + opaque suffix before rendering. Roman and Arabic are two renderers over the same data, and later transposition is a third.

### Decision: Mode affects detection only

Degrees are measured against the major scale of the tonic in both modes (`C` in A minor is `bIII`). The key's mode is used by detection and shown in the UI, and does not change numbering.

### Decision: Key detection weights live in one table

A single exported constants object holds the diatonic, first-chord, last-chord and cadence weights and the confidence margin. They are tuned against `fixtures/key-corpus.json`, and the corpus test records the baseline accuracy.

### Decision: UI state

Plain React state plus `localStorage` for last input and notation style. No router, no state library. Output is derived on render; conversion is fast enough not to need memoisation or a worker.

## Risks / Trade-offs

- [Line classification misreads an unusual sheet] → Lines pass through unchanged when in doubt; each real-world miss becomes a golden fixture.
- [Relative major/minor confusion in detection] → `guessed` flag, runner-up one tap away, manual picker; confusions count as failures in the corpus score.
- [Proportional fonts break alignment] → Output is rendered in a monospaced font and copied as plain text; alignment elsewhere is the reader's concern.
- [GitHub Pages serves from a sub-path] → Set Vite `base` and the PWA scope in the skeleton, verified by the first deploy.

## Open Questions

- Exact confidence margin and weights: set during task group 7 from the corpus.
- Whether unparseable-but-chord-like lines should be flagged in the UI: deferred until real use shows the need.
