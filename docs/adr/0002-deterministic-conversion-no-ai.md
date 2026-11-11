# 0002: Conversion is deterministic; no AI in the MVP or the conversion path

Status: accepted (2026-11-11)

## Context

An AI SDK was considered for cleaning input, helping detect the key and checking output.

## Decision

Parsing, key detection and numbering are deterministic code. The MVP ships no AI SDK and makes no network calls. AI never produces or rewrites chords or numbers.

## Reasons

- Chord-to-number conversion is arithmetic; a model adds latency and occasional errors and makes output untestable.
- A static web app cannot hide an API key; a bundled key is public.
- Correctness is checked by spec-derived tests and a fixture corpus, which also catch regressions.
- Key detection errors are handled by a "guessed" flag and a manual picker.

## Consequences

- If a later change adds AI, its only candidate job is extracting the song from a messy pasted page, behind an `extractSheet(text)` interface with a deterministic default and fallback, and with output verifiable as a subset of the input lines.
- Provider preference at that point: on-device browser model, then bring-your-own-key, then a serverless proxy. To be confirmed in its own ADR.
