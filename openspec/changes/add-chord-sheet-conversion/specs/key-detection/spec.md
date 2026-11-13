# Delta for Key Detection

## Purpose

Choose the most likely key of a chord sheet without user input, say how sure the choice is, and find the places where the sheet changes key.

## ADDED Requirements

### Requirement: Explicit key hint

The system SHALL use a key stated in the sheet in preference to any scoring, and SHALL report it as not guessed, with no runner-up. A key hint is a line that starts with `Key` or `Tonality` (any case; optionally preceded by `Original` or `New`, followed by `change`, `of`, `to`, `is` or `in`, and a `:`, `=` or `-`), followed by a note (`A`–`G`, upper case, with an optional accidental or the word `flat` or `sharp`) and an optional mode (`m`, `min`, `minor`, `M`, `maj`, `major`). Without a mode the key is major. A hint that precedes every chord, or follows them all, states the home key.

#### Scenario: Key line present

- **WHEN** the sheet contains the line `Key: Em` before its chords
- **THEN** the detected key is E minor and it is not marked as guessed

#### Scenario: Key line after the chords

- **WHEN** the sheet ends with the line `Key: Am` and no chords follow it
- **THEN** the detected key is A minor, it is not marked as guessed, and there is one key region

#### Scenario: Stated key with a capo

- **WHEN** the sheet states `Capo: 2` and `Key: A`, and its chords are `G C D G` and `Em C D G`
- **THEN** the detected key is G major, it is marked as guessed, and the runner-up is A major

### Requirement: Capo and the stated key

A stated key can be the sounding key while the chords are written as capo shapes. When the sheet states a capo fret (1 to 11) and a home key, the system SHALL score the chords against the stated key and against the key that many semitones lower, and SHALL use the lower key only when it scores strictly higher. In that case the result SHALL be marked as guessed with the stated key as runner-up, and later key hints in the sheet SHALL be lowered by the same amount.

#### Scenario: Stated key agrees with the shapes

- **WHEN** the sheet states `Capo 3` and `Key: G`, and its chords are `G C D G` and `Em C D G`
- **THEN** the detected key is G major and it is not marked as guessed

### Requirement: Chord quality reading

For scoring, the system SHALL read each chord suffix as one quality class: `maj`, `maj7`, `min`, `dom`, `dim`, `aug` or `sus` (no third: suspended, power chord, `no3`). Half-diminished chords are `dim`; seventh chords with a suspension or an augmented fifth are `dom`. Reading a suffix SHALL NOT change the suffix written to the output. `fixtures/chord-tokens.json` lists the class of every accepted suffix.

#### Scenario: Suffix classes

- **WHEN** the suffixes are `m7b5`, `7sus4`, `maj9`, `6/9`, `5` and `-7`
- **THEN** the classes are `dim`, `dom`, `maj7`, `maj`, `sus` and `min`

### Requirement: Scored detection

When no hint states the home key, the system SHALL score all 24 major and minor keys and return the highest. The score SHALL reward chords diatonic to the candidate key with matching quality, weighted by occurrence, SHALL give partial credit to common borrowed chords and secondary dominants, and SHALL add bonuses for every occurrence of the candidate's tonic chord, for every arrival on it from its V or V7, and when it is the first chord or the last chord. The score SHALL be per chord, so that it does not grow with the length of the sheet. Detection SHALL be deterministic, and moving every chord of a sheet by the same interval SHALL move the detected key by that interval.

#### Scenario: Plain major progression

- **WHEN** the chords are `G D Em C G D C G`
- **THEN** the detected key is G major

#### Scenario: Relative minor decided by first and last chord

- **WHEN** the chords are `Em C G D Em C D Em`
- **THEN** the detected key is E minor

#### Scenario: Cadence decides

- **WHEN** the chords are `Am Dm E7 Am`
- **THEN** the detected key is A minor

### Requirement: Tie-break and confidence

