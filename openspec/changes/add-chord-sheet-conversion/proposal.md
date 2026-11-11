# Proposal: Add chord sheet conversion (MVP)

## Why

Getting a song from a letter-chord sheet into numbers before a rehearsal is manual and slow. The MVP makes it a ten-second job: paste the sheet, get the same sheet in numbers, readable on phone or PC.

## What Changes

- New web app (TypeScript, React, Vite), deployed as a static, installable, offline-capable site.
- Paste a chord-over-lyrics sheet; output keeps the layout with numbers in place of chords.
- Key is auto-detected, shown, and overridable (12 roots, major or minor).
- Notation: uppercase Roman with the original suffix (`Am` → `VIm`) by default; Arabic (`6m`) as a setting.
- Copy the result; last input is restored on reload.

## Capabilities

### New Capabilities

- `chord-conversion`: chord grammar, line classification, degree calculation, slash chords, notation style, alignment.
- `key-detection`: explicit hints, scored detection, confidence, corpus accuracy.
- `converter-ui`: the single screen, key picker, settings, copy, persistence, offline.

### Modified Capabilities

None.

## Out of Scope

- Transposition to letter chords in another key (design recorded in ADR 0006).
- Webview, scraping, messy-paste extraction, bookmarklet or extension (direction in ADR 0004).
- Any AI step (ADR 0002).
- Song library, setlists, sync, accounts.
- ChordPro inline input, tabs, PDF or image import.
- German `H` notation, per-section keys, modulation detection, capo helper.
- True Nashville chart layout (bars, rhythm marks).
- Editing individual output chords; analytics; monetisation.

## Impact

Greenfield: creates the repository, toolchain, CI and deployment. No existing code or users affected.
