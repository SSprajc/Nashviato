# Delta for Converter UI

## Purpose

One screen, usable on phone and desktop browsers, that takes a pasted sheet and shows it in numbers.

## ADDED Requirements

### Requirement: Paste and convert

The app SHALL provide a text input for the sheet and a read-only, monospaced output that updates whenever the input, key or notation style changes, with no submit step.

#### Scenario: Paste shows numbers

- **WHEN** the user pastes a sheet containing chord lines
- **THEN** the output shows the sheet with numbers in place of the chords

### Requirement: Key selection

The app SHALL show the key in use and let the user choose any of 12 roots in major or minor, or `Auto`. `Auto` SHALL be the default and SHALL use key detection, including its key regions. A manual choice SHALL convert the whole sheet in the chosen key, ignoring detected key changes, and SHALL stay in effect until the user selects `Auto` again.

#### Scenario: Auto key shown

- **WHEN** a sheet is pasted with the key set to `Auto`
- **THEN** the detected key is displayed and used for the output

#### Scenario: Guessed key offers the runner-up

- **WHEN** the detected key is marked as guessed
- **THEN** the key is shown as a guess and the runner-up can be selected with one tap

#### Scenario: Manual override

- **WHEN** the user picks D major
- **THEN** the output is re-rendered in D major and stays so when the input is edited

#### Scenario: Key change shown

- **WHEN** a sheet whose last chorus repeats a tone higher is pasted with the key set to `Auto`
- **THEN** the key display names both keys and where the change happens, and the last chorus shows the same numbers as the earlier ones

#### Scenario: Manual key ignores key changes

- **WHEN** the user picks a key for that sheet
- **THEN** every chord line is numbered in the picked key and no key change is displayed

#### Scenario: No chords found

- **WHEN** the input contains no chord lines and the key is `Auto`
- **THEN** the key display reads "no chords found" and the output equals the input

### Requirement: Notation setting

The app SHALL let the user switch between Roman and Arabic numerals and SHALL remember the choice between visits.

#### Scenario: Switch to Arabic

- **WHEN** the user selects Arabic
- **THEN** the output is re-rendered with Arabic numerals and the choice persists after reload

### Requirement: Copy output

The app SHALL copy the converted sheet to the clipboard as plain text on one action.

#### Scenario: Copy

- **WHEN** the user activates Copy
- **THEN** the clipboard contains exactly the output text

### Requirement: Restore last input

The app SHALL restore the most recent input after a reload. It SHALL NOT keep a library of sheets.

#### Scenario: Reload

- **WHEN** the user reloads the page after pasting a sheet
- **THEN** the same input and its output are shown

### Requirement: Offline and private

The app SHALL work without a network connection after first load, SHALL be installable as a PWA, and SHALL NOT send sheet content anywhere.

#### Scenario: Offline use

- **WHEN** the app has been loaded once and the device is offline
- **THEN** the app opens and converts sheets
