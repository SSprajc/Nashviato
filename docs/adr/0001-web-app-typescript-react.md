# 0001: Web app in TypeScript and React, framework-free core

Status: accepted (2026-11-11)

## Context

The app must be usable on both PC and phone from day one. The author's main stacks are Kotlin/Compose and Flutter.

## Decision

Build a static web app with TypeScript, React and Vite, installable as a PWA, hosted on GitHub Pages. All music logic lives in `src/core` with no React, DOM or I/O dependencies.

## Reasons

- One URL covers desktop and mobile with no store release.
- Web is the primary target, and the app is text-heavy; that is where Flutter web is weakest and where Compose's web target is least mature. Flutter was considered and rejected by the author in favour of TypeScript.
- A pure core is testable in milliseconds and can move under a native shell later.

## Consequences

- A browser page cannot read another site's DOM, so "browse and convert inside the app" is not possible in this build (see 0004).
- A native shell, if ever needed, means Capacitor or a port of the core.
