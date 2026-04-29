# Form-Aware Defense Calculations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Model Crawl forms, Shapeshifting scaling, and melded equipment so imported form morgues calculate AC, EV, SH, and spell penalties from source rules instead of ignoring form state.

**Architecture:** Add a small versioned form-data layer, preserve parser form/equip state during morgue import, and route AC/EV/SH/spell calculations through shared effective-equipment helpers. Top-line morgue AC/EV/SH remains regression evidence only and is never assigned as calculator output.

**Tech Stack:** Vite, React, TypeScript, Jest, existing `dcss-morgue-parser`, local Crawl source under `crawl/crawl-ref/source`.

---

## File Structure

- Create `src/versioning/formData.ts`: parser-facing form keys, form definitions, scaling helpers, form lookup.
- Create `src/versioning/__tests__/formData.test.ts`: unit coverage for scaling, meld groups, form size/stat data, and special cases.
- Modify `src/versioning/versionRegistry.ts`: expose `forms` on each version config.
- Modify `src/versioning/defaultState.ts`: default form-related calculator state to no form.
- Modify `src/hooks/useCalculatorState.ts`: persist and validate `form`, `shapeshiftingSkill`, `experienceLevel`, and item `equipState`.
- Modify `src/types/equipmentItems.ts`: preserve parser equip state on item-level equipment state.
- Modify `src/types/equipmentSlots.ts`: preserve parser equip state on dynamic ring, amulet, headgear, and glove slots.
- Modify `src/utils/equipmentModifiers.ts`: add form-aware effective equipment helpers and aggregation.
- Modify `src/utils/acCalculation.ts`: accept form AC and body armour AC multiplier inputs.
- Modify `src/utils/evCalculation.ts`: accept effective size and form EV/stat-adjusted inputs.
- Modify `src/utils/shCalculation.ts`: accept blade parry and effective shield state.
- Modify `src/utils/spellCalculation.ts`: receive effective armour/shield/orb and effective stat inputs from calculator utilities.
- Modify `src/utils/calculatorUtils.ts`: use form-aware helpers for AC, EV, SH, and spell calculation params.
- Modify `src/morgueImport/importMorgue.ts`: import parser `form`, Shapeshifting skill, XL, and item `equipState`; normalize base stats with form stat modifiers.
- Modify `src/morgueImport/__tests__/importMorgue.test.ts`: add dragon-form and statue-form defense regressions.
- Add `src/morgueImport/__fixtures__/triskalTrunkDragonForm.ts`: focused fixture for the pasted Triskal morgue.
- Modify `docs/operations/versioning-workflow.md`: record form-data update checklist.
- Modify `docs/meta--catalog.md`: add the implementation plan to the document catalog.

## Task 1: Add Versioned Form Data And Pure Helpers

**Files:**
- Create: `src/versioning/formData.ts`
- Create: `src/versioning/__tests__/formData.test.ts`
- Modify: `src/versioning/versionRegistry.ts`

- [ ] **Step 1: Write failing form helper tests**

Add `src/versioning/__tests__/formData.test.ts`:

```ts
import { Size } from "@/types/species";
import {
  formMeldsSlot,
  getFormDefinition,
  getFormStatModifiers,
  getFormValue,
} from "../formData";

describe("formData", () => {
  test("scales dragon AC from Crawl form data at max Shapeshifting", () => {
    const dragon = getFormDefinition("trunk", "dragon-form");

    expect(getFormValue(dragon.ac, { shapeshiftingSkill: 25, experienceLevel: 25, form: dragon })).toBe(18);
  });

  test("scales statue AC and records statue EV multiplier", () => {
    const statue = getFormDefinition("trunk", "statue-form");

    expect(getFormValue(statue.ac, { shapeshiftingSkill: 25, experienceLevel: 25, form: statue })).toBe(38);
    expect(statue.special?.statueEvMultiplier).toEqual({ numerator: 4, denominator: 5 });
  });

  test("expands physical melds to body, cloak, gloves, boots, barding, helmet, and offhand", () => {
    const dragon = getFormDefinition("trunk", "dragon-form");

    expect(formMeldsSlot(dragon, "body")).toBe(true);
    expect(formMeldsSlot(dragon, "cloak")).toBe(true);
    expect(formMeldsSlot(dragon, "offhand")).toBe(true);
    expect(formMeldsSlot(dragon, "ring")).toBe(false);
  });

  test("uses form size and stat modifiers from Crawl YAML", () => {
    const dragon = getFormDefinition("trunk", "dragon-form");

    expect(dragon.size).toBe(Size.GIANT);
    expect(getFormStatModifiers(dragon)).toEqual({ str: 10, dex: 0, int: 0 });
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/versioning/__tests__/formData.test.ts
```

Expected: fail with module-not-found for `../formData`.

- [ ] **Step 3: Implement form data helpers**

Create `src/versioning/formData.ts` with parser-facing form keys and the first supported trunk/stable definitions:

```ts
import { Size } from "@/types/species";
import type { GameVersion } from "@/types/game";

export type FormKey =
  | "none"
  | "dragon-form"
  | "statue-form"
  | "spider-form"
  | "storm-form"
  | "flux-form"
  | "aqua-form"
  | "amphisbaena-form"
  | "yak-form"
  | "scarab-form"
  | "hive-form"
  | "sphinx-form"
  | "crab-form"
  | "quill-form"
  | "werewolf-form"
  | "blade-form"
  | "maw-form"
  | "medusa-form"
  | "spore-form"
  | "scroll-form"
  | "death-form"
  | "vampire-form"
  | "bat-form"
  | "bat-swarm-form"
  | "pig-form"
  | "tree-form"
  | "wisp-form"
  | "fungus-form"
  | "jelly-form";

export type EquipmentMeldGroup =
  | "weapon"
  | "offhand"
  | "body"
  | "helmet"
  | "gloves"
  | "boots"
  | "barding"
  | "cloak"
  | "ring"
  | "amulet"
  | "held"
  | "aux"
  | "physical"
  | "jewellery"
  | "all";

export type EquipmentSlotForMeld =
  | "weapon"
  | "offhand"
  | "body"
  | "helmet"
  | "gloves"
  | "boots"
  | "barding"
  | "cloak"
  | "ring"
  | "amulet";

export type FormScaling = {
  base?: number;
  scaling?: number;
  xlBased?: boolean;
};

export type FormDefinition = {
  key: FormKey;
  minSkill: number;
  maxSkill: number;
  melds: EquipmentMeldGroup[];
  size?: Size;
  strMod?: number;
  dexMod?: number;
  intMod?: number;
  ac?: FormScaling;
  ev?: FormScaling;
  bodyAcMult?: FormScaling;
  changesAnatomy?: boolean;
  changesSubstance?: boolean;
  special?: {
    dragonDraconianAcPenalty?: number;
    statueEvMultiplier?: { numerator: number; denominator: number };
    bladeParry?: FormScaling;
  };
};

type FormValueParams = {
  shapeshiftingSkill: number;
  experienceLevel: number;
  form: Pick<FormDefinition, "minSkill" | "maxSkill">;
};

const noForm: FormDefinition = {
  key: "none",
  minSkill: 0,
  maxSkill: 0,
  melds: [],
};

export const formDefinitions = {
  "0.32": {},
  "0.33": {},
  "0.34": {},
  trunk: {
    "dragon-form": {
      key: "dragon-form",
      minSkill: 17,
      maxSkill: 25,
      melds: ["physical"],
      size: Size.GIANT,
      strMod: 10,
      ac: { base: 12, scaling: 6 },
      changesAnatomy: true,
      special: { dragonDraconianAcPenalty: 6 },
    },
    "statue-form": {
      key: "statue-form",
      minSkill: 17,
      maxSkill: 25,
      melds: ["gloves", "boots", "barding", "body"],
      strMod: 7,
      ac: { base: 27, scaling: 11 },
      changesSubstance: true,
      special: { statueEvMultiplier: { numerator: 4, denominator: 5 } },
    },
    "spider-form": {
      key: "spider-form",
      minSkill: 12,
      maxSkill: 20,
      melds: ["physical"],
      size: Size.TINY,
      dexMod: 5,
      ac: { base: 3 },
      ev: { base: 5, scaling: 10 },
      changesAnatomy: true,
    },
    "storm-form": {
      key: "storm-form",
      minSkill: 23,
      maxSkill: 27,
      melds: ["physical"],
      ac: { base: 12, scaling: 3 },
      ev: { base: 20, scaling: 7 },
      changesAnatomy: true,
      changesSubstance: true,
    },
    "blade-form": {
      key: "blade-form",
      minSkill: 17,
      maxSkill: 25,
      melds: [],
      bodyAcMult: { base: -50, scaling: 30 },
      special: { bladeParry: { base: 6, scaling: 6 } },
    },
  },
} as const satisfies Record<GameVersion, Partial<Record<FormKey, FormDefinition>>>;

const meldGroupSlots: Record<EquipmentMeldGroup, EquipmentSlotForMeld[]> = {
  weapon: ["weapon"],
  offhand: ["offhand"],
  body: ["body"],
  helmet: ["helmet"],
  gloves: ["gloves"],
  boots: ["boots"],
  barding: ["barding"],
  cloak: ["cloak"],
  ring: ["ring"],
  amulet: ["amulet"],
  held: ["weapon", "offhand"],
  aux: ["helmet", "gloves", "boots", "barding", "cloak"],
  physical: ["weapon", "offhand", "body", "helmet", "gloves", "boots", "barding", "cloak"],
  jewellery: ["ring", "amulet"],
  all: ["weapon", "offhand", "body", "helmet", "gloves", "boots", "barding", "cloak", "ring", "amulet"],
};

export const getFormDefinition = <V extends GameVersion>(
  version: V,
  form: FormKey | null | undefined
): FormDefinition => {
  if (!form || form === "none") {
    return noForm;
  }

  return formDefinitions[version][form] ?? noForm;
};

export const getFormValue = (
  scaling: FormScaling | undefined,
  params: FormValueParams
): number => {
  if (!scaling) {
    return 0;
  }

  const base = scaling.base ?? 0;
  const scale = 100;
  if (scaling.xlBased) {
    return Math.trunc((base * scale + (scaling.scaling ?? 0) * params.experienceLevel * scale / 27) / scale);
  }

  if (params.form.maxSkill === params.form.minSkill) {
    return base;
  }

  const level = Math.min(params.shapeshiftingSkill, params.form.maxSkill) * scale;
  const overMin = level - params.form.minSkill * scale;
  const scaled = base * scale + Math.trunc((overMin * (scaling.scaling ?? 0)) / (params.form.maxSkill - params.form.minSkill));

  return Math.trunc(scaled / scale);
};

export const formMeldsSlot = (
  form: Pick<FormDefinition, "melds">,
  slot: EquipmentSlotForMeld
): boolean => form.melds.some((group) => meldGroupSlots[group].includes(slot));

export const getFormStatModifiers = (
  form: Pick<FormDefinition, "strMod" | "dexMod" | "intMod">
) => ({
  str: form.strMod ?? 0,
  dex: form.dexMod ?? 0,
  int: form.intMod ?? 0,
});
```

