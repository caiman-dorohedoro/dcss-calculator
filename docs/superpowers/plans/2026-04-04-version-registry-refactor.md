# Version Registry Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize version-specific datasets, formulas, defaults, and maintenance workflow so new DCSS versions can be added through bounded registry updates instead of scattered conditionals.

**Architecture:** Add a `src/versioning` layer that owns version registry data, formula profiles, species datasets, default-state builders, and UI option helpers. Refactor calculators, hook defaults, and UI code to consume that layer, then add a version diff tool and operations documentation so future updates follow a fixed checklist.

**Tech Stack:** TypeScript, React 18, Vite, Jest with ts-jest, Node/tsx scripts, Markdown docs

---

## File Map

### Create

- `src/versioning/formulaProfiles.ts`
- `src/versioning/speciesData.ts`
- `src/versioning/versionRegistry.ts`
- `src/versioning/defaultState.ts`
- `src/versioning/uiOptions.ts`
- `src/versioning/versionDiff.ts`
- `src/versioning/__tests__/formulaProfiles.test.ts`
- `src/versioning/__tests__/versionRegistry.test.ts`
- `src/versioning/__tests__/defaultState.test.ts`
- `src/versioning/__tests__/uiOptions.test.ts`
- `src/versioning/__tests__/versionDiff.test.ts`
- `src/utils/__tests__/spellCanBeEnkindled.test.ts`
- `src/scripts/reportVersionDiff.ts`
- `docs/operations/versioning-workflow.md`

### Modify

- `src/utils/spellCalculation.ts`
- `src/utils/spellCanbeEnkindled.ts`
- `src/types/species.ts`
- `src/hooks/useCalculatorState.ts`
- `src/components/Calculator.tsx`
- `src/components/SpellModeHeader.tsx`
- `src/scripts/extractSpellDataHeader.ts`
- `src/types/game.ts`
- `package.json`
- `README.md`

### Existing Tests To Keep Green

- `src/utils/__tests__/spellCalculations.test.ts`
- `src/utils/__tests__/acCalculations.test.ts`
- `src/utils/__tests__/evCalculations.test.ts`
- `src/utils/__tests__/shCalculations.test.ts`
- `src/scripts/__tests__/parseSpellBlock.test.ts`

## Task 1: Create Versioning Core Modules

**Files:**
- Create: `src/versioning/formulaProfiles.ts`
- Create: `src/versioning/speciesData.ts`
- Create: `src/versioning/versionRegistry.ts`
- Create: `src/versioning/__tests__/formulaProfiles.test.ts`
- Create: `src/versioning/__tests__/versionRegistry.test.ts`
- Modify: `src/types/game.ts`

- [ ] **Step 1: Write the failing formula profile and registry tests**

```ts
// src/versioning/__tests__/formulaProfiles.test.ts
import { describe, expect, test } from "@jest/globals";
import { formulaProfiles } from "../formulaProfiles";

describe("formulaProfiles", () => {
  test("legacy210 caps spell fail chance at 210", () => {
    expect(formulaProfiles.legacy210.applySpellCap(999)).toBe(210);
  });

  test("modern400 caps spell fail chance at 400", () => {
    expect(formulaProfiles.modern400.applySpellCap(999)).toBe(400);
  });
});
```

```ts
// src/versioning/__tests__/versionRegistry.test.ts
import { describe, expect, test } from "@jest/globals";
import spells032 from "@/data/generated-spells.0.32.json";
import spells033 from "@/data/generated-spells.0.33.json";
import spellsTrunk from "@/data/generated-spells.trunk.json";
import { getVersionConfig, versionRegistry } from "../versionRegistry";

describe("versionRegistry", () => {
  test("returns the generated spell dataset for each version", () => {
    expect(getVersionConfig("0.32").spells).toBe(spells032);
    expect(getVersionConfig("0.33").spells).toBe(spells033);
    expect(getVersionConfig("trunk").spells).toBe(spellsTrunk);
  });

  test("keeps 0.32-only and trunk-only species separate", () => {
    expect("ghoul" in versionRegistry["0.32"].species).toBe(true);
    expect("ghoul" in versionRegistry["0.33"].species).toBe(false);
    expect("revenant" in versionRegistry.trunk.species).toBe(true);
    expect("revenant" in versionRegistry["0.32"].species).toBe(false);
  });

  test("selects the expected formula profile per version", () => {
    expect(versionRegistry["0.32"].formulaProfile).toBe("legacy210");
    expect(versionRegistry["0.33"].formulaProfile).toBe("modern400");
    expect(versionRegistry.trunk.formulaProfile).toBe("modern400");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/formulaProfiles.test.ts src/versioning/__tests__/versionRegistry.test.ts
```

