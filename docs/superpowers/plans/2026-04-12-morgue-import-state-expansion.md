# Morgue Import State Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the calculator so morgue import and manual editing both support dynamic jewellery and auxiliary slots, signed enchant values, residual equipment modifiers, and the parity-relevant mutation subset needed for AC, EV, SH, and spell failure.

**Architecture:** Keep the existing versioned calculator model, but add one explicit layer for dynamic slot counts and one explicit layer for aggregating slot effects into calculation inputs. Import, UI, persistence, and formulas should all speak the same normalized state shape so imported values stay manually editable instead of living in import-only fields.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind CSS, Jest with `jest-environment-jsdom`

---

## File Map

### Create

- `src/types/equipmentSlots.ts`
- `src/versioning/dynamicSlotCounts.ts`
- `src/versioning/__tests__/dynamicSlotCounts.test.ts`
- `src/hooks/__tests__/calculatorStatePersistence.test.ts`
- `src/utils/equipmentModifiers.ts`
- `src/components/DynamicEquipmentControls.tsx`
- `src/components/__tests__/DynamicEquipmentControls.test.tsx`

### Modify

- `docs/meta--catalog.md`
- `src/components/AttrInput.tsx`
- `src/components/Calculator.tsx`
- `src/components/SpellControls.tsx`
- `src/components/__tests__/CalculatorLayout.test.tsx`
- `src/hooks/useCalculatorState.ts`
- `src/morgueImport/importMorgue.ts`
- `src/morgueImport/__tests__/importMorgue.test.ts`
- `src/utils/acCalculation.ts`
- `src/utils/calculatorUtils.ts`
- `src/utils/evCalculation.ts`
- `src/utils/shCalculation.ts`
- `src/utils/spellCalculation.ts`
- `src/utils/__tests__/acCalculations.test.ts`
- `src/utils/__tests__/evCalculations.test.ts`
- `src/utils/__tests__/shCalculations.test.ts`
- `src/utils/__tests__/spellCalculations.test.ts`
- `src/versioning/defaultState.ts`
- `src/versioning/speciesData.ts`
- `src/versioning/speciesModel.ts`
- `src/versioning/uiOptions.ts`

### Existing Tests To Keep Green

- `src/morgueImport/__tests__/importMorgue.test.ts`
- `src/utils/__tests__/acCalculations.test.ts`
- `src/utils/__tests__/evCalculations.test.ts`
- `src/utils/__tests__/shCalculations.test.ts`
- `src/utils/__tests__/spellCalculations.test.ts`
- `src/components/__tests__/CalculatorLayout.test.tsx`

### Scope Notes

- This batch should only implement dynamic slot counts that the current state
  model can actually express. In practice that means:
  - Octopode ring slot expansion
  - Formicid double gloves
- Do not add manual controls for hypothetical slot-granting gear that the app
  still does not model as equipment choices.
- Keep `boots`, `cloak`, and `barding` as the current fixed controls, but add
  signed enchant inputs for boots and cloak.

### Implementation Notes

- 2026-04-13 update:
  - Headgear now models `hat` and `helmet` separately so imported hats keep
    signed enchant without gaining helmet base AC.
  - Headgear and glove editing now use selector-based controls with the signed
    enchant input rendered before the selector.
  - Body armour, shield, cloak, boots, and barding now share the same compact
    enchant input component so the equipment controls use a consistent width.
  - `bardingEnchant` was added to calculator state, AC calculation plumbing,
    and morgue import normalization so barding enchant remains editable after
    import.

## Task 1: Add Dynamic Slot State, Defaults, And Saved-State Migration

**Files:**
- Create: `src/types/equipmentSlots.ts`
- Create: `src/versioning/dynamicSlotCounts.ts`
- Create: `src/versioning/__tests__/dynamicSlotCounts.test.ts`
- Create: `src/hooks/__tests__/calculatorStatePersistence.test.ts`
- Modify: `src/hooks/useCalculatorState.ts`
- Modify: `src/versioning/defaultState.ts`
- Modify: `src/versioning/speciesData.ts`
- Modify: `src/versioning/speciesModel.ts`
- Test: `src/versioning/__tests__/dynamicSlotCounts.test.ts`
- Test: `src/hooks/__tests__/calculatorStatePersistence.test.ts`

- [ ] **Step 1: Write the failing dynamic-slot resolver test**

