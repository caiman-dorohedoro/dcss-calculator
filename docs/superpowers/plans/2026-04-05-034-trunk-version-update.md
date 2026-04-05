# 0.34 And Trunk Version Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class `0.34` support, refresh `trunk` from the current local `crawl/master`, and document `0.34.1 -> trunk` Crawl changes without expanding calculator scope beyond the mechanics it already models.

**Architecture:** Treat `0.34` and `trunk` as explicit versioned datasets. Snapshot stable spell data from the exact `0.34.1` tag, snapshot trunk spell data from the local refreshed `crawl/master`, wire both through the existing version registry and type maps, then update species handling so trunk reflects the current `Gale Centaur` identity through version-aware traits instead of hardcoded string checks.

**Tech Stack:** TypeScript, React 18, Vite, Jest with ts-jest, Node/tsx scripts, Markdown docs, local `crawl` checkout, GitHub raw and compare HTTP endpoints

---

## File Map

### Create

- `src/data/spl-data.0.34.h`
- `src/data/generated-spells.0.34.json`
- `src/types/generated-spells.0.34.d.ts`
- `src/data/spl-data.trunk.20260405.h`
- `docs/operations/crawl-0.34.1-to-trunk-audit.md`

### Modify

- `src/scripts/extractSpellDataHeader.ts`
- `src/types/game.ts`
- `src/types/spells.ts`
- `src/versioning/speciesModel.ts`
- `src/versioning/speciesData.ts`
- `src/types/species.ts`
- `src/versioning/versionRegistry.ts`
- `src/utils/acCalculation.ts`
- `src/utils/calculatorUtils.ts`
- `src/versioning/__tests__/versionRegistry.test.ts`
- `src/versioning/__tests__/defaultState.test.ts`
- `src/versioning/__tests__/spellDataSelection.test.ts`
- `src/versioning/__tests__/uiOptions.test.ts`
- `src/utils/__tests__/acCalculations.test.ts`
- `docs/operations/versioning-workflow.md`
- `README.md`

### Existing Tests To Keep Green

- `src/utils/__tests__/spellCalculations.test.ts`
- `src/utils/__tests__/spellCanBeEnkindled.test.ts`
- `src/utils/__tests__/evCalculations.test.ts`
- `src/utils/__tests__/shCalculations.test.ts`
- `src/scripts/__tests__/parseSpellBlock.test.ts`

## Task 1: Add 0.34 Version Plumbing And Refresh Spell Artifacts

**Files:**
- Create: `src/data/spl-data.0.34.h`
- Create: `src/data/generated-spells.0.34.json`
- Create: `src/types/generated-spells.0.34.d.ts`
- Create: `src/data/spl-data.trunk.20260405.h`
- Modify: `src/scripts/extractSpellDataHeader.ts`
- Modify: `src/types/game.ts`
- Modify: `src/types/spells.ts`
- Modify: `src/versioning/speciesData.ts`
- Modify: `src/types/species.ts`
- Modify: `src/versioning/versionRegistry.ts`
- Test: `src/versioning/__tests__/versionRegistry.test.ts`
- Test: `src/versioning/__tests__/defaultState.test.ts`
- Test: `src/versioning/__tests__/spellDataSelection.test.ts`
- Test: `src/versioning/__tests__/uiOptions.test.ts`

- [ ] **Step 1: Extend the failing version tests to cover `0.34`**

```ts
// src/versioning/__tests__/versionRegistry.test.ts
import spells034 from "@/data/generated-spells.0.34.json";

test("returns the generated spell dataset for each version", () => {
  expect(getVersionConfig("0.32").spells).toBe(spells032);
  expect(getVersionConfig("0.33").spells).toBe(spells033);
  expect(getVersionConfig("0.34").spells).toBe(spells034);
  expect(getVersionConfig("trunk").spells).toBe(spellsTrunk);
});

test("keeps version-specific species separate", () => {
  expect("armataur" in versionRegistry["0.34"].species).toBe(true);
  expect("ghoul" in versionRegistry["0.34"].species).toBe(false);
  expect("revenant" in versionRegistry["0.34"].species).toBe(true);
});

test("selects the expected formula profile per version", () => {
  expect(versionRegistry["0.34"].formulaProfile).toBe("modern400");
});

test("exposes the expected feature flags and defaults per version", () => {
  expect(versionRegistry["0.34"].features.secondGloves).toBe(true);
  expect(versionRegistry["0.34"].features.enkindle).toBe(false);
  expect(versionRegistry["0.34"].defaults).toEqual({
    species: "armataur",
    targetSpell: "Airstrike",
  });
});
```

