# Parser-Aligned Equipment Ego Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make body armour ego state match `dcss-morgue-parser` and Crawl ego semantics while preserving current spell-failure behavior.

**Architecture:** Treat `bodyArmour.ego` as the canonical item ego and derive the narrow spell-failure boost subset at calculation boundaries. Add a focused body-armour ego helper for labels, fixed ego modifiers, and safe modifier synchronization, then update import, persistence, summary formatting, and the modal to use that helper.

**Tech Stack:** TypeScript, React 18, Radix Select, Jest with `jest-environment-jsdom`

---

## File Map

### Create

- `src/utils/bodyArmourEgos.ts` - body armour ego labels, item-name helpers, fixed modifier effects, and spell-boost mapping.

### Modify

- `docs/meta--catalog.md` - register this implementation plan.
- `src/types/equipment.ts` - expand body armour ego types and option metadata.
- `src/versioning/equipmentData.ts` - expose versioned parser-aligned ego options and spell-boost options separately.
- `src/versioning/__tests__/equipmentData.test.ts` - cover real ego options plus versioned spell-boost availability.
- `src/utils/spellCalculation.ts` - use derived spell-boost ego instead of treating every item ego as a spell boost.
- `src/utils/calculatorUtils.ts` - pass canonical `state.bodyArmour.ego` into spell calculations.
- `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts` - prove non-spell egos are neutral and old spell egos still work.
- `src/morgueImport/importMorgue.ts` - import `bodyArmourDetails.ego` into `bodyArmour.ego`.
- `src/morgueImport/__tests__/importMorgue.test.ts` - cover `+2 robe of willpower` parser-aligned import.
- `src/hooks/useCalculatorState.ts` - allow parser-aligned ego strings and fold legacy top-level ego into item state.
- `src/hooks/__tests__/calculatorStatePersistence.test.ts` - cover known, unknown, and legacy ego persistence.
- `src/utils/equipmentSummaryText.ts` - format fallback body armour as `+N base armour of ego`.
- `src/utils/__tests__/equipmentSummaryText.test.ts` - cover fallback and unknown ego formatting.
- `src/components/equipment/EquipmentEditModal.tsx` - show real ego options and sync ego-owned modifiers on ego changes.
- `src/components/Calculator.tsx` - stop clamping `state.bodyArmour.ego` to the old spell subset and save the derived legacy spell-boost field.
- `src/components/__tests__/CalculatorLayout.test.tsx` - cover modal display for real ego labels.

## Task 1: Add Parser-Aligned Ego Types And Helpers

**Files:**
- Modify: `src/types/equipment.ts`
- Create: `src/utils/bodyArmourEgos.ts`
- Modify: `src/versioning/equipmentData.ts`
- Modify: `src/versioning/__tests__/equipmentData.test.ts`
- Test: `src/versioning/__tests__/equipmentData.test.ts`

- [ ] **Step 1: Write failing equipment-data tests**

Replace the two body-armour ego tests in `src/versioning/__tests__/equipmentData.test.ts` with:

```ts
  test("exposes common Crawl body-armour egos on all supported versions", () => {
    for (const version of ["0.32", "0.33", "0.34", "trunk"] as const) {
      expect(Object.keys(getBodyArmourEgoOptions(version))).toEqual(
        expect.arrayContaining([
          "none",
          "willpower",
          "strength",
          "dexterity",
          "intelligence",
          "protection",
          "resistance",
          "ponderousness",
        ])
      );
    }
  });

  test("exposes command, death, and resonance as spell-boost egos only on 0.34 and trunk", () => {
    expect(Object.keys(getSpellBoostBodyArmourEgoOptions("0.32"))).toEqual([
      "none",
    ]);
    expect(Object.keys(getSpellBoostBodyArmourEgoOptions("0.33"))).toEqual([
      "none",
    ]);
    expect(Object.keys(getSpellBoostBodyArmourEgoOptions("0.34"))).toEqual([
      "none",
      "command",
      "death",
      "resonance",
    ]);
    expect(Object.keys(getSpellBoostBodyArmourEgoOptions("trunk"))).toEqual([
      "none",
      "command",
      "death",
      "resonance",
    ]);
  });
```

Update the import at the top of that test file:

```ts
import {
  getArmourEncumbrance,
  getBodyArmourEgoOptions,
  getSpellBoostBodyArmourEgoOptions,
} from "../equipmentData";
```

- [ ] **Step 2: Run the versioning test to verify it fails**

