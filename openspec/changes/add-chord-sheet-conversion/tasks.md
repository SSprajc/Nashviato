# Tasks

Core tasks are test-first: write the failing table rows or fixture from the spec scenarios, then implement.

## 1. Walking skeleton

- [x] 1.1 `git init`; scaffold Vite + React + TypeScript (strict) with pnpm; add ESLint, Prettier, Vitest and the scripts listed in `AGENTS.md`; add commitlint (`@commitlint/config-conventional`, types and scopes from `AGENTS.md`, plus a custom rule rejecting any message that mentions Claude, Anthropic or a `Co-Authored-By` trailer for them) run from a husky `commit-msg` hook, and verify the hook rejects a bad message before making the first commit
- [x] 1.2 `src/core/convert.ts`: `convert(sheet, key, style)` handling only plain major/minor triads on chord-only lines, key hard-coded to C in the UI
- [ ] 1.3 One golden fixture (`fixtures/skeleton.input.txt` / `.expected.txt`) and the golden-file test runner
- [ ] 1.4 One screen: textarea and live monospaced output
- [ ] 1.5 GitHub Actions: typecheck, lint, test on push; deploy to GitHub Pages from `main` (Vite `base` set)
- [ ] 1.6 Open the deployed URL on phone and desktop

## 2. Chord grammar

- [ ] 2.1 Table tests for the "Chord token grammar" scenarios, plus a wider accept/reject table
- [ ] 2.2 `parseChord(token)`: root, opaque suffix, optional bass; `♯`/`♭` accepted; `H` rejected

## 3. Line classification

- [ ] 3.1 Table tests for the "Line classification" scenarios
- [ ] 3.2 `classifyLine`: chord line, header with trailing chords, pass-through; allowed markers
- [ ] 3.3 Property tests: never throws, non-chord lines unchanged, line count preserved

## 4. Degrees

- [ ] 4.1 Table tests: every root in all 12 major keys, plus the "Degree calculation" scenarios
- [ ] 4.2 `toDegree(note, key)` with the accidental rules; slash-chord bass
- [ ] 4.3 Roman renderer; golden fixtures for a major-key and a minor-key sheet

## 5. Key picker

- [ ] 5.1 Picker with 12 roots × major/minor; output re-renders on change
- [ ] 5.2 Component smoke test: paste, see numbers, change key, see update

## 6. Column alignment

- [ ] 6.1 Table tests for the "Column alignment" scenarios
- [ ] 6.2 Anchor chords at source columns; shift on collision; update golden fixtures

## 7. Key detection

- [ ] 7.1 Build `fixtures/key-corpus.json`: about 30 progressions with labelled keys, original placeholder lyrics only where a full sheet is needed
- [ ] 7.2 Explicit hint parsing (`Key:`, `Key of`, `Tonality:`)
- [ ] 7.3 Scorer with weights table; tie-break to major; `guessed` and `runnerUp`
- [ ] 7.4 Corpus test with recorded baseline, at least 90%
- [ ] 7.5 UI: `Auto` option as default, guessed indicator, one-tap runner-up, "no chords found"

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