```ts
// src/versioning/__tests__/spellDataSelection.test.ts
import spells034 from "@/data/generated-spells.0.34.json";

test("0.34 reads from the 0.34 generated dataset", () => {
  expect(getSpellData("0.34")).toBe(spells034);
  expect(getSpellData("0.34")).not.toBe(spellsTrunk);
});
```

```ts
// src/versioning/__tests__/defaultState.test.ts
test("restores saved state in trunk, then 0.34, then 0.32, then 0.33 order", () => {
  localStorageMock.setItem(
    "calculator_0.34",
    JSON.stringify(buildDefaultCalculatorState("0.34"))
  );

  const restored = getStartupSavedState();

  expect(restored?.version).toBe("trunk");
});

test("falls back to 0.34 before 0.32 when trunk state is absent", () => {
  localStorageMock.setItem(
    "calculator_0.34",
    JSON.stringify(buildDefaultCalculatorState("0.34"))
  );

  const restored = getStartupSavedState();

  expect(restored?.version).toBe("0.34");
});
```

```ts
// src/versioning/__tests__/uiOptions.test.ts
test("0.34 includes secondGloves", () => {
  expect(getEquipmentToggleKeys("0.34")).toEqual([
    "helmet",
    "cloak",
    "gloves",
    "boots",
    "barding",
    "secondGloves",
  ]);
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail before the new version is wired**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/spellDataSelection.test.ts src/versioning/__tests__/uiOptions.test.ts
```

Expected:

```text
FAIL src/versioning/__tests__/versionRegistry.test.ts
FAIL src/versioning/__tests__/defaultState.test.ts
FAIL src/versioning/__tests__/spellDataSelection.test.ts
FAIL src/versioning/__tests__/uiOptions.test.ts
Cannot find module '@/data/generated-spells.0.34.json'
Argument of type '"0.34"' is not assignable to parameter of type 'GameVersion'
```

- [ ] **Step 3: Snapshot the exact stable and trunk spell headers, then regenerate derived artifacts**

Run:

```bash
curl -L https://raw.githubusercontent.com/crawl/crawl/0.34.1/crawl-ref/source/spl-data.h -o src/data/spl-data.0.34.h
cp crawl/crawl-ref/source/spl-data.h src/data/spl-data.trunk.20260405.h
npm run extract-spell-data
```

Then update the extraction target list:

```ts
// src/scripts/extractSpellDataHeader.ts
const extractionTargets: ExtractionTarget[] = [
  {
    spellDataPath: "src/data/spl-data.trunk.20260405.h",
    extractedSpellDataPath: "src/data/generated-spells.trunk.json",
    extractedSpellTypesPath: "src/types/generated-spells.trunk.d.ts",
  },
  {
    spellDataPath: "src/data/spl-data.0.32.h",
    extractedSpellDataPath: "src/data/generated-spells.0.32.json",
    extractedSpellTypesPath: "src/types/generated-spells.0.32.d.ts",
  },
  {
    spellDataPath: "src/data/spl-data.0.33.h",
    extractedSpellDataPath: "src/data/generated-spells.0.33.json",
    extractedSpellTypesPath: "src/types/generated-spells.0.33.d.ts",
  },
  {
    spellDataPath: "src/data/spl-data.0.34.h",
    extractedSpellDataPath: "src/data/generated-spells.0.34.json",
    extractedSpellTypesPath: "src/types/generated-spells.0.34.d.ts",
  },
];
```

- [ ] **Step 4: Wire `0.34` through the version, spell, species, and registry types**

```ts
// src/types/game.ts
export type GameVersion = "0.32" | "0.33" | "0.34" | "trunk";

export const gameVersions = ["0.32", "0.33", "0.34", "trunk"] as const satisfies readonly GameVersion[];
export const startupRestoreOrder = ["trunk", "0.34", "0.32", "0.33"] as const satisfies readonly GameVersion[];
```

