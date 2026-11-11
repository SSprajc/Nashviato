# 0004: Paste is the only input; no scrapers, private APIs or proxies

Status: accepted (2026-11-11)

## Context

The original idea included opening a chord site in an in-app webview and scraping it. `Pilfer/ultimate-guitar-scraper` was proposed as the MVP's only source.

## Decision

The MVP takes pasted text only. Later content acquisition must follow these rules: user-initiated, one song the user is already viewing, read in the user's own browser session, never fetched by infrastructure we run, never stored remotely or redistributed.

## Reasons

- The proposed scraper is a Go client for Ultimate Guitar's private mobile API, reverse-engineered from the Android app. It has no license, no commits since November 2023, and an issue opened 2026-11-10 reports all tab fetches failing.
- Impersonating an official client against a private API is the highest-risk form of scraping, and a single source that can be cut off at any time.
- It would not remove any work: its output still needs the parser, key detection and rendering.
- A web page cannot read another origin's DOM, so the webview idea needs a native shell regardless.
- Chord sites' terms generally restrict automated access and their content is copyrighted. This was not checked against any specific site's current terms.

## Consequences

Planned order for later changes, each needing its own proposal:

1. Messy paste: paste a whole copied page; the app extracts the longest run of chord and lyric blocks.
2. Bookmarklet or browser extension that hands the current page's text to the app.
3. Native webview shell (Capacitor) as a last resort.

A server-side proxy that fetches chord pages is ruled out.
