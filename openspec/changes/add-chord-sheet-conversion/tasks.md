# Tasks

Core tasks are test-first: write the failing table rows or fixture from the spec scenarios, then implement.

The JSON tables in `fixtures/` are the reference data for the core. Where a task names one, the test iterates the whole file; do not copy rows into the test. `design.md` explains every rule the tables encode.

## 1. Walking skeleton

- [x] 1.1 `git init`; scaffold Vite + React + TypeScript (strict) with pnpm; add ESLint, Prettier, Vitest and the scripts listed in `AGENTS.md`; add commitlint (`@commitlint/config-conventional`, types and scopes from `AGENTS.md`, plus a custom rule rejecting any message that mentions Claude, Anthropic or a `Co-Authored-By` trailer for them) run from a husky `commit-msg` hook, and verify the hook rejects a bad message before making the first commit
- [x] 1.2 `src/core/convert.ts`: `convert(sheet, key, style)` handling only plain major/minor triads on chord-only lines, key hard-coded to C in the UI
- [x] 1.3 One golden fixture (`fixtures/skeleton.input.txt` / `.expected.txt`) and the golden-file test runner
- [x] 1.4 One screen: textarea and live monospaced output
- [x] 1.5 GitHub Actions: typecheck, lint, test on push; deploy to GitHub Pages from `main` (Vite `base` set at build time from the Pages settings)
- [x] 1.6 Open the deployed URL on phone and desktop

## 2. Chord grammar

- [x] 2.1 Table tests for the "Chord token grammar" scenarios, plus a wider accept/reject table
- [x] 2.2 `parseChord(token)`: root, opaque suffix, optional bass; `♯`/`♭` accepted; `H` rejected
- [x] 2.3 `fixtures/chord-tokens.json` and `chordTable.test.ts`: every root x suffix x bass, single accept cases, reject list with reasons
- [x] 2.4 Extend the suffix vocabulary: quality symbols (`°`, `ø`, `Δ`), `-` and `mi` for minor, `ma` before a number, `alt`, omitted tones, accidentals on added tones, commas inside parentheses
- [x] 2.5 `chordQuality(suffix)`: the quality class of every suffix in the table (read by key detection only)

## 3. Line classification

- [x] 3.1 Table tests for the "Line classification" scenarios
- [x] 3.2 `classifyLine`: chord line, header with trailing chords, pass-through; allowed markers
- [x] 3.3 Property tests: never throws, non-chord lines unchanged, line count preserved
- [x] 3.4 `fixtures/chord-lines.json` and `lineTable.test.ts`: line shapes that are chord lines, with their tokens, and line shapes that pass through
- [x] 3.5 Glued decoration: bar lines touching chords, wrapping parentheses, trailing commas, footnote stars, dash-joined chords; more markers; repeat counts capped at two digits

## 4. Degrees

- [ ] 4.1 Table test over `fixtures/degrees.json` (every spelled note in all 12 keys, for the major and the minor key on each tonic), plus the "Degree calculation" scenarios
- [ ] 4.2 `toDegree(note, key)` with the accidental rules; use `notePitch` from `pitch.ts`; slash-chord bass by the same function, with the "Slash chords" scenarios
- [ ] 4.3 Roman renderer; degree accidentals always `b` and `#`; replace the skeleton `convertChord`; per-fixture key in the golden runner; golden fixtures for a major-key and a minor-key sheet with slash chords and off-scale roots
- [ ] 4.4 `convert(sheet, key | regions, style)`: number each chord line in the key of its region; the "Key regions" scenarios of the chord-conversion spec; a golden fixture whose last chorus repeats a tone up, converted with the regions `detectKey` returns; property test that a one-region list equals the single key

## 5. Key picker

- [ ] 5.1 Picker with 12 roots × major/minor; output re-renders on change
- [ ] 5.2 Component smoke test: paste, see numbers, change key, see update

## 6. Column alignment

- [ ] 6.1 Table tests for the "Column alignment" scenarios, including glued tokens, dash-joined chords and a gap with a tab
- [ ] 6.2 Place units (runs of glued tokens) at source columns; shift on collision; copy gaps that contain a tab; update golden fixtures
- [ ] 6.3 Replace the property "whitespace runs are untouched" in `convert.property.test.ts` with: output tokens are in source order, glued tokens stay glued, and a line whose converted chords are no longer than their sources keeps every column

## 7. Key detection

- [x] 7.1 Build `fixtures/key-corpus.json`: 70 progressions with labelled keys, 8 marked `hard`
- [x] 7.2 Explicit hint parsing (`Key:`, `Key of`, `Tonality:`, `Key change:`), capo parsing, and the capo adjustment of a stated key
- [x] 7.3 Scorer with the `KEY_WEIGHTS` table; tie-break to major; `guessed` and `runnerUp` (a different tonic)
- [x] 7.4 Corpus test with a recorded list of misses, at least 90%; every miss is `hard` and comes back guessed with the labelled key as runner-up
- [x] 7.5 Key regions: sections, transposed repeats, mid-sheet hints; `fixtures/key-changes.json` with exact regions, including sheets that must not change key
- [ ] 7.6 UI: `Auto` option as default, guessed indicator, one-tap runner-up, "no chords found"; pass `detection.regions` to `convert`; show key changes next to the key; a manual key converts the whole sheet in that key
- [ ] 7.7 Spot-check the corpus labels against songs you know, and add the first real sheets that detect wrongly

## 8. Notation setting

- [ ] 8.1 Arabic renderer with table tests
- [ ] 8.2 Setting in the UI, persisted in `localStorage`

## 9. Copy and restore

- [ ] 9.1 Copy button using the Clipboard API
- [ ] 9.2 Persist and restore last input

## 10. PWA

- [ ] 10.1 `vite-plugin-pwa`: manifest, icons, offline service worker scoped to the Pages sub-path
- [ ] 10.2 Verify install and offline conversion on phone

## 11. Close out

- [ ] 11.1 Check every spec scenario has a named test
- [ ] 11.2 Merge delta specs into `openspec/specs/` and archive this change