```ts
// src/types/spells.ts
import {
  SpellName as SpellName034,
  SpellSchool as SpellSchool034,
  SpellFlag as SpellFlag034,
} from "@/types/generated-spells.0.34.d";

type SpellNameMap = {
  "0.32": SpellName032;
  "0.33": SpellName033;
  "0.34": SpellName034;
  trunk: SpellNameTrunk;
};

type SpellSchoolMap = {
  "0.32": SpellSchool032;
  "0.33": SpellSchool033;
  "0.34": SpellSchool034;
  trunk: SpellSchoolTrunk;
};

type SpellFlagMap = {
  "0.32": SpellFlag032;
  "0.33": SpellFlag033;
  "0.34": SpellFlag034;
  trunk: SpellFlagTrunk;
};
```

```ts
// src/versioning/speciesData.ts
export const species034 = {
  ...species033,
} as const satisfies Record<string, SpeciesOption>;
```

```ts
// src/types/species.ts
import { species032, species033, species034, speciesTrunk } from "@/versioning/speciesData";

const speciesByVersion = {
  "0.32": species032,
  "0.33": species033,
  "0.34": species034,
  trunk: speciesTrunk,
} as const;
```

```ts
// src/versioning/versionRegistry.ts
import spells034 from "@/data/generated-spells.0.34.json";
import { species032, species033, species034, speciesTrunk } from "./speciesData";

export const versionRegistry = {
  "0.32": defineVersionConfig<"0.32">({
    spells: spells032 as readonly VersionedSpellDatum<"0.32">[],
    species: species032,
    formulaProfile: "legacy210",
    features: {
      secondGloves: false,
      enkindle: false,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  }),
  "0.33": defineVersionConfig<"0.33">({
    spells: spells033 as readonly VersionedSpellDatum<"0.33">[],
    species: species033,
    formulaProfile: "modern400",
    features: {
      secondGloves: true,
      enkindle: false,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  }),
  "0.34": defineVersionConfig<"0.34">({
    spells: spells034 as readonly VersionedSpellDatum<"0.34">[],
    species: species034,
    formulaProfile: "modern400",
    features: {
      secondGloves: true,
      enkindle: false,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  }),
  trunk: defineVersionConfig<"trunk">({
    spells: spellsTrunk as readonly VersionedSpellDatum<"trunk">[],
    species: speciesTrunk,
    formulaProfile: "modern400",
    features: {
      secondGloves: true,
      enkindle: true,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  }),
} as const satisfies {
  [K in GameVersion]: VersionConfig<K>;
};
```

- [ ] **Step 5: Run the targeted tests again to verify `0.34` is fully supported**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/spellDataSelection.test.ts src/versioning/__tests__/uiOptions.test.ts
```

Expected:

```text
PASS src/versioning/__tests__/versionRegistry.test.ts
PASS src/versioning/__tests__/defaultState.test.ts
PASS src/versioning/__tests__/spellDataSelection.test.ts
PASS src/versioning/__tests__/uiOptions.test.ts
```

- [ ] **Step 6: Commit the version-plumbing and artifact refresh**

Run:

```bash
git add src/data/spl-data.0.34.h src/data/generated-spells.0.34.json src/types/generated-spells.0.34.d.ts src/data/spl-data.trunk.20260405.h src/data/generated-spells.trunk.json src/types/generated-spells.trunk.d.ts src/scripts/extractSpellDataHeader.ts src/types/game.ts src/types/spells.ts src/versioning/speciesData.ts src/types/species.ts src/versioning/versionRegistry.ts src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/spellDataSelection.test.ts src/versioning/__tests__/uiOptions.test.ts
git commit -m "feat: add 0.34 version data and refresh trunk spells"
```

## Task 2: Make Trunk Species Handling Version-Aware

**Files:**
- Modify: `src/versioning/speciesModel.ts`
- Modify: `src/versioning/speciesData.ts`
- Modify: `src/versioning/versionRegistry.ts`
- Modify: `src/utils/acCalculation.ts`
- Modify: `src/utils/calculatorUtils.ts`
- Test: `src/versioning/__tests__/versionRegistry.test.ts`
- Test: `src/versioning/__tests__/defaultState.test.ts`
- Test: `src/utils/__tests__/acCalculations.test.ts`

- [ ] **Step 1: Write the failing tests for trunk `Gale Centaur` defaults and AC behavior**

```ts
// src/versioning/__tests__/versionRegistry.test.ts
test("uses Gale Centaur as the trunk default species", () => {
  expect(versionRegistry.trunk.defaults).toEqual({
    species: "galeCentaur",
    targetSpell: "Airstrike",
  });
  expect("galeCentaur" in versionRegistry.trunk.species).toBe(true);
  expect("armataur" in versionRegistry.trunk.species).toBe(false);
});
```

```ts
// src/versioning/__tests__/defaultState.test.ts
test("uses Gale Centaur for trunk defaults", () => {
  const state = buildDefaultCalculatorState("trunk");

  expect(state.species).toBe("galeCentaur");
});

