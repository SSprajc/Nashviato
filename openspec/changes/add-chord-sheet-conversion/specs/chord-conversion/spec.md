# Delta for Chord Conversion

## Purpose

Turn a pasted chord-over-lyrics sheet into the same sheet with number notation in place of letter chords, given a key.

## ADDED Requirements

### Requirement: Chord token grammar

The system SHALL recognise a token as a chord when it consists of a root (`A`–`G` with optional `#`, `b`, `♯` or `♭`), an optional suffix, and an optional `/` followed by a bass note in root syntax. The suffix SHALL be kept as an opaque string. `H` SHALL NOT be recognised as a root. Roots and basses SHALL be upper case and SHALL carry at most one accidental.

The suffix SHALL be built only from chord vocabulary, so that words are not read as chords: qualities (`maj`, `Maj`, `MAJ`, `M`, `ma` before a number, `m`, `min`, `Min`, `mi`, `-` before a number, `dim`, `aug`, `+`, `sus`, `alt`), quality symbols (`°`, `º`, `ø`, `Ø`, `Δ`, `△`, and `o` before `7`), extensions (`2`, `4`, `5`, `6`, `7`, `9`, `11`, `13`, `6/9`), alterations (an accidental before `5`, `6`, `9`, `11` or `13`), added tones (`add` before `2`, `4`, `6`, `9`, `11` or `13`, with an optional accidental) and omitted tones (`no3`, `no5`, `omit3`, `omit5`). Any run of these MAY be wrapped in one pair of parentheses, with commas between items inside it. `fixtures/chord-tokens.json` is the reference list of accepted and rejected tokens.

#### Scenario: Extended chord parses

- **WHEN** the token is `F#m7b5`
- **THEN** the root is `F#`, the suffix is `m7b5`, and there is no bass

#### Scenario: Slash chord parses

- **WHEN** the token is `D/F#`
- **THEN** the root is `D`, the suffix is empty, and the bass is `F#`

#### Scenario: Parenthesised suffix parses

- **WHEN** the token is `C(add9)`
- **THEN** the root is `C` and the suffix is `(add9)`

#### Scenario: Ordinary words are not chords

- **WHEN** the token is `Dad`, `Be`, `Hm` or `Hello`
- **THEN** it is not recognised as a chord

#### Scenario: Symbol qualities parse

- **WHEN** the tokens are `C°7`, `Bø7`, `FΔ7` and `A-7`
- **THEN** the suffixes are `°7`, `ø7`, `Δ7` and `-7`

#### Scenario: Alterations in parentheses parse

- **WHEN** the token is `G7(b9,#11)/B`
- **THEN** the root is `G`, the suffix is `7(b9,#11)` and the bass is `B`

#### Scenario: Six-nine is a suffix

- **WHEN** the token is `C6/9/E`
- **THEN** the suffix is `6/9` and the bass is `E`

#### Scenario: Loose spellings that make words are rejected

- **WHEN** the token is `Emma`, `Go`, `Do` or `C-`
- **THEN** it is not recognised as a chord

#### Scenario: Chord token table

- **WHEN** every root, suffix and bass listed in `fixtures/chord-tokens.json` are combined, and every token of its accept and reject lists is parsed
- **THEN** each combination and each accepted token parses to exactly its root, suffix and bass, and no rejected token parses

### Requirement: Line classification

The system SHALL treat a line as a chord line only when, after an optional header, every word on it is a chord, an allowed marker, or chords glued to allowed decoration, and at least one is a chord. Every other line SHALL be returned byte-for-byte unchanged. The output SHALL have the same number of lines as the input.

Allowed markers are `N.C.` (also `NC`, `N.C`, `n.c.`), bar lines (`|`, `||`, `|:`, `:|` and their combinations), `-`, `–`, `—`, `>`, `→`, `%`, `/`, `.`, a lone `(` or `)`, and repeat counts of one or two digits (`x2`, `2x`, `X2`, `×2`, `(x2)`).

Allowed decoration glued to a chord is: a bar line before or after it (`|C`, `G|`), an opening parenthesis before it and a closing one after it (`(C`, `Am)`, `(G/B)`), a comma after it (`C,`), footnote stars after it (`C*`), and a single dash joining it to the next chord (`C-G-Am`). Glued pieces SHALL be reported as separate tokens that touch, and SHALL be copied to the output unchanged. A word that is itself a chord is never split (`A-7` is one chord). `fixtures/chord-lines.json` is the reference list of line shapes.

A header is a bracketed label (`[Verse 1]`) or one word, optionally followed by a number, ending in a colon (`Intro:`, `Verse 2:`), and contains at least one letter. Lines labelled `Key:`, `Tonality:`, `Tuning:` or `Capo:` are never chord lines.