Run: `npm test -- --runInBand src/versioning/__tests__/equipmentData.test.ts`

Expected: FAIL because `getSpellBoostBodyArmourEgoOptions` does not exist and the current ego list only contains the old spell subset.

- [ ] **Step 3: Expand the body armour ego model**

In `src/types/equipment.ts`, replace the current `BodyArmourEgoKey` type and `bodyArmourEgoOptions` object with:

```ts
export const bodyArmourEgoOptions = {
  none: { name: "None", itemName: null },
  "fire resistance": { name: "Fire resistance", itemName: "fire resistance" },
  "cold resistance": { name: "Cold resistance", itemName: "cold resistance" },
  "poison resistance": {
    name: "Poison resistance",
    itemName: "poison resistance",
  },
  "corrosion resistance": {
    name: "Corrosion resistance",
    itemName: "corrosion resistance",
  },
  "see invisible": { name: "See invisible", itemName: "see invisible" },
  invisibility: { name: "Invisibility", itemName: "invisibility" },
  strength: { name: "Strength", itemName: "strength" },
  dexterity: { name: "Dexterity", itemName: "dexterity" },
  intelligence: { name: "Intelligence", itemName: "intelligence" },
  ponderousness: { name: "Ponderousness", itemName: "ponderousness" },
  flying: { name: "Flying", itemName: "flying" },
  willpower: { name: "Willpower", itemName: "willpower" },
  protection: { name: "Protection", itemName: "protection" },
  stealth: { name: "Stealth", itemName: "stealth" },
  resistance: { name: "Resistance", itemName: "resistance" },
  "positive energy": { name: "Positive energy", itemName: "positive energy" },
  "the Archmagi": { name: "The Archmagi", itemName: "the Archmagi" },
  reflection: { name: "Reflection", itemName: "reflection" },
  "spirit shield": { name: "Spirit shield", itemName: "spirit shield" },
  hurling: { name: "Hurling", itemName: "hurling" },
  repulsion: { name: "Repulsion", itemName: "repulsion" },
  harm: { name: "Harm", itemName: "harm" },
  shadows: { name: "Shadows", itemName: "shadows" },
  rampaging: { name: "Rampaging", itemName: "rampaging" },
  infusion: { name: "Infusion", itemName: "infusion" },
  light: { name: "Light", itemName: "light" },
  wrath: { name: "Wrath", itemName: "wrath" },
  mayhem: { name: "Mayhem", itemName: "mayhem" },
  guile: { name: "Guile", itemName: "guile" },
  energy: { name: "Energy", itemName: "energy" },
  sniping: { name: "Sniping", itemName: "sniping" },
  ice: { name: "Ice", itemName: "ice" },
  fire: { name: "Fire", itemName: "fire" },
  air: { name: "Air", itemName: "air" },
  earth: { name: "Earth", itemName: "earth" },
  archery: { name: "Archery", itemName: "archery" },
  command: { name: "Command", itemName: "command" },
  death: { name: "Death", itemName: "death" },
  resonance: { name: "Resonance", itemName: "resonance" },
  parrying: { name: "Parrying", itemName: "parrying" },
  glass: { name: "Glass", itemName: "glass" },
  pyromania: { name: "Pyromania", itemName: "pyromania" },
  stardust: { name: "Stardust", itemName: "stardust" },
  mesmerism: { name: "Mesmerism", itemName: "mesmerism" },
  attunement: { name: "Attunement", itemName: "attunement" },
} as const;

export type KnownBodyArmourEgoKey = keyof typeof bodyArmourEgoOptions;
export type BodyArmourEgoKey = KnownBodyArmourEgoKey | (string & {});
export type SpellBoostBodyArmourEgoKey =
  | "none"
  | "command"
  | "death"
  | "resonance";
```

- [ ] **Step 4: Create body armour ego helper**

Create `src/utils/bodyArmourEgos.ts`:

