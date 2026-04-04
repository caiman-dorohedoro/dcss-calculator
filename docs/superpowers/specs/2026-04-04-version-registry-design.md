# Version Registry Design

## Summary

Refactor version handling so that version-specific behavior is configured in one place instead of being spread across data extraction scripts, runtime calculators, state defaults, and UI conditionals.

The chosen approach is:

- Introduce a central `versionRegistry` that owns per-version spell data, species data, defaults, feature flags, and formula profile selection.
- Introduce `formulaProfiles` so calculation code stops branching directly on version strings.
- Move version-specific species datasets into dedicated data objects rather than hardcoded `if (version === ...)` blocks.
- Keep spell extraction as-is for now, but change the generated outputs to feed the registry cleanly.
- Add operational documentation so future version updates follow a fixed checklist instead of memory.

This is intentionally a "structure first" refactor, not a full automation pass. It is designed to reduce change surface for future version additions while staying close to the current codebase.

## Problem Statement

The current project handles version differences in multiple unrelated places:

- spell header extraction script
- generated spell type wiring
- runtime spell data loading
- species sets
- calculator default state
- UI feature toggles
- formula branching

This creates several maintenance problems:

- Adding a version requires touching many files.
- Runtime behavior can silently diverge from generated data.
- Formula changes and data changes are mixed together.
- Species and UI features are not managed through the same model as spell data.
- The process for adding a new version is not discoverable from the repository.

There is already one concrete structural risk in the current code: `0.33` has its own generated spell files, but runtime spell loading still effectively behaves as `0.32` vs `non-0.32`. That is safe only while `0.33` and `trunk` happen to match.

## Goals

- Make version additions predictable and low-risk.
- Reduce version-specific edits to a small number of well-known files.
- Separate "which formula a version uses" from "which version is selected".
- Centralize version capabilities such as `secondGloves`, `enkindle`, and school availability.
- Preserve current behavior while improving structure.
- Make future maintenance easier through an operations document and checklist.

## Non-Goals

- Do not fully automate species extraction in this phase.
- Do not redesign the existing spell header parser in this phase.
- Do not change calculator formulas unless needed to preserve current behavior.
- Do not introduce new gameplay features as part of this refactor.

## Proposed Architecture

### 1. Central Version Registry

Add a new module, tentatively `src/versioning/versionRegistry.ts`, which becomes the single source of truth for version metadata.

Each version entry will contain:

- `spells`: generated spell dataset for that version
- `species`: version-specific species dataset
- `formulaProfile`: reference to a named formula profile
- `features`: booleans or small flags for version-specific UI and runtime behavior
- `defaults`: default species, default spell, and any other version-specific initial state values

Illustrative shape:

```ts
export const versionRegistry = {
  "0.32": {
    spells: spells032,
    species: species032,
    formulaProfile: "legacy210",
    features: {
      secondGloves: false,
      enkindle: false,
      forgecraft: false,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  },
  "0.33": {
    spells: spells033,
    species: species033,
    formulaProfile: "modern400",
    features: {
      secondGloves: true,
      enkindle: false,
      forgecraft: true,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  },
  trunk: {
    spells: spellsTrunk,
    species: speciesTrunk,
    formulaProfile: "modern400",
    features: {
      secondGloves: true,
      enkindle: true,
      forgecraft: true,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  },
} as const;
```

This registry will replace scattered version conditionals in runtime code.

### 2. Formula Profiles

Add a new module, tentatively `src/versioning/formulaProfiles.ts`, to represent formula differences separately from version selection.

Examples of formula-owned behavior:

- spell fail cap
- version-specific calculation constants
- future changes to penalty or scaling rules

Illustrative shape:

```ts
export const formulaProfiles = {
  legacy210: {
    spellFailCap: 210,
    applySpellCap(chance: number) {
      return Math.min(chance, 210);
    },
  },
  modern400: {
    spellFailCap: 400,
    applySpellCap(chance: number) {
      return Math.min(chance, 400);
    },
  },
} as const;
```

Calculation code should no longer branch on version strings when the actual concern is formula selection. Instead it should:

1. read the current version config from `versionRegistry`
2. read the selected formula profile
3. apply formula behavior through that profile

This lets future versions reuse an existing profile without changing calculation code.

### 3. Species Data Separation

Replace the current large `speciesOptions(version)` conditional with dedicated data objects, tentatively in `src/versioning/speciesData.ts`.

Examples:

- `species032`
- `species033`
- `speciesTrunk`

The registry will reference these datasets directly.

`src/types/species.ts` should be simplified to:

- shared type helpers
- size enum
- any reusable species-related utilities that are not version-owned

