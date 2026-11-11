# 0007: Spec-driven workflow using the OpenSpec layout, kept light

Status: accepted (2026-11-11)

## Context

The project is small and solo, and is built with AI coding agents. Spec-driven tooling in late 2026 ranges from plain Markdown to heavier frameworks (GitHub Spec Kit, Kiro, BMAD).

## Decision

- Use the OpenSpec directory layout and file formats: `openspec/specs/<capability>/spec.md` as the source of truth, `openspec/changes/<name>/` with `proposal.md`, `design.md`, `tasks.md` and delta specs, archived on completion.
- Requirements use SHALL with `#### Scenario` blocks in WHEN/THEN form; each scenario maps to a named test.
- The `openspec` CLI is optional. The files are plain Markdown and the workflow in `AGENTS.md` works without it.
- A short hand-written root `AGENTS.md` holds only what an agent cannot infer from the code; `CLAUDE.md` imports it.
- Reasons for decisions go in `docs/adr/`, not in specs.

## Reasons

- Among current tools, OpenSpec is the lightest and is repo-native Markdown, which suits a one-person project; heavier frameworks add ceremony without making a spec more correct.
- Following its exact layout keeps the option of `openspec validate` and archive tooling at no cost.
- Scenario-to-test mapping is what makes the spec enforceable; without it specs drift.
- Agent instruction files are loaded into every session, so they stay short and specific.

## Consequences

- For a greenfield project `openspec/specs/` starts empty; the MVP's requirements live as `ADDED` deltas in the first change until it is archived.
- Formats were taken from the OpenSpec docs on 2026-11-11. Sources disagreed on some details (scenario bullet style, proposal section names); this repo uses the schema's variant. Re-check with `openspec validate` if the CLI is adopted.