```ts
import {
  bodyArmourEgoOptions,
  type BodyArmourEgoKey,
  type KnownBodyArmourEgoKey,
  type SpellBoostBodyArmourEgoKey,
} from "@/types/equipment";
import type { EquipmentModifierBag } from "@/types/equipmentItems";

const spellBoostBodyArmourEgos = new Set<SpellBoostBodyArmourEgoKey>([
  "none",
  "command",
  "death",
  "resonance",
]);

const isKnownBodyArmourEgo = (
  ego: BodyArmourEgoKey
): ego is KnownBodyArmourEgoKey => ego in bodyArmourEgoOptions;

const bodyArmourEgoModifierMap: Partial<
  Record<KnownBodyArmourEgoKey, EquipmentModifierBag>
> = {
  "fire resistance": { rF: 1 },
  "cold resistance": { rC: 1 },
  "poison resistance": { flags: ["rPois"] },
  "corrosion resistance": { flags: ["rCorr"] },
  "see invisible": { flags: ["SInv"] },
  invisibility: { flags: ["+Inv"] },
  strength: { str: 3 },
  dexterity: { dex: 3 },
  intelligence: { int: 3 },
  ponderousness: { flags: ["Ponderous"] },
  flying: { flags: ["Fly"] },
  willpower: { will: 1 },
  protection: { ac: 3 },
  stealth: { stlth: 1 },
  resistance: { rC: 1, rF: 1 },
  "positive energy": { rN: 1 },
  "the Archmagi": { flags: ["Archmagi"] },
  reflection: { flags: ["Reflect"] },
  "spirit shield": { flags: ["Spirit"] },
  hurling: { flags: ["Hurl"] },
  repulsion: { flags: ["Repulsion"] },
  harm: { flags: ["Harm"] },
  shadows: { flags: ["Shadows"] },
  rampaging: { flags: ["Rampage"] },
  infusion: { flags: ["Infuse"] },
  light: { flags: ["Light"] },
  wrath: { flags: ["*Rage"] },
  mayhem: { flags: ["Mayhem"] },
  guile: { flags: ["Guile"] },
  energy: { flags: ["Energy"] },
  sniping: { flags: ["Snipe"] },
  ice: { flags: ["Ice"] },
  fire: { flags: ["Fire"] },
  air: { flags: ["Air"] },
  earth: { flags: ["Earth"] },
  archery: { flags: ["Archery"] },
  command: { flags: ["Command"] },
  death: { flags: ["Death"] },
  resonance: { flags: ["Resonance"] },
  parrying: { flags: ["Parrying"] },
  glass: { flags: ["Glass"] },
  pyromania: { flags: ["Pyromania"] },
  stardust: { flags: ["Stardust"] },
  mesmerism: { flags: ["Mesmerism"] },
  attunement: { flags: ["Attunement"] },
};

const cloneModifierBag = (
  modifiers: EquipmentModifierBag
): EquipmentModifierBag => ({
  ...modifiers,
  flags: modifiers.flags ? [...modifiers.flags] : undefined,
});

export const getBodyArmourEgoLabel = (ego: BodyArmourEgoKey) =>
  isKnownBodyArmourEgo(ego) ? bodyArmourEgoOptions[ego].name : ego;

export const getBodyArmourEgoItemName = (ego: BodyArmourEgoKey) =>
  isKnownBodyArmourEgo(ego)
    ? bodyArmourEgoOptions[ego].itemName
    : ego === "none"
      ? null
      : ego;

export const getSpellBoostBodyArmourEgo = (
  ego: BodyArmourEgoKey | undefined
): SpellBoostBodyArmourEgoKey =>
  ego && spellBoostBodyArmourEgos.has(ego as SpellBoostBodyArmourEgoKey)
    ? (ego as SpellBoostBodyArmourEgoKey)
    : "none";

export const getBodyArmourEgoModifierBag = (
  ego: BodyArmourEgoKey
): EquipmentModifierBag | undefined => {
  if (!isKnownBodyArmourEgo(ego)) {
    return undefined;
  }

  const modifiers = bodyArmourEgoModifierMap[ego];
  return modifiers ? cloneModifierBag(modifiers) : undefined;
};

const removeOwnedEgoModifiers = (
  modifiers: EquipmentModifierBag,
  ego: BodyArmourEgoKey
) => {
  const owned = getBodyArmourEgoModifierBag(ego);
  if (!owned) {
    return modifiers;
  }

  const next: EquipmentModifierBag = {
    ...modifiers,
    flags: modifiers.flags ? [...modifiers.flags] : undefined,
  };

  for (const [key, value] of Object.entries(owned)) {
    if (key === "flags") {
      continue;
    }

    const modifierKey = key as Exclude<keyof EquipmentModifierBag, "flags">;
    if (next[modifierKey] === value) {
      delete next[modifierKey];
    }
  }

  if (owned.flags && next.flags) {
    const ownedFlags = new Set(owned.flags);
    next.flags = next.flags.filter((flag) => !ownedFlags.has(flag));
    if (next.flags.length === 0) {
      delete next.flags;
    }
  }

  return next;
};

const isEmptyModifierBag = (modifiers: EquipmentModifierBag) =>
  Object.keys(modifiers).length === 0;

export const syncBodyArmourEgoModifiers = (
  modifiers: EquipmentModifierBag | undefined,
  previousEgo: BodyArmourEgoKey,
  nextEgo: BodyArmourEgoKey
): EquipmentModifierBag | undefined => {
  const withoutPrevious = removeOwnedEgoModifiers(modifiers ?? {}, previousEgo);
  const nextOwned = getBodyArmourEgoModifierBag(nextEgo);
  const next = nextOwned
    ? {
        ...withoutPrevious,
        ...nextOwned,
        flags: [
          ...(withoutPrevious.flags ?? []),
          ...(nextOwned.flags ?? []).filter(
            (flag) => !(withoutPrevious.flags ?? []).includes(flag)
          ),
        ],
      }
    : withoutPrevious;

  if (next.flags?.length === 0) {
    delete next.flags;
  }

  return isEmptyModifierBag(next) ? undefined : next;
};
```