Expected:

```text
FAIL src/versioning/__tests__/formulaProfiles.test.ts
FAIL src/versioning/__tests__/versionRegistry.test.ts
Cannot find module '../formulaProfiles'
Cannot find module '../versionRegistry'
```

- [ ] **Step 3: Implement the formula profile module**

```ts
// src/versioning/formulaProfiles.ts
import { GameVersion } from "@/types/game";

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

export type FormulaProfileName = keyof typeof formulaProfiles;

export const getFormulaProfile = (
  profileName: FormulaProfileName
) => formulaProfiles[profileName];

export const getFormulaProfileForVersion = (
  version: GameVersion,
  lookup: (version: GameVersion) => FormulaProfileName
) => getFormulaProfile(lookup(version));
```

- [ ] **Step 4: Implement the species dataset and version registry modules**

```ts
// src/versioning/speciesData.ts
export enum Size {
  TINY = "tiny",
  LITTLE = "little",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  GIANT = "giant",
}

export type SpeciesOption = {
  name: string;
  size: Size;
};

const baseSpecies = {
  armataur: { name: "Armataur", size: Size.LARGE },
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
  naga: { name: "Naga", size: Size.LARGE },
  octopode: { name: "Octopode", size: Size.MEDIUM },
  oni: { name: "Oni", size: Size.LARGE },
  spriggan: { name: "Spriggan", size: Size.LITTLE },
  tengu: { name: "Tengu", size: Size.MEDIUM },
  troll: { name: "Troll", size: Size.LARGE },
  vineStalker: { name: "Vine Stalker", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

export const species032 = {
  ...baseSpecies,
  ghoul: { name: "Ghoul", size: Size.MEDIUM },
  vampire: { name: "Vampire", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

export const species033 = {
  ...baseSpecies,
  poltergeist: { name: "Poltergeist", size: Size.MEDIUM },
  revenant: { name: "Revenant", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

export const speciesTrunk = {
  ...species033,
} as const satisfies Record<string, SpeciesOption>;
```

```ts
// src/versioning/versionRegistry.ts
import spells032 from "@/data/generated-spells.0.32.json" assert { type: "json" };
import spells033 from "@/data/generated-spells.0.33.json" assert { type: "json" };
import spellsTrunk from "@/data/generated-spells.trunk.json" assert { type: "json" };
import { GameVersion, gameVersions } from "@/types/game";
import {
  species032,
  species033,
  speciesTrunk,
} from "./speciesData";
import { FormulaProfileName } from "./formulaProfiles";

type VersionFeatures = {
  secondGloves: boolean;
  enkindle: boolean;
};

type VersionDefaults = {
  species: string;
  targetSpell: string;
};

export const versionRegistry = {
  "0.32": {
    spells: spells032,
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
  },
  "0.33": {
    spells: spells033,
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
  },
  trunk: {
    spells: spellsTrunk,
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
  },
} as const satisfies Record<
  GameVersion,
  {
    spells: readonly unknown[];
    species: Record<string, { name: string; size: string }>;
    formulaProfile: FormulaProfileName;
    features: VersionFeatures;
    defaults: VersionDefaults;
  }
>;

export const getVersionConfig = <V extends GameVersion>(version: V) =>
  versionRegistry[version];

export const getVersionSpellData = <V extends GameVersion>(version: V) =>
  getVersionConfig(version).spells;

export const getVersionSpecies = <V extends GameVersion>(version: V) =>
  getVersionConfig(version).species;

export const getRegisteredVersions = () => gameVersions;
```

```ts
// src/types/game.ts
export type GameVersion = "0.32" | "0.33" | "trunk";

export const gameVersions = ["0.32", "0.33", "trunk"] as const satisfies readonly GameVersion[];

export const isGameVersion = (version: string): version is GameVersion => {
  return gameVersions.includes(version as GameVersion);
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/formulaProfiles.test.ts src/versioning/__tests__/versionRegistry.test.ts
```

Expected:

```text
PASS src/versioning/__tests__/formulaProfiles.test.ts
PASS src/versioning/__tests__/versionRegistry.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/versioning/formulaProfiles.ts src/versioning/speciesData.ts src/versioning/versionRegistry.ts src/versioning/__tests__/formulaProfiles.test.ts src/versioning/__tests__/versionRegistry.test.ts src/types/game.ts
git commit -m "refactor: add version registry foundation"
```

## Task 2: Route Spell Calculation Through Registry and Formula Profiles

**Files:**
- Modify: `src/utils/spellCalculation.ts`
- Create: `src/versioning/__tests__/spellDataSelection.test.ts`
- Test: `src/utils/__tests__/spellCalculations.test.ts`

- [ ] **Step 1: Write the failing spell data selection test**

```ts
// src/versioning/__tests__/spellDataSelection.test.ts
import { describe, expect, test } from "@jest/globals";
import { getSpellData } from "@/utils/spellCalculation";
import { getVersionConfig } from "../versionRegistry";

describe("spell data selection", () => {
  test("0.33 reads from the 0.33 generated dataset instead of falling through", () => {
    expect(getSpellData("0.33")).toBe(getVersionConfig("0.33").spells);
  });

  test("trunk keeps reading from the trunk generated dataset", () => {
    expect(getSpellData("trunk")).toBe(getVersionConfig("trunk").spells);
  });
});
```

- [ ] **Step 2: Run tests to verify the new selection test fails**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/spellDataSelection.test.ts
```

Expected:

```text
FAIL src/versioning/__tests__/spellDataSelection.test.ts
Expected: same reference as versionRegistry["0.33"].spells
Received: trunk spell dataset reference
```

- [ ] **Step 3: Refactor spell calculation to read from the registry and formula profile**

```ts
// src/utils/spellCalculation.ts
import { getFormulaProfile } from "@/versioning/formulaProfiles";
import { getVersionConfig } from "@/versioning/versionRegistry";
```

```ts
export const getSpellData = <V extends GameVersion>(version: V) => {
  return getVersionConfig(version).spells as VersionedSpellDatum<V>[];
};
```

```ts
function rawSpellFail<V extends GameVersion>({
  version,
  species,
  strength,
  intelligence,
  spellDifficulty,
  armour,
  shield,
  targetSpell,
  schoolSkills,
  spellcasting,
  armourSkill,
  shieldSkill,
  wizardry = 0,
  channel = false,
  wildMagic = 0,
  enkindle = false,
}: SpellCalculationParams<V>) {
  const config = getVersionConfig(version);
  const formula = getFormulaProfile(config.formulaProfile);

  let chance = 60;

  const spellPower = Math.floor(
    (getSkillPower<V>(version, targetSpell, schoolSkills, spellcasting) * 6) /
      100
  );

  chance -= spellPower;
  chance -= intelligence * 2;

  const armourShieldSpellPenalty = calculateArmourShieldSpellPenalty({
    species,
    strength,
    armourSkill,
    armour,
    shieldSkill,
    shield,
  });

  if (!enkindle) {
    chance += armourShieldSpellPenalty;
  }

  chance += spellDifficulties[spellDifficulty];
  chance = formula.applySpellCap(chance);

  let chance2 = Math.max(
    Math.floor((((chance + 426) * chance + 82670) * chance + 7245398) / 262144),
    0
  );

  if (wildMagic > 0) {
    chance2 += wildMagic * 4;
  }

  if (channel) {
    chance2 += 10;
  }

  if (wizardry > 0) {
    chance2 = applyWizardryBoost(chance2, wizardry);
  }

  if (enkindle) {
    chance2 = Math.floor((chance2 * 3) / 4) - 5;
  }

  return Math.min(Math.max(chance2, 0), 100);
}
```

- [ ] **Step 4: Run targeted and existing spell tests**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/spellDataSelection.test.ts src/utils/__tests__/spellCalculations.test.ts
```

Expected:

```text
PASS src/versioning/__tests__/spellDataSelection.test.ts
PASS src/utils/__tests__/spellCalculations.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/spellCalculation.ts src/versioning/__tests__/spellDataSelection.test.ts
git commit -m "refactor: route spell calculation through version registry"
```

## Task 3: Move Species Access and Default State Construction Behind Versioning Helpers

**Files:**
- Modify: `src/types/species.ts`
- Create: `src/versioning/defaultState.ts`
- Create: `src/versioning/__tests__/defaultState.test.ts`
- Modify: `src/hooks/useCalculatorState.ts`

- [ ] **Step 1: Write the failing default-state tests**

