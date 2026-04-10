# Morgue Import Design

## Summary

Add a morgue import flow to the calculator so a user can paste a DCSS morgue
dump and have the calculator automatically overwrite every supported field with
parsed data from `dcss-morgue-parser`.

The import flow should stay intentionally narrow:

- parse a pasted morgue text in the browser
- normalize the parser output into the calculator's internal versioned state
- overwrite every supported calculator field
- show a version-confirmation modal only when the morgue version implies a
  different calculator version than the one currently selected
- show an import result summary panel that lists which fields were applied and
  which were skipped

The import flow should not expand the calculator into a full morgue viewer or
item inspector. Fields that the calculator does not model today should be left
out of state and reported as skipped.

## Problem Statement

The current app requires the user to manually enter species, stats, armour,
shield, auxiliary equipment flags, and spell-related skills. That is workable
for quick experiments, but it is tedious for validating a real in-progress or
finished character against a morgue.

The new `dcss-morgue-parser` package can parse browser-side morgue text into a
structured record with version, stats, equipment, skills, spells, and mutation
data. The repository does not yet have a safe boundary that translates that
record into the app's narrower calculator model.

The design challenge is therefore not parsing itself. It is building a clean
mapping layer that:

- respects the app's existing versioned state model
- overwrites supported fields aggressively
- does not invent unsupported calculator state
- explains partial imports clearly to the user

## Goals

- Add an `Import Morgue` entry point near the top-level calculator controls.
- Allow users to paste morgue text directly into an in-app modal.
- Parse morgue text in the browser with `dcss-morgue-parser`.
- Normalize parsed data into the calculator's versioned internal state.
- Overwrite every currently supported calculator field that can be mapped
  reliably.
- When the parsed morgue version maps to a different supported app version,
  show an in-app confirmation modal before switching versions and applying.
- Show a post-import summary panel with separate `Applied` and `Skipped`
  sections.
- Preserve best-effort behavior: partial mapping success should still apply the
  supported subset.

## Non-Goals

- Do not add support for calculator concepts the app does not model today, such
  as rings, amulets, gizmos, talismans, full mutation state, or form state.
- Do not build a generic morgue browser, storage layer, or fetch flow.
- Do not block imports for partial mapping ambiguity beyond version mismatch.
- Do not add browser-native `window.confirm` or `alert` interactions.

## User-Confirmed Scope Decisions

- Imported values should overwrite all supported fields rather than merging
  conservatively with existing manual input.
- If the parsed morgue implies a different supported game version than the
  currently selected version, the app should ask for confirmation in an in-app
  modal and then switch versions if confirmed.
- The import result should include a visible summary panel showing both applied
  and skipped fields.
- `wizardry` and `wildMagic` should be populated when they can be inferred
  reliably and otherwise reported as skipped without blocking the rest of the
  import.

## Current Repo State

The calculator state is centralized in `useCalculatorState`, and the top-level
calculator controls directly edit that state through `setState`. This is the
right place to consume an imported state object, but not the right place to
contain parsing and normalization rules.

Today the calculator state includes:

- version
- species
- strength, dexterity, intelligence
- armour, shield, orb
- armour, shields, dodging, and spellcasting skills
- versioned spell-school skills
- auxiliary armour booleans such as helmet, gloves, boots, cloak, barding, and
  second gloves
- spell-related modifiers `wizardry`, `wildMagic`, and `bodyArmourEgo`

The parser produces a broader record than the app can store. It includes:

- raw morgue version string
- canonical species plus optional species variant
- combat stats and base stats
- summary and detail equipment records for body armour, shield, orb, helmets,
  gloves, footwear, cloaks, amulets, rings, gizmos, and talisman
- complete skill maps
- spell rows
- mutation entries
- form

That mismatch means the implementation needs a dedicated translation layer.

## Proposed Design

### 1. Add A Dedicated Morgue Import Mapping Layer

Create a small import module that owns all translation between parser output and
calculator state. The parser result should not be wired directly into React
components or passed straight to `setState`.

This module should:

- normalize the parser's raw version string into one supported app version
- create a fresh default calculator state for that target version
- map supported parser fields into calculator fields
- leave unsupported fields out of state
- generate a structured import summary with `applied` and `skipped` entries

This keeps the import boundary explicit and avoids pushing conversion logic into
`App.tsx`, `Calculator.tsx`, or `useCalculatorState`.

### 2. Use Fresh Defaults, Then Overwrite Supported Fields

The imported state should be built from `buildDefaultCalculatorState(version)`,
not from the user's current manual state.

The intended order is:

1. parse morgue text
2. normalize the target app version
3. create the default state for that version
4. overwrite every supported field that can be mapped reliably
5. leave remaining unsupported fields at their normal defaults

This is the simplest way to honor the user's request that imported values
replace the current manual entry.

### 3. Treat Version Normalization As A First-Class Step

The parser exposes the raw morgue version string, while the app only supports:

- `0.32`
- `0.33`
- `0.34`
- `trunk`

The import layer should therefore normalize raw version strings into one of
those four values. The normalization should prefer explicit release lines when
available and map newer development morgues to `trunk`.

If the normalized import version differs from the currently selected version:

- do not apply immediately
- show an in-app confirmation modal
- if the user confirms, switch to the parsed version and apply
- if the user cancels, abort the import and leave the current state unchanged

If the normalized version matches the current selected version, apply
immediately without the extra confirmation step.

### 4. Keep UI State And Import Logic Separate

The UI should introduce three small pieces of user-facing state:

- a paste modal for entering morgue text
- a version-confirmation modal for cross-version imports
- a result summary panel or modal that appears after a completed import attempt

The UI should not be responsible for converting species names, equipment names,
or skill keys. It should only:

- collect text input
- trigger parse + map actions
- branch on success, parse failure, or version mismatch confirmation
- display the import summary

### 5. Apply Supported Fields Aggressively, Skip Unsupported Fields Explicitly

The import layer should fill every calculator field that can be mapped
reliably.

Supported fields to apply:

- `version`
- `species`
- `strength`
- `dexterity`
- `intelligence`
- `armour`
- `shield`
- `orb`
- `armourSkill`
- `shieldSkill`
- `dodgingSkill`
- `spellcasting`
- versioned school skills
- `helmet`
- `gloves`
- `boots`
- `cloak`
- `barding`
- `secondGloves` when the imported version and species support it
- `bodyArmourEgo` when it can be inferred from parsed item properties and the
  target version exposes that ego
- `wizardry` when parsed equipment properties expose a reliable `Wiz` count
- `wildMagic` when parsed mutations expose an active, reliable wild-magic level

Fields to skip in this pass:

- `amulets`
- `rings`
- `gizmo`
- `talisman`
- `form`
- raw spell rows other than choosing a supported target spell
- full mutation lists
- any detailed equipment semantics that the current calculator state cannot
  represent

The summary should list both the applied and skipped categories using labels
written for users rather than internal property names.

## Mapping Rules

### Version Mapping

The raw parser version should be normalized into the nearest supported app
version.

Expected behavior:

- raw `0.32` line -> `0.32`
- raw `0.33` line -> `0.33`
- raw `0.34` line -> `0.34`
- raw `0.35-a0`, `0.36-a0`, or any newer development string -> `trunk`

If normalization fails entirely, treat that as a skipped version mapping and
surface an import failure because the app cannot build a valid target state
without a supported version.

### Species Mapping

The parser returns canonical species display names, while the app uses versioned
internal keys such as `mountainDwarf` and `galeCentaur`.

The import module should maintain a normalization table from parser names to the
target version's species keys. It should:

- validate the mapped key against `speciesOptions(version)`
- reject species names that are not available in the normalized target version
- ignore `speciesVariant` unless it is required to disambiguate a supported app
  species key

The most important examples are:

- `Mountain Dwarf` -> `mountainDwarf`
- `Vine Stalker` -> `vineStalker`
- `Gale Centaur` -> `galeCentaur`
- `Draconian` -> `draconian`

### Body Armour, Shield, Orb, And Auxiliary Equipment

The parser exposes summary strings plus detail objects. The import layer should
prefer the detail objects when they exist and use summary strings only as a
fallback.

Rules:

- map body armour names to internal `ArmourKey`
- map shield names to internal `ShieldKey`
- map orb names to internal `OrbKey`
- infer `helmet`, `gloves`, `boots`, `cloak`, and `barding` booleans from the
  parsed equipped item arrays
- treat hats and scarves as unsupported for AC import because the current app
  only models `helmet` and `cloak`
- infer `secondGloves` only when the parsed version and item layout make that
  state explicit enough to trust

Unsupported auxiliary cases should not fail the import. They should be listed
under `Skipped`.

### Skill Mapping

The parser skill map uses Crawl-facing camelCase keys such as:

- `armour`
- `dodging`
- `shields`
- `spellcasting`
- `fireMagic`
- `translocations`

The app uses:

- direct scalar fields for `armourSkill`, `dodgingSkill`, `shieldSkill`,
  `spellcasting`
- versioned school-skill keys such as `fire`, `air`, `alchemy`,
  `translocation`

The mapping layer should:

- copy scalar skills directly into the matching calculator fields
- translate school names into the app's internal school keys
- only set school-skill values for schools that exist in the target version's
  default state
- leave unsupported parser skills such as `fighting`, `evocations`, or weapon
  skills out of state and report them as skipped when needed

### Target Spell Selection

The parser returns a spell list, while the app expects one selected
`targetSpell`.

The import layer should:

- try to select a parsed spell that exists in the target version's spell list
- prefer a memorized and castable spell if more than one option exists
- fall back to the target version's default spell when no parsed spell can be
  matched safely

The spell list itself should not be stored in calculator state in this pass.