- [ ] **Step 5: Split parser-aligned options from spell-boost options**

In `src/versioning/equipmentData.ts`, update imports:

```ts
import {
  ArmourKey,
  armourOptions,
  type KnownBodyArmourEgoKey,
  type SpellBoostBodyArmourEgoKey,
  bodyArmourEgoOptions,
} from "@/types/equipment.ts";
```

Replace `bodyArmourEgoKeysByVersion` and `getBodyArmourEgoOptions` with:

```ts
const commonBodyArmourEgoKeys = [
  "none",
  "fire resistance",
  "cold resistance",
  "poison resistance",
  "corrosion resistance",
  "see invisible",
  "invisibility",
  "strength",
  "dexterity",
  "intelligence",
  "ponderousness",
  "flying",
  "willpower",
  "protection",
  "stealth",
  "resistance",
  "positive energy",
  "the Archmagi",
  "reflection",
  "spirit shield",
  "hurling",
  "repulsion",
  "harm",
  "shadows",
  "rampaging",
  "infusion",
  "light",
  "wrath",
  "mayhem",
  "guile",
  "energy",
  "sniping",
  "ice",
  "fire",
  "air",
  "earth",
  "archery",
] as const satisfies readonly KnownBodyArmourEgoKey[];

const spellBoostBodyArmourEgoKeys = [
  "command",
  "death",
  "resonance",
] as const satisfies readonly KnownBodyArmourEgoKey[];

const bodyArmourEgoKeysByVersion: Record<
  GameVersion,
  readonly KnownBodyArmourEgoKey[]
> = {
  "0.32": commonBodyArmourEgoKeys,
  "0.33": commonBodyArmourEgoKeys,
  "0.34": [...commonBodyArmourEgoKeys, ...spellBoostBodyArmourEgoKeys],
  trunk: [...commonBodyArmourEgoKeys, ...spellBoostBodyArmourEgoKeys],
};

const spellBoostBodyArmourEgoKeysByVersion: Record<
  GameVersion,
  readonly SpellBoostBodyArmourEgoKey[]
> = {
  "0.32": ["none"],
  "0.33": ["none"],
  "0.34": ["none", "command", "death", "resonance"],
  trunk: ["none", "command", "death", "resonance"],
};

export const getBodyArmourEgoOptions = <V extends GameVersion>(version: V) => {
  return Object.fromEntries(
    bodyArmourEgoKeysByVersion[version].map((key) => [
      key,
      bodyArmourEgoOptions[key],
    ])
  ) as Partial<Record<KnownBodyArmourEgoKey, { name: string; itemName: string | null }>>;
};

export const getSpellBoostBodyArmourEgoOptions = <V extends GameVersion>(
  version: V
) => {
  return Object.fromEntries(
    spellBoostBodyArmourEgoKeysByVersion[version].map((key) => [
      key,
      bodyArmourEgoOptions[key],
    ])
  ) as Partial<Record<SpellBoostBodyArmourEgoKey, { name: string; itemName: string | null }>>;
};
```

- [ ] **Step 6: Run the versioning test to verify it passes**

