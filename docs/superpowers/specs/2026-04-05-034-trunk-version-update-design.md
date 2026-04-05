# 0.34 And Trunk Version Update Design

## Summary

Update the calculator from a `0.32 / 0.33 / trunk` model to a
`0.32 / 0.33 / 0.34 / trunk` model, where:

- `0.34` represents the latest stable 0.34 release line
- `trunk` represents the current local `crawl/master` checkout, which the user
  has already refreshed and wants treated as the 0.35-era development baseline

The calculator will directly absorb changes that it already models today:

- spell datasets
- spell-name / school / flag types
- species rosters and species keys
- version defaults and feature flags
- calculator behavior that depends on species identity or versioned data

Changes that the calculator does not model today, but that may still matter for
future work, will be collected into an audit report instead of being added as
new app features in this pass:

- item and unrand changes
- mutation changes
- species passive / aptitude / gameplay changes beyond what current calculators
  already use
- formula-adjacent Crawl changes that do not require an immediate app change

## Problem Statement

The repository currently supports three versions:

- `0.32`
- `0.33`
- `trunk`

That is now stale. DCSS `0.34` is released, and the local Crawl checkout's
`master` branch is the desired baseline for current `trunk`.

This creates two distinct maintenance needs:

1. The app must actually support `0.34` as a first-class version.
2. The existing `trunk` data and assumptions must be refreshed against the
   current Crawl source, because game content and species identities have moved
   since the older trunk snapshot currently stored in this repo.

The risky part is that version updates are not limited to spell list changes.
They can also alter:

- species names and keys
- species passive traits that affect AC, EV, SH, or spell calculations
- item base values or artefacts that should be documented for later scope
- spell metadata that can change a calculator result without changing formulas

## Goals

- Add `0.34` as a supported calculator version.
- Refresh `trunk` to the current local `crawl/master` baseline.
- Keep `0.32` and `0.33` working unchanged.
- Update versioned spell data, spell types, species data, registry entries, and
  defaults so the app remains type-safe across all supported versions.
- Audit Crawl history between the `0.34` release line and current `master` for
  gameplay changes relevant to the calculator or nearby future work.
- Record audit findings in repo documentation, separating immediate code changes
  from follow-up candidates.

## Non-Goals

- Do not expand the app into a full item, mutation, or species-aptitude
  simulator in this pass.
- Do not add new calculator panels or UI solely for newly discovered Crawl
  mechanics.
- Do not assume formula changes without checking, but also do not rewrite the
  formula system unless the audit proves a current calculator regression.
- Do not drop older version support.

## Scope Decisions

### Directly Implemented In App Code

- `0.34` spell header ingestion, generated JSON, and generated type definitions
- refreshed `trunk` spell header ingestion, generated JSON, and generated type
  definitions
- `GameVersion` union and version ordering
- version registry entries
- versioned species maps
- default state selection and version-aware restore behavior
- calculator logic that depends on species identity or current version metadata
- tests covering the new version matrix

### Audit-Only In This Pass

- item and unrand additions, removals, renames, and numerical tuning
- mutation additions, removals, and renames
- species aptitude or passive changes not currently modeled by the app
- Crawl commits that touch spell-casting support code but leave the current app
  formulas unchanged

## Current Repo State

The current app stores version-specific behavior behind the version registry
layer introduced on 2026-04-04, which is the correct foundation for this work.
However, several parts of the code still hardcode the current three-version
matrix:

- `src/types/game.ts`
- `src/types/spells.ts`
- `src/types/species.ts`
- `src/versioning/speciesData.ts`
- `src/versioning/versionRegistry.ts`
- `src/scripts/extractSpellDataHeader.ts`

The app also still contains direct species-name assumptions that are no longer
safe for current trunk. One confirmed example is `armataur` being treated as a
deformed-body species in AC logic.

## Crawl Findings Incorporated Into The Design

### Stable 0.34 vs Current Trunk Is Not A Minor Delta

Exploration against the local `crawl` checkout showed that the current trunk
baseline includes meaningful content changes beyond the app's older trunk data.

Observed gameplay-relevant examples include:

- `Armataur` was replaced by `Anemocentaur`, and later renamed to
  `Gale Centaur`.
- the old rolling passive was replaced by `Stampede` and Four Winds-related
  mutation entries
- new item content was added, including `Athame`
- new unrand content was added, including `swamp witch's dragon scales`
- existing unrands were reworked or renamed, including `Zephyr`,
  `glaive of Prune` becoming `partisan of Prune`, and `amulet of the Four Winds`
  becoming `amulet of Tranquility`
- `spl-data.h` contains spell metadata changes such as
  `Summon Ufetubus -> Ufetubi Swarm` and `Wall of Brambles -> Cage of Brambles`

### Trunk Species Identity Must Follow Current Crawl, Not The Old App Snapshot

Current Crawl source contains `SP_GALE_CENTAUR` in the generated species enum
set, and the current trunk species data file is `gale-centaur.yaml`.

This means the trunk-side app update must not stop at `Anemocentaur`; it should
match the current `crawl/master` naming and species identity.

### Formula Changes Must Be Verified Explicitly

The user correctly flagged that spell formulas or adjacent calculation behavior
may have changed after the app's previous trunk snapshot.

Preliminary exploration did not show a net tree diff between the inspected
release baseline and current trunk for these formula-adjacent files:

- `crawl-ref/source/spl-cast.cc`
- `crawl-ref/source/spl-util.cc`
- `crawl-ref/source/player-equip.cc`
- `crawl-ref/source/skills.cc`
- `crawl-ref/source/player-stats.cc`

That is encouraging, but not enough to assume safety. Implementation should
explicitly verify whether the app's `formulaProfiles` still match current Crawl
behavior before leaving them unchanged.

## Proposed Design

### 1. Expand The Version Matrix To Four Supported Versions

Update the app to support:

- `0.32`
- `0.33`
- `0.34`
- `trunk`

`0.34` becomes a first-class stable version entry with its own spell dataset,
type definitions, species map, defaults, and tests. `trunk` remains a version
name in the app, but its backing data is refreshed from the current local
`crawl/master`.

### 2. Keep Version Data Fully Explicit

Do not collapse `0.34` into `trunk` or reuse older generated data by
assumption.

Each version should have its own:

- raw spell header source
- generated spell JSON
- generated spell TypeScript definitions
- species map entry
- registry entry

This preserves the purpose of the version-registry refactor: adding or updating
versions should be an explicit data operation, not a chain of scattered
conditionals.

### 3. Treat Species Changes As Versioned Data, Not Cosmetic Labels

Species changes between `0.34` and current trunk must be modeled through the
existing version-aware species system.

Concretely:

- `0.34` should keep the release-line species roster
- `trunk` should use the current trunk roster, including `Gale Centaur`
- any direct species string checks in calculator code must be reviewed for
  version-sensitive behavior

The most important immediate review target is AC logic around deformed-body
armor penalties. If current trunk `Gale Centaur` retains the effective passive
that the app currently associates with `armataur`, then the relevant logic
should move from a hardcoded string check to a version-correct species check.

### 4. Separate Code Changes From Content Audit

This pass should produce two outputs:

1. app code and tests updated for `0.34` and current `trunk`
2. an audit document that records relevant Crawl history between the chosen
   `0.34` release baseline and the current local `master`

The audit document should categorize findings into:

- directly reflected in this implementation
- verified as no current app impact
- likely future calculator scope

This keeps the current implementation bounded while preserving useful research
for later work.

## Files Expected To Change

### App Data And Version Wiring

- `src/data/spl-data.0.34.h`
- `src/data/generated-spells.0.34.json`
- `src/types/generated-spells.0.34.d.ts`
- `src/data/spl-data.trunk.<date>.h`
- `src/data/generated-spells.trunk.json`
- `src/types/generated-spells.trunk.d.ts`
- `src/scripts/extractSpellDataHeader.ts`
- `src/types/game.ts`
- `src/types/spells.ts`
- `src/types/species.ts`
- `src/versioning/speciesData.ts`
- `src/versioning/versionRegistry.ts`
- `src/versioning/defaultState.ts`

### Calculator Logic Review Targets

- `src/utils/acCalculation.ts`
- `src/utils/spellCalculation.ts`
- `src/utils/spellCanbeEnkindled.ts`
- any other file found by searching direct species-name checks or version
  assumptions

### Tests

- `src/versioning/__tests__/versionRegistry.test.ts`
- `src/versioning/__tests__/defaultState.test.ts`
- `src/versioning/__tests__/spellDataSelection.test.ts`
- `src/versioning/__tests__/versionDiff.test.ts`
- `src/versioning/__tests__/uiOptions.test.ts`
- targeted calculator tests that currently assume `armataur` as the default or
  trunk deformed-body species

### Documentation

- `docs/operations/versioning-workflow.md`
- `README.md` if supported versions or workflow examples are surfaced there
- a new audit note or operations document covering `0.34 -> trunk` Crawl
  changes

## Implementation Constraints

- Preserve support for `0.32` and `0.33`.
- Do not remove or rewrite the version registry abstraction.
- Prefer version-aware data lookups over new runtime `if (version === ...)`
  branches.
- If `Gale Centaur` and `Armataur` both need the same calculator treatment in
  different versions, express that through versioned species data or a helper,
  not by silently overwriting older species support.
- Keep the audit report factual and source-driven. It should summarize changes,
  not speculate beyond what the inspected Crawl files and commits support.

## Risks

### Species-Key Breakage

Adding `0.34` and updating trunk species names will widen the versioned type
space. Any code that assumes a species exists in all versions can fail at the
type level or at runtime.

### Hidden Calculator Behavior Drift

Even when formulas themselves do not change, spell metadata, armor values,
species passives, or item encumbrance changes can still alter expected results.

### Incorrect Release Baseline Selection

The implementation must pin `0.34` to an explicit release-line source rather
than an ambiguous moving branch. If the local Crawl checkout does not have the
needed release ref available, the implementation should fetch or import the
corresponding stable source explicitly before generating artifacts.

## Verification Strategy

Implementation should finish with evidence for all of the following:

- `0.34` data files generate cleanly
- refreshed trunk data files generate cleanly
- version registry tests pass for all four supported versions
- default state tests pass with the new version matrix
- spell data selection tests prove `0.34` and `trunk` use distinct datasets
- calculator tests still pass after species and spell-data updates
- the audit document is written and checked into the repo

## Deliverables

- updated app support for `0.32 / 0.33 / 0.34 / trunk`
- refreshed trunk data sourced from current local `crawl/master`
- version-aware species handling updated for current trunk naming
- documentation explaining how to repeat this update flow later
- a Crawl audit report covering release-to-trunk changes relevant to calculator
  maintenance