```ts
// src/versioning/__tests__/dynamicSlotCounts.test.ts
import { describe, expect, test } from "@jest/globals";
import {
  coerceSlotArrayLength,
  getDynamicSlotCounts,
} from "../dynamicSlotCounts";

describe("dynamic slot counts", () => {
  test("uses species-aware overrides for octopode rings and formicid gloves", () => {
    expect(getDynamicSlotCounts("trunk", "human")).toEqual({
      ringSlots: 2,
      amuletSlots: 1,
      headgearSlots: 1,
      gloveSlots: 1,
    });

    expect(getDynamicSlotCounts("trunk", "octopode")).toEqual({
      ringSlots: 8,
      amuletSlots: 1,
      headgearSlots: 1,
      gloveSlots: 1,
    });

    expect(getDynamicSlotCounts("0.34", "formicid")).toEqual({
      ringSlots: 2,
      amuletSlots: 1,
      headgearSlots: 1,
      gloveSlots: 2,
    });
  });

  test("truncates or pads slot arrays to the current legal size", () => {
    expect(
      coerceSlotArrayLength(
        [{ kind: "wizardry", plus: 0 }, { kind: "protection", plus: 5 }],
        1,
        () => ({ kind: "none", plus: 0 })
      )
    ).toEqual([{ kind: "wizardry", plus: 0 }]);

    expect(
      coerceSlotArrayLength([], 2, () => ({ kind: "none", plus: 0 }))
    ).toEqual([
      { kind: "none", plus: 0 },
      { kind: "none", plus: 0 },
    ]);
  });
});
```

- [ ] **Step 2: Run the resolver test to verify it fails**

Run: `pnpm test src/versioning/__tests__/dynamicSlotCounts.test.ts --runInBand`

Expected: FAIL because `dynamicSlotCounts.ts` does not exist and no slot
resolver is available yet.

- [ ] **Step 3: Implement slot types and the resolver**

```ts
// src/types/equipmentSlots.ts
export type RingSlotKind = "none" | "wizardry" | "protection" | "evasion";

export type RingSlotState = {
  kind: RingSlotKind;
  plus: number;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export type AmuletSlotKind = "none" | "reflection";

export type AmuletSlotState = {
  kind: AmuletSlotKind;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export type AuxArmourSlotState = {
  present: boolean;
  enchant: number;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export const createDefaultRingSlot = (): RingSlotState => ({
  kind: "none",
  plus: 0,
});

export const createDefaultAmuletSlot = (): AmuletSlotState => ({
  kind: "none",
});

export const createDefaultAuxArmourSlot = (): AuxArmourSlotState => ({
  present: false,
  enchant: 0,
});
```

```ts
// src/versioning/dynamicSlotCounts.ts
import type { GameVersion } from "@/types/game";
import type { SpeciesKey } from "@/types/species";
import { getVersionSpecies } from "./versionRegistry";

export type DynamicSlotCounts = {
  ringSlots: number;
  amuletSlots: number;
  headgearSlots: number;
  gloveSlots: number;
};

const baseSlotCounts: DynamicSlotCounts = {
  ringSlots: 2,
  amuletSlots: 1,
  headgearSlots: 1,
  gloveSlots: 1,
};

export const getDynamicSlotCounts = <V extends GameVersion>(
  version: V,
  species: SpeciesKey<V>
): DynamicSlotCounts => {
  const speciesData = getVersionSpecies(version)[species];
  return {
    ...baseSlotCounts,
    ...speciesData.slotOverrides,
  };
};

export const coerceSlotArrayLength = <T>(
  slots: T[] | undefined,
  count: number,
  makeDefault: () => T
) => {
  const current = [...(slots ?? [])].slice(0, count);
  while (current.length < count) {
    current.push(makeDefault());
  }
  return current;
};
```

```ts
// src/versioning/speciesModel.ts
export type SpeciesOption = {
  name: string;
  size: Size;
  deformedBody?: boolean;
  slotOverrides?: Partial<{
    ringSlots: number;
    amuletSlots: number;
    headgearSlots: number;
    gloveSlots: number;
  }>;
};
```

```ts
// src/versioning/speciesData.ts
  formicid: {
    name: "Formicid",
    size: Size.MEDIUM,
    slotOverrides: { gloveSlots: 2 },
  },
  octopode: {
    name: "Octopode",
    size: Size.MEDIUM,
    slotOverrides: { ringSlots: 8 },
  },
```

- [ ] **Step 4: Run the resolver test to verify it passes**

Run: `pnpm test src/versioning/__tests__/dynamicSlotCounts.test.ts --runInBand`

Expected: PASS

- [ ] **Step 5: Write the failing saved-state migration test**

```ts
// src/hooks/__tests__/calculatorStatePersistence.test.ts
/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { parseSavedState } from "../useCalculatorState";

describe("calculator saved-state migration", () => {
  test("migrates secondGloves and scalar wizardry into dynamic slots", () => {
    const legacy = {
      ...buildDefaultCalculatorState("0.34"),
      gloves: true,
      secondGloves: true,
      wizardry: 2,
    };

    const parsed = parseSavedState(JSON.stringify(legacy));
    expect(parsed).not.toBeNull();
    expect(parsed?.gloveSlots.map((slot) => slot.present)).toEqual([true, true]);
    expect(parsed?.ringSlots.slice(0, 2).map((slot) => slot.kind)).toEqual([
      "wizardry",
      "wizardry",
    ]);
  });
});
```