#### Scenario: Chord line is converted

- **WHEN** the key is C major and the line is `C   G   Am  F`
- **THEN** the line's chords are replaced with `I`, `V`, `VIm` and `IV`

#### Scenario: Lyric line containing chord-like words is unchanged

- **WHEN** the line is `A Dad and a G-man`
- **THEN** the line is returned unchanged

#### Scenario: Single chord on a line is a chord line

- **WHEN** the key is C major and the line is `Am`
- **THEN** the output line is `VIm`

#### Scenario: Header with trailing chords

- **WHEN** the key is G major and the line is `Intro: G  D  Em  C`
- **THEN** `Intro:` is kept and the chords become `I`, `V`, `VIm` and `IV`

#### Scenario: Tab line is unchanged

- **WHEN** the line is `e|---3---2---0---|`
- **THEN** the line is returned unchanged

#### Scenario: Markers pass through

- **WHEN** the key is C major and the line is `| C  | N.C. | G  x2`
- **THEN** `|`, `N.C.` and `x2` are kept and the chords become `I` and `V`

#### Scenario: Bar lines touching chords

- **WHEN** the line is `|C  G|Am  F|`
- **THEN** it is a chord line whose tokens are `|`, `C`, `G`, `|`, `Am`, `F`, `|`

#### Scenario: Chords in parentheses

- **WHEN** the line is `C  (G/B)  Am`
- **THEN** it is a chord line whose tokens are `C`, `(`, `G/B`, `)`, `Am`

#### Scenario: Comma-separated chords

- **WHEN** the line is `Intro: G, D/F#, Em`
- **THEN** it is a chord line with the header `Intro:` and the chords `G`, `D/F#`, `Em`, each comma kept as a marker

#### Scenario: Dash-joined chords

- **WHEN** the line is `A-7-D7-Gmaj7`
- **THEN** it is a chord line with the chords `A-7`, `D7` and `Gmaj7` joined by `-` markers

#### Scenario: Footnote star

- **WHEN** the line is `C*  G`
- **THEN** it is a chord line with the chords `C` and `G` and the marker `*`

#### Scenario: Tab line whose string name is a chord

- **WHEN** the line is `E|---3---2---0---|`
- **THEN** the line is returned unchanged

#### Scenario: Annotation makes the line pass through

- **WHEN** the line is `C (hold) G` or `C  x32010`
- **THEN** the line is returned unchanged

#### Scenario: Line shape table

- **WHEN** every line of `fixtures/chord-lines.json` is classified
- **THEN** each chord line splits into exactly its listed tokens, each at the position of its text, and each pass-through line is not a chord line

### Requirement: Degree calculation

The system SHALL number a root by its interval above the key's tonic, measured against the major scale of that tonic, in both major and minor keys. A root on that scale SHALL be the plain degree whatever its spelling. A root off that scale SHALL take an accidental before the degree: `#` of the degree below when the source is spelled with a sharp, `b` of the degree above when spelled with a flat, and `bII`, `bIII`, `#IV`, `bVI`, `bVII` when spelled natural.

#### Scenario: Diatonic chords in a major key

- **WHEN** the key is G major and the chords are `G`, `Am`, `Bm`, `C`, `D`, `Em`
- **THEN** the output is `I`, `IIm`, `IIIm`, `IV`, `V`, `VIm`

#### Scenario: Minor key numbers from the minor tonic

- **WHEN** the key is A minor and the chords are `Am`, `C`, `F`, `G`, `E7`
- **THEN** the output is `Im`, `bIII`, `bVI`, `bVII`, `V7`

#### Scenario: Off-scale root follows source spelling

- **WHEN** the key is C major and the chords are `F#dim` and `Gb`
- **THEN** the output is `#IVdim` and `bV`

#### Scenario: Natural off-scale root uses the default accidental

- **WHEN** the key is E major and the chords are `G`, `C`, `D`
- **THEN** the output is `bIII`, `bVI`, `bVII`

#### Scenario: Enharmonic spelling of a scale tone is plain

- **WHEN** the key is F major and the chord is `A#`
- **THEN** the output is `IV`

#### Scenario: Degree accidentals are written in ASCII

- **WHEN** the key is C major and the chords are `E♭` and `F♯m7♭5`
- **THEN** the output is `bIII` and `#IVm7♭5`

#### Scenario: Degree table

- **WHEN** every spelled note of `fixtures/degrees.json` is numbered in each of its 12 keys
- **THEN** the degree equals the table entry, for the major and the minor key on that tonic

### Requirement: Quality and suffix pass-through

The system SHALL copy the chord suffix to the output exactly as written and SHALL NOT infer, normalise or correct chord quality.