This phase keeps species lists manually maintained, but moves them into the same versioning model as spells.

### 4. Defaults and Feature Flags

Version-specific defaults currently stored in `useCalculatorState` should be assembled from registry data.

Examples:

- default species
- default target spell
- available school skills
- optional state such as `secondGloves`

UI decisions that currently branch directly on version should instead use feature flags from the version config.

Examples:

- whether `secondGloves` should be shown
- whether enkindle behavior is supported
- whether forgecraft is part of the version

This keeps UI and state behavior consistent with version metadata.

## Module Responsibilities

### `src/versioning/versionRegistry.ts`

Owns all version configuration and exposes helpers such as:

- `getVersionConfig(version)`
- `getVersionSpells(version)`
- `getVersionSpecies(version)`

### `src/versioning/formulaProfiles.ts`

Owns named formula profiles and shared formula helpers.

### `src/versioning/speciesData.ts`

Owns version-specific species datasets.

### `src/types/game.ts`

Continues to own the version union and ordered version list, but should be kept thin.

### `src/utils/spellCalculation.ts`

Should consume:

- version spell dataset from the registry
- formula behavior from `formulaProfiles`

Should stop embedding version branching for data selection and formula selection.

### `src/hooks/useCalculatorState.ts`

Should derive default state from the version registry instead of hardcoding complete default objects per version.

### `src/components/Calculator.tsx`

Should derive version-specific UI toggles from registry features instead of manual version-to-checkbox maps.

## Data Flow

### Runtime

1. User selects a version.
2. App loads config from `versionRegistry[version]`.
3. UI reads allowed species and features from that config.
4. State defaults are derived from that config.
5. Calculators read spell data and formula profile through that config.

### New Version Onboarding

1. Add the raw spell header file for the new version.
2. Run the spell extraction script to generate version data.
3. Add or update the version-specific species dataset.
4. Add a new registry entry for the version.
5. Reuse an existing formula profile or add a new one.
6. Run tests and version diff checks.
7. Update operations documentation if the workflow changed.

## Migration Plan

### Phase 1

- Add `versionRegistry`
- Add `formulaProfiles`
- Add `speciesData`
- Refactor spell data loading to use registry
- Refactor default state assembly to use registry
- Refactor UI feature checks to use registry flags

### Phase 2

- Add a version diff helper script for spell and species changes
- Document update procedure in an operations guide
- Optionally link the guide from `README.md`

### Phase 3

- Consider partial automation for species extraction if the manual dataset becomes a maintenance burden

## Error Handling

- Registry helpers should throw explicit errors when a version entry is missing.
- Formula profile lookup should fail loudly if a profile name is unknown.
- Default state generation should validate that referenced default species and spell exist in that version dataset.
- Version onboarding scripts should surface missing generated files and invalid dataset references clearly.

This is important because centralization increases correctness only if mismatches become obvious at load time.

## Testing Strategy

### Unit Tests

- registry helpers return the expected config for each version
- formula profile selection maps to the expected spell fail cap
- default state generation works per version
- feature flags drive UI decisions correctly

### Regression Tests

- spell failure tests continue passing for existing snapshots
- AC, EV, and SH calculations are unchanged unless intentionally modified
- `0.33` runtime uses its own spell dataset rather than falling through to trunk behavior

### Version Maintenance Checks

Add a lightweight maintenance script to compare adjacent versions and report:

- added spells
- removed spells
- added species
- removed species
- changed feature flags

This does not need to block the initial refactor, but it should be part of the follow-up implementation.

## Documentation Deliverables

Implementation must also add operational documentation so future updates are repeatable.

Required document:

- `docs/operations/versioning-workflow.md`

That document should include:

- how to add a new version
- which files are expected to change
- when to reuse an existing formula profile
- when to create a new formula profile
- how to validate spell/species additions and removals
- which tests to run before considering a version update complete

The goal is that future maintenance is guided by a checklist, not repository memory.

## Trade-Offs

### Benefits

- Version-specific logic becomes discoverable and centralized.
- New version support becomes a bounded task.
- Formula changes are isolated from data changes.
- UI, state, and runtime behavior share the same version model.

### Costs

- Initial refactor touches several files.
- Species remain manually curated in this phase.
- Type relationships around versioned spell names and species may need simplification while centralizing data.

## Recommendation

Proceed with the central registry refactor first, then add the maintenance workflow documentation and version diff tooling on top of that structure.

This keeps the change set focused, fixes the current structural risk around version fallthrough, and creates a clear base for easier long-term version maintenance without requiring a full extraction pipeline rewrite.