Run: `npm test -- --runInBand src/versioning/__tests__/equipmentData.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the ego type/helper slice**

```bash
git add src/types/equipment.ts src/utils/bodyArmourEgos.ts src/versioning/equipmentData.ts src/versioning/__tests__/equipmentData.test.ts
git commit -m "feat: align body armour ego options"
```

## Task 2: Derive Spell Boosts From Item Ego

**Files:**
- Modify: `src/utils/spellCalculation.ts`
- Modify: `src/utils/calculatorUtils.ts`
- Modify: `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`
- Test: `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`

- [ ] **Step 1: Add a neutral non-spell ego regression test**

In `src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`, add this test near the existing command/resonance ego tests:

```ts
    test("non-spell body armour egos do not change spell failure", () => {
      const baseParams = {
        version: "trunk" as const,
        species: "galeCentaur" as const,
        strength: 20,
        intelligence: 12,
        spellcasting: 0,
        armour: "plate" as const,
        shield: "none" as const,
        armourSkill: 27,
        shieldSkill: 0,
        targetSpell: "Summon Small Mammal" as const,
        schoolSkills: zeroSkillLevels("summoning"),
        spellDifficulty: 1 as const,
      };

      expect(
        calculateSpellFailureRate({
          ...baseParams,
          bodyArmourEgo: "willpower",
        })
      ).toBe(
        calculateSpellFailureRate({
          ...baseParams,
          bodyArmourEgo: "none",
        })
      );
    });
```

- [ ] **Step 2: Run the spell regression test**

Run: `npm test -- --runInBand src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`

Expected: PASS. This test locks the intended neutral behavior while the next step removes the old option-list coupling from the implementation.

- [ ] **Step 3: Update spell calculation to use spell-boost helpers**

In `src/utils/spellCalculation.ts`, change imports from equipment/versioning:

```ts
import {
  ArmourKey,
  BodyArmourEgoKey,
  OrbKey,
  ShieldKey,
  shieldOptions,
} from "@/types/equipment.ts";
import { getSpellBoostBodyArmourEgo } from "@/utils/bodyArmourEgos";
import { getSpellBoostBodyArmourEgoOptions } from "@/versioning/equipmentData";
```

Replace the `supportedBodyArmourEgos` line in `applySpellSuccessBoosts`:

```ts
  const supportedBodyArmourEgos = getSpellBoostBodyArmourEgoOptions(version);
  const spellBoostBodyArmourEgo = getSpellBoostBodyArmourEgo(bodyArmourEgo);
```

Then replace the three ego comparisons in that function:

```ts
    spellBoostBodyArmourEgo in supportedBodyArmourEgos &&
    spellBoostBodyArmourEgo === "death" &&
```

```ts
    spellBoostBodyArmourEgo in supportedBodyArmourEgos &&
    spellBoostBodyArmourEgo === "command" &&
```

```ts
    spellBoostBodyArmourEgo in supportedBodyArmourEgos &&
    spellBoostBodyArmourEgo === "resonance" &&
```

- [ ] **Step 4: Pass canonical item ego from chart calculations**

In `src/utils/calculatorUtils.ts`, replace both `bodyArmourEgo: state.bodyArmourEgo,` entries with:

```ts
        bodyArmourEgo: state.bodyArmour.ego ?? state.bodyArmourEgo,
```

- [ ] **Step 5: Run focused spell tests**

Run: `npm test -- --runInBand src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts`

Expected: PASS, including existing `command` and `resonance` tests.

- [ ] **Step 6: Commit the spell-boost derivation slice**

```bash
git add src/utils/spellCalculation.ts src/utils/calculatorUtils.ts src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts
git commit -m "fix: derive spell boosts from armour ego"
```

## Task 3: Import And Persist Parser Ego Values

**Files:**
- Modify: `src/morgueImport/importMorgue.ts`
- Modify: `src/morgueImport/__tests__/importMorgue.test.ts`
- Modify: `src/hooks/useCalculatorState.ts`
- Modify: `src/hooks/__tests__/calculatorStatePersistence.test.ts`
- Test: `src/morgueImport/__tests__/importMorgue.test.ts`
- Test: `src/hooks/__tests__/calculatorStatePersistence.test.ts`

- [ ] **Step 1: Add an import test for normal armour ego**

In `src/morgueImport/__tests__/importMorgue.test.ts`, add this test after the existing body-armour ego import test:

```ts
  test("imports parser-reported normal body armour ego without translating it to none", () => {
    const robeOfWillpower = {
      ...makeItem("+2 robe of willpower", "robe", {
        numeric: { Will: 1 },
      }),
      objectClass: "armour",
      enchant: 2,
      ego: "willpower",
      egoProperties: {
        numeric: { Will: 1 },
        booleanProps: {},
        opaqueTokens: [],
      },
    } as EquipmentItemSnapshot;

    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Human",
      speciesVariant: null,
      background: "Wizard",
      god: null,
      ...defaultGodState,
      xl: 10,
      ac: 5,
      ev: 10,
      sh: 0,
      strength: 10,
      intelligence: 20,
      dexterity: 10,
      bodyArmour: "+2 robe of willpower",
      shield: "none",
      helmets: [],
      gloves: [],
      footwear: [],
      cloaks: [],
      orb: "none",
      amulets: [],
      rings: [],
      talisman: "none",
      form: null,
      bodyArmourDetails: robeOfWillpower,
      skills: baseSkills,
      effectiveSkills: baseSkills,
      spells: [
        {
          name: "Magic Dart",
          failurePercent: 2,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.importedState.bodyArmour).toMatchObject({
      kind: "robe",
      enchant: 2,
      ego: "willpower",
      displayName: "+2 robe of willpower",
      artifactKind: "normal",
      source: "imported",
      modifiers: { will: 1 },
    });
    expect(result.importedState.bodyArmourEgo).toBe("none");
    expect(result.summary.applied).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Body armour ego",
          detail: "willpower",
        }),
      ])
    );
  });