#### Scenario: Non-diatonic major chord stays major

- **WHEN** the key is C major and the chord is `D`
- **THEN** the output is `II`

#### Scenario: Suffix is copied verbatim

- **WHEN** the key is C major and the chords are `Fmaj7`, `Gsus4`, `E7#9`
- **THEN** the output is `IVmaj7`, `Vsus4`, `III7#9`

### Requirement: Slash chords

The system SHALL convert the bass note of a slash chord as a degree of the key, using the same rules as roots.

#### Scenario: Diatonic bass

- **WHEN** the key is C major and the chord is `G/B`
- **THEN** the output is `V/VII`

#### Scenario: Off-scale bass

- **WHEN** the key is C major and the chord is `D/F#`
- **THEN** the output is `II/#IV`

#### Scenario: Bass follows its own spelling

- **WHEN** the key is C major and the chords are `C/Bb` and `C/A#`
- **THEN** the output is `I/bVII` and `I/#VI`

#### Scenario: Bass in a minor key

- **WHEN** the key is A minor and the chords are `Am/G` and `Am/G#`
- **THEN** the output is `Im/bVII` and `Im/VII`

#### Scenario: Suffix that contains a slash

- **WHEN** the key is C major and the chords are `C6/9` and `C6/9/E`
- **THEN** the output is `I6/9` and `I6/9/III`

### Requirement: Key regions

The system SHALL convert a sheet either in one key or in a list of key regions, each starting at a line and running to the next region. Every chord line SHALL be numbered in the key of the region that contains it. Regions SHALL NOT change which lines are chord lines or the number of lines.

#### Scenario: Chords after a key change are numbered in the new key

- **WHEN** the regions are C major from line 0 and D major from line 2, and the lines are `C  F  G`, an empty line and `D  G  A`
- **THEN** the output lines are `I  IV  V`, an empty line and `I  IV  V`

#### Scenario: Single key is one region

- **WHEN** the same sheet is converted in C major alone
- **THEN** the third line is `II  V  VI`

### Requirement: Notation style

The system SHALL render degrees as uppercase Roman numerals by default and SHALL render them as Arabic numerals when that style is selected. Accidentals, suffixes and bass notes SHALL be rendered the same way in both styles.

#### Scenario: Roman style

- **WHEN** the key is C major, the style is Roman and the chords are `Am`, `Bb`, `G/B`
- **THEN** the output is `VIm`, `bVII`, `V/VII`

#### Scenario: Arabic style

- **WHEN** the key is C major, the style is Arabic and the chords are `Am`, `Bb`, `G/B`
- **THEN** the output is `6m`, `b7`, `5/7`

### Requirement: Column alignment

The system SHALL start each converted chord at the column where the source chord started. When a converted chord would otherwise touch or overlap the previous one, it SHALL be shifted right so that exactly one space separates them, and later chords SHALL shift only as far as needed.

Tokens that touch in the source (a word split into glued tokens) SHALL be placed as one unit: the unit starts at the source column of its first token, its tokens stay adjacent, and the collision rule applies between units. Headers and markers SHALL keep their text and follow the same placement rule. A gap that contains a tab character SHALL be copied unchanged, with no shifting across it.

#### Scenario: Shorter output keeps columns

- **WHEN** the key is C major and the line is `C       G       Am`
- **THEN** the output is `I       V       VIm`

#### Scenario: Longer output avoids collision

- **WHEN** the key is C major and the line is `Am G C`
- **THEN** the output is `VIm V I`

#### Scenario: Glued tokens stay glued

- **WHEN** the key is C major and the line is `|Am  G|C   F|`
- **THEN** the output is `|VIm V|I   IV|`

#### Scenario: Dash-joined chords stay joined

- **WHEN** the key is C major and the line is `Am-G-F  C`
- **THEN** the output is `VIm-V-IV I`

#### Scenario: Gap with a tab is copied

- **WHEN** the key is C major and the line is `Am<TAB>G<TAB>C`, where `<TAB>` is a tab character
- **THEN** the output is `VIm<TAB>V<TAB>I`

### Requirement: Robustness

The system SHALL never fail on any text input. A token whose root or bass does not parse SHALL be treated as a non-chord, which makes its line a non-chord line.

#### Scenario: Malformed bass

- **WHEN** the line is `C/X  G`
- **THEN** the line is returned unchanged

#### Scenario: Empty input

- **WHEN** the input is empty
- **THEN** the output is empty

#### Scenario: Sheet without chords

- **WHEN** the input contains no chord lines
- **THEN** the output equals the input

#### Scenario: Capo line passes through

- **WHEN** the input contains the line `Capo: 3`
- **THEN** that line is unchanged and the chords are numbered as written
