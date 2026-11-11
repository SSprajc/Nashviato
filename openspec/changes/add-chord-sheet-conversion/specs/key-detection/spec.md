# Delta for Key Detection

## Purpose

Choose the most likely key of a chord sheet without user input, and say how sure the choice is.

## ADDED Requirements

### Requirement: Explicit key hint

The system SHALL use a key stated in the sheet (`Key: G`, `Key of Bb`, `Tonality: Em`) in preference to any scoring, and SHALL report it as not guessed.

#### Scenario: Key line present

- **WHEN** the sheet contains the line `Key: Em`
- **THEN** the detected key is E minor and it is not marked as guessed

### Requirement: Scored detection

When no hint is present, the system SHALL score all 24 major and minor keys and return the highest. The score SHALL reward chords diatonic to the candidate key with matching quality, weighted by occurrence, and SHALL add bonuses when the candidate's tonic chord is the first chord, is the last chord, or is approached by its V or V7. Detection SHALL be deterministic.

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

When a major key and its relative minor score equally, the system SHALL return the major key. The system SHALL return the runner-up key alongside the result and SHALL mark the result as guessed when the top two scores are within the confidence margin.

#### Scenario: Unresolvable tie prefers major

- **WHEN** the chords are `C Am F G` repeated with no clear first-or-last tonic advantage for A minor
- **THEN** the detected key is C major

#### Scenario: Close result is marked guessed

- **WHEN** the top two candidates score within the confidence margin
- **THEN** the result is marked as guessed and includes the runner-up

### Requirement: No chords

The system SHALL return no key when the sheet contains no chords.

#### Scenario: Lyrics only

- **WHEN** the sheet contains no chord lines
- **THEN** no key is returned

### Requirement: Corpus accuracy

The system SHALL detect the correct key for at least 90% of the key corpus in `fixtures/`, counting a relative major/minor confusion as wrong. The test suite SHALL fail if accuracy falls below the recorded baseline.

#### Scenario: Corpus run

- **WHEN** detection runs over every entry of the key corpus
- **THEN** at least 90% match the labelled key