When a major key and its relative minor score equally, the system SHALL return the major key. The system SHALL return a runner-up alongside a scored result: the best-scoring key whose tonic differs from the result's, because a key on the same tonic gives the same numbers. The result SHALL be marked as guessed when its score exceeds the runner-up's by less than the confidence margin.

#### Scenario: Unresolvable tie prefers major

- **WHEN** the chords are `C Am F G` repeated with no clear first-or-last tonic advantage for A minor
- **THEN** the detected key is C major

#### Scenario: Close result is marked guessed

- **WHEN** the top two candidates score within the confidence margin
- **THEN** the result is marked as guessed and includes the runner-up

#### Scenario: Clear result is not marked guessed

- **WHEN** the chords are `G C D G`, `G C D G` and `Em C D G`
- **THEN** the detected key is G major and it is not marked as guessed

#### Scenario: Runner-up has a different tonic

- **WHEN** the chords are `C F G C`
- **THEN** the runner-up is not C minor

### Requirement: Key regions

The system SHALL report the keys of a sheet as regions: each has a start line, a key and a reason, the first starts at line 0 in the home key, and each later region has a different key from the one before it. A new region SHALL start only for one of two reasons:

- `hint`: a key hint with chords before it and chords after it. The region starts at the hint line.
- `repeat`: a section that repeats an earlier section in another key, or that repeats an earlier section exactly while the sheet is in another key. The region starts at the first line of the section and takes the mode of the home key.

Sections are divided by headers when the sheet has any, and otherwise by blank lines; a key hint always starts a section. A section repeats an earlier one when, over the length of the shorter, every chord root is moved by the same interval and every quality class is unchanged, with at least 3 chords and 3 different roots compared. A transposed repeat SHALL NOT count as a key change when both sections together use only the notes of one major scale. A section that repeats nothing SHALL stay in the key of the section before it.

The home key SHALL be scored on all chords that no later hint governs, with every repeated section moved back to the key of the section it repeats.

#### Scenario: Sheet in one key has one region

- **WHEN** the sheet has a verse `G D Em C` and a chorus `C G D G`
- **THEN** there is one region, G major from line 0

#### Scenario: Section repeated in a new key

- **WHEN** a chorus `C F G Am`, `C F G C` is followed by a chorus `D G A Bm`, `D G A D`
- **THEN** the regions are C major from line 0 and D major from the header of the second chorus, with reason `repeat`

#### Scenario: Key stated in the middle of the sheet

- **WHEN** the sheet is `Key: C`, `C F G C`, an empty line, `Key: D`, `Bm G A D`
- **THEN** the regions are C major from line 0 and D major from line 3, with reason `hint`

#### Scenario: Diatonic sequence is not a key change

- **WHEN** a verse `Em C G Em` is followed by a chorus `Bm G D Bm` and an outro `C D G G`
- **THEN** there is one region

#### Scenario: Borrowed chords are not a key change

- **WHEN** a verse `C G Am F` is followed by a bridge `Ab Bb C C` and the verse again
- **THEN** there is one region

#### Scenario: Home key is scored with the repeat moved back

- **WHEN** the sections are `C F G C`, `D G A D` and `D G A D`
- **THEN** the home key is C major

#### Scenario: Key change table

- **WHEN** detection runs over every sheet of `fixtures/key-changes.json`
- **THEN** the regions equal the listed regions exactly

### Requirement: No chords

The system SHALL return no key when the sheet contains no chords, whether or not it states a key.

#### Scenario: Lyrics only

- **WHEN** the sheet contains no chord lines
- **THEN** no key is returned

### Requirement: Corpus accuracy

The system SHALL detect the correct home key for at least 90% of the key corpus in `fixtures/key-corpus.json`, counting a relative major/minor confusion as wrong. The test suite SHALL record the entries that are detected wrongly and SHALL fail when any other entry is. Every recorded miss SHALL be an entry marked `hard`, and SHALL be reported as guessed with the labelled key as runner-up. No corpus entry SHALL produce a key change.

#### Scenario: Corpus run

- **WHEN** detection runs over every entry of the key corpus
- **THEN** at least 90% match the labelled key, and the misses are exactly the recorded ones