```

- [ ] **Step 2: Add persistence tests for parser-aligned ego strings**

In `src/hooks/__tests__/calculatorStatePersistence.test.ts`, add these tests near the existing modern itemized equipment save test:

```ts
  test("restores parser-aligned body armour ego strings", () => {
    const modern = {
      ...buildDefaultCalculatorState("trunk"),
      bodyArmour: {
        kind: "robe",
        enchant: 2,
        ego: "willpower",
        modifiers: { will: 1 },
      },
    };

    const parsed = parseSavedState(JSON.stringify(modern));

    expect(parsed?.bodyArmour.ego).toBe("willpower");
    expect(parsed?.bodyArmour.modifiers).toEqual({ will: 1 });
  });

  test("keeps unknown imported body armour ego strings loadable", () => {
    const modern = {
      ...buildDefaultCalculatorState("trunk"),
      bodyArmour: {
        kind: "robe",
        enchant: 1,
        ego: "future mystery",
        displayName: "+1 robe of future mystery",
        artifactKind: "normal",
        source: "imported",
      },
    };

    const parsed = parseSavedState(JSON.stringify(modern));

    expect(parsed?.bodyArmour.ego).toBe("future mystery");
  });

  test("folds legacy top-level bodyArmourEgo into itemized body armour when needed", () => {
    const legacy = {
      ...buildDefaultCalculatorState("trunk"),
      bodyArmourEgo: "resonance",
      bodyArmour: {
        kind: "plate",
        enchant: 0,
        ego: "none",
      },
    };

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed?.bodyArmour.ego).toBe("resonance");
    expect(parsed?.bodyArmourEgo).toBe("resonance");
  });
```

- [ ] **Step 3: Run import and persistence tests to verify failures**

Run: `npm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts src/hooks/__tests__/calculatorStatePersistence.test.ts`

Expected: FAIL because import still writes `ego: "none"` for `willpower`, and persistence still validates top-level ego against the old spell subset.

- [ ] **Step 4: Update the import mapper**

In `src/morgueImport/importMorgue.ts`, remove `getBodyArmourEgoOptions` from imports and add:

```ts
import { getSpellBoostBodyArmourEgo } from "@/utils/bodyArmourEgos";
```

Replace `deriveBodyArmourEgo` with:

```ts
const deriveBodyArmourEgo = (
  detail: EquipmentItemSnapshot | null | undefined
): BodyArmourEgoKey => {
  if (!detail) {
    return "none";
  }

  if (detail.ego) {
    return detail.ego as BodyArmourEgoKey;
  }

  if (detail.properties.booleanProps.Command) {
    return "command";
  }
  if (detail.properties.booleanProps.Death) {
    return "death";
  }
  if (detail.properties.booleanProps.Resonance) {
    return "resonance";
  }

  return "none";
};
```

Before the body armour assignment in `buildImportedCalculatorState`, add:

```ts
  const importedBodyArmourEgo = deriveBodyArmourEgo(record.bodyArmourDetails);
```

Then set the imported body armour item ego with that value:

```ts
      ego: importedBodyArmourEgo,
