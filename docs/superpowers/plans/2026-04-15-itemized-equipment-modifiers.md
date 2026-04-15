# Itemized Equipment Modifiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace flat gear-side modifier totals with item-level equipment modifiers that import from `dcss-morgue-parser` detail objects and remain editable next to each item in the UI.

**Architecture:** Keep the calculator formulas mostly unchanged by inserting one aggregation layer between itemized equipment state and the existing AC, EV, SH, and spell-failure helpers. Migrate persistence and import first so state has one clear source of truth, then update the UI to edit those item-level modifiers in place instead of through a separate `Modifiers` section.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind CSS, Jest with `jest-environment-jsdom`, `dcss-morgue-parser`

---

## File Map

### Create

- `src/types/equipmentItems.ts`
- `src/utils/__tests__/equipmentModifiers.test.ts`

### Modify

- `docs/meta--catalog.md`
- `src/components/Calculator.tsx`
- `src/components/DynamicEquipmentControls.tsx`
- `src/components/__tests__/CalculatorLayout.test.tsx`
- `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- `src/hooks/__tests__/calculatorStatePersistence.test.ts`
- `src/hooks/useCalculatorState.ts`
- `src/morgueImport/__tests__/importMorgue.test.ts`
- `src/morgueImport/importMorgue.ts`
- `src/types/equipmentSlots.ts`
- `src/utils/acCalculation.ts`
- `src/utils/calculatorUtils.ts`
- `src/utils/equipmentModifiers.ts`
- `src/utils/evCalculation.ts`
- `src/utils/shCalculation.ts`
- `src/utils/spellCalculation.ts`
- `src/utils/__tests__/acCalculations.test.ts`
- `src/utils/__tests__/evCalculations.test.ts`
- `src/utils/__tests__/shCalculations.test.ts`
- `src/utils/__tests__/spellCalculations.test.ts`
- `src/versioning/__tests__/defaultState.test.ts`
- `src/versioning/defaultState.ts`

### Existing Tests To Keep Green

- `src/hooks/__tests__/calculatorStatePersistence.test.ts`
- `src/morgueImport/__tests__/importMorgue.test.ts`
- `src/utils/__tests__/acCalculations.test.ts`
- `src/utils/__tests__/evCalculations.test.ts`
- `src/utils/__tests__/shCalculations.test.ts`
- `src/utils/__tests__/spellCalculations.test.ts`
- `src/components/__tests__/CalculatorLayout.test.tsx`
- `src/components/__tests__/DynamicEquipmentControls.test.tsx`

### Scope Notes

- Keep dynamic ring, amulet, headgear, and glove slots intact; add item modifier bags rather than redesigning slot counts.
- Replace flat gear aggregates such as `equipmentStr` and `equipmentAC` instead of mirroring them into a second source of truth.
- Preserve mutation and trait modifiers outside equipment.
- Support old saves by migrating unattached legacy totals into one explicit fallback equipment entry rather than silently dropping them.

## Task 1: Introduce Itemized Equipment State And Defaults

**Files:**
- Create: `src/types/equipmentItems.ts`
- Modify: `src/types/equipmentSlots.ts`
- Modify: `src/hooks/useCalculatorState.ts`
- Modify: `src/versioning/defaultState.ts`
- Modify: `src/versioning/__tests__/defaultState.test.ts`
- Test: `src/versioning/__tests__/defaultState.test.ts`

- [ ] **Step 1: Write the failing default-state test**

```ts
// src/versioning/__tests__/defaultState.test.ts
import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "../defaultState";