```ts
// src/versioning/__tests__/defaultState.test.ts
import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "../defaultState";

describe("buildDefaultCalculatorState", () => {
  test("adds forgecraft to 0.33 school defaults because the spell dataset includes it", () => {
    const state = buildDefaultCalculatorState("0.33");

    expect(state.schoolSkills?.forgecraft).toBe(0);
  });

  test("does not expose secondGloves on 0.32 defaults", () => {
    const state = buildDefaultCalculatorState("0.32");

    expect("secondGloves" in state && state.secondGloves !== undefined).toBe(false);
  });

  test("enables secondGloves on trunk defaults", () => {
    const state = buildDefaultCalculatorState("trunk");

    expect(state.secondGloves).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/defaultState.test.ts
```

Expected:

```text
FAIL src/versioning/__tests__/defaultState.test.ts
Cannot find module '../defaultState'
```

- [ ] **Step 3: Refactor species typing to derive keys from the version datasets**

```ts
// src/types/species.ts
import { GameVersion } from "./game";
import {
  Size,
  species032,
  species033,
  speciesTrunk,
} from "@/versioning/speciesData";

const speciesByVersion = {
  "0.32": species032,
  "0.33": species033,
  trunk: speciesTrunk,
} as const;

type SpeciesMap = typeof speciesByVersion;

export type SpeciesKey<V extends GameVersion> = keyof SpeciesMap[V];

export { Size };

export const speciesOptions = <V extends GameVersion>(version: V) => {
  return speciesByVersion[version];
};
```

- [ ] **Step 4: Implement default-state construction using registry data and spell-derived schools**

```ts
// src/versioning/defaultState.ts
import type { CalculatorState } from "@/hooks/useCalculatorState";
import { GameVersion } from "@/types/game";
import { VersionedSchoolSkillLevels, VersionedSpellName, VersionedSpellSchool } from "@/types/spells";
import { SpeciesKey } from "@/types/species";
import { getVersionConfig } from "./versionRegistry";

const baseDefaultState = {
  accordionValue: ["sf"],
  accordionOrder: ["sf", "ev", "ac", "sh"],
  dexterity: 10,
  strength: 10,
  intelligence: 10,
  shield: "none" as const,
  armour: "robe" as const,
  shieldSkill: 0,
  armourSkill: 0,
  dodgingSkill: 0,
  helmet: false,
  gloves: false,
  boots: false,
  cloak: false,
  barding: false,
  spellcasting: 0,
  wizardry: 0,
  channel: false,
  wildMagic: 0,
};

const buildSchoolDefaults = <V extends GameVersion>(version: V) => {
  const schools = new Set<string>();

  for (const spell of getVersionConfig(version).spells as {
    schools: string[];
  }[]) {
    for (const school of spell.schools) {
      schools.add(school);
    }
  }

  return Object.fromEntries(
    Array.from(schools)
      .sort()
      .map((school) => [school, 0])
  ) as VersionedSchoolSkillLevels<V>;
};

export const buildDefaultCalculatorState = <V extends GameVersion>(
  version: V
): CalculatorState<V> => {
  const config = getVersionConfig(version);

  const state: CalculatorState<V> = {
    ...baseDefaultState,
    version,
    species: config.defaults.species as SpeciesKey<V>,
    targetSpell: config.defaults.targetSpell as VersionedSpellName<V>,
    schoolSkills: buildSchoolDefaults(version),
  };

  if (config.features.secondGloves) {
    state.secondGloves = false;
  }

  return state;
};
```

- [ ] **Step 5: Update the hook to use the new helpers**

```ts
// src/hooks/useCalculatorState.ts
import { useState, useEffect } from "react";
import { ArmourKey, ShieldKey } from "@/types/equipment.ts";
import { SpeciesKey } from "@/types/species.ts";
import { GameVersion, gameVersions, isGameVersion } from "@/types/game";
import { VersionedSchoolSkillLevels, VersionedSpellName } from "@/types/spells";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
```

```ts
const getDefaultState = <V extends GameVersion>(
  version: V
): CalculatorState<V> => {
  return buildDefaultCalculatorState(version);
};
```

```ts
const validateState = <V extends GameVersion>(
  state: unknown
): state is CalculatorState<V> => {
  if (!isObject(state)) return false;

  if (
    !("version" in state) ||
    typeof state.version !== "string" ||
    !isGameVersion(state.version)
  ) {
    return false;
  }

  const defaultState = getDefaultState(state.version);

  for (const key of Object.keys(defaultState)) {
    if (!(key in state)) {
      return false;
    }
  }

  return true;
};
```

