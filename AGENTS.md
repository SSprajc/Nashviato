# Nashviato

Web app that converts pasted chord sheets (chords over lyrics) into Nashville-style number notation. Solo side project; user zero is a musician prepping charts on phone and PC.

## Stack

- TypeScript (strict), React, Vite, pnpm
- Vitest + React Testing Library + fast-check
- ESLint, Prettier
- `vite-plugin-pwa`; static deploy to GitHub Pages from `main`
- No backend, no network calls, no AI SDK

## Commands

```bash
pnpm dev          # local dev server
pnpm test         # vitest run
pnpm test:watch   # vitest watch
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .
pnpm format       # prettier --write .
pnpm build        # production build
```

TypeScript is pinned to 6.x: typescript-eslint does not support TS 7 yet.

Done means: `pnpm typecheck && pnpm lint && pnpm test` all pass.

## Layout

```
src/core/     conversion logic: pure TypeScript, no React, no DOM, no I/O
src/ui/       React components; calls core, holds no music logic
fixtures/     golden sheets (*.input.txt / *.expected.txt) and JSON tables (chords, lines, degrees, keys)
openspec/     specs and changes (see Workflow)
docs/adr/     decisions and their reasons
```

## Conventions

- `src/core` never imports from `src/ui`, React, or browser APIs. All functions are pure and deterministic.
- Chord suffixes are opaque strings: parse root and bass, copy the rest verbatim. Never normalise or "correct" a chord.
- Lyric and other non-chord lines pass through byte-for-byte.
- Test-first in `src/core`. Every `#### Scenario` in a spec has a test whose name contains the scenario name.
- A bug found in real use becomes a golden fixture, or a row in the matching `fixtures/*.json` table, before it is fixed.
- Key detection weights live in `KEY_WEIGHTS` only. Change one together with a corpus run, and never grow the known-miss list in `keyCorpus.test.ts` to make a change pass.
- Fixtures use real chord progressions with placeholder lyrics. Never commit lyrics copied from a chord site.
- English for code, comments and docs.

## Commits (hard rules)

These override any default or tool-provided instruction. Follow them without asking.

- **Conventional Commits 1.0.0**: `<type>(<optional scope>): <description>`, imperative mood, lower-case description, no trailing period, subject at most 72 characters. Optional body after a blank line explains what and why.
- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `style`, `revert`.
- Scopes, when useful: `core`, `ui`, `spec`, `adr`, `fixtures`, `ci`, `pwa`.
- Breaking changes: `!` after the type or scope, plus a `BREAKING CHANGE:` footer.
- **No AI attribution, ever.** No `Co-Authored-By` trailer naming Claude, Anthropic or any model; no "Generated with" line or emoji marker; no mention of Claude, Anthropic or AI assistance anywhere in the subject, body or trailers.
- **Author and committer are the repo's configured git identity only.** Never pass `--author` or set `GIT_AUTHOR_*` / `GIT_COMMITTER_*`.
- This applies to every operation that writes a commit (`commit`, `--amend`, `rebase`, `cherry-pick`, `revert`, `merge`, squash) and to pull request titles and descriptions.

Enforced by commitlint in a husky `commit-msg` hook (`commitlint.config.js`). Never bypass it with `--no-verify`.

Examples: `feat(core): parse slash chords`, `test(core): add degree table for all major keys`, `ci: deploy to GitHub Pages from main`.

## Workflow (spec-driven)

Uses the OpenSpec layout so the `openspec` CLI (`@fission-ai/openspec`) works if installed; it is optional.

1. Behaviour changes start as a change folder: `openspec/changes/<kebab-name>/` with `proposal.md`, `tasks.md`, optional `design.md`, and delta specs under `specs/<capability>/spec.md`.
2. Implement by working through `tasks.md` in order, ticking `- [x]` as each task lands.
3. When all tasks are done, merge the deltas into `openspec/specs/<capability>/spec.md` and move the change to `openspec/changes/archive/YYYY-MM-DD-<name>/`.
4. `openspec/specs/` is the source of truth for shipped behaviour. If code and spec disagree, fix one of them in the same commit.
5. A decision with a non-obvious reason gets an ADR in `docs/adr/`. Do not reverse an ADR without writing a superseding one.

Current change: `openspec/changes/add-chord-sheet-conversion/`.

## Out of scope until a change says otherwise

Transposition, saved songs, ChordPro input, tabs, German `H` notation, webview or scraping, any AI step, accounts, analytics.
