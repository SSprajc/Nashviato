# Delta for Chord Conversion

## Purpose

Turn a pasted chord-over-lyrics sheet into the same sheet with number notation in place of letter chords, given a key.

## ADDED Requirements

### Requirement: Chord token grammar

The system SHALL recognise a token as a chord when it consists of a root (`A`–`G` with optional `#`, `b`, `♯` or `♭`), an optional suffix, and an optional `/` followed by a bass note in root syntax. The suffix SHALL be kept as an opaque string. `H` SHALL NOT be recognised as a root.

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

### Requirement: Line classification

The system SHALL treat a line as a chord line only when every token on it is a chord or an allowed marker (`N.C.`, `|`, `-`, `%`, `/`, `x2`, `(x2)` and other repeat counts). Every other line SHALL be returned byte-for-byte unchanged. The output SHALL have the same number of lines as the input.

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

#### Scenario: Shorter output keeps columns

- **WHEN** the key is C major and the line is `C       G       Am`
- **THEN** the output is `I       V       VIm`

#### Scenario: Longer output avoids collision

- **WHEN** the key is C major and the line is `Am G C`
- **THEN** the output is `VIm V I`

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