test("skips an old trunk armataur save and falls back to 0.34", () => {
  localStorageMock.setItem(
    "calculator_trunk",
    JSON.stringify({
      ...buildDefaultCalculatorState("trunk"),
      species: "armataur",
    })
  );
  localStorageMock.setItem(
    "calculator_0.34",
    JSON.stringify(buildDefaultCalculatorState("0.34"))
  );

  const restored = getStartupSavedState();

  expect(restored?.version).toBe("0.34");
});
```

```ts
// src/utils/__tests__/acCalculations.test.ts
test("gale centaur keeps the deformed-body armour penalty on trunk", () => {
  expect(
    calculateMixedAC({
      version: "trunk",
      species: "galeCentaur",
      armour: "golden_dragon",
      armourSkill: 27,
      cloak: true,
      gloves: true,
      barding: true,
    })
  ).toBe(34);
});

test("armataur keeps the deformed-body armour penalty on 0.34", () => {
  expect(
    calculateMixedAC({
      version: "0.34",
      species: "armataur",
      armour: "golden_dragon",
      armourSkill: 27,
      cloak: true,
      gloves: true,
      barding: true,
    })
  ).toBe(34);
});
```

- [ ] **Step 2: Run the species and AC regression tests to verify they fail first**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/utils/__tests__/acCalculations.test.ts
```

Expected:

```text
FAIL src/versioning/__tests__/versionRegistry.test.ts
FAIL src/versioning/__tests__/defaultState.test.ts
FAIL src/utils/__tests__/acCalculations.test.ts
Property 'galeCentaur' does not exist
Expected: "galeCentaur"
Received: "armataur"
Object literal may only specify known properties, and 'version' does not exist
```

- [ ] **Step 3: Add a species trait model and switch trunk from `armataur` to `galeCentaur`**

```ts
// src/versioning/speciesModel.ts
export type SpeciesOption = {
  name: string;
  size: Size;
  deformedBody?: boolean;
};
```

```ts
// src/versioning/speciesData.ts
const commonSpecies = {
  barachi: { name: "Barachi", size: Size.MEDIUM },
  coglin: { name: "Coglin", size: Size.MEDIUM },
  deepElf: { name: "Deep Elf", size: Size.MEDIUM },
  demigod: { name: "Demigod", size: Size.MEDIUM },
  demonspawn: { name: "Demonspawn", size: Size.MEDIUM },
  djinni: { name: "Djinni", size: Size.MEDIUM },
  draconian: { name: "Draconian", size: Size.MEDIUM },
  felid: { name: "Felid", size: Size.LITTLE },
  formicid: { name: "Formicid", size: Size.MEDIUM },
  gargoyle: { name: "Gargoyle", size: Size.MEDIUM },
  gnoll: { name: "Gnoll", size: Size.MEDIUM },
  human: { name: "Human", size: Size.MEDIUM },
  kobold: { name: "Kobold", size: Size.SMALL },
  mountainDwarf: { name: "Mountain Dwarf", size: Size.MEDIUM },
  merfolk: { name: "Merfolk", size: Size.MEDIUM },
  minotaur: { name: "Minotaur", size: Size.MEDIUM },
  mummy: { name: "Mummy", size: Size.MEDIUM },
  naga: { name: "Naga", size: Size.LARGE, deformedBody: true },
  octopode: { name: "Octopode", size: Size.MEDIUM },
  oni: { name: "Oni", size: Size.LARGE },
  spriggan: { name: "Spriggan", size: Size.LITTLE },
  tengu: { name: "Tengu", size: Size.MEDIUM },
  troll: { name: "Troll", size: Size.LARGE },
  vineStalker: { name: "Vine Stalker", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

const armataurSpecies = {
  armataur: { name: "Armataur", size: Size.LARGE, deformedBody: true },
} as const satisfies Record<string, SpeciesOption>;

export const species032 = {
  ...commonSpecies,
  ...armataurSpecies,
  ghoul: { name: "Ghoul", size: Size.MEDIUM },
  vampire: { name: "Vampire", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

export const species033 = {
  ...commonSpecies,
  ...armataurSpecies,
  poltergeist: { name: "Poltergeist", size: Size.MEDIUM },
  revenant: { name: "Revenant", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

export const species034 = {
  ...species033,
} as const satisfies Record<string, SpeciesOption>;

export const speciesTrunk = {
  ...commonSpecies,
  poltergeist: { name: "Poltergeist", size: Size.MEDIUM },
  revenant: { name: "Revenant", size: Size.MEDIUM },
  galeCentaur: { name: "Gale Centaur", size: Size.LARGE, deformedBody: true },
} as const satisfies Record<string, SpeciesOption>;
```