- [ ] **Step 6: Run the migration test to verify it fails**

Run: `pnpm test src/hooks/__tests__/calculatorStatePersistence.test.ts --runInBand`

Expected: FAIL because `parseSavedState` is not exported and the new slot arrays
are not part of the saved-state shape yet.

- [ ] **Step 7: Extend default state and migration**

```ts
// src/versioning/defaultState.ts
import {
  createDefaultAmuletSlot,
  createDefaultAuxArmourSlot,
  createDefaultRingSlot,
} from "@/types/equipmentSlots";
import { coerceSlotArrayLength, getDynamicSlotCounts } from "./dynamicSlotCounts";

const baseDefaultState = {
  accordionValue: ["sf"],
  accordionOrder: ["sf", "ev", "ac", "sh"],
  dexterity: 10,
  strength: 10,
  intelligence: 10,
  shield: "none" as const,
  orb: "none" as const,
  armour: "robe" as const,
  shieldSkill: 0,
  armourSkill: 0,
  dodgingSkill: 0,
  boots: false,
  bootsEnchant: 0,
  cloak: false,
  cloakEnchant: 0,
  barding: false,
  bodyArmourEnchant: 0,
  shieldEnchant: 0,
  equipmentStr: 0,
  equipmentDex: 0,
  equipmentInt: 0,
  equipmentAC: 0,
  equipmentEV: 0,
  equipmentSH: 0,
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

export const buildDefaultCalculatorState = <V extends GameVersion>(version: V) => {
  const config = getVersionConfig(version);
  const slotCounts = getDynamicSlotCounts(version, config.defaults.species);

  return {
    ...baseDefaultState,
    version,
    species: config.defaults.species,
    targetSpell: config.defaults.targetSpell,
    schoolSkills: buildSchoolDefaults(version),
    ringSlots: coerceSlotArrayLength([], slotCounts.ringSlots, createDefaultRingSlot),
    amuletSlots: coerceSlotArrayLength([], slotCounts.amuletSlots, createDefaultAmuletSlot),
    headgearSlots: coerceSlotArrayLength([], slotCounts.headgearSlots, createDefaultAuxArmourSlot),
    gloveSlots: coerceSlotArrayLength([], slotCounts.gloveSlots, createDefaultAuxArmourSlot),
  };
};
```

```ts
// src/hooks/useCalculatorState.ts
export const parseSavedState = (saved: string): CalculatorState<GameVersion> | null => {
  try {
    const parsed = JSON.parse(saved);
    if (!isObject(parsed)) return null;

    const version = parsed.version;
    if (!isGameVersion(version)) return null;

    const migrated = {
      ...buildDefaultCalculatorState(version),
      ...parsed,
      ringSlots: migrateLegacyWizardrySlots(parsed),
      gloveSlots: migrateLegacyGloveSlots(parsed),
    };

    return validateState(migrated) ? migrated : null;
  } catch {
    return null;
  }
};
```

- [ ] **Step 8: Run both state tests to verify they pass**

Run: `pnpm test src/versioning/__tests__/dynamicSlotCounts.test.ts src/hooks/__tests__/calculatorStatePersistence.test.ts --runInBand`

Expected: PASS

- [ ] **Step 9: Commit the state-shape foundation**

```bash
git add src/types/equipmentSlots.ts src/versioning/dynamicSlotCounts.ts src/versioning/speciesModel.ts src/versioning/speciesData.ts src/versioning/defaultState.ts src/hooks/useCalculatorState.ts src/versioning/__tests__/dynamicSlotCounts.test.ts src/hooks/__tests__/calculatorStatePersistence.test.ts
git commit -m "feat: add dynamic equipment slot state"
```

## Task 2: Expand Formula Inputs And Aggregation Helpers

**Files:**
- Create: `src/utils/equipmentModifiers.ts`
- Modify: `src/utils/acCalculation.ts`
- Modify: `src/utils/evCalculation.ts`
- Modify: `src/utils/shCalculation.ts`
- Modify: `src/utils/spellCalculation.ts`
- Modify: `src/utils/calculatorUtils.ts`
- Modify: `src/utils/__tests__/acCalculations.test.ts`
- Modify: `src/utils/__tests__/evCalculations.test.ts`
- Modify: `src/utils/__tests__/shCalculations.test.ts`
- Modify: `src/utils/__tests__/spellCalculations.test.ts`
- Test: `src/utils/__tests__/acCalculations.test.ts`
- Test: `src/utils/__tests__/evCalculations.test.ts`
- Test: `src/utils/__tests__/shCalculations.test.ts`
- Test: `src/utils/__tests__/spellCalculations.test.ts`

