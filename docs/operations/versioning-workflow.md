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

- `README.md`
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
12. Update `README.md` if the supported versions or maintenance links changed.

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

## Compare The Previously Supported Trunk Snapshot

Do not rely only on the stable-release baseline. Before and after refreshing trunk, compare the repo's previously committed trunk snapshot against the newly generated trunk snapshot as well.

This catches repo-trunk drift that a stable baseline can hide. In the `0.34.1 -> trunk` pass, the repo's older committed trunk support still modeled `Armataur` and `Dazzling Flash`, while the refreshed trunk support needed `Gale Centaur` and `Gloom`. The stable `0.34` baseline already had `Gloom`, so a stable-only diff would not have highlighted that older repo trunk spell drift.

Useful commands:

```bash
git log --oneline -- \
  src/data/generated-spells.trunk.json \
  src/types/generated-spells.trunk.d.ts \
  src/versioning/speciesData.ts \
  src/types/species.ts

git diff --word-diff -- \
  src/types/generated-spells.trunk.d.ts \
  src/versioning/speciesData.ts \
  src/types/species.ts
```

Review the repo-trunk diff for:

- spell renames or removals that might be invisible from the stable baseline
- species renames, additions, removals, or trait changes
- versioned defaults or saved-state assumptions that still mention old trunk-only names

## Snapshot Stable And Trunk Spell Headers

Use exact source snapshots instead of reusing older generated artifacts:

```bash
export STABLE_TAG=<stable_tag>
export STABLE_VERSION=<stable_version>
export TRUNK_SNAPSHOT_DATE=<yyyymmdd>

git -C crawl rev-parse "${STABLE_TAG}^{commit}"
curl -L "https://raw.githubusercontent.com/crawl/crawl/${STABLE_TAG}/crawl-ref/source/spl-data.h" \
  -o "src/data/spl-data.${STABLE_VERSION}.h"
cp crawl/crawl-ref/source/spl-data.h "src/data/spl-data.trunk.${TRUNK_SNAPSHOT_DATE}.h"
npm run extract-spell-data
```

Record the output of `git -C crawl rev-parse "${STABLE_TAG}^{commit}"` in the audit doc as the dereferenced release commit for the stable baseline. Do not record the annotated tag object SHA.

Example for the current `0.34.1 -> trunk` pass:

```bash
git -C crawl rev-parse "0.34.1^{commit}"
curl -L "https://raw.githubusercontent.com/crawl/crawl/0.34.1/crawl-ref/source/spl-data.h" \
  -o "src/data/spl-data.0.34.h"
cp crawl/crawl-ref/source/spl-data.h "src/data/spl-data.trunk.20260405.h"
```

## Audit Release-To-Trunk Changes

Before landing a stable-to-trunk refresh, capture a release audit from both the GitHub compare API and the local `crawl/master` checkout.

Collect the compare payload:

```bash
export STABLE_TAG=<stable_tag>
export AUDIT_BASENAME=<stable_tag>-to-master

python3 - <<'PY'
import json
import urllib.request
import os

stable_tag = os.environ["STABLE_TAG"]
audit_basename = os.environ["AUDIT_BASENAME"]
url = f"https://api.github.com/repos/crawl/crawl/compare/{stable_tag}...master"
with urllib.request.urlopen(url) as response:
    compare = json.load(response)

with open(f"/tmp/crawl-{audit_basename}-compare.json", "w") as handle:
    json.dump(compare, handle, indent=2)

print(compare["status"])
print(compare["ahead_by"])
print(compare["behind_by"])
print(compare["total_commits"])
print(len(compare["commits"]))
print(len(compare["files"]))
PY
```

Then verify the current local Crawl head, the dereferenced stable baseline, and the files that most often affect calculator scope:

```bash
git -C crawl rev-parse "${STABLE_TAG}^{commit}"
git -C crawl rev-parse master
git -C crawl show -s --format=%cs master
git -C crawl log --oneline "${STABLE_TAG}"..master -- \
  crawl-ref/source/spl-data.h \
  crawl-ref/source/mutation-data.h \
  crawl-ref/source/dat/species \
  crawl-ref/source/dat/descript/species.txt \
  crawl-ref/source/files.cc \
  crawl-ref/source/tags.cc \
  crawl-ref/source/art-data.txt \
  crawl-ref/source/dat/descript/unrand.txt \
  crawl-ref/source/spl-cast.cc \
  crawl-ref/source/spl-util.cc \
  crawl-ref/source/player-equip.cc \
  crawl-ref/source/skills.cc \
  crawl-ref/source/player-stats.cc
```

Audit checklist:

- record the dereferenced stable release commit from `git -C crawl rev-parse "${STABLE_TAG}^{commit}"`
- record the local `crawl/master` head SHA and date
- compare the repo's previously committed trunk snapshot against the refreshed trunk snapshot before concluding the update is complete
- inspect spell metadata changes from `spl-data.h`
- inspect species source files and related history from `crawl-ref/source/dat/species`, `species.txt`, `files.cc`, and `tags.cc`
- inspect mutation or ability changes and item or unrand changes that may affect future calculator scope
- inspect repo-trunk drift for spell names, species names, and versioned traits or defaults that may need app updates even when the stable baseline looks similar
- if the supported species can wear barding, validate at least one barding-wearing morgue against AC and EV separately rather than assuming the armour and spell-failure paths cover it
- when validating spell-failure parity from a morgue, check whether the equipped body armour has an ego that changes spell success, especially `death` for Necromancy, before classifying the mismatch as a formula bug
- inspect formula-adjacent files before deciding no formula rewrite is needed
- update `README.md` if the supported versions or maintenance links changed

Write the results into a dated audit doc under `docs/operations/`. The current example is `docs/operations/crawl-0.34.1-to-trunk-audit.md`.

## Required Verification

Run the full verification suite before landing a versioning change:

```bash
npm test -- --runInBand src/versioning/__tests__/formulaProfiles.test.ts src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/uiOptions.test.ts src/versioning/__tests__/versionDiff.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts src/utils/__tests__/spellCalculations.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/scripts/__tests__/parseSpellBlock.test.ts
npm run build
```

If the suite reports a known baseline-equivalent failure, note it in the task summary rather than widening scope unless the regression is caused by the versioning change.