```ts
// src/versioning/versionRegistry.ts
  trunk: defineVersionConfig<"trunk">({
    spells: spellsTrunk as readonly VersionedSpellDatum<"trunk">[],
    species: speciesTrunk,
    formulaProfile: "modern400",
    features: {
      secondGloves: true,
      enkindle: true,
    },
    defaults: {
      species: "galeCentaur",
      targetSpell: "Airstrike",
    },
  }),
```

- [ ] **Step 4: Make AC calculations look up deformed-body status through versioned species data**

```ts
// src/utils/acCalculation.ts
import { GameVersion } from "@/types/game";
import { SpeciesKey, speciesOptions } from "@/types/species.ts";

type MixedCalculationsParams<V extends GameVersion> = {
  version: V;
  species: SpeciesKey<V>;
  armour?: ArmourKey;
  helmet?: boolean;
  gloves?: boolean;
  boots?: boolean;
  cloak?: boolean;
  barding?: boolean;
  secondGloves?: boolean;
  armourSkill: number;
};

export const calculateMixedAC = <V extends GameVersion>({
  version,
  species,
  armour,
  helmet,
  gloves,
  boots,
  cloak,
  barding,
  secondGloves,
  armourSkill,
}: MixedCalculationsParams<V>): number => {
  const speciesOption = speciesOptions(version)[species];
  const isDeformed = speciesOption.deformedBody === true;
  let baseAC = 0;

  // existing baseAC accumulation stays the same

  return (
    calculateAC(baseAC, armourSkill) -
    (isDeformed && armour ? Math.floor(armourOptions[armour].baseAC * 0.5) : 0)
  );
};
```

```ts
// src/utils/calculatorUtils.ts
ac: calculateMixedAC({
  version: state.version,
  species: state.species,
  armour: state.armour,
  helmet: state.helmet,
  gloves: state.gloves,
  boots: state.boots,
  cloak: state.cloak,
  barding: state.barding,
  secondGloves: state.secondGloves,
  armourSkill: armour,
}),
```

- [ ] **Step 5: Run the targeted tests again to verify trunk species handling is correct**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/utils/__tests__/acCalculations.test.ts
```

Expected:

```text
PASS src/versioning/__tests__/versionRegistry.test.ts
PASS src/versioning/__tests__/defaultState.test.ts
PASS src/utils/__tests__/acCalculations.test.ts
```

- [ ] **Step 6: Commit the trunk species and AC changes**

Run:

```bash
git add src/versioning/speciesModel.ts src/versioning/speciesData.ts src/versioning/versionRegistry.ts src/utils/acCalculation.ts src/utils/calculatorUtils.ts src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/utils/__tests__/acCalculations.test.ts
git commit -m "fix: align trunk species data with gale centaur"
```

## Task 3: Audit Crawl Release-To-Trunk Changes And Update Maintenance Docs

**Files:**
- Create: `docs/operations/crawl-0.34.1-to-trunk-audit.md`
- Modify: `docs/operations/versioning-workflow.md`
- Modify: `README.md`

- [ ] **Step 1: Collect the exact Crawl compare data and turn it into an audit source file**

Run:

```bash
python - <<'PY'
import json
import urllib.request

url = "https://api.github.com/repos/crawl/crawl/compare/0.34.1...master"
with urllib.request.urlopen(url) as response:
    compare = json.load(response)

with open("/tmp/crawl-0.34.1-to-master-compare.json", "w") as handle:
    json.dump(compare, handle, indent=2)

print(compare["status"])
print(len(compare["commits"]))
print(compare["files"][0]["filename"])
PY
```

Expected:

```text
diverged
250
.github/workflows/ci.yml
```

- [ ] **Step 2: Write the audit document with direct app impacts, audit-only findings, and formula checks**

```md
<!-- docs/operations/crawl-0.34.1-to-trunk-audit.md -->
# Crawl 0.34.1 To Trunk Audit