- [ ] **Step 1: Write the failing AC, EV, and SH regression tests**

```ts
// src/utils/__tests__/acCalculations.test.ts
test("signed enchant, protection rings, residual AC, and scales AC all affect AC", () => {
  expect(
    calculateMixedAC({
      version: "trunk",
      species: "human",
      armour: "robe",
      armourSkill: 0,
      headgearSlots: [{ present: true, enchant: -1 }],
      gloveSlots: [{ present: true, enchant: 2 }],
      boots: true,
      bootsEnchant: 0,
      cloak: true,
      cloakEnchant: -1,
      bodyArmourEnchant: 0,
      ringProtection: 4,
      equipmentAC: 2,
      scalesAC: 3,
    })
  ).toBe(15);
});
```

```ts
// src/utils/__tests__/evCalculations.test.ts
test("equipment stats, evasion rings, and EV mutations stack into EV", () => {
  const base = calculateEV({
    version: "trunk",
    dodgingSkill: 10,
    dexterity: 12,
    equipmentDex: 0,
    strength: 10,
    equipmentStr: 0,
    species: "tengu",
    shield: "none",
    armour: "robe",
    barding: false,
    shieldSkill: 0,
    armourSkill: 0,
    ringEvasion: 0,
    equipmentEV: 0,
    distortionField: 0,
    tenguFlight: 0,
  });

  const modified = calculateEV({
    version: "trunk",
    dodgingSkill: 10,
    dexterity: 12,
    equipmentDex: 6,
    strength: 10,
    equipmentStr: 0,
    species: "tengu",
    shield: "none",
    armour: "robe",
    barding: false,
    shieldSkill: 0,
    armourSkill: 0,
    ringEvasion: 5,
    equipmentEV: 2,
    distortionField: 3,
    tenguFlight: 1,
  });

  expect(modified.finalEV - base.finalEV).toBe(17);
});
```

```ts
// src/utils/__tests__/shCalculations.test.ts
test("shield enchant, reflection, residual SH, bone plates, and equipment dex affect SH", () => {
  const base = calculateSH({
    shield: "tower_shield",
    shieldSkill: 27,
    dexterity: 15,
    equipmentDex: 0,
    shieldEnchant: 0,
    equipmentSH: 0,
    amuletReflection: 0,
    largeBonePlates: 0,
  });

  const modified = calculateSH({
    shield: "tower_shield",
    shieldSkill: 27,
    dexterity: 15,
    equipmentDex: 6,
    shieldEnchant: 3,
    equipmentSH: 4,
    amuletReflection: 1,
    largeBonePlates: 2,
  });

  expect(modified - base).toBe(18);
});
```

- [ ] **Step 2: Write the failing spell-failure tests**

```ts
// src/utils/__tests__/spellCalculations.test.ts
test("wizardry slots, big brain, subdued magic, and anti-wizardry affect spell failure", () => {
  const base = calculateSpellFailureRate({
    version: "trunk",
    species: "human",
    strength: 10,
    equipmentStr: 0,
    spellcasting: 8,
    intelligence: 18,
    equipmentInt: 0,
    targetSpell: "Fireball",
    schoolSkills: { fire: 8, conjuration: 8 } as never,
    spellDifficulty: 5,
    armour: "robe",
    shield: "none",
    armourSkill: 0,
    shieldSkill: 0,
    ringWizardry: 0,
    bigBrainWizardry: 0,
    subduedMagic: 0,
    antiWizardry: 0,
    runicMagic: 0,
    wildMagic: 0,
  });

  const modified = calculateSpellFailureRate({
    version: "trunk",
    species: "human",
    strength: 10,
    equipmentStr: 0,
    spellcasting: 8,
    intelligence: 18,
    equipmentInt: 0,
    targetSpell: "Fireball",
    schoolSkills: { fire: 8, conjuration: 8 } as never,
    spellDifficulty: 5,
    armour: "robe",
    shield: "none",
    armourSkill: 0,
    shieldSkill: 0,
    ringWizardry: 2,
    bigBrainWizardry: 1,
    subduedMagic: 1,
    antiWizardry: 1,
    runicMagic: 0,
    wildMagic: 0,
  });

  expect(modified).toBeLessThan(base);
});

test("runic magic reduces the body-armour spell penalty", () => {
  const base = calculateSpellFailureRate({
    version: "trunk",
    species: "human",
    strength: 12,
    equipmentStr: 0,
    spellcasting: 6,
    intelligence: 16,
    equipmentInt: 0,
    targetSpell: "Fireball",
    schoolSkills: { fire: 6, conjuration: 6 } as never,
    spellDifficulty: 5,
    armour: "plate",
    shield: "none",
    armourSkill: 0,
    shieldSkill: 0,
    ringWizardry: 0,
    bigBrainWizardry: 0,
    subduedMagic: 0,
    antiWizardry: 0,
    runicMagic: 0,
    wildMagic: 0,
  });

  const modified = calculateSpellFailureRate({
    version: "trunk",
    species: "human",
    strength: 12,
    equipmentStr: 0,
    spellcasting: 6,
    intelligence: 16,
    equipmentInt: 0,
    targetSpell: "Fireball",
    schoolSkills: { fire: 6, conjuration: 6 } as never,
    spellDifficulty: 5,
    armour: "plate",
    shield: "none",
    armourSkill: 0,
    shieldSkill: 0,
    ringWizardry: 0,
    bigBrainWizardry: 0,
    subduedMagic: 0,
    antiWizardry: 0,
    runicMagic: 1,
    wildMagic: 0,
  });

  expect(modified).toBeLessThan(base);
});
```