Update `src/versioning/versionRegistry.ts` to include form definitions:

```ts
import { formDefinitions, type FormDefinition, type FormKey } from "./formData";
```

Add `forms: Partial<Record<FormKey, FormDefinition>>;` to `VersionConfig`, then add `forms: formDefinitions["0.32"]`, `forms: formDefinitions["0.33"]`, `forms: formDefinitions["0.34"]`, and `forms: formDefinitions.trunk` to each registry entry.

- [ ] **Step 4: Run form data tests**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/versioning/__tests__/formData.test.ts
```

Expected: pass with 4 tests.

- [ ] **Step 5: Commit form data helpers**

Run:

```bash
git add src/versioning/formData.ts src/versioning/__tests__/formData.test.ts src/versioning/versionRegistry.ts
git commit -m "feat: add versioned form data"
```

## Task 2: Preserve Form And Equip State In Calculator State

**Files:**
- Modify: `src/hooks/useCalculatorState.ts`
- Modify: `src/types/equipmentItems.ts`
- Modify: `src/types/equipmentSlots.ts`
- Modify: `src/versioning/defaultState.ts`
- Test: `src/versioning/__tests__/defaultState.test.ts`

- [ ] **Step 1: Write failing default-state and validation tests**

Add to `src/versioning/__tests__/defaultState.test.ts`:

```ts
test("defaults form-related state to untransformed values", () => {
  const state = buildDefaultCalculatorState("trunk");

  expect(state.form).toBe("none");
  expect(state.shapeshiftingSkill).toBe(0);
  expect(state.experienceLevel).toBe(1);
});
```

Add a restore test near existing saved-state tests:

```ts
test("restores imported form and equipment equip states", () => {
  localStorage.setItem(
    "calculator_trunk",
    JSON.stringify({
      ...buildDefaultCalculatorState("trunk"),
      form: "dragon-form",
      shapeshiftingSkill: 25,
      experienceLevel: 25,
      bodyArmour: {
        ...buildDefaultCalculatorState("trunk").bodyArmour,
        equipState: "melded",
      },
    })
  );

  const state = restoreCalculatorState();

  expect(state.form).toBe("dragon-form");
  expect(state.shapeshiftingSkill).toBe(25);
  expect(state.experienceLevel).toBe(25);
  expect(state.bodyArmour.equipState).toBe("melded");
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/versioning/__tests__/defaultState.test.ts
```

Expected: fail because `form`, `shapeshiftingSkill`, `experienceLevel`, and item `equipState` are not present or not validated.

- [ ] **Step 3: Add state fields and equip-state types**

In `src/hooks/useCalculatorState.ts`, import `FormKey` and add to `CalculatorState`:

```ts
import type { FormKey } from "@/versioning/formData";
```

```ts
form?: FormKey;
shapeshiftingSkill?: number;
experienceLevel?: number;
```

Add validation helpers:

```ts
const isEquipmentEquipState = (value: unknown) =>
  value === undefined ||
  value === "worn" ||
  value === "haunted" ||
  value === "melded" ||
  value === "installed";

const isFormKey = (value: unknown): value is FormKey =>
  typeof value === "string" &&
  (value === "none" ||
    value === "dragon-form" ||
    value === "statue-form" ||
    value === "spider-form" ||
    value === "storm-form" ||
    value === "flux-form" ||
    value === "aqua-form" ||
    value === "amphisbaena-form" ||
    value === "yak-form" ||
    value === "scarab-form" ||
    value === "hive-form" ||
    value === "sphinx-form" ||
    value === "crab-form" ||
    value === "quill-form" ||
    value === "werewolf-form" ||
    value === "blade-form" ||
    value === "maw-form" ||
    value === "medusa-form" ||
    value === "spore-form" ||
    value === "scroll-form" ||
    value === "death-form" ||
    value === "vampire-form" ||
    value === "bat-form" ||
    value === "bat-swarm-form" ||
    value === "pig-form" ||
    value === "tree-form" ||
    value === "wisp-form" ||
    value === "fungus-form" ||
    value === "jelly-form");
```

In `src/types/equipmentItems.ts`, add:

```ts
export type EquipmentEquipState = "worn" | "haunted" | "melded" | "installed";
```

Extend `EquipmentItemMeta`:

```ts
equipState?: EquipmentEquipState;
```

In `src/types/equipmentSlots.ts`, add `equipState?: EquipmentEquipState` to ring, amulet, and aux slot state types. Import the type from `equipmentItems`.

In `src/versioning/defaultState.ts`, add to `baseDefaultState`:

```ts
form: "none",
shapeshiftingSkill: 0,
experienceLevel: 1,
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/versioning/__tests__/defaultState.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit state preservation primitives**

Run:

```bash
git add src/hooks/useCalculatorState.ts src/types/equipmentItems.ts src/types/equipmentSlots.ts src/versioning/defaultState.ts src/versioning/__tests__/defaultState.test.ts
git commit -m "feat: preserve form state"
```

## Task 3: Import Parser Form, Shapeshifting, XL, And Equip State

**Files:**
- Create: `src/morgueImport/__fixtures__/triskalTrunkDragonForm.ts`
- Modify: `src/morgueImport/importMorgue.ts`
- Modify: `src/morgueImport/__tests__/importMorgue.test.ts`

- [ ] **Step 1: Add focused Triskal dragon-form fixture**

Create `src/morgueImport/__fixtures__/triskalTrunkDragonForm.ts` using the pasted morgue text. Keep the full status header, equipment section, mutations, and skills section so parser output matches the real case. Export:

```ts
export const triskalTrunkDragonFormMorgue = String.raw`Dungeon Crawl Stone Soup version 0.35-a0-325-g92c20a70a4 (webtiles) character file.

Game seed: 7832032806534488266

645115 Triskal the Skinwalker (level 25, -30/414 (424) HPs)
             Began as a Troll Shapeshifter on Apr 27, 2026.
             Was the Champion of Jiyva.
             Annihilated by Cerebov
             ... wielding the +6 sword of Cerebov {flame}
              (52 damage)
             ... in Pandemonium on Apr 28, 2026.
             The game lasted 04:42:59 (52404 turns).

Triskal the Skinwalker (Troll Shapeshifter)        Turns: 52404, Time: 04:42:59

HP:   -30/414 (424) AC: 18    Str: 44    XL:     25   Next: 96%
MP:   0/37          EV: 22    Int:  8    God:    Jiyva [******]
Gold: 1404          SH:  0    Dex: 11    Spells: 15/46 levels left

rFire   + . .  (50%)      - Teeth and claws
rCold   + . .  (50%)    O - melded skull of Zonguldrok {Reaping Hat+ rN+ Int+4}
rNeg    + . .  (50%)    q - melded +2 troll leather armour {Snorg}
rPois   +      (33%)    (helmet unavailable)
rElec   .      (100%)   g - melded +2 cloak {Will+}
rCorr   +      (50%)    h - amulet "Nicup" {Spirit rN+}
SInv    +               u - ring of the Locust {rF+ EV+5 Str+3}
Will    ++++.           r - +5 ring of evasion
Stlth                   w - dragon-coil talisman "Sawnau" {Will+++ rCorr Int-2 Stlth-}

You were in Pandemonium.
You worshipped Jiyva.
Jiyva was exalted by your worship.
You were a fearsome dragon!

Inventory:

Armour
 g - a +2 cloak of willpower (melded)
 q - a +2 troll leather armour (melded) {Snorg}
 O - the skull of Zonguldrok (melded) {Reaping Hat+ rN+ Int+4}
Jewellery
 h - the amulet "Nicup" (worn) {Spirit rN+}
 r - a +5 ring of evasion (worn)
 u - the ring of the Locust (worn) {rF+ EV+5 Str+3}
Talismans
 w - the dragon-coil talisman "Sawnau" (worn) {Will+++ rCorr Int-2 Stlth-}

   Skills:
 + Level 16.7 Fighting
 * Level 8.1 Throwing
 + Level 17.3 Dodging
 - Level 17.1 Unarmed Combat
 - Level 11.3 Spellcasting
 - Level 3.1 Hexes
 - Level 3.4 Summonings
 - Level 13.0 Necromancy
 - Level 4.0 Translocations
 + Level 6.0 Evocations
 - Level 25.0 Shapeshifting
`;
```

- [ ] **Step 2: Write failing import mapping tests**

Add to `src/morgueImport/__tests__/importMorgue.test.ts`:

```ts
import { triskalTrunkDragonFormMorgue } from "../__fixtures__/triskalTrunkDragonForm";
```

```ts
test("imports trunk dragon form and melded equipment states", () => {
  const parsed = parseMorgueText(triskalTrunkDragonFormMorgue);
  const result = buildImportedCalculatorState(parsed.record);

  expect(result.importedState.form).toBe("dragon-form");
  expect(result.importedState.shapeshiftingSkill).toBe(25);
  expect(result.importedState.experienceLevel).toBe(25);
  expect(result.importedState.bodyArmour.equipState).toBe("melded");
  expect(result.importedState.cloakItem.equipState).toBe("melded");
  expect(result.summary.skipped).not.toContainEqual({
    label: "Form",
    detail: "Form state is not modeled by this calculator.",
  });
});
```

- [ ] **Step 3: Run import test and verify it fails**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/morgueImport/__tests__/importMorgue.test.ts --testNamePattern "dragon form"
```

Expected: fail because imported state does not preserve form/equip state.

- [ ] **Step 4: Implement import mapping**

In `src/morgueImport/importMorgue.ts`, import `FormKey`, `getFormDefinition`, and `getFormStatModifiers`.

After skill import, assign:

```ts
importedState.form = (record.form ?? "none") as CalculatorState<GameVersion>["form"];
importedState.shapeshiftingSkill = record.effectiveSkills.shapeshifting;
importedState.experienceLevel = record.xl;
```

When mapping each item, copy `equipState`:

```ts
equipState: record.bodyArmourDetails?.equipState,
```

Apply this same property to shield, orb, cloak, boots, barding, headgear slots, glove slots, ring slots, and amulet slots when their parser detail object exists.

Update `normalizeImportedBaseStats`:

```ts
const form = getFormDefinition(state.version, state.form);
const formStats = getFormStatModifiers(form);

state.strength = record.strength - itemModifiers.str - formStats.str;
state.dexterity = record.dexterity - itemModifiers.dex - formStats.dex;
state.intelligence = record.intelligence - itemModifiers.int - formStats.int;
```

Replace the old form skipped summary with:

```ts
if (record.form) {
  summary.applied.push({
    label: "Form",
    detail: `${record.form} imported for defense calculations`,
  });
}
```

Keep talisman skipped unless a later UI task models talisman editing.

- [ ] **Step 5: Run import mapping test**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/morgueImport/__tests__/importMorgue.test.ts --testNamePattern "dragon form"
```

Expected: pass.

- [ ] **Step 6: Commit import mapping**

Run:

```bash
git add src/morgueImport/importMorgue.ts src/morgueImport/__tests__/importMorgue.test.ts src/morgueImport/__fixtures__/triskalTrunkDragonForm.ts
git commit -m "feat: import form state from morgues"
```

## Task 4: Add Effective Equipment Helpers

**Files:**
- Modify: `src/utils/equipmentModifiers.ts`
- Test: `src/utils/__tests__/equipmentModifiers.test.ts`

- [ ] **Step 1: Write failing effective equipment tests**

Create or extend `src/utils/__tests__/equipmentModifiers.test.ts`:

```ts
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import {
  getAggregatedEquipmentEffects,
  getEffectiveEquipmentState,
} from "../equipmentModifiers";

describe("form-aware equipment effects", () => {
  test("excludes parser-melded body armour and cloak modifiers", () => {
    const state = buildDefaultCalculatorState("trunk");
    state.bodyArmour = {
      ...state.bodyArmour,
      equipState: "melded",
      modifiers: { ac: 3, str: 2 },
    };
    state.cloakItem = {
      ...state.cloakItem,
      present: true,
      equipState: "melded",
      modifiers: { ev: 4 },
    };

    expect(getAggregatedEquipmentEffects(state)).toMatchObject({
      ac: 0,
      ev: 0,
      str: 0,
    });
  });

  test("dragon form physical meld excludes offhand but keeps rings", () => {
    const state = buildDefaultCalculatorState("trunk");
    state.form = "dragon-form";
    state.shield = "kite_shield";
    state.shieldItem = {
      ...state.shieldItem,
      kind: "kite_shield",
      enchant: 2,
      modifiers: { sh: 5 },
    };
    state.ringSlots[0] = {
      ...state.ringSlots[0],
      kind: "evasion",
      plus: 5,
    };

    const effective = getEffectiveEquipmentState(state);
    const gear = getAggregatedEquipmentEffects(state);

    expect(effective.shield).toBe("none");
    expect(gear.ev).toBe(5);
    expect(gear.sh).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/utils/__tests__/equipmentModifiers.test.ts
```

Expected: fail because `getEffectiveEquipmentState` does not exist and aggregation includes melded modifiers.

- [ ] **Step 3: Implement effective equipment state**

In `src/utils/equipmentModifiers.ts`, add:

```ts
import {
  formMeldsSlot,
  getFormDefinition,
  type EquipmentSlotForMeld,
} from "@/versioning/formData";
```

Add helper:

```ts
const itemIsMelded = (equipState?: string) => equipState === "melded";

export const slotIsEffectivelyMelded = <V extends GameVersion>(
  state: CalculatorState<V>,
  slot: EquipmentSlotForMeld
) => {
  const form = getFormDefinition(state.version, state.form);
  return formMeldsSlot(form, slot);
};

export const getEffectiveEquipmentState = <V extends GameVersion>(
  state: CalculatorState<V>
): CalculatorState<V> => {
  const effective = structuredClone(state) as CalculatorState<V>;

  if (slotIsEffectivelyMelded(state, "body") || itemIsMelded(state.bodyArmour.equipState)) {
    effective.armour = "none";
    effective.bodyArmour = { ...effective.bodyArmour, kind: "none", enchant: 0, modifiers: undefined };
    effective.bodyArmourEnchant = 0;
  }

  if (slotIsEffectivelyMelded(state, "offhand") || itemIsMelded(state.shieldItem.equipState) || itemIsMelded(state.orbItem.equipState)) {
    effective.shield = "none";
    effective.orb = "none";
    effective.shieldItem = { ...effective.shieldItem, kind: "none", enchant: 0, modifiers: undefined };
    effective.orbItem = { ...effective.orbItem, kind: "none", modifiers: undefined };
    effective.shieldEnchant = 0;
  }

  if (slotIsEffectivelyMelded(state, "cloak") || itemIsMelded(state.cloakItem.equipState)) {
    effective.cloak = false;
    effective.cloakItem = { ...effective.cloakItem, present: false, enchant: 0, modifiers: undefined };
    effective.cloakEnchant = 0;
  }

  if (slotIsEffectivelyMelded(state, "boots") || itemIsMelded(state.bootsItem.equipState)) {
    effective.boots = false;
    effective.bootsItem = { ...effective.bootsItem, present: false, enchant: 0, modifiers: undefined };
    effective.bootsEnchant = 0;
  }

  if (slotIsEffectivelyMelded(state, "barding") || itemIsMelded(state.bardingItem.equipState)) {
    effective.barding = false;
    effective.bardingItem = { ...effective.bardingItem, present: false, enchant: 0, modifiers: undefined };
    effective.bardingEnchant = 0;
  }

  effective.headgearSlots = effective.headgearSlots.map((slot) =>
    slotIsEffectivelyMelded(state, "helmet") || itemIsMelded(slot.equipState)
      ? { ...slot, present: false, enchant: 0, modifiers: undefined }
      : slot
  );

  effective.gloveSlots = effective.gloveSlots.map((slot) =>
    slotIsEffectivelyMelded(state, "gloves") || itemIsMelded(slot.equipState)
      ? { ...slot, present: false, enchant: 0, modifiers: undefined }
      : slot
  );

  effective.ringSlots = effective.ringSlots.map((slot) =>
    slotIsEffectivelyMelded(state, "ring") || itemIsMelded(slot.equipState)
      ? { ...slot, kind: "none", plus: 0, modifiers: undefined }
      : slot
  );

  effective.amuletSlots = effective.amuletSlots.map((slot) =>
    slotIsEffectivelyMelded(state, "amulet") || itemIsMelded(slot.equipState)
      ? { ...slot, kind: "none", modifiers: undefined }
      : slot
  );

  return effective;
};
```

At the beginning of `getAggregatedEquipmentEffects`, derive `const effective = getEffectiveEquipmentState(state);` and read equipment from `effective` instead of `state`.

- [ ] **Step 4: Run effective equipment tests**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/utils/__tests__/equipmentModifiers.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit effective equipment helpers**

Run:

```bash
git add src/utils/equipmentModifiers.ts src/utils/__tests__/equipmentModifiers.test.ts
git commit -m "feat: exclude melded equipment effects"
```

## Task 5: Wire Form-Aware AC

**Files:**
- Modify: `src/utils/acCalculation.ts`
- Modify: `src/utils/calculatorUtils.ts`
- Modify: `src/morgueImport/__tests__/importMorgue.test.ts`
- Test: `src/utils/__tests__/acCalculations.test.ts`

- [ ] **Step 1: Write failing AC regression**

Add to `src/morgueImport/__tests__/importMorgue.test.ts`:

```ts
test("calculates imported Triskal dragon-form AC from form AC instead of melded armour", () => {
  const parsed = parseMorgueText(triskalTrunkDragonFormMorgue);
  const result = buildImportedCalculatorState(parsed.record);
  const point = calculateAcData(result.importedState).find(
    (candidate) => candidate.armour === parsed.record.effectiveSkills.armour
  );

  expect(parsed.record.ac).toBe(18);
  expect(point?.ac).toBe(18);
});
```

- [ ] **Step 2: Run AC regression and verify it fails**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/morgueImport/__tests__/importMorgue.test.ts --testNamePattern "dragon-form AC"
```

Expected: fail because form AC is not included yet.

- [ ] **Step 3: Add form AC and body AC multiplier inputs**

In `src/utils/acCalculation.ts`, add params:

```ts
formAC?: number;
bodyArmourBaseAcMultiplier?: number;
```

Apply `bodyArmourBaseAcMultiplier` after armour scaling and before deformed-body adjustment:

```ts
const bodyMultiplier = bodyArmourBaseAcMultiplier ?? 0;
const formAdjustedBodyAc =
  hasBodyArmour && bodyMultiplier !== 0
    ? Math.max(0, scaledBodyAc + Math.trunc((scaledBodyAc * bodyMultiplier) / 100))
    : scaledBodyAc;
```

Use `formAdjustedBodyAc` in place of `scaledBodyAc` for `adjustedBodyAc`, and add `formAC` to the return value.

In `src/utils/calculatorUtils.ts`, import form helpers:

```ts
import { getEffectiveEquipmentState } from "./equipmentModifiers";
import { getFormDefinition, getFormValue } from "@/versioning/formData";
```

In `calculateAcData`, use effective state and form data:

```ts
const effectiveState = getEffectiveEquipmentState(state);
const form = getFormDefinition(state.version, state.form);
const formValueParams = {
  shapeshiftingSkill: state.shapeshiftingSkill ?? 0,
  experienceLevel: state.experienceLevel ?? 1,
  form,
};
const formAC = getFormValue(form.ac, formValueParams);
const bodyArmourBaseAcMultiplier = getFormValue(form.bodyAcMult, formValueParams);
```

Pass `effectiveState` equipment values and `formAC`, `bodyArmourBaseAcMultiplier` into `calculateMixedAC`.

- [ ] **Step 4: Run AC tests**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/morgueImport/__tests__/importMorgue.test.ts src/utils/__tests__/acCalculations.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit form-aware AC**

Run:

```bash
git add src/utils/acCalculation.ts src/utils/calculatorUtils.ts src/morgueImport/__tests__/importMorgue.test.ts src/utils/__tests__/acCalculations.test.ts
git commit -m "feat: apply form AC bonuses"
```

## Task 6: Wire Form-Aware EV

**Files:**
- Modify: `src/utils/evCalculation.ts`
- Modify: `src/utils/calculatorUtils.ts`
- Modify: `src/morgueImport/__tests__/importMorgue.test.ts`
- Test: `src/utils/__tests__/evCalculations.test.ts`

- [ ] **Step 1: Write failing EV regression**

Add to `src/morgueImport/__tests__/importMorgue.test.ts`:

```ts
test("calculates imported Triskal dragon-form EV using giant size and form-aware equipment", () => {
  const parsed = parseMorgueText(triskalTrunkDragonFormMorgue);
  const result = buildImportedCalculatorState(parsed.record);
  const point = calculateEvData(result.importedState).find(
    (candidate) => candidate.dodgingSkill === parsed.record.effectiveSkills.dodging
  );

  expect(parsed.record.ev).toBe(22);
  expect(point?.finalEV).toBe(22);
});
```

- [ ] **Step 2: Run EV regression and verify it fails**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/morgueImport/__tests__/importMorgue.test.ts --testNamePattern "dragon-form EV"
```

Expected: fail because EV still uses species size without form EV special handling.

- [ ] **Step 3: Add effective size and form EV inputs**

In `src/utils/evCalculation.ts`, add params:

```ts
effectiveSize?: Size;
formEV?: number;
evMultiplier?: { numerator: number; denominator: number };
```

Use:

```ts
const sizeFactor = sizeToNumber[effectiveSize ?? speciesOpts[species].size];
```

Add `formEV * CRAWL_STAT_SCALE` to `currentEVScaled` before final floor. Apply `evMultiplier` to natural EV before temporary/direct already modeled values only if the multiplier is present. For this calculator, apply it to the full scaled subtotal before final floor because current direct modifiers are permanent modifiers in the existing model:

```ts
const multipliedEVScaled = evMultiplier
  ? Math.trunc((currentEVScaled * evMultiplier.numerator) / evMultiplier.denominator)
  : currentEVScaled;
const currentEV = Math.max(1, Math.floor(multipliedEVScaled / CRAWL_STAT_SCALE));
```

In `calculateEvData`, pass:

```ts
effectiveSize: form.size,
formEV: getFormValue(form.ev, formValueParams),
evMultiplier: form.special?.statueEvMultiplier,
```

Use `effectiveState` for armour/shield/barding and `gear` from effective aggregation.

- [ ] **Step 4: Run EV tests**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/morgueImport/__tests__/importMorgue.test.ts src/utils/__tests__/evCalculations.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit form-aware EV**

Run:

```bash
git add src/utils/evCalculation.ts src/utils/calculatorUtils.ts src/morgueImport/__tests__/importMorgue.test.ts src/utils/__tests__/evCalculations.test.ts
git commit -m "feat: apply form EV rules"
```

## Task 7: Wire Form-Aware SH And Spell Penalties

**Files:**
- Modify: `src/utils/shCalculation.ts`
- Modify: `src/utils/spellCalculation.ts`
- Modify: `src/utils/calculatorUtils.ts`
- Test: `src/utils/__tests__/shCalculations.test.ts`
- Test: `src/utils/__tests__/spellCalculations.test.ts`

- [ ] **Step 1: Write failing SH and spell penalty tests**

Add to `src/utils/__tests__/shCalculations.test.ts`:

```ts
test("dragon form melds shield and removes shield SH", () => {
  const state = buildDefaultCalculatorState("trunk");
  state.form = "dragon-form";
  state.shield = "kite_shield";
  state.shieldItem = { ...state.shieldItem, kind: "kite_shield", enchant: 2 };
  state.shieldSkill = 15;

  const current = calculateSHData(state).find((point) => point.shield === 15);

  expect(current?.sh).toBe(0);
});
```

Add to `src/utils/__tests__/spellCalculations.test.ts`:

```ts
import { calculateAvgSFData } from "../calculatorUtils";

test("melded body armour and shield do not add spell failure penalties", () => {
  const state = buildDefaultCalculatorState("trunk");
  state.form = "dragon-form";
  state.shapeshiftingSkill = 25;
  state.experienceLevel = 25;
  state.armour = "plate";
  state.bodyArmour = { ...state.bodyArmour, kind: "plate", equipState: "melded" };
  state.shield = "tower_shield";
  state.shieldItem = { ...state.shieldItem, kind: "tower_shield", equipState: "melded" };
  state.targetSpell = "Blink";
  state.spellcasting = 11.3;
  state.schoolSkills = { ...state.schoolSkills!, translocations: 4 };

  const point = calculateAvgSFData(state).find((entry) => entry.spellSkill === 4);

  expect(point?.spellFailureRate).toBeLessThan(50);
});
```

This test must exercise calculator state through `calculateAvgSFData`, not a morgue spell row or parser-provided `failurePercent`.

- [ ] **Step 2: Run SH/spell tests and verify failure**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts --testNamePattern "melded|dragon form"
```

Expected: fail before wiring effective equipment into SH/spell parameter construction.

- [ ] **Step 3: Use effective equipment in SH**

In `calculateSHData`, derive:

```ts
const effectiveState = getEffectiveEquipmentState(state);
const gear = getAggregatedEquipmentEffects(state);
```

Pass `effectiveState.shield`, `effectiveState.shieldEnchant`, and form blade parry:

```ts
bladeParry: getFormValue(form.special?.bladeParry, formValueParams),
```

In `src/utils/shCalculation.ts`, add `bladeParry?: number` to params and include:

```ts
sh += bladeParry * 100;
```

before the final `Math.floor(sh / 2 / 100)`.

- [ ] **Step 4: Use effective equipment in spell calculations**

In `calculatorUtils` spell parameter construction, use `effectiveState` for:

- `armour`
- `bodyArmourEgo`
- `orb`
- `shield`
- `armourSkill`
- `shieldSkill`

Keep the original `state` for selected spell, skills, god, and status values. Use gear from `getAggregatedEquipmentEffects(state)`, which now excludes melded item modifiers.

- [ ] **Step 5: Run SH/spell tests**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit SH and spell wiring**

Run:

```bash
git add src/utils/shCalculation.ts src/utils/spellCalculation.ts src/utils/calculatorUtils.ts src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts
git commit -m "feat: use form-aware equipment for SH and spells"
```

## Task 8: Tighten Morgue Regression Coverage

**Files:**
- Modify: `src/morgueImport/__tests__/importMorgue.test.ts`
- Test fixture: `src/morgueImport/__fixtures__/oniMonkTrunkStatueForm.ts`

- [ ] **Step 1: Add statue fixture regression**

Extend the existing statue-form test:

```ts
test("calculates imported statue-form AC and EV from form rules", () => {
  const parsed = parseMorgueText(oniMonkTrunkStatueFormMorgue);
  const result = buildImportedCalculatorState(parsed.record);
  const acPoint = calculateAcData(result.importedState).find(
    (point) => point.armour === parsed.record.effectiveSkills.armour
  );
  const evPoint = calculateEvData(result.importedState).find(
    (point) => point.dodgingSkill === parsed.record.effectiveSkills.dodging
  );

  expect(parsed.record.form).toBe("statue-form");
  expect(acPoint?.ac).toBe(parsed.record.ac);
  expect(evPoint?.finalEV).toBe(parsed.record.ev);
});
```

- [ ] **Step 2: Run statue regression**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/morgueImport/__tests__/importMorgue.test.ts --testNamePattern "statue-form"
```

Expected: pass with `acPoint.ac === parsed.record.ac` and `evPoint.finalEV === parsed.record.ev`.

- [ ] **Step 3: Fix only formula-backed statue gaps**

If AC fails, inspect:

- `crawl/crawl-ref/source/dat/forms/statue.yaml`
- `crawl/crawl-ref/source/player.cc:6318`
- `crawl/crawl-ref/source/player.cc:6457`

If EV fails, inspect:

- `crawl/crawl-ref/source/player.cc:2141`
- `crawl/crawl-ref/source/player.cc:2174`

Patch only the missing source-backed rule. Do not compensate with fixture-specific constants.

- [ ] **Step 4: Run import regression suite**

Run:

```bash
pnpm test --runInBand --runTestsByPath src/morgueImport/__tests__/importMorgue.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit regression tightening**

Run:

```bash
git add src/morgueImport/__tests__/importMorgue.test.ts
git commit -m "test: cover imported form defenses"
```

## Task 9: Document Maintenance Workflow

**Files:**
- Modify: `docs/operations/versioning-workflow.md`
- Modify: `docs/meta--catalog.md`

- [ ] **Step 1: Add form-data maintenance notes**

In `docs/operations/versioning-workflow.md`, add a subsection under formula-adjacent audits:

```md
### Form data audit

When updating Crawl versions, inspect `crawl/crawl-ref/source/dat/forms/*.yaml`,
`crawl/crawl-ref/source/transform.cc`, and the AC/EV/SH paths in
`crawl/crawl-ref/source/player.cc`.

Update `src/versioning/formData.ts` when any supported version changes:

- form `skill` min/max
- `melds`
- `size`
- `str` or `dex`
- `ac`, `ev`, or `body_ac_mult`
- special cases such as dragon draconian AC, statue EV multiplier, or blade parry

Imported morgue defense tests must continue to derive calculator output from
state and formulas. Do not copy morgue top-line AC, EV, or SH into calculator
state.
```

Add this plan to `docs/meta--catalog.md`:

```md
| `2026-04-29-form-aware-defense-calculations.md` | form-aware AC/EV/SH/spell penalty 계산 구현 계획 | `/docs/superpowers/plans` |
```

- [ ] **Step 2: Verify docs diff**

Run:

```bash
git diff --check docs/operations/versioning-workflow.md docs/meta--catalog.md
```

Expected: no output and exit code 0.

- [ ] **Step 3: Commit docs**

Run:

```bash
git add docs/operations/versioning-workflow.md docs/meta--catalog.md
git commit -m "docs: document form data maintenance"
```

## Final Verification

- [ ] **Step 1: Run focused test suite**

Run:

```bash
pnpm test --runInBand --runTestsByPath \
  src/versioning/__tests__/formData.test.ts \
  src/versioning/__tests__/defaultState.test.ts \
  src/utils/__tests__/equipmentModifiers.test.ts \
  src/utils/__tests__/acCalculations.test.ts \
  src/utils/__tests__/evCalculations.test.ts \
  src/utils/__tests__/shCalculations.test.ts \
  src/utils/__tests__/spellCalculations.test.ts \
  src/morgueImport/__tests__/importMorgue.test.ts
```

Expected: all listed suites pass.

- [ ] **Step 2: Run lint on changed source files**

Run:

```bash
pnpm exec eslint \
  src/versioning/formData.ts \
  src/versioning/versionRegistry.ts \
  src/versioning/defaultState.ts \
  src/hooks/useCalculatorState.ts \
  src/types/equipmentItems.ts \
  src/types/equipmentSlots.ts \
  src/utils/equipmentModifiers.ts \
  src/utils/acCalculation.ts \
  src/utils/evCalculation.ts \
  src/utils/shCalculation.ts \
  src/utils/spellCalculation.ts \
  src/utils/calculatorUtils.ts \
  src/morgueImport/importMorgue.ts
```

Expected: no output and exit code 0.

- [ ] **Step 3: Run production build**

Run:

```bash
pnpm build
```

Expected: Vite build exits 0.

- [ ] **Step 4: Confirm git status**

Run:

```bash
git status --short
```

Expected: no unstaged or staged changes unless the implementation branch intentionally leaves follow-up notes.