### Wizardry And Wild Magic

`wizardry` and `wildMagic` should be treated as optional derivations, not hard
requirements for a successful import.

For `wizardry`:

- inspect equipped item details for `properties.booleanProps.Wiz`
- count the equipped sources that can be represented by the calculator's
  `wizardry` numeric field
- apply the count when the source attribution is clear
- otherwise leave the default value and add a skipped entry explaining that the
  effect could not be determined reliably

For `wildMagic`:

- inspect parsed mutations for an active wild-magic entry
- use the parsed mutation level when it is explicit and not suppressed
- ignore suppressed or ambiguous entries
- if no reliable level can be derived, keep the default value and report the
  skip reason in the import summary

These should not trigger an extra confirmation modal. They are best-effort
fields.

### Body Armour Ego

The app currently models only:

- `none`
- `command`
- `death`
- `resonance`

The import layer should inspect parsed body-armour detail properties and only
set one of those keys when the target version supports it and the parsed item
semantics clearly match one of them. Otherwise it should leave `bodyArmourEgo`
at the default value and report the skip.

## UI Flow

### Import Entry Point

Add an `Import Morgue` trigger near the existing top-level controls in `App.tsx`
so the feature is discoverable without interfering with the existing calculator
layout.

### Paste Modal

The first modal should contain:

- a multiline textarea
- an `Apply` action
- a cancel action

Submitting should run parse + normalization. Empty input should be rejected in
place without attempting a parse.

### Version Confirmation Modal

This modal appears only when:

- parse succeeds
- version normalization succeeds
- normalized import version differs from the current app version

The modal should explain that the pasted morgue was detected as a different
version and ask whether the user wants to switch versions and apply the import.

### Import Result Summary

After a successful import attempt, show a result panel with:

- import version used
- `Applied` list
- `Skipped` list with reasons where useful

Typical examples:

- applied: `Species`, `Stats`, `Body armour`, `Shield`, `Spell skills`
- skipped: `Amulets are not modeled in this calculator`, `Wild magic could not
  be inferred reliably`

### Parse Failure Feedback

If `parseMorgueText()` fails:

- do not modify calculator state
- show a failure panel or modal
- include the parser's reason in short user-facing text
- keep the feedback concise and avoid raw stack-like output

## Error Handling

### Hard Failures

Abort the import when:

- pasted text is empty
- `parseMorgueText()` returns `ok: false`
- version normalization cannot produce a supported app version
- species normalization fails for the normalized target version

### Soft Failures

Do not abort the import when:

- some equipped items cannot be mapped
- `wizardry` cannot be inferred reliably
- `wildMagic` cannot be inferred reliably
- some school-skill keys do not exist in the target version
- no parsed spell can be used as a `targetSpell`

Instead:

- apply the supported subset
- keep defaults for unsupported fields
- record those decisions in the summary

## Files Expected To Change

### Dependencies

- `package.json`
- lockfile if dependency installation changes it

### Import Mapping And Utilities

- new import utility module under `src/` for parser integration and state
  mapping
- new tests for version normalization and mapping behavior

### UI

- `src/App.tsx`
- possibly one or more new small UI components for:
  - paste modal
  - version confirmation modal
  - import result summary panel

### Existing State And Type Boundaries

- `src/hooks/useCalculatorState.ts` only if small helper surface changes are
  needed for applying imported state cleanly
- related type files if shared import-summary types are extracted

## Testing Strategy

### Mapper Unit Tests

Add focused tests for:

- version normalization from raw morgue version strings
- species display-name to internal-key mapping
- armour, shield, orb, and auxiliary-equipment mapping
- school-skill key translation
- `wizardry` derivation from item properties
- `wildMagic` derivation from active mutation entries
- applied and skipped summary generation

### UI Tests

Add tests for:

- opening the import modal
- version mismatch confirmation flow
- successful import showing the summary panel
- parse failure leaving state unchanged

### Fixture-Based Regression

Add at least one realistic morgue-text fixture or inline sample test that proves
the import pipeline can take a pasted morgue and produce the expected
calculator-relevant state for a real character.

## Risks And Tradeoffs

- The parser exposes more equipment detail than the calculator can currently
  store. Hiding that mismatch is worse than reporting it, so the summary must be
  treated as part of the feature rather than optional polish.
- Some equipment distinctions, such as hat versus helmet or scarf versus cloak,
  can affect AC if mapped naively. It is better to skip those cases than to
  silently overstate accuracy.
- Keeping all mapping rules in a dedicated module adds a small amount of file
  count, but it prevents the UI from becoming the place where game semantics are
  encoded.

## Open Implementation Guidance

- Favor exact, explicit name tables over fuzzy matching for species and
  equipment normalization.
- Prefer parser detail objects over summary strings when both are available.
- Keep the first implementation narrow and auditable. If later work expands the
  calculator model to rings, amulets, talismans, or form, that should be a
  separate feature rather than hidden inside this import pass.