- [ ] **Step 3: Run the formula tests to verify they fail**

Run: `pnpm test src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts --runInBand`

Expected: FAIL because the calculators do not accept the new slot and residual
modifier inputs yet.

- [ ] **Step 4: Add one aggregation helper for slot-derived modifiers**

```ts
// src/utils/equipmentModifiers.ts
import type {
  AmuletSlotState,
  AuxArmourSlotState,
  RingSlotState,
} from "@/types/equipmentSlots";

export const getRingProtectionBonus = (ringSlots: RingSlotState[] = []) =>
  ringSlots
    .filter((slot) => slot.kind === "protection")
    .reduce((sum, slot) => sum + slot.plus, 0);

export const getRingEvasionBonus = (ringSlots: RingSlotState[] = []) =>
  ringSlots
    .filter((slot) => slot.kind === "evasion")
    .reduce((sum, slot) => sum + slot.plus, 0);

export const getRingWizardryCount = (ringSlots: RingSlotState[] = []) =>
  ringSlots.filter((slot) => slot.kind === "wizardry").length;

export const getAmuletReflectionCount = (amuletSlots: AmuletSlotState[] = []) =>
  amuletSlots.filter((slot) => slot.kind === "reflection").length;

export const getAuxArmourEnchantTotal = (slots: AuxArmourSlotState[] = []) =>
  slots.filter((slot) => slot.present).reduce((sum, slot) => sum + slot.enchant, 0);

export const getAuxArmourBaseAc = (
  slots: AuxArmourSlotState[] = [],
  baseAcPerPiece: number
) => slots.filter((slot) => slot.present).length * baseAcPerPiece;
```

- [ ] **Step 5: Extend the calculators and chart input wiring**

```ts
// src/utils/acCalculation.ts
type MixedCalculationsParams<V extends GameVersion> = {
  version: V;
  species: SpeciesKey<V>;
  armour?: ArmourKey;
  armourSkill: number;
  bodyArmourEnchant?: number;
  headgearSlots?: AuxArmourSlotState[];
  gloveSlots?: AuxArmourSlotState[];
  boots?: boolean;
  bootsEnchant?: number;
  cloak?: boolean;
  cloakEnchant?: number;
  barding?: boolean;
  ringProtection?: number;
  equipmentAC?: number;
  scalesAC?: number;
};

const scaledBaseAc = calculateAC(baseAC, armourSkill);
return (
  scaledBaseAc
  + (bodyArmourEnchant ?? 0)
  + getAuxArmourEnchantTotal(headgearSlots)
  + getAuxArmourEnchantTotal(gloveSlots)
  + (boots ? bootsEnchant ?? 0 : 0)
  + (cloak ? cloakEnchant ?? 0 : 0)
  + (ringProtection ?? 0)
  + (equipmentAC ?? 0)
  + (scalesAC ?? 0)
  - deformedPenalty
);
```

```ts
// src/utils/evCalculation.ts
const effectiveStrength = strength + (equipmentStr ?? 0);
const effectiveDexterity = dexterity + (equipmentDex ?? 0);
const directBonus =
  (ringEvasion ?? 0) +
  (equipmentEV ?? 0) +
  ((distortionField ?? 0) > 0 ? (distortionField ?? 0) + 1 : 0) +
  ((tenguFlight ?? 0) > 0 ? 4 : 0);
```

```ts
// src/utils/shCalculation.ts
let sh = base * 50;
sh += shieldEnchant * 200;
sh += equipmentSH * 200;
sh += amuletReflection * 1000;
sh += (largeBonePlates > 0 ? largeBonePlates * 400 + 400 : 0);
```