```ts
const saved = gameVersions
  .map((version) => localStorage.getItem(getStorageKey(version)))
  .find(Boolean);
```

- [ ] **Step 6: Run tests to verify the defaults and existing calculations still pass**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/defaultState.test.ts src/utils/__tests__/spellCalculations.test.ts src/utils/__tests__/evCalculations.test.ts
```

Expected:

```text
PASS src/versioning/__tests__/defaultState.test.ts
PASS src/utils/__tests__/spellCalculations.test.ts
PASS src/utils/__tests__/evCalculations.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/types/species.ts src/versioning/defaultState.ts src/versioning/__tests__/defaultState.test.ts src/hooks/useCalculatorState.ts
git commit -m "refactor: derive species and default state from version config"
```

## Task 4: Replace UI Conditionals With Versioning Helpers and Make Enkindle Version-Aware

**Files:**
- Create: `src/versioning/uiOptions.ts`
- Create: `src/versioning/__tests__/uiOptions.test.ts`
- Create: `src/utils/__tests__/spellCanBeEnkindled.test.ts`
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/SpellModeHeader.tsx`
- Modify: `src/utils/spellCanbeEnkindled.ts`

- [ ] **Step 1: Write the failing UI-option and enkindle tests**

```ts
// src/versioning/__tests__/uiOptions.test.ts
import { describe, expect, test } from "@jest/globals";
import { getEquipmentToggleKeys } from "../uiOptions";

describe("getEquipmentToggleKeys", () => {
  test("0.32 does not include secondGloves", () => {
    expect(getEquipmentToggleKeys("0.32")).toEqual([
      "helmet",
      "cloak",
      "gloves",
      "boots",
      "barding",
    ]);
  });

  test("0.33 includes secondGloves", () => {
    expect(getEquipmentToggleKeys("0.33")).toContain("secondGloves");
  });
});
```

```ts
// src/utils/__tests__/spellCanBeEnkindled.test.ts
import { describe, expect, test } from "@jest/globals";
import { spellCanBeEnkindled } from "../spellCanbeEnkindled";

describe("spellCanBeEnkindled", () => {
  test("returns false for non-enkindle versions", () => {
    expect(spellCanBeEnkindled("0.33", "Fire Storm")).toBe(false);
  });

  test("uses trunk rules when the version supports enkindle", () => {
    expect(spellCanBeEnkindled("trunk", "Hellfire Mortar")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/uiOptions.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts
```

Expected:

```text
FAIL src/versioning/__tests__/uiOptions.test.ts
FAIL src/utils/__tests__/spellCanBeEnkindled.test.ts
Cannot find module '../uiOptions'
Expected: false for version "0.33"
Received: true or type error because the function signature does not accept version
```

- [ ] **Step 3: Implement the UI option helper**

```ts
// src/versioning/uiOptions.ts
import { GameVersion } from "@/types/game";
import { getVersionConfig } from "./versionRegistry";

const baseEquipmentToggleKeys = [
  "helmet",
  "cloak",
  "gloves",
  "boots",
  "barding",
] as const;

export const getEquipmentToggleKeys = (version: GameVersion) => {
  const config = getVersionConfig(version);

  return config.features.secondGloves
    ? [...baseEquipmentToggleKeys, "secondGloves"] as const
    : baseEquipmentToggleKeys;
};
```

- [ ] **Step 4: Make enkindle version-aware and refactor the UI consumers**

