# 0005: Classify whole lines; treat chord suffixes as opaque

Status: accepted (2026-11-11)

## Context

Pasted sheets mix chords, lyrics, headers and tabs. Many words are also valid chord names (`A`, `Am`, `Add`, `Dad`).

## Decision

- A line is a chord line only if every token is a chord or an allowed marker. All other lines pass through byte-for-byte.
- A chord is parsed into root, suffix and optional bass. Only root and bass are interpreted; the suffix is copied verbatim.
- A lone chord-like token on a line counts as a chord line.
- German `H` notation is not supported in the MVP.

## Reasons

- Deciding per line removes almost all false positives without a dictionary or heuristics on individual words.
- An opaque suffix means unknown or exotic chord types still convert correctly, and the grammar never needs to enumerate every extension.
- When in doubt the sheet is left as written, so a parsing miss is visible and harmless instead of silently wrong.

## Consequences

- Chords embedded in lyric lines (ChordPro `[C]` style) are not converted until a change adds that input format.
- A chord line containing one unrecognised token is not converted at all; such cases become fixtures and grammar fixes.