```

Replace the late body-armour ego block near the end of `buildImportedCalculatorState` with:

```ts
  if (importedBodyArmourEgo !== "none") {
    importedState.bodyArmourEgo =
      getSpellBoostBodyArmourEgo(importedBodyArmourEgo);
    importedState.bodyArmour.ego = importedBodyArmourEgo;
    summary.applied.push({
      label: "Body armour ego",
      detail: importedBodyArmourEgo,
    });
  }
```

- [ ] **Step 5: Update saved-state parsing and validation**

In `src/hooks/useCalculatorState.ts`, remove the `getBodyArmourEgoOptions` import.

Replace the top-level body armour ego validation block with a string-only check:

```ts
  if (
    state.bodyArmourEgo !== undefined &&
    typeof state.bodyArmourEgo !== "string"
  ) {
    return false;
  }
```

In `parseSavedState`, after `const defaultState = buildDefaultCalculatorState(version);`, add:

```ts
    const parsedBodyArmour = isBodyArmourItem(parsed.bodyArmour)
      ? parsed.bodyArmour
      : defaultState.bodyArmour;
    const legacyBodyArmourEgo =
      typeof parsed.bodyArmourEgo === "string"
        ? (parsed.bodyArmourEgo as BodyArmourEgoKey)
        : undefined;
    const bodyArmour =
      legacyBodyArmourEgo &&
      legacyBodyArmourEgo !== "none" &&
      parsedBodyArmour.ego === "none"
        ? {
            ...parsedBodyArmour,
            ego: legacyBodyArmourEgo,
          }
        : parsedBodyArmour;
```

Inside the `normalized` object, add this property after `species,` so it overrides the spread value:

```ts
      bodyArmour,
```

- [ ] **Step 6: Run import and persistence tests**

Run: `npm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts src/hooks/__tests__/calculatorStatePersistence.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the import/persistence slice**

```bash
git add src/morgueImport/importMorgue.ts src/morgueImport/__tests__/importMorgue.test.ts src/hooks/useCalculatorState.ts src/hooks/__tests__/calculatorStatePersistence.test.ts
git commit -m "fix: preserve parser body armour ego"
```

## Task 4: Format And Edit Real Body Armour Egos

**Files:**
- Modify: `src/utils/equipmentSummaryText.ts`
- Modify: `src/utils/__tests__/equipmentSummaryText.test.ts`
- Modify: `src/components/equipment/EquipmentEditModal.tsx`
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/utils/__tests__/equipmentSummaryText.test.ts`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`

- [ ] **Step 1: Update summary tests for Crawl-style ego fallback**

In `src/utils/__tests__/equipmentSummaryText.test.ts`, replace the first body armour expectation inside `"builds in-game-style fallback summaries"`:

```ts
    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 4,
        ego: "resonance",
        modifiers: { int: 3 },
      })
    ).toBe("+4 leather armour of resonance {Int+3}");
```

Add this expectation after it:

```ts
    expect(
      formatBodyArmourSummary({
        kind: "robe",
        enchant: 2,
        ego: "willpower",
        modifiers: { will: 1 },
      })
    ).toBe("+2 robe of willpower {Will+}");
```

Add this test near the end of the file:

```ts
  test("formats unknown body armour ego strings without crashing", () => {
    expect(
      formatBodyArmourSummary({
        kind: "robe",
        enchant: 1,
        ego: "future mystery",
      })
    ).toBe("+1 robe of future mystery");
  });
```

- [ ] **Step 2: Add a modal test for real ego labels**

In `src/components/__tests__/CalculatorLayout.test.tsx`, add this test after `"shows body armour enchant and ego in the modal only when body armour is equipped"`:

```tsx
  test("shows parser-aligned body armour ego in the modal", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.armour = "robe";
    equipped.bodyArmour = {
      ...equipped.bodyArmour,
      kind: "robe",
      enchant: 2,
      ego: "willpower",
      modifiers: { will: 1 },
    };

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-body-armour"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('button[aria-label="Body armour ego"]')
        ?.textContent
    ).toContain("Willpower");
  });
```

