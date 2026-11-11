# 0003: Uppercase Roman numerals with the original suffix; minor keys numbered from their own tonic

Status: accepted (2026-11-11)

## Context

The Nashville Number System proper uses Arabic numerals (`6m`). The author reads and wants `VIm`. Classical Roman analysis would write lowercase `vi`.

## Decision

- Default output is an uppercase Roman degree followed by the chord's suffix exactly as written: `Am` → `VIm`, `G7` → `V7`.
- Arabic numerals are a setting, rendered from the same data.
- Accidentals precede the degree: `bVII`, `#IV`.
- Degrees are always measured against the major scale of the tonic. In A minor, `Am` is `Im`, `C` is `bIII`, `G` is `bVII`.

## Reasons

- Uppercase plus verbatim suffix means quality is never inferred, so the converter cannot introduce a wrong quality.
- Arabic costs one small renderer and matches what other players expect from a "Nashville" chart.
- One numbering rule for both modes keeps the core simple; mode only matters to key detection.

## Consequences

- Numbering a minor song from its relative major (`Am` stays `VIm`) is done by picking the relative major in the key picker, not by a separate option.
- Off-scale roots spelled natural use fixed defaults (`bII`, `bIII`, `#IV`, `bVI`, `bVII`); sharp- or flat-spelled roots follow the source.