```ts
// src/utils/spellCanbeEnkindled.ts
import { GameVersion } from "@/types/game";
import {
  VersionedSpellFlag,
  VersionedSpellName,
  VersionedSpellSchool,
} from "@/types/spells";
import { getVersionConfig } from "@/versioning/versionRegistry";
import { getSpellFlags, getSpellSchools } from "./spellCalculation";

const isConjuration = <V extends GameVersion>(
  school: VersionedSpellSchool<V>
): boolean => school === ("conjuration" as VersionedSpellSchool<V>);

const isDestructive = <V extends GameVersion>(
  flag: VersionedSpellFlag<V>
): boolean => flag === ("destructive" as VersionedSpellFlag<V>);

const vehumetSupportsSpell = <V extends GameVersion>(
  version: V,
  spellName: VersionedSpellName<V>
) => {
  if (getSpellSchools(version, spellName).some(isConjuration)) {
    return true;
  }

  if (getSpellFlags(version, spellName).some(isDestructive)) {
    return true;
  }

  return false;
};

export const spellCanBeEnkindled = <V extends GameVersion>(
  version: V,
  spellName?: VersionedSpellName<V>
) => {
  if (!spellName) {
    return false;
  }

  if (!getVersionConfig(version).features.enkindle) {
    return false;
  }

  switch (spellName) {
    case "Iskenderun's Battlesphere":
    case "Spellforged Servitor":
    case "Mephitic Cloud":
      return false;
    case "Grave Claw":
    case "Vampiric Draining":
    case "Borgnjor's Vile Clutch":
    case "Cigotuvi's Putrefaction":
      return true;
    default:
      return vehumetSupportsSpell(version, spellName);
  }
};
```

```ts
// src/components/Calculator.tsx
import { getEquipmentToggleKeys } from "@/versioning/uiOptions";
```

```ts
const checkboxLabelMap = {
  helmet: "Helmet",
  cloak: "Cloak",
  gloves: "Gloves",
  boots: "Boots",
  barding: "Barding",
  secondGloves: "2nd Gloves",
} as const;

const checkboxKeys = getEquipmentToggleKeys(state.version).map((key) => ({
  key,
  label: checkboxLabelMap[key],
}));
```

```ts
// src/components/SpellModeHeader.tsx
{state.species === "revenant" &&
  spellCanBeEnkindled(state.version, spell.name) && (
    <span className="text-[#60FDFF] transform translate-y-0.5">*</span>
  )}
```

- [ ] **Step 5: Run tests and a focused spell regression**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/uiOptions.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts src/utils/__tests__/spellCalculations.test.ts
```

Expected:

```text
PASS src/versioning/__tests__/uiOptions.test.ts
PASS src/utils/__tests__/spellCanBeEnkindled.test.ts
PASS src/utils/__tests__/spellCalculations.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/versioning/uiOptions.ts src/versioning/__tests__/uiOptions.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts src/components/Calculator.tsx src/components/SpellModeHeader.tsx src/utils/spellCanbeEnkindled.ts
git commit -m "refactor: drive UI flags from version config"
```

## Task 5: Centralize Extraction Targets and Add Version Diff Tooling

**Files:**
- Modify: `src/scripts/extractSpellDataHeader.ts`
- Create: `src/versioning/versionDiff.ts`
- Create: `src/versioning/__tests__/versionDiff.test.ts`
- Create: `src/scripts/reportVersionDiff.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing version diff tests**

```ts
// src/versioning/__tests__/versionDiff.test.ts
import { describe, expect, test } from "@jest/globals";
import { diffNamedRecords, summarizeVersionDiff } from "../versionDiff";

describe("versionDiff", () => {
  test("reports added and removed names", () => {
    expect(
      diffNamedRecords(
        [{ name: "Airstrike" }, { name: "Sting" }],
        [{ name: "Airstrike" }, { name: "Forge Lightning Spire" }]
      )
    ).toEqual({
      added: ["Forge Lightning Spire"],
      removed: ["Sting"],
    });
  });

  test("summarizes spell and species diffs together", () => {
    const summary = summarizeVersionDiff(
      "0.32",
      "0.33",
      [{ name: "Airstrike" }, { name: "Sting" }],
      [{ name: "Airstrike" }, { name: "Forge Lightning Spire" }],
      {
        human: { name: "Human", size: "medium" },
        ghoul: { name: "Ghoul", size: "medium" },
      },
      {
        human: { name: "Human", size: "medium" },
        revenant: { name: "Revenant", size: "medium" },
      }
    );

    expect(summary).toContain("Added spells: Forge Lightning Spire");
    expect(summary).toContain("Removed spells: Sting");
    expect(summary).toContain("Added species: revenant");
    expect(summary).toContain("Removed species: ghoul");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/versionDiff.test.ts
```

Expected:

```text
FAIL src/versioning/__tests__/versionDiff.test.ts
Cannot find module '../versionDiff'
```

- [ ] **Step 3: Replace hardcoded extraction calls with an extraction target list**

