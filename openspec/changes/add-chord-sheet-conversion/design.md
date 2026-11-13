# Design: Add chord sheet conversion (MVP)

## Context

Greenfield, solo. The value is in the conversion rules; the UI is one screen. Decisions and their reasons are in `docs/adr/`; this file covers how the pieces fit, and the rules of the core in enough detail to build the rest test-first.

## Goals / Non-Goals

**Goals**

- A pure, deterministic core that can be tested without a browser and reused under a different shell later.
- Every spec scenario backed by a test.
- A deployed walking skeleton before any rule gets sophisticated.

**Non-Goals**

- Anything listed under Out of Scope in the proposal.
- Abstractions for future input sources or output modes beyond keeping the core's data model degree-based.

## Status of the core

| Module | State | Tested by |
| --- | --- | --- |
| `parseChord` | built | `parseChord.test.ts`, `chordTable.test.ts` over `fixtures/chord-tokens.json` |
| `chordQuality` | built | `chordTable.test.ts` |
| `classifyLine` | built | `classifyLine.test.ts`, `lineTable.test.ts` over `fixtures/chord-lines.json` |
| `keyHints`, `keyScore`, `detectKey` | built | `detectKey.test.ts`, `keyCorpus.test.ts` over `fixtures/key-corpus.json` and `fixtures/key-changes.json` |
| `toDegree`, renderers | to build (task group 4, 8) | `fixtures/degrees.json` is the oracle |
| alignment | to build (task group 6) | spec scenarios under Column alignment |
| `convert` with key regions | to build (task 4.4) | spec scenarios under Key regions |

`convert.ts` is still the walking skeleton: natural roots on the major scale, no bass, replacement in place, one key.

## Decisions

### Decision: Pipeline of pure functions

```
text ─► classifyLine (per line) ─► parseChord (per word) ─► toDegree ─► render ─► align ─► text
                │
                └─► detectKey (whole sheet, only when the picker is on Auto)
```

```ts
type Mode = 'major' | 'minor';
type Key = { tonic: PitchClass; mode: Mode };          // PitchClass = 0..11
type Note = { letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G'; accidental: -1 | 0 | 1 };
type ParsedChord = { root: Note; suffix: string; bass?: Note };
type Degree = { number: 1|2|3|4|5|6|7; accidental: -1 | 0 | 1 };
type NotationStyle = 'roman' | 'arabic';

type LineToken =
  | { kind: 'header'; text: string; column: number }
  | { kind: 'marker'; text: string; column: number }
  | { kind: 'chord'; text: string; column: number; chord: ParsedChord };

type KeyRegion = { startLine: number; key: Key; reason: 'start' | 'hint' | 'repeat' };
type KeyDetection = { key: Key; guessed: boolean; runnerUp?: Key; regions: KeyRegion[] };

detectKey(sheet: string): KeyDetection | null
convert(sheet: string, key: Key | readonly KeyRegion[], style: NotationStyle): string
```

`convert` takes the key, or the key regions, as an argument and never detects them. The UI calls `detectKey` only when the picker is on `Auto`. This keeps conversion testable independently of the least certain piece.

### Decision: Degrees are the internal model

Chords are reduced to `Degree` + opaque suffix before rendering. Roman and Arabic are two renderers over the same data, and later transposition is a third.

### Decision: Mode affects detection only

Degrees are measured against the major scale of the tonic in both modes (`C` in A minor is `bIII`). The key's mode is used by detection and shown in the UI, and does not change numbering. One consequence: C major and C minor give the same output, so detection never offers one as the runner-up of the other.

### Decision: The chord grammar is a closed vocabulary, narrowed where it makes words

A token is `root suffix? (/bass)?`. Root and bass are an upper-case letter `A`–`G` and at most one accidental. The suffix is any run of vocabulary items, optionally with one parenthesised group; it is never interpreted by conversion.

Three items are narrower than their loose form, each because the loose form turns a common word into a chord:

| Item | Accepted | Rejected | Word it would admit |
| --- | --- | --- | --- |
| `ma` | `Cma7`, `Cma9` | `Cma` | `Emma`, `Gamma` |
| `o` (diminished) | `Co7` | `Co` | `Go`, `Do` |
| `-` (minor) | `C-7`, `Cm7-5` | `C-` | none, but `C-G` must stay two chords |

