# 0008: Key changes are regions, found from hints and transposed repeats only

Status: accepted (2026-11-14)

## Context

The MVP proposal listed per-section keys and modulation detection as out of scope: one key per sheet. Real sheets change key, most often by repeating the last chorus a semitone or a tone up. Numbered in the home key, that chorus comes out as a row of accidentals (`II`, `VI`, `III` for what the band hears as `IV`, `I`, `V`), which is the opposite of what a number chart is for. A Nashville chart writes the new key and keeps the numbers.

Detecting key changes in general is unreliable. Borrowed chords, secondary dominants, a bridge in the relative minor and a passing ii–V–I all look like a new key to a window-by-window scorer, and a false change renumbers a whole section.

## Decision

- Key detection returns a list of key regions (start line, key, reason). Conversion takes one key or a list of regions and numbers each chord line in the key of its region. The first region is the home key.
- A region starts for one of two reasons only:
  - a key hint in the sheet with chords before and after it;
  - a section that repeats an earlier section at another pitch, or returns to it exactly.
- A repeat needs every root moved by the same interval and every chord quality unchanged, over at least 3 chords and 3 different roots. A transposed repeat that fits one major scale together with its original is not a key change.
- The key is never changed inside a section, and never on the strength of scoring a section by itself.
- A manual key in the UI converts the whole sheet in that key and drops the regions.

## Reasons

- A transposed repeat is direct evidence: the same progression at another pitch has no other reading once it leaves the scale. It needs no threshold tuned against a corpus.
- Both signals are explainable to the user in a sentence, which matters when the app shows "key change at the last chorus".
- A missed change is visible and harmless: the chords are still correct, with accidentals. A false change is silently wrong. The rule set is chosen to miss.
- Returning regions from the start costs almost nothing now and avoids changing the signature of `convert` and the UI contract later.

## Consequences

- A change into new material (a bridge in a new key that repeats nothing) is not detected.
- A sheet with no headers and no blank lines has one section, so no change is detected in it.
- The home key is scored with repeated sections moved back to the key of their original, so the regions have to be found before the key is.
- Per-region manual override is not offered. If it is wanted, it is a UI change on top of the same data.
- The proposal's out-of-scope list no longer includes per-section keys or modulation detection. Transposition stays deferred (ADR 0006).