```ts
// src/scripts/extractSpellDataHeader.ts
type ExtractionTarget = {
  version: "0.32" | "0.33" | "trunk";
  spellDataPath: string;
  extractedSpellDataPath: string;
  extractedSpellTypesPath: string;
};

const extractionTargets: ExtractionTarget[] = [
  {
    version: "0.32",
    spellDataPath: "src/data/spl-data.0.32.h",
    extractedSpellDataPath: "src/data/generated-spells.0.32.json",
    extractedSpellTypesPath: "src/types/generated-spells.0.32.d.ts",
  },
  {
    version: "0.33",
    spellDataPath: "src/data/spl-data.0.33.h",
    extractedSpellDataPath: "src/data/generated-spells.0.33.json",
    extractedSpellTypesPath: "src/types/generated-spells.0.33.d.ts",
  },
  {
    version: "trunk",
    spellDataPath: "src/data/spl-data.trunk.20240428.h",
    extractedSpellDataPath: "src/data/generated-spells.trunk.json",
    extractedSpellTypesPath: "src/types/generated-spells.trunk.d.ts",
  },
];

for (const target of extractionTargets) {
  extract(
    target.spellDataPath,
    target.extractedSpellDataPath,
    target.extractedSpellTypesPath
  );
}
```

- [ ] **Step 4: Implement the version diff helper and CLI script**

```ts
// src/versioning/versionDiff.ts
type NamedRecord = { name: string };

export const diffNamedRecords = (
  previous: NamedRecord[],
  next: NamedRecord[]
) => {
  const previousNames = new Set(previous.map((item) => item.name));
  const nextNames = new Set(next.map((item) => item.name));

  return {
    added: Array.from(nextNames).filter((name) => !previousNames.has(name)).sort(),
    removed: Array.from(previousNames).filter((name) => !nextNames.has(name)).sort(),
  };
};

export const diffSpeciesKeys = (
  previous: Record<string, unknown>,
  next: Record<string, unknown>
) => {
  const previousKeys = new Set(Object.keys(previous));
  const nextKeys = new Set(Object.keys(next));

  return {
    added: Array.from(nextKeys).filter((key) => !previousKeys.has(key)).sort(),
    removed: Array.from(previousKeys).filter((key) => !nextKeys.has(key)).sort(),
  };
};

export const summarizeVersionDiff = (
  previousVersion: string,
  nextVersion: string,
  previousSpells: NamedRecord[],
  nextSpells: NamedRecord[],
  previousSpecies: Record<string, unknown>,
  nextSpecies: Record<string, unknown>
) => {
  const spellDiff = diffNamedRecords(previousSpells, nextSpells);
  const speciesDiff = diffSpeciesKeys(previousSpecies, nextSpecies);

  return [
    `Version diff: ${previousVersion} -> ${nextVersion}`,
    `Added spells: ${spellDiff.added.join(", ") || "(none)"}`,
    `Removed spells: ${spellDiff.removed.join(", ") || "(none)"}`,
    `Added species: ${speciesDiff.added.join(", ") || "(none)"}`,
    `Removed species: ${speciesDiff.removed.join(", ") || "(none)"}`,
  ].join("\n");
};
```

```ts
// src/scripts/reportVersionDiff.ts
import { gameVersions, isGameVersion } from "../types/game";
import { summarizeVersionDiff } from "../versioning/versionDiff";
import { getVersionConfig } from "../versioning/versionRegistry";

const [, , previousVersion, nextVersion] = process.argv;

if (!previousVersion || !nextVersion || !isGameVersion(previousVersion) || !isGameVersion(nextVersion)) {
  console.error(`Usage: npm run report-version-diff -- <${gameVersions.join("|")}> <${gameVersions.join("|")}>`);
  process.exit(1);
}

const previousConfig = getVersionConfig(previousVersion);
const nextConfig = getVersionConfig(nextVersion);

console.log(
  summarizeVersionDiff(
    previousVersion,
    nextVersion,
    previousConfig.spells as { name: string }[],
    nextConfig.spells as { name: string }[],
    previousConfig.species,
    nextConfig.species
  )
);
```

```json
// package.json
{
  "scripts": {
    "report-version-diff": "tsx src/scripts/reportVersionDiff.ts"
  }
}
```