Rejected on purpose, to become fixtures if they turn up in real sheets: lower-case roots and basses (`am`, `D/f#`), double accidentals (`Bbb`, `F##`, `Cx`), German `H`, `dom7`, `C7/9`, polychords (`C/Em`), spaces inside parentheses (`C7(b9 #11)`), the bare minus (`C-`).

`fixtures/chord-tokens.json` holds the grammar as data: 25 roots x 175 suffixes x 12 basses (about 52,000 chords) that must parse to exactly their parts, plus single accept cases and a reject list with a reason per row. A grammar change is a change to that file first.

### Decision: Decoration is handled by the line classifier, not the chord parser

`parseChord` accepts a bare chord and nothing else: `(C)`, `C,`, `C|` and `C-G` are not chords. The classifier splits a word that is neither a chord nor a marker into pieces, reading left to right and always taking the longest chord it can:

| Piece | Allowed where |
| --- | --- |
| bar line, single or double, with or without repeat dots | anywhere except straight after a dash |
| `(` | before a chord |
| chord, or `N.C.` | anywhere |
| `)` | after a chord, a star or another `)` |
| `,` | after a chord, a star or `)` |
| `*`, `**` | after a chord |
| `-` | between two chords |

A word that does not split this way makes the whole line a text line, as before (ADR 0005). Trying the whole word as a chord first keeps `A-7` one chord, and taking the longest chord prefix makes `A-7-D7` split as `A-7`, `-`, `D7`.

The pieces come out as ordinary tokens that touch: `|C` is a marker at column 0 and a chord at column 1. Nothing else in the token model changed, so the walking-skeleton `convert` still works. Two tokens are glued exactly when the second starts where the first ends; alignment (task group 6) must keep glued tokens adjacent and move them as one unit.

Tab lines stay text because a string name followed by `|-` does not split: `-` is only allowed between two chords. Chord diagrams stay text because a repeat count has at most two digits, so `x32010` is not one.

Known line shapes that pass through today, to become fixtures if real sheets need them: headers without a colon or brackets (`Intro  G  D`), annotations (`C (hold) G`), a repeat glued to a parenthesis (`(C G)x2`), ChordPro brackets, chords glued to a full stop, a zero-width space pasted next to a chord.

### Decision: Chord quality is read separately, for detection only

`chordQuality(suffix)` maps a suffix to one of seven classes: `maj`, `maj7`, `min`, `dom`, `dim`, `aug`, `sus`. Key detection needs to know that `Bm7b5` is the vii of C and that `G7` wants to resolve; conversion needs none of it. Keeping the reader out of `parseChord` keeps "the suffix is opaque" true for everything the user sees.

The order of the checks matters and is fixed by the table in `fixtures/chord-tokens.json`: `no3` first (no third wins over everything), then diminished symbols, then minor (which becomes `dim` with a flat fifth), then augmented (which becomes `dom` with a seventh), then major seventh, then dominant, then suspended, else `maj`.

### Decision: Key detection scores 24 keys per chord, from one table of weights

`KEY_WEIGHTS` in `keyScore.ts` holds every number: a fit table per mode (interval above the tonic x quality class), and the bonuses.

```
score(key) = ( Σ fit(key, chord)
             + tonic   × occurrences of the tonic chord
             + cadence × arrivals on the tonic chord from its V or V7 ) / chord count
           + first  (the first chord is the tonic chord)
           + last   (the last chord is the tonic chord)
```

- Diatonic chords of matching quality fit 1; `V7` fits 1.1; borrowed chords and secondary dominants fit between 0.2 and 0.6; anything not in the table fits 0.
- Dividing by the chord count makes the score independent of the sheet's length, so one margin works for every sheet.
- Ties keep major before minor, then the tonic nearest above the first chord's root. That order does not depend on the key the sheet is written in, so moving a sheet by an interval moves the answer by the same interval (a property test checks this).
- The runner-up is the best key on a different tonic. The result is `guessed` when it beats the runner-up by less than `margin`.

Weights were set from a sweep over the corpus, not by hand. With `first` and `last` at 0, about 20 of 70 entries fail: without them a relative minor cannot be told from its major. From `first = last = 0.25` upwards, with `tonic` between 0.25 and 0.75 and `cadence` between 0 and 1, the result is a plateau of the same two misses. The values chosen sit in the middle of that plateau. Raising `first` above `last` breaks sheets whose verse starts on vi.

