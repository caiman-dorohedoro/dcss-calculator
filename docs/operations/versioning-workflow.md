# Versioning Workflow

## Purpose

This guide explains how to add or update a DCSS version now that version-specific data, defaults, and UI behavior live behind the `src/versioning` registry layer. The goal is to keep version updates bounded to a small set of files instead of scattering conditionals across calculators and components.

## Current Supported Versions

- `0.32`
- `0.33`
- `0.34`
- `trunk`

## Files To Update

When adding or updating a version, check these files first:

- `src/data/spl-data.<version>.h`
- `src/data/generated-spells.<version>.json`
- `src/types/generated-spells.<version>.d.ts`
- `src/scripts/extractSpellDataHeader.ts`
- `src/types/game.ts`
- `src/types/species.ts`
- `src/types/spells.ts`
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
5. Extend `src/types/species.ts` and `src/types/spells.ts` with the new version maps.
6. Add the version-specific species dataset in `src/versioning/speciesData.ts`.
7. Add the version entry in `src/versioning/versionRegistry.ts`.
8. Pick the correct formula profile in `src/versioning/versionRegistry.ts`.
9. Update `src/versioning/defaultState.ts` if the version needs different default species, spells, or feature flags.
10. Update `src/versioning/uiOptions.ts` if the version changes which equipment toggles appear in the UI.
11. If the formula rules changed, update or add a profile in `src/versioning/formulaProfiles.ts`.

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

## Snapshot Stable And Trunk Spell Headers

Use exact source snapshots instead of reusing older generated artifacts:

```bash
curl -L https://raw.githubusercontent.com/crawl/crawl/0.34.1/crawl-ref/source/spl-data.h -o src/data/spl-data.0.34.h
cp crawl/crawl-ref/source/spl-data.h src/data/spl-data.trunk.20260405.h
npm run extract-spell-data
```

When refreshing trunk again, replace the dated trunk header filename with the new snapshot date and keep the stable header pinned to the exact release tag you are targeting.

## Audit Release-To-Trunk Changes

Before landing a stable-to-trunk refresh, capture a release audit from both the GitHub compare API and the local `crawl/master` checkout.

Collect the compare payload:

```bash
python3 - <<'PY'
import json
import urllib.request

url = "https://api.github.com/repos/crawl/crawl/compare/0.34.1...master"
with urllib.request.urlopen(url) as response:
    compare = json.load(response)

with open("/tmp/crawl-0.34.1-to-master-compare.json", "w") as handle:
    json.dump(compare, handle, indent=2)

print(compare["status"])
print(compare["ahead_by"])
print(compare["behind_by"])
print(compare["total_commits"])
print(len(compare["commits"]))
print(len(compare["files"]))
PY
```

Then verify the current local Crawl head and inspect the files that most often affect calculator scope:

```bash
git -C crawl rev-parse master
git -C crawl show -s --format=%cs master
git -C crawl log --oneline 0.34.1..master -- \
  crawl-ref/source/spl-data.h \
  crawl-ref/source/mutation-data.h \
  crawl-ref/source/art-data.txt \
  crawl-ref/source/dat/descript/unrand.txt \
  crawl-ref/source/spl-cast.cc \
  crawl-ref/source/spl-util.cc \
  crawl-ref/source/player-equip.cc \
  crawl-ref/source/skills.cc \
  crawl-ref/source/player-stats.cc
```

Write the results into a dated audit doc under `docs/operations/`. For the `0.34.1 -> trunk` pass, see `docs/operations/crawl-0.34.1-to-trunk-audit.md`.

## Required Verification

Run the full verification suite before landing a versioning change:

```bash
npm test -- --runInBand src/versioning/__tests__/formulaProfiles.test.ts src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/uiOptions.test.ts src/versioning/__tests__/versionDiff.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts src/utils/__tests__/spellCalculations.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/scripts/__tests__/parseSpellBlock.test.ts
npm run build
```

If the suite reports a known baseline-equivalent failure, note it in the task summary rather than widening scope unless the regression is caused by the versioning change.
