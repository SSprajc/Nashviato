# 0006: Transposition is deferred; the core stays degree-based so it can be added

Status: accepted (2026-11-11)

## Context

Transposition was moved into the MVP and then removed again by the author. Numbers are key-independent, so the MVP's output does not need it.

## Decision

No transposition in the MVP. The core converts chords to degrees before rendering, which a later letter-chord renderer can reuse.

## Intended design for the later change

- Output mode toggle: Numbers or Letters. Transposing means choosing a target key, with semitone steppers; the control appears only in Letters mode.
- Spelling follows the target key's signature. Off-scale chords keep the accidental direction of their degree (`bVII` stays flat-spelled).
- Target keys use common names: Db, Eb, Ab, Bb, F#. No double sharps or flats; respell to the simple equivalent.
- Mode is fixed: minor songs transpose to minor keys.
- Suffix copied; bass transposed and spelled like a root.
- No capo helper.

## Reasons

- Keeps the first change small and focused on the number output.
- Recording the design now avoids choosing a data model that would block it.