```ts
// src/utils/spellCalculation.ts
const effectiveStrength = strength + (equipmentStr ?? 0);
const effectiveIntelligence = intelligence + (equipmentInt ?? 0);
const wizardry =
  (ringWizardry ?? 0) + (bigBrainWizardry ?? 0);

chance -= effectiveIntelligence * 2;
chance2 -= 2 * (subduedMagic ?? 0);
chance2 += 4 * (antiWizardry ?? 0);
if (runicMagic) {
  bodyArmourPenalty = Math.floor(bodyArmourPenalty / 4);
}
```

```ts
// src/utils/calculatorUtils.ts
import {
  getAmuletReflectionCount,
  getAuxArmourEnchantTotal,
  getRingEvasionBonus,
  getRingProtectionBonus,
  getRingWizardryCount,
} from "./equipmentModifiers";

const ringProtection = getRingProtectionBonus(state.ringSlots);
const ringEvasion = getRingEvasionBonus(state.ringSlots);
const ringWizardry = getRingWizardryCount(state.ringSlots);
const amuletReflection = getAmuletReflectionCount(state.amuletSlots);
```

- [ ] **Step 6: Run the formula tests to verify they pass**

Run: `pnpm test src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts --runInBand`

Expected: PASS

- [ ] **Step 7: Commit the formula expansion**

```bash
git add src/utils/equipmentModifiers.ts src/utils/acCalculation.ts src/utils/evCalculation.ts src/utils/shCalculation.ts src/utils/spellCalculation.ts src/utils/calculatorUtils.ts src/utils/__tests__/acCalculations.test.ts src/utils/__tests__/evCalculations.test.ts src/utils/__tests__/shCalculations.test.ts src/utils/__tests__/spellCalculations.test.ts
git commit -m "feat: expand calculator inputs for morgue parity"
```

## Task 3: Expand Morgue Import Mapping To Populate Slots And Residual Modifiers

**Files:**
- Modify: `src/morgueImport/importMorgue.ts`
- Modify: `src/morgueImport/__tests__/importMorgue.test.ts`
- Test: `src/morgueImport/__tests__/importMorgue.test.ts`

- [ ] **Step 1: Write the failing import-mapping regression**

```ts
// src/morgueImport/__tests__/importMorgue.test.ts
test("maps slot-supported jewellery, signed enchants, residual numeric props, and mutation modifiers", () => {
  const record = {
    version: "0.35-a0-181-g84ebf06",
    species: "Octopode",
    speciesVariant: null,
    background: "Conjurer",
    god: null,
    xl: 12,
    ac: 17,
    ev: 20,
    sh: 11,
    strength: 8,
    intelligence: 23,
    dexterity: 14,
    bodyArmour: "robe",
    shield: "kite shield",
    helmets: ["-1 hat of intelligence"],
    gloves: [],
    footwear: [],
    cloaks: ["+2 cloak"],
    orb: "none",
    amulets: ["amulet of reflection"],
    rings: ["ring of protection +4", "ring of wizardry", "ring of evasion +5"],
    talisman: "none",
    form: null,
    bodyArmourDetails: { ...makeItem("robe", "robe"), enchant: -2 },
    shieldDetails: { ...makeItem("+3 kite shield", "kite shield"), enchant: 3 },
    helmetDetails: [{ ...makeItem("-1 hat", "hat"), enchant: -1 }],
    cloakDetails: [{ ...makeItem("+2 cloak", "cloak"), enchant: 2 }],
    amuletDetails: [makeItem("amulet of reflection", "amulet", { Reflect: true })],
    ringDetails: [
      { ...makeItem("ring of protection +4", "ring"), subtypeEffect: "protection", enchant: 4 },
      makeItem("ring of wizardry", "ring", { Wiz: true }),
      { ...makeItem("ring of evasion +5", "ring"), subtypeEffect: "evasion", enchant: 5 },
    ],
    skills: baseSkills,
    effectiveSkills: baseSkills,
    spells: [{ name: "Magic Dart", failurePercent: 2, castable: true, memorized: true }],
    mutations: [
      { name: "subdued magic", level: 1 },
      { name: "anti-wizardry", level: 2 },
      { name: "distortion field", level: 3 },
      { name: "large bone plates", level: 2 },
      { name: "big brain", level: 3 },
    ],
  } as ParsedMorgueTextRecord;

  const result = buildImportedCalculatorState(record);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected successful import");

  expect(result.importedState.ringSlots.slice(0, 3)).toEqual([
    expect.objectContaining({ kind: "protection", plus: 4 }),
    expect.objectContaining({ kind: "wizardry", plus: 0 }),
    expect.objectContaining({ kind: "evasion", plus: 5 }),
  ]);
  expect(result.importedState.amuletSlots[0]).toEqual(
    expect.objectContaining({ kind: "reflection" })
  );
  expect(result.importedState.bodyArmourEnchant).toBe(-2);
  expect(result.importedState.shieldEnchant).toBe(3);
  expect(result.importedState.cloakEnchant).toBe(2);
  expect(result.importedState.subduedMagic).toBe(1);
  expect(result.importedState.antiWizardry).toBe(2);
  expect(result.importedState.distortionField).toBe(3);
  expect(result.importedState.largeBonePlates).toBe(2);
  expect(result.importedState.bigBrainWizardry).toBe(1);
});
```