describe("buildDefaultCalculatorState", () => {
  test("builds itemized equipment defaults and removes flat gear totals", () => {
    const state = buildDefaultCalculatorState("trunk");

    expect(state.bodyArmour).toEqual({
      kind: "robe",
      enchant: 0,
      ego: "none",
    });
    expect(state.shieldItem).toEqual({
      kind: "none",
      enchant: 0,
    });
    expect(state.orbItem).toEqual({
      kind: "none",
    });
    expect(state.cloakItem).toEqual({
      kind: "cloak",
      present: false,
      enchant: 0,
    });
    expect(state.bootsItem).toEqual({
      kind: "boots",
      present: false,
      enchant: 0,
    });
    expect(state.bardingItem).toEqual({
      kind: "barding",
      present: false,
      enchant: 0,
    });
    expect(state.unattributedGear).toBeUndefined();
    expect("equipmentStr" in state).toBe(false);
    expect("equipmentAC" in state).toBe(false);
    expect("wizardry" in state).toBe(false);
    expect(state.ringSlots[0]).toEqual({ kind: "none", plus: 0 });
    expect(state.ringSlots[0].modifiers).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the default-state test to verify it fails**

Run: `npm test -- --runInBand src/versioning/__tests__/defaultState.test.ts`

Expected: FAIL because `bodyArmour`, `shieldItem`, `orbItem`, and fixed item
objects do not exist yet and the default state still exposes flat gear totals.

- [ ] **Step 3: Add shared item types and slot modifier bags**

```ts
// src/types/equipmentItems.ts
import type {
  ArmourKey,
  BodyArmourEgoKey,
  OrbKey,
  ShieldKey,
} from "@/types/equipment";

type ArtifactKind = "normal" | "randart" | "unrand";
type EquipmentSource = "manual" | "imported" | "legacy";

export type EquipmentModifierBag = {
  str?: number;
  dex?: number;
  int?: number;
  ac?: number;
  ev?: number;
  sh?: number;
  wizardry?: number;
};

type EquipmentItemMeta = {
  displayName?: string;
  artifactKind?: ArtifactKind;
  source?: EquipmentSource;
};

export type BodyArmourItemState = EquipmentItemMeta & {
  kind: ArmourKey;
  enchant: number;
  ego: BodyArmourEgoKey;
  modifiers?: EquipmentModifierBag;
};

export type ShieldItemState = EquipmentItemMeta & {
  kind: ShieldKey;
  enchant: number;
  modifiers?: EquipmentModifierBag;
};

export type OrbItemState = EquipmentItemMeta & {
  kind: OrbKey;
  modifiers?: EquipmentModifierBag;
};

export type FixedAuxItemState = EquipmentItemMeta & {
  kind: "cloak" | "boots" | "barding";
  present: boolean;
  enchant: number;
  modifiers?: EquipmentModifierBag;
};

export type UnattributedGearState = {
  label: "legacy gear";
  modifiers: EquipmentModifierBag;
  source: "legacy";
};

export const createDefaultBodyArmourItem = (): BodyArmourItemState => ({
  kind: "robe",
  enchant: 0,
  ego: "none",
});

export const createDefaultShieldItem = (): ShieldItemState => ({
  kind: "none",
  enchant: 0,
});

export const createDefaultOrbItem = (): OrbItemState => ({
  kind: "none",
});

export const createDefaultFixedAuxItem = (
  kind: FixedAuxItemState["kind"]
): FixedAuxItemState => ({
  kind,
  present: false,
  enchant: 0,
});
```

```ts
// src/types/equipmentSlots.ts
import type { EquipmentModifierBag } from "@/types/equipmentItems";

export type RingSlotState = {
  kind: RingSlotKind;
  plus: number;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export type AmuletSlotState = {
  kind: AmuletSlotKind;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export type AuxArmourSlotState = {
  present: boolean;
  enchant: number;
  kind?: HeadgearKind;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};
```

- [ ] **Step 4: Replace flat default equipment fields with itemized defaults**

```ts
// src/hooks/useCalculatorState.ts
import type {
  BodyArmourItemState,
  FixedAuxItemState,
  OrbItemState,
  ShieldItemState,
  UnattributedGearState,
} from "@/types/equipmentItems";

export interface CalculatorState<V extends GameVersion> {
  version: V;
  accordionValue: string[];
  accordionOrder: string[];
  dexterity: number;
  strength: number;
  intelligence: number;
  species: SpeciesKey<V>;
  bodyArmour: BodyArmourItemState;
  shieldItem: ShieldItemState;
  orbItem: OrbItemState;
  cloakItem: FixedAuxItemState;
  bootsItem: FixedAuxItemState;
  bardingItem: FixedAuxItemState;
  ringSlots: RingSlotState[];
  amuletSlots: AmuletSlotState[];
  headgearSlots: AuxArmourSlotState[];
  gloveSlots: AuxArmourSlotState[];
  unattributedGear?: UnattributedGearState;
  subduedMagic?: number;
  antiWizardry?: number;
  runicMagic?: number;
  bigBrainWizardry?: number;
  scalesAC?: number;
  distortionField?: number;
  tenguFlight?: number;
  largeBonePlates?: number;
  schoolSkills?: VersionedSchoolSkillLevels<V>;
  targetSpell?: VersionedSpellName<V>;
  spellcasting?: number;
  wildMagic?: number;
}
```

```ts
// src/versioning/defaultState.ts
import {
  createDefaultBodyArmourItem,
  createDefaultFixedAuxItem,
  createDefaultOrbItem,
  createDefaultShieldItem,
} from "@/types/equipmentItems";

const baseDefaultState = {
  accordionValue: ["sf"],
  accordionOrder: ["sf", "ev", "ac", "sh"],
  dexterity: 10,
  strength: 10,
  intelligence: 10,
  bodyArmour: createDefaultBodyArmourItem(),
  shieldItem: createDefaultShieldItem(),
  orbItem: createDefaultOrbItem(),
  cloakItem: createDefaultFixedAuxItem("cloak"),
  bootsItem: createDefaultFixedAuxItem("boots"),
  bardingItem: createDefaultFixedAuxItem("barding"),
  subduedMagic: 0,
  antiWizardry: 0,
  runicMagic: 0,
  bigBrainWizardry: 0,
  scalesAC: 0,
  distortionField: 0,
  tenguFlight: 0,
  largeBonePlates: 0,
  spellcasting: 0,
  wildMagic: 0,
};
```

- [ ] **Step 5: Run the default-state test to verify it passes**

Run: `npm test -- --runInBand src/versioning/__tests__/defaultState.test.ts`

Expected: PASS with the new itemized equipment shape.

- [ ] **Step 6: Commit**

```bash
git add src/types/equipmentItems.ts src/types/equipmentSlots.ts src/hooks/useCalculatorState.ts src/versioning/defaultState.ts src/versioning/__tests__/defaultState.test.ts
git commit -m "refactor: add itemized equipment state"
```

## Task 2: Migrate Saved State Into Itemized Equipment

**Files:**
- Modify: `src/hooks/useCalculatorState.ts`
- Modify: `src/hooks/__tests__/calculatorStatePersistence.test.ts`
- Test: `src/hooks/__tests__/calculatorStatePersistence.test.ts`

- [ ] **Step 1: Write failing persistence tests for modern and legacy saves**

```ts
// src/hooks/__tests__/calculatorStatePersistence.test.ts
import { describe, expect, test } from "@jest/globals";
import { parseSavedState } from "../useCalculatorState";

describe("parseSavedState", () => {
  test("restores modern itemized equipment saves", () => {
    const modern = {
      version: "trunk",
      species: "human",
      bodyArmour: {
        kind: "ring_mail",
        enchant: 2,
        ego: "none",
        modifiers: { int: 3 },
      },
      shieldItem: {
        kind: "buckler",
        enchant: 1,
        modifiers: { sh: 2 },
      },
      orbItem: {
        kind: "energy",
        modifiers: { wizardry: 1 },
      },
    };

    const parsed = parseSavedState(JSON.stringify(modern));
    expect(parsed?.bodyArmour.modifiers).toEqual({ int: 3 });
    expect(parsed?.shieldItem.modifiers).toEqual({ sh: 2 });
    expect(parsed?.orbItem.modifiers).toEqual({ wizardry: 1 });
  });

  test("migrates legacy flat gear totals into rings and explicit fallback gear", () => {
    const legacy = {
      version: "trunk",
      species: "human",
      armour: "ring_mail",
      bodyArmourEnchant: 2,
      shield: "buckler",
      shieldEnchant: 1,
      orb: "energy",
      ringSlots: [],
      amuletSlots: [],
      headgearSlots: [],
      gloveSlots: [],
      equipmentInt: 3,
      equipmentSH: 2,
      equipmentDex: 1,
      wizardry: 2,
    };

    const parsed = parseSavedState(JSON.stringify(legacy));
    expect(parsed?.ringSlots.slice(0, 2)).toEqual([
      expect.objectContaining({ kind: "wizardry" }),
      expect.objectContaining({ kind: "wizardry" }),
    ]);
    expect(parsed?.unattributedGear).toEqual({
      label: "legacy gear",
      modifiers: { int: 3, sh: 2, dex: 1 },
      source: "legacy",
    });
  });
});
```

- [ ] **Step 2: Run the persistence test to verify it fails**

Run: `npm test -- --runInBand src/hooks/__tests__/calculatorStatePersistence.test.ts`

Expected: FAIL because `parseSavedState` still validates and restores the old
flat gear fields.

- [ ] **Step 3: Add legacy migration helpers and modern validators**

```ts
// src/hooks/useCalculatorState.ts
import {
  createDefaultBodyArmourItem,
  createDefaultFixedAuxItem,
  createDefaultOrbItem,
  createDefaultShieldItem,
  type EquipmentModifierBag,
  type UnattributedGearState,
} from "@/types/equipmentItems";

const isModifierBag = (value: unknown): value is EquipmentModifierBag => {
  if (!isObject(value)) return false;

  return [
    value.str,
    value.dex,
    value.int,
    value.ac,
    value.ev,
    value.sh,
    value.wizardry,
  ].every(isOptionalNumber);
};

const buildLegacyModifierBag = (parsed: Record<string, unknown>) => {
  const modifiers: EquipmentModifierBag = {};

  if (typeof parsed.equipmentStr === "number") modifiers.str = parsed.equipmentStr;
  if (typeof parsed.equipmentDex === "number") modifiers.dex = parsed.equipmentDex;
  if (typeof parsed.equipmentInt === "number") modifiers.int = parsed.equipmentInt;
  if (typeof parsed.equipmentAC === "number") modifiers.ac = parsed.equipmentAC;
  if (typeof parsed.equipmentEV === "number") modifiers.ev = parsed.equipmentEV;
  if (typeof parsed.equipmentSH === "number") modifiers.sh = parsed.equipmentSH;

  return Object.keys(modifiers).length > 0 ? modifiers : undefined;
};

const buildLegacyWizardryRingSlots = (
  wizardry: unknown,
  slotCount: number
) => {
  const count =
    typeof wizardry === "number" ? Math.max(0, Math.trunc(wizardry)) : 0;
  return coerceSlotArrayLength(
    Array.from({ length: Math.min(count, slotCount) }, () => ({
      kind: "wizardry" as const,
      plus: 0,
    })),
    slotCount,
    createDefaultRingSlot
  );
};

const buildUnattributedGear = (
  modifiers: EquipmentModifierBag | undefined
): UnattributedGearState | undefined =>
  modifiers
    ? { label: "legacy gear", modifiers, source: "legacy" }
    : undefined;
```

- [ ] **Step 4: Normalize old saves into the new state shape**

```ts
// src/hooks/useCalculatorState.ts
const normalized = {
  ...defaultState,
  ...parsed,
  bodyArmour: parsed.bodyArmour
    ? parsed.bodyArmour
    : {
        ...createDefaultBodyArmourItem(),
        kind: (parsed.armour as ArmourKey) ?? defaultState.bodyArmour.kind,
        enchant:
          typeof parsed.bodyArmourEnchant === "number"
            ? parsed.bodyArmourEnchant
            : 0,
        ego:
          typeof parsed.bodyArmourEgo === "string"
            ? (parsed.bodyArmourEgo as BodyArmourEgoKey)
            : "none",
      },
  shieldItem: parsed.shieldItem
    ? parsed.shieldItem
    : {
        ...createDefaultShieldItem(),
        kind: (parsed.shield as ShieldKey) ?? "none",
        enchant:
          typeof parsed.shieldEnchant === "number" ? parsed.shieldEnchant : 0,
      },
  orbItem: parsed.orbItem
    ? parsed.orbItem
    : {
        ...createDefaultOrbItem(),
        kind: (parsed.orb as OrbKey) ?? "none",
      },
  cloakItem: parsed.cloakItem
    ? parsed.cloakItem
    : {
        ...createDefaultFixedAuxItem("cloak"),
        present: parsed.cloak === true,
        enchant: typeof parsed.cloakEnchant === "number" ? parsed.cloakEnchant : 0,
      },
  bootsItem: parsed.bootsItem
    ? parsed.bootsItem
    : {
        ...createDefaultFixedAuxItem("boots"),
        present: parsed.boots === true,
        enchant: typeof parsed.bootsEnchant === "number" ? parsed.bootsEnchant : 0,
      },
  bardingItem: parsed.bardingItem
    ? parsed.bardingItem
    : {
        ...createDefaultFixedAuxItem("barding"),
        present: parsed.barding === true,
        enchant:
          typeof parsed.bardingEnchant === "number" ? parsed.bardingEnchant : 0,
      },
  ringSlots: Array.isArray(parsed.ringSlots) && parsed.ringSlots.length > 0
    ? coerceLegacySlots(parsed.ringSlots, slotCounts.ringSlots, createDefaultRingSlot)
    : buildLegacyWizardryRingSlots(parsed.wizardry, slotCounts.ringSlots),
  unattributedGear:
    parsed.unattributedGear ??
    buildUnattributedGear(buildLegacyModifierBag(parsed)),
};
```

- [ ] **Step 5: Run the persistence test to verify it passes**

Run: `npm test -- --runInBand src/hooks/__tests__/calculatorStatePersistence.test.ts`

Expected: PASS, with modern itemized saves loading directly and legacy flat
fields preserved in `unattributedGear`.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCalculatorState.ts src/hooks/__tests__/calculatorStatePersistence.test.ts
git commit -m "refactor: migrate saved equipment to itemized state"
```

## Task 3: Aggregate Item Modifiers And Rewire Calculations

**Files:**
- Create: `src/utils/__tests__/equipmentModifiers.test.ts`
- Modify: `src/utils/equipmentModifiers.ts`
- Modify: `src/utils/calculatorUtils.ts`
- Modify: `src/utils/acCalculation.ts`
- Modify: `src/utils/evCalculation.ts`
- Modify: `src/utils/shCalculation.ts`
- Modify: `src/utils/spellCalculation.ts`
- Modify: `src/utils/__tests__/acCalculations.test.ts`
- Modify: `src/utils/__tests__/evCalculations.test.ts`
- Modify: `src/utils/__tests__/shCalculations.test.ts`
- Modify: `src/utils/__tests__/spellCalculations.test.ts`
- Test: `src/utils/__tests__/equipmentModifiers.test.ts`
- Test: `src/utils/__tests__/acCalculations.test.ts`
- Test: `src/utils/__tests__/evCalculations.test.ts`
- Test: `src/utils/__tests__/shCalculations.test.ts`
- Test: `src/utils/__tests__/spellCalculations.test.ts`

- [ ] **Step 1: Write the failing aggregation helper test**

```ts
// src/utils/__tests__/equipmentModifiers.test.ts
import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { getAggregatedEquipmentEffects } from "../equipmentModifiers";

describe("getAggregatedEquipmentEffects", () => {
  test("sums fixed items, slots, and legacy fallback gear", () => {
    const state = buildDefaultCalculatorState("trunk");
    state.bodyArmour = {
      kind: "ring_mail",
      enchant: 2,
      ego: "none",
      modifiers: { int: 3, ac: 1 },
    };
    state.shieldItem = {
      kind: "buckler",
      enchant: 1,
      modifiers: { sh: 2 },
    };
    state.orbItem = {
      kind: "energy",
      modifiers: { wizardry: 1 },
    };
    state.cloakItem = {
      kind: "cloak",
      present: true,
      enchant: 1,
      modifiers: { ev: 2 },
    };
    state.ringSlots = [
      { kind: "protection", plus: 4, modifiers: { int: 1 } },
      { kind: "wizardry", plus: 0, modifiers: { wizardry: 1 } },
    ];
    state.amuletSlots = [{ kind: "reflection", modifiers: { sh: 1 } }];
    state.unattributedGear = {
      label: "legacy gear",
      modifiers: { dex: 2 },
      source: "legacy",
    };

    expect(getAggregatedEquipmentEffects(state)).toEqual({
      str: 0,
      dex: 2,
      int: 4,
      ac: 5,
      ev: 2,
      sh: 4,
      wizardry: 3,
    });
  });
});
```

- [ ] **Step 2: Run the helper and formula tests to verify they fail**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentModifiers.test.ts src/utils/__tests__/spellCalculations.test.ts`

Expected: FAIL because no itemized aggregation helper exists and spell
calculation still expects `wizardry` plus `ringWizardry`.

- [ ] **Step 3: Implement one aggregation helper and remove direct flat-field reads**

```ts
// src/utils/equipmentModifiers.ts
import type { CalculatorState } from "@/hooks/useCalculatorState";
import type { EquipmentModifierBag } from "@/types/equipmentItems";

type AggregatedEquipmentEffects = {
  str: number;
  dex: number;
  int: number;
  ac: number;
  ev: number;
  sh: number;
  wizardry: number;
};

const emptyEffects = (): AggregatedEquipmentEffects => ({
  str: 0,
  dex: 0,
  int: 0,
  ac: 0,
  ev: 0,
  sh: 0,
  wizardry: 0,
});

const applyModifierBag = (
  totals: AggregatedEquipmentEffects,
  modifiers?: EquipmentModifierBag
) => {
  if (!modifiers) return;
  totals.str += modifiers.str ?? 0;
  totals.dex += modifiers.dex ?? 0;
  totals.int += modifiers.int ?? 0;
  totals.ac += modifiers.ac ?? 0;
  totals.ev += modifiers.ev ?? 0;
  totals.sh += modifiers.sh ?? 0;
  totals.wizardry += modifiers.wizardry ?? 0;
};

export const getAggregatedEquipmentEffects = <V extends GameVersion>(
  state: CalculatorState<V>
) => {
  const totals = emptyEffects();

  applyModifierBag(totals, state.bodyArmour.modifiers);
  applyModifierBag(totals, state.shieldItem.modifiers);
  applyModifierBag(totals, state.orbItem.modifiers);
  applyModifierBag(totals, state.cloakItem.modifiers);
  applyModifierBag(totals, state.bootsItem.modifiers);
  applyModifierBag(totals, state.bardingItem.modifiers);
  applyModifierBag(totals, state.unattributedGear?.modifiers);

  for (const ring of state.ringSlots) {
    if (ring.kind === "protection") totals.ac += ring.plus;
    if (ring.kind === "evasion") totals.ev += ring.plus;
    if (ring.kind === "wizardry") totals.wizardry += 1;
    applyModifierBag(totals, ring.modifiers);
  }

  for (const amulet of state.amuletSlots) {
    applyModifierBag(totals, amulet.modifiers);
  }

  for (const slot of state.headgearSlots) {
    applyModifierBag(totals, slot.modifiers);
  }

  for (const slot of state.gloveSlots) {
    applyModifierBag(totals, slot.modifiers);
  }

  return totals;
};
```

- [ ] **Step 4: Feed calculation helpers from aggregated gear effects**

```ts
// src/utils/calculatorUtils.ts
import { getAggregatedEquipmentEffects } from "./equipmentModifiers";

export const calculateAcData = <V extends GameVersion>(state: CalculatorState<V>) => {
  const gear = getAggregatedEquipmentEffects(state);

  return Array.from({ length: 271 }, (_, index) => {
    const armourSkill = index / 10;

    return {
      armour: armourSkill,
      ac: calculateMixedAC({
        version: state.version,
        species: state.species,
        armour: state.bodyArmour.kind,
        bodyArmourEnchant: state.bodyArmour.enchant,
        headgearSlots: state.headgearSlots,
        gloveSlots: state.gloveSlots,
        boots: state.bootsItem.present,
        bootsEnchant: state.bootsItem.enchant,
        cloak: state.cloakItem.present,
        cloakEnchant: state.cloakItem.enchant,
        barding: state.bardingItem.present,
        bardingEnchant: state.bardingItem.enchant,
        equipmentAC: gear.ac,
        scalesAC: state.scalesAC,
        armourSkill,
      }),
    };
  });
};
```

```ts
// src/utils/spellCalculation.ts
export type SpellCalculationParams<V extends GameVersion> = {
  version: V;
  species: SpeciesKey<V>;
  strength: number;
  equipmentStr?: number;
  spellcasting: number;
  intelligence: number;
  equipmentInt?: number;
  targetSpell: VersionedSpellName<V>;
  schoolSkills: VersionedSchoolSkillLevels<V>;
  spellDifficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  armour: ArmourKey;
  bodyArmourEgo?: BodyArmourEgoKey;
  orb?: OrbKey;
  shield: ShieldKey;
  armourSkill: number;
  shieldSkill: number;
  wizardry?: number;
  bigBrainWizardry?: number;
  subduedMagic?: number;
  antiWizardry?: number;
  runicMagic?: number;
  wildMagic?: number;
  enkindle?: boolean;
};

const totalWizardry = (wizardry ?? 0) + (bigBrainWizardry ?? 0);
```

- [ ] **Step 5: Run the helper and formula tests to verify they pass**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentModifiers.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts`

Expected: PASS, with AC/EV/SH/spell-failure tests reading itemized equipment
through the aggregation helper instead of direct state totals.

- [ ] **Step 6: Commit**

```bash
git add src/utils/equipmentModifiers.ts src/utils/calculatorUtils.ts src/utils/acCalculation.ts src/utils/evCalculation.ts src/utils/shCalculation.ts src/utils/spellCalculation.ts src/utils/__tests__/equipmentModifiers.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts
git commit -m "refactor: aggregate itemized equipment effects"
```

## Task 4: Map Morgue Parser Detail Objects Into Itemized Equipment

**Files:**
- Modify: `src/morgueImport/importMorgue.ts`
- Modify: `src/morgueImport/__tests__/importMorgue.test.ts`
- Test: `src/morgueImport/__tests__/importMorgue.test.ts`

- [ ] **Step 1: Write the failing import test around item-level modifiers**

```ts
// src/morgueImport/__tests__/importMorgue.test.ts
test("maps parser detail modifiers onto the owning equipment item", () => {
  const result = buildImportedCalculatorState(record);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected successful import");
  }

  expect(result.importedState.bodyArmour).toEqual(
    expect.objectContaining({
      kind: "robe",
      enchant: -2,
    })
  );
  expect(result.importedState.shieldItem).toEqual(
    expect.objectContaining({
      kind: "kite_shield",
      enchant: 3,
    })
  );
  expect(result.importedState.headgearSlots[0]).toEqual(
    expect.objectContaining({
      present: true,
      enchant: -1,
      kind: "hat",
      modifiers: { int: 3 },
    })
  );
  expect(result.importedState.ringSlots.slice(0, 3)).toEqual([
    expect.objectContaining({ kind: "protection", plus: 4 }),
    expect.objectContaining({ kind: "wizardry", plus: 0 }),
    expect.objectContaining({ kind: "evasion", plus: 5 }),
  ]);
  expect(result.importedState.unattributedGear).toBeUndefined();
});
```

- [ ] **Step 2: Run the import test to verify it fails**

Run: `npm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts`

Expected: FAIL because import still writes `equipmentInt`, `equipmentSH`, and
legacy `wizardry` totals instead of item-level modifier bags.

- [ ] **Step 3: Build one modifier-bag extractor for parser detail objects**

```ts
// src/morgueImport/importMorgue.ts
import type { EquipmentModifierBag } from "@/types/equipmentItems";

const numericModifierMap = {
  Str: "str",
  Dex: "dex",
  Int: "int",
  AC: "ac",
  EV: "ev",
  SH: "sh",
} as const;

const buildModifierBagFromItem = (
  item: EquipmentItemSnapshot,
  options?: {
    ignoreNumeric?: Array<keyof typeof numericModifierMap>;
    ignoreWiz?: boolean;
  }
): EquipmentModifierBag | undefined => {
  const modifiers: EquipmentModifierBag = {};

  for (const [property, key] of Object.entries(numericModifierMap) as [
    keyof typeof numericModifierMap,
    keyof EquipmentModifierBag,
  ][]) {
    if (options?.ignoreNumeric?.includes(property)) continue;
    const value = item.properties.numeric[property];
    if (typeof value === "number" && value !== 0) {
      modifiers[key] = value;
    }
  }

  if (!options?.ignoreWiz && item.properties.booleanProps.Wiz) {
    modifiers.wizardry = 1;
  }

  return Object.keys(modifiers).length > 0 ? modifiers : undefined;
};
```

- [ ] **Step 4: Map fixed equipment and slot items directly from parser detail objects**

```ts
// src/morgueImport/importMorgue.ts
state.bodyArmour = {
  kind: mapArmour(record.bodyArmourDetails?.baseType) ?? "none",
  enchant: record.bodyArmourDetails?.enchant ?? 0,
  ego: mapBodyArmourEgo(record.bodyArmourDetails),
  modifiers: record.bodyArmourDetails
    ? buildModifierBagFromItem(record.bodyArmourDetails)
    : undefined,
  displayName: record.bodyArmourDetails?.displayName,
  artifactKind: record.bodyArmourDetails?.artifactKind,
  source: record.bodyArmourDetails ? "imported" : undefined,
};

ringSlots[nextIndex] = {
  kind: "protection",
  plus: detail.enchant ?? Number(protectionMatch[1] ?? 0),
  modifiers: buildModifierBagFromItem(detail, { ignoreNumeric: ["AC"] }),
  displayName: detail.displayName,
  artifactKind: detail.artifactKind,
  source: "imported",
};

ringSlots[nextIndex] = {
  kind: "wizardry",
  plus: 0,
  modifiers: buildModifierBagFromItem(detail, { ignoreWiz: true }),
  displayName: detail.displayName,
  artifactKind: detail.artifactKind,
  source: "imported",
};
```

- [ ] **Step 5: Remove residual flat gear totals from import and rerun tests**

Run: `npm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts`

Expected: PASS, with item modifiers attached to the correct equipment entry and
no `equipment*` totals or legacy `wizardry` writes left in the import path.

- [ ] **Step 6: Commit**

```bash
git add src/morgueImport/importMorgue.ts src/morgueImport/__tests__/importMorgue.test.ts
git commit -m "feat: import itemized equipment modifiers"
```

## Task 5: Move Modifier Editing Next To Each Equipment Item

**Files:**
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/DynamicEquipmentControls.tsx`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Modify: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

```ts
// src/components/__tests__/DynamicEquipmentControls.test.tsx
test("renders item modifier inputs next to rings and removes the old Modifiers section", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.ringSlots = [
    {
      kind: "protection",
      plus: 4,
      modifiers: { int: 3 },
      displayName: "ring of intelligence",
      source: "imported",
    },
    { kind: "wizardry", plus: 0 },
  ];

  await act(async () => {
    root.render(<DynamicEquipmentControls state={state} setState={setState} />);
  });

  expect(container.textContent).toContain("Ring 1");
  expect(container.textContent).toContain("ring of intelligence");
  expect(container.textContent).toContain("Int");
  expect(container.textContent).not.toContain("Modifiers");
});
```

```ts
// src/components/__tests__/CalculatorLayout.test.tsx
test("renders body armour, shield, and orb modifier inputs in the equipment section", () => {
  render(<Calculator state={state} setState={setState} />);

  const equipmentSection = screen.getByTestId("sidebar-section-equipment");
  expect(equipmentSection.textContent).toContain("Armour");
  expect(equipmentSection.textContent).toContain("Shield");
  expect(equipmentSection.textContent).toContain("Orb");
  expect(equipmentSection.textContent).toContain("Wiz");
  expect(equipmentSection.textContent).not.toContain("Modifiers");
});
```

- [ ] **Step 2: Run the UI tests to verify they fail**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/CalculatorLayout.test.tsx`

Expected: FAIL because the UI still renders a standalone `Modifiers` section and
fixed equipment controls do not expose per-item modifier editors.

- [ ] **Step 3: Add one small modifier-input renderer and reuse it across equipment**

```ts
// src/components/DynamicEquipmentControls.tsx
const modifierFields = [
  ["Str", "str"],
  ["Dex", "dex"],
  ["Int", "int"],
  ["AC", "ac"],
  ["EV", "ev"],
  ["SH", "sh"],
  ["Wiz", "wizardry"],
] as const;

const updateModifierBag = (
  current: EquipmentModifierBag | undefined,
  key: keyof EquipmentModifierBag,
  value: number
) => {
  const next = { ...(current ?? {}) };
  if (value === 0) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return Object.keys(next).length > 0 ? next : undefined;
};

const EquipmentModifierInputs = ({
  modifiers,
  onChange,
}: {
  modifiers?: EquipmentModifierBag;
  onChange: (next: EquipmentModifierBag | undefined) => void;
}) => (
  <div className="flex flex-wrap gap-4">
    {modifierFields.map(([label, key]) => (
      <AttrInput
        key={key}
        label={label}
        value={modifiers?.[key] ?? 0}
        type="number"
        onChange={(value) => onChange(updateModifierBag(modifiers, key, value))}
      />
    ))}
  </div>
);
```

- [ ] **Step 4: Render modifier editors with each fixed and slot-based equipment control**

```tsx
// src/components/Calculator.tsx
<section data-testid="sidebar-section-equipment" className="flex flex-col gap-3">
  <SectionHeading>Equipment</SectionHeading>
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2">
        <span>Armour:</span>
        <EquipmentEnchantInput
          ariaLabel="Body armour enchant"
          value={state.bodyArmour.enchant}
          onChange={(value) =>
            setState((prev) => ({
              ...prev,
              bodyArmour: { ...prev.bodyArmour, enchant: value },
            }))
          }
        />
      </div>
      {state.bodyArmour.displayName && (
        <span className="text-xs text-muted-foreground">
          {state.bodyArmour.displayName}
        </span>
      )}
      <EquipmentModifierInputs
        modifiers={state.bodyArmour.modifiers}
        onChange={(modifiers) =>
          setState((prev) => ({
            ...prev,
            bodyArmour: { ...prev.bodyArmour, modifiers },
          }))
        }
      />
    </div>
  </div>
</section>
```

```tsx
// src/components/DynamicEquipmentControls.tsx
<div className="flex flex-col gap-2">
  <div className="flex flex-wrap items-center gap-3">
    <span className="text-sm font-medium">Ring {index + 1}</span>
    <Select value={slot.kind} ... />
    {isRingBonusKind(slot.kind) && <AttrInput label="Plus" value={slot.plus} ... />}
  </div>
  {slot.displayName && (
    <span className="text-xs text-muted-foreground">{slot.displayName}</span>
  )}
  <EquipmentModifierInputs
    modifiers={slot.modifiers}
    onChange={(modifiers) =>
      updateRingSlot(index, (current) => ({
        ...current,
        modifiers,
      }))
    }
  />
</div>
```

- [ ] **Step 5: Run the UI tests to verify they pass**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/CalculatorLayout.test.tsx`

Expected: PASS, with no standalone `Modifiers` section and each item exposing
its own nearby modifier inputs.

- [ ] **Step 6: Commit**

```bash
git add src/components/Calculator.tsx src/components/DynamicEquipmentControls.tsx src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx
git commit -m "feat: edit modifiers next to equipment items"
```

## Task 6: Final Verification And Documentation Check

**Files:**
- Modify: `docs/meta--catalog.md`

- [ ] **Step 1: Add the implementation plan to the meta catalog**

```md
| `2026-04-15-itemized-equipment-modifiers.md` | gear-side modifier를 itemized equipment state로 옮기는 구현 계획 문서 | `/docs/superpowers/plans` |
```

- [ ] **Step 2: Run the focused regression suite**

Run: `npm test -- --runInBand src/versioning/__tests__/defaultState.test.ts src/hooks/__tests__/calculatorStatePersistence.test.ts src/utils/__tests__/equipmentModifiers.test.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts src/morgueImport/__tests__/importMorgue.test.ts src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/CalculatorLayout.test.tsx`

Expected: PASS for all targeted regressions.

- [ ] **Step 3: Run the project-level sanity checks**

Run: `npm run build`
Expected: PASS with a production build.

Run: `npm run lint`
Expected: PASS with no new lint errors in the modified files.

- [ ] **Step 4: Confirm documentation coverage before the final code commit**

```txt
Verified documentation coverage:
- Spec: docs/superpowers/specs/2026-04-15-itemized-equipment-modifiers-design.md
- Plan: docs/superpowers/plans/2026-04-15-itemized-equipment-modifiers.md

No extra user-facing documentation is required unless implementation diverges
from the approved spec.
```

- [ ] **Step 5: Commit**

```bash
git add docs/meta--catalog.md
git commit -m "docs: register itemized equipment plan"
```
