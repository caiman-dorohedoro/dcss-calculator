# Versioning Workflow

## Purpose

This guide explains how to add or update a DCSS version now that version-specific data, defaults, and UI behavior live behind the `src/versioning` registry layer. The goal is to keep version updates bounded to a small set of files instead of scattering conditionals across calculators and components.

## Files To Update

When adding or updating a version, check these files first:

- `src/data/spl-data.<version>.h`
- `src/data/generated-spells.<version>.json`
- `src/types/generated-spells.<version>.d.ts`
- `src/scripts/extractSpellDataHeader.ts`
- `src/types/game.ts`
- `src/versioning/speciesData.ts`
- `src/versioning/versionRegistry.ts`
- `src/versioning/defaultState.ts`
- `src/versioning/uiOptions.ts`
- `src/versioning/formulaProfiles.ts` when the spell-failure formula changes

## Add A New Version Checklist

1. Add the raw DCSS spell header to `src/data/` using the established naming pattern.
2. Register the new header in `src/scripts/extractSpellDataHeader.ts`.
3. Run `npm run extract-spell-data` to regenerate the versioned spell JSON and types.
4. Add the new `GameVersion` literal to `src/types/game.ts`.
5. Add the version-specific species dataset in `src/versioning/speciesData.ts`.
6. Add the version entry in `src/versioning/versionRegistry.ts`.
7. Pick the correct formula profile in `src/versioning/versionRegistry.ts`.
8. Update `src/versioning/defaultState.ts` if the version needs different default species, spells, or feature flags.
9. Update `src/versioning/uiOptions.ts` if the version changes which equipment toggles appear in the UI.
10. If the formula rules changed, update or add a profile in `src/versioning/formulaProfiles.ts`.

## Check Version Diffs

Use the diff script to compare spell and species changes between two versions:

```bash
npm run report-version-diff -- 0.33 trunk
```

Review the output for:

- added spells
- removed spells
- added species
- removed species

## Required Verification

Run the full verification suite before landing a versioning change:

```bash
npm test -- --runInBand src/versioning/__tests__/formulaProfiles.test.ts src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/uiOptions.test.ts src/versioning/__tests__/versionDiff.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts src/utils/__tests__/spellCalculations.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/scripts/__tests__/parseSpellBlock.test.ts
npm run build
```

If the suite reports a known baseline-equivalent failure, note it in the task summary rather than widening scope unless the regression is caused by the versioning change.