## Baselines

- Stable source: `0.34.1`
- Trunk source: local `crawl/master` as of `2026-04-05`
- App mapping: `0.34` -> stable release, `trunk` -> current development snapshot

## Directly Reflected In This Update

- Added `0.34` spell snapshot and generated types
- Refreshed trunk spell snapshot from local `crawl/master`
- Kept `armataur` on `0.34`
- Switched trunk species roster to `galeCentaur`
- Made AC deformed-body handling version-aware

## Spell Metadata Changes Observed

- `Summon Ufetubus` -> `Ufetubi Swarm`
- `Wall of Brambles` -> `Cage of Brambles`

## Species And Mutation Changes Observed

- `Armataur` -> `Anemocentaur` -> `Gale Centaur`
- `Stampede` replaced the old rolling passive naming
- Four Winds-related mutation entries were added for current trunk

## Item And Unrand Changes Observed

- New short blade base type: `Athame`
- New unrand: `swamp witch's dragon scales`
- `Zephyr` reworked
- `glaive of Prune` -> `partisan of Prune`
- `amulet of the Four Winds` -> `amulet of Tranquility`

## Formula-Adjacent Files Checked

- `crawl-ref/source/spl-cast.cc`
- `crawl-ref/source/spl-util.cc`
- `crawl-ref/source/player-equip.cc`
- `crawl-ref/source/skills.cc`
- `crawl-ref/source/player-stats.cc`

Result: no immediate app formula rewrite was required in this pass, but future version bumps should re-check these paths instead of assuming safety.

## Follow-Up Candidates

- audit whether any new trunk item base values should update local equipment tables
- audit whether future species trait modeling should cover more than `deformedBody`
- audit whether any renamed trunk spells need additional UI or saved-state migration handling
```

- [ ] **Step 3: Update the versioning workflow and README so the next refresh is repeatable**

```md
<!-- docs/operations/versioning-workflow.md -->
## Current Supported Versions

- `0.32`
- `0.33`
- `0.34`
- `trunk`

## Snapshot Stable And Trunk Spell Headers

```bash
curl -L https://raw.githubusercontent.com/crawl/crawl/0.34.1/crawl-ref/source/spl-data.h -o src/data/spl-data.0.34.h
cp crawl/crawl-ref/source/spl-data.h src/data/spl-data.trunk.20260405.h
npm run extract-spell-data
```

## Audit Release-To-Trunk Changes

```bash
python - <<'PY'
import json
import urllib.request

url = "https://api.github.com/repos/crawl/crawl/compare/0.34.1...master"
with urllib.request.urlopen(url) as response:
    compare = json.load(response)

print(compare["status"])
print(len(compare["commits"]))
PY
```
```

```md
<!-- README.md -->
## Supported Versions

- `0.32`
- `0.33`
- `0.34`
- `trunk`
```

- [ ] **Step 4: Run the focused verification, version diff script, full regression suite, and build**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/spellDataSelection.test.ts src/versioning/__tests__/uiOptions.test.ts src/versioning/__tests__/versionDiff.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts src/utils/__tests__/spellCalculations.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/scripts/__tests__/parseSpellBlock.test.ts
npm run report-version-diff -- 0.33 0.34
npm run report-version-diff -- 0.34 trunk
npm run build
```

Expected:

```text
PASS src/versioning/__tests__/versionRegistry.test.ts
PASS src/versioning/__tests__/defaultState.test.ts
PASS src/versioning/__tests__/spellDataSelection.test.ts
PASS src/versioning/__tests__/uiOptions.test.ts
PASS src/versioning/__tests__/versionDiff.test.ts
PASS src/utils/__tests__/spellCanBeEnkindled.test.ts
PASS src/utils/__tests__/spellCalculations.test.ts
PASS src/utils/__tests__/acCalculations.test.ts
PASS src/utils/__tests__/evCalculations.test.ts
PASS src/utils/__tests__/shCalculations.test.ts
PASS src/scripts/__tests__/parseSpellBlock.test.ts
Version diff: 0.33 -> 0.34
Version diff: 0.34 -> trunk
✓ built in
```

- [ ] **Step 5: Commit the audit and maintenance docs**

Run:

```bash
git add docs/operations/crawl-0.34.1-to-trunk-audit.md docs/operations/versioning-workflow.md README.md
git commit -m "docs: audit crawl 0.34.1 to trunk changes"
```