- [ ] **Step 2: Run the import test to verify it fails**

Run: `pnpm test src/morgueImport/__tests__/importMorgue.test.ts --runInBand`

Expected: FAIL because the importer still writes legacy booleans and scalar
wizardry instead of slot arrays and residual modifiers.

- [ ] **Step 3: Implement slot-first import helpers**

```ts
// src/morgueImport/importMorgue.ts
const fillRingSlots = (
  ringSlots: RingSlotState[],
  details: EquipmentItemSnapshot[] | undefined
) => {
  let nextIndex = 0;
  for (const detail of details ?? []) {
    if (detail.subtypeEffect === "protection") {
      ringSlots[nextIndex++] = {
        kind: "protection",
        plus: detail.enchant ?? 0,
        displayName: detail.displayName,
        artifactKind: detail.artifactKind,
        source: "imported",
      };
      continue;
    }
    if (detail.subtypeEffect === "evasion") {
      ringSlots[nextIndex++] = {
        kind: "evasion",
        plus: detail.enchant ?? 0,
        displayName: detail.displayName,
        artifactKind: detail.artifactKind,
        source: "imported",
      };
      continue;
    }
    if (detail.properties.booleanProps.Wiz) {
      ringSlots[nextIndex++] = {
        kind: "wizardry",
        plus: 0,
        displayName: detail.displayName,
        artifactKind: detail.artifactKind,
        source: "imported",
      };
    }
  }
};

const applyMutationModifiers = (record: ParsedMorgueTextRecord, state: CalculatorState<GameVersion>) => {
  for (const mutation of record.mutations) {
    if (mutation.name === "subdued magic") state.subduedMagic = mutation.level ?? 0;
    if (mutation.name === "anti-wizardry") state.antiWizardry = mutation.level ?? 0;
    if (mutation.name === "runic magic") state.runicMagic = mutation.level ?? 0;
    if (mutation.name === "big brain" && mutation.level === 3) state.bigBrainWizardry = 1;
    if (mutation.name === "distortion field") state.distortionField = mutation.level ?? 0;
    if (mutation.name === "large bone plates") state.largeBonePlates = mutation.level ?? 0;
  }
};
```

- [ ] **Step 4: Run the import test to verify it passes**

Run: `pnpm test src/morgueImport/__tests__/importMorgue.test.ts --runInBand`

Expected: PASS

- [ ] **Step 5: Commit the importer expansion**

```bash
git add src/morgueImport/importMorgue.ts src/morgueImport/__tests__/importMorgue.test.ts
git commit -m "feat: import expanded morgue equipment modifiers"
```

## Task 4: Replace Fixed Equipment Toggles With Dynamic Slot Controls

**Files:**
- Create: `src/components/DynamicEquipmentControls.tsx`
- Create: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Modify: `src/components/AttrInput.tsx`
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/SpellControls.tsx`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Modify: `src/versioning/uiOptions.ts`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`

- [ ] **Step 1: Write the failing slot-controls test**