- [ ] **Step 5: Run tests and the diff script**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/versionDiff.test.ts src/scripts/__tests__/parseSpellBlock.test.ts
npm run report-version-diff -- 0.32 0.33
```

Expected:

```text
PASS src/versioning/__tests__/versionDiff.test.ts
PASS src/scripts/__tests__/parseSpellBlock.test.ts
Version diff: 0.32 -> 0.33
Added spells:
Removed spells:
Added species:
Removed species:
```

- [ ] **Step 6: Commit**

```bash
git add src/scripts/extractSpellDataHeader.ts src/versioning/versionDiff.ts src/versioning/__tests__/versionDiff.test.ts src/scripts/reportVersionDiff.ts package.json
git commit -m "feat: add version diff maintenance tooling"
```

## Task 6: Add Operations Documentation and Run Full Verification

**Files:**
- Create: `docs/operations/versioning-workflow.md`
- Modify: `README.md`

- [ ] **Step 1: Write the operations document**

````md
# Versioning Workflow

## Purpose

This guide explains how to add or update a DCSS version in this repository without searching the codebase for scattered version checks.

## Files To Update

- `src/data/spl-data.<version>.h`
- `src/data/generated-spells.<version>.json`
- `src/types/generated-spells.<version>.d.ts`
- `src/versioning/speciesData.ts`
- `src/versioning/versionRegistry.ts`
- `src/versioning/formulaProfiles.ts` only when the formula changes

## Add A New Version

1. Copy the raw DCSS spell header into `src/data/`.
2. Add the new extraction target to `src/scripts/extractSpellDataHeader.ts`.
3. Run `npm run extract-spell-data`.
4. Add the species dataset for the version to `src/versioning/speciesData.ts`.
5. Add the version entry to `src/versioning/versionRegistry.ts`.
6. Reuse an existing formula profile if the calculator rules match.
7. Create a new formula profile only when the rules differ from all existing profiles.

## Check Version Diffs

Run:

```bash
npm run report-version-diff -- 0.33 trunk
```

Review:

- added spells
- removed spells
- added species
- removed species

## Required Verification

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/formulaProfiles.test.ts src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/uiOptions.test.ts src/versioning/__tests__/versionDiff.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts src/utils/__tests__/spellCalculations.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/scripts/__tests__/parseSpellBlock.test.ts
npm run build
```
````

- [ ] **Step 2: Link the operations guide from the README**

```md
## Maintenance

- [Versioning workflow](./docs/operations/versioning-workflow.md)
```

- [ ] **Step 3: Run the full verification suite**

Run:

```bash
npm test -- --runInBand src/versioning/__tests__/formulaProfiles.test.ts src/versioning/__tests__/versionRegistry.test.ts src/versioning/__tests__/defaultState.test.ts src/versioning/__tests__/uiOptions.test.ts src/versioning/__tests__/versionDiff.test.ts src/utils/__tests__/spellCanBeEnkindled.test.ts src/utils/__tests__/spellCalculations.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/scripts/__tests__/parseSpellBlock.test.ts
npm run build
```

Expected:

```text
PASS src/versioning/__tests__/formulaProfiles.test.ts
PASS src/versioning/__tests__/versionRegistry.test.ts
PASS src/versioning/__tests__/defaultState.test.ts
PASS src/versioning/__tests__/uiOptions.test.ts
PASS src/versioning/__tests__/versionDiff.test.ts
PASS src/utils/__tests__/spellCanBeEnkindled.test.ts
PASS src/utils/__tests__/spellCalculations.test.ts
PASS src/utils/__tests__/acCalculations.test.ts
PASS src/utils/__tests__/evCalculations.test.ts
PASS src/utils/__tests__/shCalculations.test.ts
PASS src/scripts/__tests__/parseSpellBlock.test.ts
vite v6
✓ built in
```

- [ ] **Step 4: Commit**

```bash
git add docs/operations/versioning-workflow.md README.md
git commit -m "docs: add versioning workflow guide"
```

## Self-Review

### Spec Coverage

- `versionRegistry` is implemented in Task 1.
- `formulaProfiles` are implemented in Task 1 and consumed in Task 2.
- `speciesData` separation is implemented in Task 1 and wired in Task 3.
- state defaults are centralized in Task 3.
- UI feature flags move behind helpers in Task 4.
- version diff tooling is added in Task 5.
- operations documentation is added in Task 6.

### Placeholder Scan

- No `TODO`, `TBD`, or deferred implementation markers remain.
- Every task includes concrete file paths, code blocks, commands, and expected outcomes.

### Type Consistency

- `GameVersion` stays in `src/types/game.ts`.
- `SpeciesKey<V>` derives from `speciesData.ts`.
- runtime spell selection uses `getVersionConfig(version).spells`.
- formula lookup uses `config.formulaProfile`.