- [ ] **Step 3: Run summary and modal tests to verify failures**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts src/components/__tests__/CalculatorLayout.test.tsx`

Expected: FAIL because fallback formatting still uses `(Ego)` labels and the modal currently clamps non-spell egos to `none`.

- [ ] **Step 4: Update fallback body armour summary formatting**

In `src/utils/equipmentSummaryText.ts`, replace the `bodyArmourEgoOptions` import with:

```ts
import { getBodyArmourEgoItemName } from "@/utils/bodyArmourEgos";
```

Add this helper near `withEnchant`:

```ts
const withBodyArmourEgo = (baseName: string, ego: BodyArmourItemState["ego"]) => {
  const egoItemName = getBodyArmourEgoItemName(ego);
  return egoItemName ? `${baseName} of ${egoItemName}` : baseName;
};
```

Replace the fallback body armour block:

```ts
  const baseName = armourOptions[item.kind].name;
  const itemName = withBodyArmourEgo(baseName, item.ego);

  return withModifiers(withEnchant(item.enchant, itemName), item.modifiers);
```

- [ ] **Step 5: Update body armour modal option handling and modifier sync**

In `src/components/equipment/EquipmentEditModal.tsx`, update imports:

```tsx
import {
  getBodyArmourEgoLabel,
  syncBodyArmourEgoModifiers,
} from "@/utils/bodyArmourEgos";
```

Change the body armour config type:

```ts
      bodyArmourEgos: Partial<
        Record<BodyArmourEgoKey, { name: string; itemName: string | null }>
      >;
```

Inside `BodyArmourEditor`, after `importedItemSummary`, add:

```tsx
  const bodyArmourEgoEntries = Object.entries(config.bodyArmourEgos);
  const bodyArmourEgoOptions = bodyArmourEgoEntries.some(
    ([key]) => key === draft.ego
  )
    ? bodyArmourEgoEntries
    : [
        [draft.ego, { name: getBodyArmourEgoLabel(draft.ego), itemName: null }],
        ...bodyArmourEgoEntries,
      ];
```

Replace the body armour ego `onValueChange` handler:

```tsx
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  ego: value as BodyArmourEgoKey,
                  modifiers: syncBodyArmourEgoModifiers(
                    current.modifiers,
                    current.ego,
                    value as BodyArmourEgoKey
                  ),
                }))
              }
```

Replace the select item rendering:

```tsx
                {bodyArmourEgoOptions.map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
```

- [ ] **Step 6: Update Calculator's canonical ego selection and save path**

In `src/components/Calculator.tsx`, import:

```tsx
import { getSpellBoostBodyArmourEgo } from "@/utils/bodyArmourEgos";
```

Replace `selectedBodyArmourEgo` with:

```tsx
  const selectedBodyArmourEgo =
    state.bodyArmour.ego ??
    (state.bodyArmourEgo !== undefined ? state.bodyArmourEgo : "none");
```

In the body armour `onSave`, replace:

```tsx
                  bodyArmourEgo: nextItem.ego,
```

with:

```tsx
                  bodyArmourEgo: getSpellBoostBodyArmourEgo(nextItem.ego),
```

- [ ] **Step 7: Run summary and modal tests**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts src/components/__tests__/CalculatorLayout.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit the summary/modal slice**

```bash
git add src/utils/equipmentSummaryText.ts src/utils/__tests__/equipmentSummaryText.test.ts src/components/equipment/EquipmentEditModal.tsx src/components/Calculator.tsx src/components/__tests__/CalculatorLayout.test.tsx
git commit -m "fix: show parser armour egos in equipment UI"
```

## Task 5: Final Verification And Documentation Check

**Files:**
- Verify only.

- [ ] **Step 1: Run focused regression tests**

Run: `npm test -- --runInBand src/versioning/__tests__/equipmentData.test.ts src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts src/morgueImport/__tests__/importMorgue.test.ts src/hooks/__tests__/calculatorStatePersistence.test.ts src/utils/__tests__/equipmentSummaryText.test.ts src/components/__tests__/CalculatorLayout.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run the full Jest suite**

Run: `npm test -- --runInBand`

Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS with no new errors. If the repository still has the existing `react-refresh/only-export-components` warning in `src/components/ui/button.tsx`, leave it untouched.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS. If Vite reports the existing chunk-size warning, leave it untouched.

- [ ] **Step 5: Check docs are current**

Run: `rg -n "parser-aligned|body armour ego|BodyArmourEgo" docs/meta--catalog.md docs/superpowers/specs/2026-04-25-parser-aligned-equipment-ego-design.md docs/superpowers/plans/2026-04-25-parser-aligned-equipment-ego.md`

Expected: output includes this plan, the approved spec, and the catalog entry.

- [ ] **Step 6: Check working tree**

Run: `git status --short`

Expected: no output after the task commits.