```tsx
// src/components/__tests__/DynamicEquipmentControls.test.tsx
/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import DynamicEquipmentControls from "../DynamicEquipmentControls";

describe("DynamicEquipmentControls", () => {
  test("renders octopode ring slots and formicid glove slots", () => {
    const octopode = buildDefaultCalculatorState("trunk");
    octopode.species = "octopode";
    octopode.ringSlots = Array.from({ length: 8 }, () => ({ kind: "none", plus: 0 }));

    const formicid = buildDefaultCalculatorState("0.34");
    formicid.species = "formicid";
    formicid.gloveSlots = [
      { present: true, enchant: 2 },
      { present: false, enchant: 0 },
    ];

    const { rerender } = render(
      <DynamicEquipmentControls state={octopode} setState={() => undefined} />
    );
    expect(screen.getAllByText(/Ring \d/i)).toHaveLength(8);

    rerender(<DynamicEquipmentControls state={formicid} setState={() => undefined} />);
    expect(screen.getAllByText(/Glove \d/i)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run: `pnpm test src/components/__tests__/DynamicEquipmentControls.test.tsx --runInBand`

Expected: FAIL because the new component does not exist and the UI still relies
on fixed checkbox toggles.

- [ ] **Step 3: Add negative-capable number inputs and the new slot-control component**

```tsx
// src/components/AttrInput.tsx
type AttrInputProps = {
  label: string;
  value: number;
  type: "stat" | "skill" | "number";
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

const minValue = min ?? (type === "skill" ? 0 : undefined);

<Input
  type="number"
  min={minValue}
  max={maxValue}
  step={type === "skill" ? "0.1" : undefined}
  value={value}
  onChange={handleChange}
/>;
```

```tsx
// src/components/DynamicEquipmentControls.tsx
import AttrInput from "@/components/AttrInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDynamicSlotCounts } from "@/versioning/dynamicSlotCounts";

const ringKinds = ["none", "wizardry", "protection", "evasion"] as const;

const DynamicEquipmentControls = <V extends GameVersion>({ state, setState }: Props<V>) => {
  const slotCounts = getDynamicSlotCounts(state.version, state.species);

  return (
    <div className="flex flex-col gap-3" data-testid="dynamic-equipment-controls">
      {state.ringSlots.slice(0, slotCounts.ringSlots).map((slot, index) => (
        <div key={`ring-${index}`} className="flex items-center gap-2">
          <span>{`Ring ${index + 1}`}</span>
          <Select
            value={slot.kind}
            onValueChange={(value) => updateRingSlot(index, value)}
          >
            <SelectTrigger className="w-[150px] h-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ringKinds.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(slot.kind === "protection" || slot.kind === "evasion") && (
            <AttrInput
              label="plus"
              value={slot.plus}
              type="number"
              min={-12}
              onChange={(value) => updateRingPlus(index, value)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 4: Wire the new controls into the calculator layout**

```tsx
// src/components/Calculator.tsx
import DynamicEquipmentControls from "@/components/DynamicEquipmentControls";

const equipmentToggleLabels = {
  cloak: "Cloak",
  boots: "Boots",
  barding: "Barding",
} as const;

<section
  data-testid="sidebar-section-equipment"
  className="flex flex-col gap-3"
>
  <SectionHeading>Equipment</SectionHeading>
  {/* existing armour / shield / orb selects */}
  <DynamicEquipmentControls state={state} setState={setState} />
  <SpellEquipmentControls
    state={state}
    setState={setState}
    className="hidden lg:flex"
    testId="desktop-spell-equipment-controls"
  />
</section>
```

```tsx
// src/components/SpellControls.tsx
<AttrInput
  label="subdued magic"
  value={state.subduedMagic ?? 0}
  type="number"
  max={3}
  onChange={(value) =>
    setState((prev) => ({ ...prev, subduedMagic: value }))
  }
/>
```

- [ ] **Step 5: Run the UI tests to verify they pass**

Run: `pnpm test src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/CalculatorLayout.test.tsx --runInBand`

Expected: PASS

- [ ] **Step 6: Commit the slot UI**

```bash
git add src/components/AttrInput.tsx src/components/DynamicEquipmentControls.tsx src/components/Calculator.tsx src/components/SpellControls.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/CalculatorLayout.test.tsx src/versioning/uiOptions.ts
git commit -m "feat: add dynamic equipment slot controls"
```

## Task 5: Run Verification And Finalize The Branch

**Files:**
- Modify: `docs/meta--catalog.md`
- Test: all files touched above

- [ ] **Step 1: Keep the plan entry in the meta catalog**

```md
| `2026-04-12-morgue-import-state-expansion.md` | morgue import state expansion 구현 계획 문서 | `/docs/superpowers/plans` |
```

- [ ] **Step 2: Run the focused regression suite**

Run:

```bash
pnpm test --runInBand \
  src/versioning/__tests__/dynamicSlotCounts.test.ts \
  src/hooks/__tests__/calculatorStatePersistence.test.ts \
  src/morgueImport/__tests__/importMorgue.test.ts \
  src/utils/__tests__/acCalculations.test.ts \
  src/utils/__tests__/evCalculations.test.ts \
  src/utils/__tests__/shCalculations.test.ts \
  src/utils/__tests__/spellCalculations.test.ts \
  src/components/__tests__/DynamicEquipmentControls.test.tsx \
  src/components/__tests__/CalculatorLayout.test.tsx
```

Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `pnpm build`

Expected: Vite build completes successfully.

- [ ] **Step 4: Commit the final integrated batch**

```bash
git add src docs/meta--catalog.md
git commit -m "feat: expand morgue-importable equipment state"
```

- [ ] **Step 5: Capture any verification notes for handoff**

```md
- focused Jest suite: pass
- build: pass
- known deferred scope: talisman/form/full randart semantics
```