Current baseline: 68 of 70 (97%). The two misses are a two-chord `G C` vamp (read as V–I in C) and a `D C G` loop (read as G major); both are marked `hard` in the corpus, both come back `guessed` with the labelled key as runner-up, and a test holds all three facts. 11 of the 70 entries are reported as guessed.

The corpus was written alongside the scorer and labelled from the progressions, so 97% is an upper bound on real-world accuracy, not an estimate of it. It grows by the project's fixture rule: a sheet detected wrongly in real use is added before anything is tuned.

### Decision: Key hints, and the capo trap

A hint that precedes every chord, or follows them all, is the home key and is not guessed. Sheets from chord sites often state the sounding key next to a capo and write the chords as shapes (`Capo: 2`, `Key: A`, chords `G C D`). Using A there would number `G` as `bVII`. So when a capo and a home key are both stated, the stated key and the key a capo's worth lower are both scored, and the lower one is used only if it scores strictly higher; the result is then `guessed` with the stated key as runner-up.

### Decision: Key changes are regions, found from two signals only (ADR 0008)

`detectKey` returns regions; `convert` numbers each chord line in the key of its region. A region starts for one of two reasons:

1. **`hint`**: a key hint with chords on both sides of it.
2. **`repeat`**: a section that repeats an earlier section at another pitch. The last chorus a tone up is the common case.

How repeats are found:

- Sections are split at headers when the sheet has any, otherwise at blank lines. A key hint always starts a section.
- Section B repeats section A when, over the length of the shorter one, every root is moved by the same interval and every quality class is unchanged, with at least 3 chords and 3 different roots compared. Comparing only the shorter length lets a modulated chorus carry an extra tag line.
- An exact repeat (interval 0) is looked for first, so a verse that returns after a modulated solo goes back to the original key.
- A transposed repeat is not a key change when both sections together fit one major scale: `Em C G` then `Bm G D` is a sequence inside G major.
- A section that repeats nothing stays in the key before it.

The home key is scored after the repeats are found: each repeated section is moved back by its interval first, so a song that spends two of its three sections in the new key is still scored as one body of evidence in the old one.

What this deliberately does not detect: a change into new material (a bridge in a new key that repeats nothing), a change inside a section, and any change in a sheet with no headers and no blank lines. Those chords get accidentals in the home key. A wrong key change renumbers a whole section and is worse than a missed one, so a signal has to be near-certain to be used. `fixtures/key-changes.json` lists 9 sheets with a key change, 2 capo sheets, and 8 sheets that must produce no change; all are checked for exact regions.

### Decision: Alignment works on units, and leaves tabs alone

To build in task group 6. A unit is a run of glued tokens (most units are a single chord). Each unit starts at the source column of its first token, shifted right only as far as needed to leave one space after the previous unit. Inside a unit the tokens are concatenated. A gap that contains a tab is copied byte for byte: tab stops cannot be shifted by a column, and they realign on their own in most viewers.

### Decision: UI state

Plain React state plus `localStorage` for last input and notation style. No router, no state library. Output is derived on render; conversion is fast enough not to need memoisation or a worker.

With the picker on `Auto` the UI passes `detection.regions` to `convert` and lists the key changes next to the key. A manual key is passed as a single key, which converts the whole sheet in it; per-region override is out of scope.

## Risks / Trade-offs

- [Line classification misreads an unusual sheet] → Lines pass through unchanged when in doubt; each real-world miss becomes a row in `fixtures/chord-lines.json` or a golden fixture.
- [Relative major/minor confusion in detection] → `guessed` flag, runner-up one tap away, manual picker; confusions count as failures in the corpus score.
- [The corpus flatters the scorer] → It was authored with it. Real sheets that fail are added to it; the baseline list may only shrink.
- [A false key change renumbers a section] → Only hints and near-exact transposed repeats start a region; a manual key removes all regions.
- [Mixolydian and two-chord vamps] → Not decidable from chords alone; they are reported as guesses.
- [Proportional fonts break alignment] → Output is rendered in a monospaced font and copied as plain text; alignment elsewhere is the reader's concern.
- [GitHub Pages serves from a sub-path] → Set Vite `base` and the PWA scope in the skeleton, verified by the first deploy.

## Open Questions

- Whether unparseable-but-chord-like lines should be flagged in the UI: deferred until real use shows the need.
- Whether a manual key should keep detected key changes by moving them with the home key: deferred; the regions are relative by construction, so it is a small addition if wanted.
- Whether headers without a colon (`Intro  G  D`) are common enough in real sheets to accept.
