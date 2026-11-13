# Proposal: Add chord sheet conversion (MVP)

## Why

Getting a song from a letter-chord sheet into numbers before a rehearsal is manual and slow. The MVP makes it a ten-second job: paste the sheet, get the same sheet in numbers, readable on phone or PC.

## What Changes

- New web app (TypeScript, React, Vite), deployed as a static, installable, offline-capable site.
- Paste a chord-over-lyrics sheet; output keeps the layout with numbers in place of chords.
- Key is auto-detected, shown, and overridable (12 roots, major or minor).
- Key changes stated in the sheet, or made by repeating a section at another pitch, are detected and numbered in the new key (ADR 0008).
- Notation: uppercase Roman with the original suffix (`Am` → `VIm`) by default; Arabic (`6m`) as a setting.
- Copy the result; last input is restored on reload.

## Capabilities

### New Capabilities

- `chord-conversion`: chord grammar, line classification, degree calculation, slash chords, key regions, notation style, alignment.
- `key-detection`: explicit hints, capo handling, scored detection, confidence, key regions, corpus accuracy.
- `converter-ui`: the single screen, key picker, settings, copy, persistence, offline.

### Modified Capabilities

None.

## Out of Scope

- Transposition to letter chords in another key (design recorded in ADR 0006).
- Webview, scraping, messy-paste extraction, bookmarklet or extension (direction in ADR 0004).
- Any AI step (ADR 0002).
- Song library, setlists, sync, accounts.
- ChordPro inline input, tabs, PDF or image import.
- German `H` notation, capo helper, manual per-section keys, and key changes into new material or inside a section (ADR 0008).
- True Nashville chart layout (bars, rhythm marks).
- Editing individual output chords; analytics; monetisation.

## Impact

Greenfield: creates the repository, toolchain, CI and deployment. No existing code or users affected.
