# Equipment Ego Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add parser-aligned ego state and base-item-filtered ego selectors for all armour-class equipment modeled by the app.

**Architecture:** Create one shared equipment ego data/helper module that owns known ego labels, item-name rendering, fixed ego modifier effects, and base-item availability. Keep body armour spell-boost behavior as a derived subset. Extend item state with `ego`, import parser `ego` for normal armour-class items, and let each equipment modal render only egos legal for the selected base.

**Tech Stack:** Vite, React, TypeScript, Jest, `dcss-morgue-parser@0.6.2`.

---

## Scope Notes

This plan deliberately does not turn jewellery into armour ego items. Parser
`ego` applies to armour-class equipment only. Normal rings and amulets keep
using jewellery `subtypeEffect` plus existing app `kind`/modifier fields.

The plan also preserves imported display text. Imported normal items such as
`orb of energy` or `+2 robe of willpower` should keep rendering without
synthesized braces.

The full Jest suite is known to have pre-existing spell-parity failures on this
branch. Focused equipment tests, lint, and build must pass; any new failures in
touched equipment areas must be fixed.

## File Map

- Create: `src/utils/equipmentEgos.ts`
  Owns `EquipmentEgoKey`, known ego labels, item-name helpers, modifier sync,
  base-name availability data, and option-list helpers.
- Modify: `src/utils/bodyArmourEgos.ts`
  Becomes a compatibility wrapper around `equipmentEgos.ts` for body-armour
  spell-boost helpers.
- Modify: `src/types/equipment.ts`
  Exports generalized ego types/options while preserving body-armour aliases.
- Modify: `src/types/equipmentItems.ts`
  Adds `ego` to `ShieldItemState`, `OrbItemState`, and `FixedAuxItemState`;
  extends fixed aux `kind` to support `scarf`.
- Modify: `src/types/equipmentSlots.ts`
  Adds `ego` to `AuxArmourSlotState`.
- Modify: `src/hooks/useCalculatorState.ts`
  Validates and migrates new ego fields.
- Modify: `src/morgueImport/importMorgue.ts`
  Imports parser `ego` for normal armour-class details and maps parser
  `baseType = "orb"` with `ego = "energy"` correctly.
- Modify: `src/utils/equipmentSummaryText.ts`
  Builds fallback item names with generic equipment ego helpers.
- Modify: `src/components/equipment/EquipmentEditModal.tsx`
  Adds ego selectors to shield, orb, headgear, gloves, and fixed auxiliary
  armour editors.
- Modify: `src/components/Calculator.tsx`
  Passes filtered ego config to the primary body/shield/orb modal.
- Modify: `src/components/DynamicEquipmentControls.tsx`
  Passes filtered ego config to dynamic equipment modals and lets the cloak row
  choose cloak vs scarf.
- Test: `src/utils/__tests__/equipmentEgos.test.ts`
- Test: `src/utils/__tests__/equipmentSummaryText.test.ts`
- Test: `src/hooks/__tests__/calculatorStatePersistence.test.ts`
- Test: `src/morgueImport/__tests__/importMorgue.test.ts`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`

---

### Task 1: Shared Equipment Ego Data And Helpers

**Files:**
- Create: `src/utils/equipmentEgos.ts`
- Modify: `src/types/equipment.ts`
- Modify: `src/utils/bodyArmourEgos.ts`
- Modify: `src/versioning/equipmentData.ts`
- Test: `src/utils/__tests__/equipmentEgos.test.ts`
- Test: `src/versioning/__tests__/equipmentData.test.ts`

- [ ] **Step 1: Write failing availability tests**

Create `src/utils/__tests__/equipmentEgos.test.ts`:

```ts
import { describe, expect, test } from "@jest/globals";
import {
  getEquipmentEgoOptionsForBaseName,
  isEquipmentEgoAllowedForBaseName,
} from "../equipmentEgos";

describe("equipment ego availability", () => {
  test("filters body armour egos by selected base item", () => {
    expect(getEquipmentEgoOptionsForBaseName("robe").map(([key]) => key)).toEqual([
      "none",
      "willpower",
      "cold resistance",
      "fire resistance",
      "positive energy",
      "resistance",
    ]);
    expect(isEquipmentEgoAllowedForBaseName("robe", "resonance")).toBe(false);

    expect(
      getEquipmentEgoOptionsForBaseName("scale mail").map(([key]) => key)
    ).toEqual([
      "none",
      "fire resistance",
      "cold resistance",
      "willpower",
      "poison resistance",
      "positive energy",
      "archery",
      "command",
      "death",
      "resonance",
    ]);
  });

  test("filters non-body armour egos by selected base item", () => {
    expect(getEquipmentEgoOptionsForBaseName("scarf").map(([key]) => key)).toEqual([
      "none",
      "resistance",
      "repulsion",
      "invisibility",
      "harm",
      "shadows",
    ]);
    expect(getEquipmentEgoOptionsForBaseName("gloves").map(([key]) => key)).toEqual([
      "none",
      "dexterity",
      "strength",
      "parrying",
      "hurling",
      "stealth",
      "infusion",
      "fire",
    ]);
    expect(getEquipmentEgoOptionsForBaseName("orb").map(([key]) => key)).toEqual([
      "none",
      "glass",
      "mayhem",
      "guile",
      "energy",
      "pyromania",
      "stardust",
      "mesmerism",
      "attunement",
    ]);
    expect(getEquipmentEgoOptionsForBaseName("tower shield").map(([key]) => key)).toEqual([
      "none",
      "protection",
      "reflection",
      "ponderousness",
      "corrosion resistance",
      "fire resistance",
      "cold resistance",
      "poison resistance",
      "positive energy",
    ]);
  });

  test("normal is a generation bucket and is not exposed as an ego option", () => {
    expect(getEquipmentEgoOptionsForBaseName("robe").map(([key]) => key)).not.toContain(
      "normal"
    );
    expect(
      getEquipmentEgoOptionsForBaseName("buckler").map(([key]) => key)
    ).not.toContain("normal");
  });

  test("preserves unknown current ego options ahead of legal choices", () => {
    expect(
      getEquipmentEgoOptionsForBaseName("robe", "future mystery").map(([key]) => key)
    ).toEqual([
      "future mystery",
      "none",
      "willpower",
      "cold resistance",
      "fire resistance",
      "positive energy",
      "resistance",
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/equipmentEgos.test.ts
```

Expected: FAIL because `src/utils/equipmentEgos.ts` does not exist.

- [ ] **Step 3: Add generalized ego types and options**

Modify `src/types/equipment.ts` by replacing `bodyArmourEgoOptions` and related
types with generalized aliases:

```ts
export const equipmentEgoOptions = {
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

export const bodyArmourEgoOptions = equipmentEgoOptions;

export type KnownEquipmentEgoKey = keyof typeof equipmentEgoOptions;
export type EquipmentEgoKey = KnownEquipmentEgoKey | (string & {});
export type KnownBodyArmourEgoKey = KnownEquipmentEgoKey;
export type BodyArmourEgoKey = EquipmentEgoKey;
export type SpellBoostBodyArmourEgoKey =
  | "none"
  | "command"
  | "death"
  | "resonance";
```

- [ ] **Step 4: Implement shared equipment ego helper**

Create `src/utils/equipmentEgos.ts`.

Use the existing `bodyArmourEgoModifierMap`, `cloneModifierBag`,
`subtractOwnedModifiers`, `isEmptyModifierBag`, and
`syncBodyArmourEgoModifiers` logic from `src/utils/bodyArmourEgos.ts`, but
generalize names to equipment.

Include this availability table:

```ts
const equipmentEgoAvailabilityByBaseName = {
  "animal skin": [],
  robe: [
    ["resistance", 1],
    ["cold resistance", 2],
    ["fire resistance", 2],
    ["positive energy", 2],
    ["normal", 4],
    ["willpower", 4],
  ],
  "leather armour": [
    ["fire resistance", 7],
    ["cold resistance", 7],
    ["poison resistance", 5],
    ["willpower", 4],
    ["positive energy", 2],
  ],
  "ring mail": [
    ["fire resistance", 7],
    ["cold resistance", 7],
    ["poison resistance", 5],
    ["willpower", 4],
    ["positive energy", 2],
  ],
  "scale mail": [
    ["fire resistance", 20],
    ["cold resistance", 20],
    ["poison resistance", 10],
    ["willpower", 15],
    ["positive energy", 7],
    ["archery", 7],
    ["command", 7],
    ["death", 7],
    ["resonance", 7],
    ["normal", 4],
  ],
  "chain mail": [
    ["fire resistance", 21],
    ["cold resistance", 21],
    ["poison resistance", 16],
    ["willpower", 15],
    ["ponderousness", 7],
    ["archery", 5],
    ["command", 5],
    ["death", 5],
    ["resonance", 5],
  ],
  "plate armour": [
    ["fire resistance", 21],
    ["cold resistance", 21],
    ["poison resistance", 16],
    ["willpower", 15],
    ["ponderousness", 7],
    ["archery", 5],
    ["command", 5],
    ["death", 5],
    ["resonance", 5],
  ],
  "crystal plate armour": [],
  "troll leather armour": [],
  cloak: [
    ["poison resistance", 2],
    ["willpower", 2],
    ["stealth", 2],
    ["corrosion resistance", 2],
    ["air", 1],
  ],
  scarf: [
    ["resistance", 1],
    ["repulsion", 1],
    ["invisibility", 1],
    ["harm", 1],
    ["shadows", 1],
  ],
  gloves: [
    ["dexterity", 1],
    ["strength", 1],
    ["parrying", 1],
    ["hurling", 1],
    ["stealth", 1],
    ["infusion", 1],
    ["fire", 1],
  ],
  helmet: [
    ["light", 2],
    ["intelligence", 2],
    ["sniping", 2],
    ["ice", 1],
  ],
  cap: [],
  hat: [
    ["willpower", 3],
    ["stealth", 2],
    ["intelligence", 2],
    ["see invisible", 2],
    ["ice", 2],
    ["sniping", 1],
  ],
  boots: [
    ["flying", 2],
    ["stealth", 2],
    ["rampaging", 2],
    ["earth", 1],
  ],
  "centaur barding": [],
  barding: [
    ["flying", 2],
    ["cold resistance", 2],
    ["fire resistance", 2],
    ["stealth", 2],
    ["earth", 1],
  ],
  orb: [
    ["glass", 1],
    ["mayhem", 1],
    ["guile", 1],
    ["energy", 1],
    ["pyromania", 1],
    ["stardust", 1],
    ["mesmerism", 1],
    ["attunement", 1],
  ],
  buckler: [
    ["resistance", 2],
    ["fire resistance", 5],
    ["cold resistance", 5],
    ["poison resistance", 5],
    ["positive energy", 5],
    ["normal", 5],
    ["reflection", 9],
    ["protection", 14],
  ],
  "kite shield": [
    ["fire resistance", 4],
    ["cold resistance", 4],
    ["poison resistance", 4],
    ["positive energy", 4],
    ["normal", 4],
    ["corrosion resistance", 4],
    ["reflection", 13],
    ["protection", 10],
  ],
  "tower shield": [
    ["fire resistance", 3],
    ["cold resistance", 3],
    ["poison resistance", 3],
    ["positive energy", 3],
    ["ponderousness", 5],
    ["corrosion resistance", 5],
    ["reflection", 9],
    ["protection", 15],
  ],
  "steam dragon scales": [],
  "acid dragon scales": [],
  "quicksilver dragon scales": [],
  "swamp dragon scales": [],
  "fire dragon scales": [],
  "ice dragon scales": [],
  "pearl dragon scales": [],
  "storm dragon scales": [],
  "shadow dragon scales": [],
  "golden dragon scales": [],
} as const satisfies Record<
  string,
  readonly (readonly [KnownEquipmentEgoKey | "normal", number])[]
>;
```

Add these exported helpers:

```ts
export type EquipmentEgoOptionEntry = [
  EquipmentEgoKey,
  { name: string; itemName: string | null },
];

export const getEquipmentEgoLabel = (ego: EquipmentEgoKey) =>
  isKnownEquipmentEgo(ego) ? equipmentEgoOptions[ego].name : ego;

export const getEquipmentEgoItemName = (ego: EquipmentEgoKey) =>
  isKnownEquipmentEgo(ego)
    ? equipmentEgoOptions[ego].itemName
    : ego === "none"
      ? null
      : ego;

export const getEquipmentEgoOptionsForBaseName = (
  baseName: string | null | undefined,
  currentEgo?: EquipmentEgoKey
): EquipmentEgoOptionEntry[] => {
  const legal = baseName
    ? [...(equipmentEgoAvailabilityByBaseName[baseName] ?? [])].filter(
        ([key]) => key !== "normal"
      )
    : [];
  legal.sort((left, right) => right[1] - left[1]);

  const entries: EquipmentEgoOptionEntry[] = [
    ["none", equipmentEgoOptions.none],
    ...legal.map(([key]) => [
      key,
      equipmentEgoOptions[key],
    ] as EquipmentEgoOptionEntry),
  ];

  if (
    currentEgo &&
    currentEgo !== "none" &&
    !entries.some(([key]) => key === currentEgo)
  ) {
    return [
      [
        currentEgo,
        { name: getEquipmentEgoLabel(currentEgo), itemName: getEquipmentEgoItemName(currentEgo) },
      ],
      ...entries,
    ];
  }

  return entries;
};

export const isEquipmentEgoAllowedForBaseName = (
  baseName: string | null | undefined,
  ego: EquipmentEgoKey
) =>
  ego === "none" ||
  getEquipmentEgoOptionsForBaseName(baseName).some(([key]) => key === ego);
```

Keep `getSpellBoostBodyArmourEgo` in this file or re-export it from
`bodyArmourEgos.ts`; do not duplicate logic.

- [ ] **Step 5: Convert body-armour helper to compatibility wrapper**

Modify `src/utils/bodyArmourEgos.ts` so existing imports keep working:

```ts
export {
  getEquipmentEgoItemName as getBodyArmourEgoItemName,
  getEquipmentEgoLabel as getBodyArmourEgoLabel,
  getEquipmentEgoModifierBag as getBodyArmourEgoModifierBag,
  getSpellBoostBodyArmourEgo,
  syncEquipmentEgoModifiers as syncBodyArmourEgoModifiers,
} from "@/utils/equipmentEgos";
```

- [ ] **Step 6: Update versioning tests and data imports**

Modify `src/versioning/equipmentData.ts` to import
`equipmentEgoOptions` and `KnownEquipmentEgoKey`, but keep the existing exported
function names:

```ts
import {
  ArmourKey,
  armourOptions,
  type KnownEquipmentEgoKey,
  type SpellBoostBodyArmourEgoKey,
  equipmentEgoOptions,
} from "@/types/equipment.ts";
```

Use `KnownEquipmentEgoKey` in place of `KnownBodyArmourEgoKey`, and return
`equipmentEgoOptions[key]`.

Modify `src/versioning/__tests__/equipmentData.test.ts` so the common
body-armour ego expectation asserts representative keys instead of relying on
the old global ordering:

```ts
test("exposes parser-aligned body-armour ego options for compatibility", () => {
  for (const version of ["0.32", "0.33", "0.34", "trunk"] as const) {
    const options = getBodyArmourEgoOptions(version);
    expect(options.willpower?.name).toBe("Willpower");
    expect(options.resistance?.name).toBe("Resistance");
    expect(options.command?.name).toBe(
      version === "0.34" || version === "trunk" ? "Command" : undefined
    );
  }
});
```

- [ ] **Step 7: Run focused helper tests**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/equipmentEgos.test.ts src/versioning/__tests__/equipmentData.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit shared ego helper**

Run:

```bash
git add src/types/equipment.ts src/utils/equipmentEgos.ts src/utils/bodyArmourEgos.ts src/versioning/equipmentData.ts src/utils/__tests__/equipmentEgos.test.ts src/versioning/__tests__/equipmentData.test.ts
git commit -m "feat: add equipment ego availability data"
```

---

### Task 2: Persist Ego State On All Armour-Class Items

**Files:**
- Modify: `src/types/equipmentItems.ts`
- Modify: `src/types/equipmentSlots.ts`
- Modify: `src/hooks/useCalculatorState.ts`
- Test: `src/hooks/__tests__/calculatorStatePersistence.test.ts`

- [ ] **Step 1: Write failing persistence tests**

Append to `src/hooks/__tests__/calculatorStatePersistence.test.ts`:

```ts
test("restores parser-aligned ego strings for non-body armour items", () => {
  const modern = {
    ...buildDefaultCalculatorState("trunk"),
    shieldItem: {
      kind: "buckler",
      enchant: 2,
      ego: "reflection",
      modifiers: { flags: ["Reflect"] },
    },
    orbItem: {
      kind: "energy",
      ego: "energy",
      modifiers: { flags: ["Energy"] },
    },
    cloakItem: {
      kind: "scarf",
      present: true,
      enchant: 0,
      ego: "resistance",
      modifiers: { rF: 1, rC: 1 },
    },
    bootsItem: {
      kind: "boots",
      present: true,
      enchant: 1,
      ego: "flying",
      modifiers: { flags: ["Fly"] },
    },
    headgearSlots: [
      {
        present: true,
        enchant: 0,
        kind: "hat",
        ego: "future mystery",
      },
    ],
    gloveSlots: [
      {
        present: true,
        enchant: 0,
        ego: "strength",
        modifiers: { str: 3 },
      },
    ],
  };

  const parsed = parseSavedState(JSON.stringify(modern));

  expect(parsed?.shieldItem.ego).toBe("reflection");
  expect(parsed?.orbItem.ego).toBe("energy");
  expect(parsed?.cloakItem.kind).toBe("scarf");
  expect(parsed?.cloakItem.ego).toBe("resistance");
  expect(parsed?.bootsItem.ego).toBe("flying");
  expect(parsed?.headgearSlots[0].ego).toBe("future mystery");
  expect(parsed?.gloveSlots[0].ego).toBe("strength");
});

test("migrates older itemized equipment saves without ego fields to none", () => {
  const legacy = {
    ...buildDefaultCalculatorState("trunk"),
    shieldItem: { kind: "buckler", enchant: 2 },
    orbItem: { kind: "energy" },
    cloakItem: { kind: "cloak", present: true, enchant: 1 },
    bootsItem: { kind: "boots", present: true, enchant: 1 },
    bardingItem: { kind: "barding", present: false, enchant: 0 },
    headgearSlots: [{ present: true, enchant: 0, kind: "helmet" }],
    gloveSlots: [{ present: true, enchant: 0 }],
  };

  const parsed = parseSavedState(JSON.stringify(legacy));

  expect(parsed?.shieldItem.ego).toBe("none");
  expect(parsed?.orbItem.ego).toBe("none");
  expect(parsed?.cloakItem.ego).toBe("none");
  expect(parsed?.bootsItem.ego).toBe("none");
  expect(parsed?.bardingItem.ego).toBe("none");
  expect(parsed?.headgearSlots[0].ego).toBe("none");
  expect(parsed?.gloveSlots[0].ego).toBe("none");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/hooks/__tests__/calculatorStatePersistence.test.ts
```

Expected: FAIL because non-body equipment item types and validators do not
store `ego`.

- [ ] **Step 3: Extend item state types**

Modify `src/types/equipmentItems.ts`:

```ts
import type {
  ArmourKey,
  BodyArmourEgoKey,
  EquipmentEgoKey,
  OrbKey,
  ShieldKey,
} from "@/types/equipment";

export type ShieldItemState = EquipmentItemMeta & {
  kind: ShieldKey;
  enchant: number;
  ego: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
};

export type OrbItemState = EquipmentItemMeta & {
  kind: OrbKey;
  ego: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
};

export type FixedAuxItemState = EquipmentItemMeta & {
  kind: "cloak" | "scarf" | "boots" | "barding";
  present: boolean;
  enchant: number;
  ego: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
};

export const createDefaultShieldItem = (): ShieldItemState => ({
  kind: "none",
  enchant: 0,
  ego: "none",
});

export const createDefaultOrbItem = (): OrbItemState => ({
  kind: "none",
  ego: "none",
});

export const createDefaultFixedAuxItem = (
  kind: FixedAuxItemState["kind"]
): FixedAuxItemState => ({
  kind,
  present: false,
  enchant: 0,
  ego: "none",
});
```

Modify `src/types/equipmentSlots.ts`:

```ts
import type {
  EquipmentModifierBag,
} from "@/types/equipmentItems";
import type { EquipmentEgoKey } from "@/types/equipment";

export type AuxArmourSlotState = {
  present: boolean;
  enchant: number;
  kind?: HeadgearKind;
  ego: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  propertiesText?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export const createDefaultAuxArmourSlot = (): AuxArmourSlotState => ({
  present: false,
  enchant: 0,
  kind: undefined,
  ego: "none",
});
```

Update `clearAuxArmourSlotMetadata` so it preserves `ego` when still present and
resets to `none` when not present:

```ts
export const clearAuxArmourSlotMetadata = (
  slot: AuxArmourSlotState,
  present: boolean
): AuxArmourSlotState => ({
  ...clearSlotMetadata(slot),
  present,
  enchant: present ? slot.enchant : 0,
  kind: present ? slot.kind : undefined,
  ego: present ? slot.ego : "none",
});
```

- [ ] **Step 4: Update saved-state validation and migration**

Modify `src/hooks/useCalculatorState.ts`:

```ts
const coerceEquipmentEgo = (value: unknown) =>
  typeof value === "string" ? value : "none";
```

In `isShieldItem`, `isOrbItem`, `isFixedAuxItem`, and `isAuxArmourSlot`, allow
missing `ego` because older saves do not have it.

In `parseSavedState`, after the parsed state is considered valid, normalize:

```ts
parsed.shieldItem = {
  ...parsed.shieldItem,
  ego: coerceEquipmentEgo(parsed.shieldItem.ego),
};
parsed.orbItem = {
  ...parsed.orbItem,
  ego: coerceEquipmentEgo(parsed.orbItem.ego),
};
parsed.cloakItem = {
  ...parsed.cloakItem,
  ego: coerceEquipmentEgo(parsed.cloakItem.ego),
};
parsed.bootsItem = {
  ...parsed.bootsItem,
  ego: coerceEquipmentEgo(parsed.bootsItem.ego),
};
parsed.bardingItem = {
  ...parsed.bardingItem,
  ego: coerceEquipmentEgo(parsed.bardingItem.ego),
};
parsed.headgearSlots = parsed.headgearSlots.map((slot) => ({
  ...slot,
  ego: coerceEquipmentEgo(slot.ego),
}));
parsed.gloveSlots = parsed.gloveSlots.map((slot) => ({
  ...slot,
  ego: coerceEquipmentEgo(slot.ego),
}));
```

Also update fixed-aux kind validation to allow `"scarf"`:

```ts
const isFixedAuxKind = (value: unknown) =>
  value === "cloak" ||
  value === "scarf" ||
  value === "boots" ||
  value === "barding";
```

- [ ] **Step 5: Run persistence tests**

Run:

```bash
npm test -- --runInBand src/hooks/__tests__/calculatorStatePersistence.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit state migration**

Run:

```bash
git add src/types/equipmentItems.ts src/types/equipmentSlots.ts src/hooks/useCalculatorState.ts src/hooks/__tests__/calculatorStatePersistence.test.ts
git commit -m "feat: persist equipment ego state"
```

---

### Task 3: Import Parser Ego For All Armour-Class Items

**Files:**
- Modify: `src/morgueImport/importMorgue.ts`
- Test: `src/morgueImport/__tests__/importMorgue.test.ts`

- [ ] **Step 1: Write failing import tests**

Add helper records in `src/morgueImport/__tests__/importMorgue.test.ts` using
the existing `makeItem` helper. Add this test:

```ts
test("imports parser-reported armour egos for shield, orb, scarf, headgear, gloves, and footwear", () => {
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
    bodyArmour: "robe",
    shield: "+2 buckler of reflection",
    helmets: ["+0 hat of intelligence"],
    gloves: ["+0 pair of gloves of strength"],
    footwear: ["+1 pair of boots of flying"],
    cloaks: ["scarf of resistance"],
    orb: "orb of energy",
    amulets: [],
    rings: [],
    talisman: "none",
    form: null,
    bodyArmourDetails: makeItem("robe", "robe"),
    shieldDetails: {
      ...makeItem("+2 buckler of reflection", "buckler", {
        booleanProps: { Reflect: true },
      }),
      objectClass: "armour",
      enchant: 2,
      ego: "reflection",
      egoProperties: {
        numeric: {},
        booleanProps: { Reflect: true },
        opaqueTokens: [],
      },
    } as EquipmentItemSnapshot,
    helmetDetails: [
      {
        ...makeItem("+0 hat of intelligence", "hat", {
          numeric: { Int: 3 },
        }),
        objectClass: "armour",
        enchant: 0,
        ego: "intelligence",
      } as EquipmentItemSnapshot,
    ],
    glovesDetails: [
      {
        ...makeItem("+0 pair of gloves of strength", "gloves", {
          numeric: { Str: 3 },
        }),
        objectClass: "armour",
        enchant: 0,
        ego: "strength",
      } as EquipmentItemSnapshot,
    ],
    footwearDetails: [
      {
        ...makeItem("+1 pair of boots of flying", "boots", {
          booleanProps: { Fly: true },
        }),
        objectClass: "armour",
        enchant: 1,
        ego: "flying",
      } as EquipmentItemSnapshot,
    ],
    cloakDetails: [
      {
        ...makeItem("scarf of resistance", "scarf", {
          numeric: { rF: 1, rC: 1 },
        }),
        objectClass: "armour",
        enchant: null,
        ego: "resistance",
      } as EquipmentItemSnapshot,
    ],
    orbDetails: {
      ...makeItem("orb of energy", "orb", {
        booleanProps: { Energy: true },
      }),
      objectClass: "armour",
      enchant: null,
      ego: "energy",
    } as EquipmentItemSnapshot,
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

  expect(result.importedState.shieldItem).toEqual(
    expect.objectContaining({ kind: "buckler", enchant: 2, ego: "reflection" })
  );
  expect(result.importedState.orb).toBe("energy");
  expect(result.importedState.orbItem).toEqual(
    expect.objectContaining({ kind: "energy", ego: "energy" })
  );
  expect(result.importedState.cloakItem).toEqual(
    expect.objectContaining({ kind: "scarf", present: true, ego: "resistance" })
  );
  expect(result.importedState.headgearSlots[0]).toEqual(
    expect.objectContaining({ present: true, kind: "hat", ego: "intelligence" })
  );
  expect(result.importedState.gloveSlots[0]).toEqual(
    expect.objectContaining({ present: true, ego: "strength" })
  );
  expect(result.importedState.bootsItem).toEqual(
    expect.objectContaining({ kind: "boots", present: true, ego: "flying" })
  );
});

test("does not turn jewellery subtype effects into equipment ego", () => {
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
    bodyArmour: "robe",
    shield: "none",
    helmets: [],
    gloves: [],
    footwear: [],
    cloaks: [],
    orb: "none",
    amulets: [],
    rings: ["ring of willpower"],
    talisman: "none",
    form: null,
    bodyArmourDetails: makeItem("robe", "robe"),
    ringDetails: [
      {
        ...makeItem("ring of willpower", "ring", {
          numeric: { Will: 1 },
        }),
        objectClass: "jewellery",
        ego: null,
        subtypeEffect: "willpower",
      } as EquipmentItemSnapshot,
    ],
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

  expect(result.importedState.ringSlots[0]).toEqual(
    expect.objectContaining({
      kind: "none",
      modifiers: { will: 1 },
    })
  );
  expect("ego" in result.importedState.ringSlots[0]).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts
```

Expected: FAIL because non-body imported egos are not copied and parser
`baseType = "orb"` is not mapped to the app's `energy` orb kind.

- [ ] **Step 3: Add import helpers**

Modify `src/morgueImport/importMorgue.ts`:

```ts
import type { EquipmentEgoKey } from "@/types/equipment.ts";

const deriveArmourClassEgo = (
  detail: EquipmentItemSnapshot | undefined
): EquipmentEgoKey =>
  detail?.objectClass === "armour" && detail.artifactKind === "normal" && detail.ego
    ? (detail.ego as EquipmentEgoKey)
    : "none";

const mapOrbDetail = (
  detail: EquipmentItemSnapshot | undefined,
  summary: string | undefined
): OrbKey | null => {
  if (detail?.baseType === "orb" && detail.ego === "energy") {
    return "energy";
  }

  return mapOrb(detail?.baseType ?? summary);
};

const mapFixedAuxKind = (
  fallback: "cloak" | "boots" | "barding",
  detail: EquipmentItemSnapshot | undefined
) => {
  if (detail?.baseType === "scarf") {
    return "scarf";
  }

  return fallback;
};
```

- [ ] **Step 4: Copy ego fields during import**

Update body armour to use `deriveArmourClassEgo` or keep the existing
`deriveBodyArmourEgo` wrapper delegating to it.

Update shield:

```ts
importedState.shieldItem = {
  kind: shield,
  enchant: record.shieldDetails?.enchant ?? 0,
  ego: deriveArmourClassEgo(record.shieldDetails),
  modifiers: record.shieldDetails ? buildModifierBagFromItem(record.shieldDetails) : undefined,
  displayName: record.shieldDetails?.displayName,
  propertiesText: record.shieldDetails?.propertiesText ?? undefined,
  artifactKind: record.shieldDetails?.artifactKind,
  source: record.shieldDetails ? "imported" : undefined,
};
```

Update orb:

```ts
const orb = mapOrbDetail(record.orbDetails, record.orb);
if (orb) {
  importedState.orb = orb;
  importedState.orbItem = {
    kind: orb,
    ego: deriveArmourClassEgo(record.orbDetails),
    modifiers: record.orbDetails
      ? buildModifierBagFromItem(record.orbDetails, {
          ignoreFlags: orb === "energy" ? ["Energy"] : undefined,
        })
      : undefined,
    displayName: record.orbDetails?.displayName,
    propertiesText: record.orbDetails?.propertiesText ?? undefined,
    artifactKind: record.orbDetails?.artifactKind,
    source: record.orbDetails ? "imported" : undefined,
  };
}
```

Update boots, barding, cloak:

```ts
importedState.bootsItem = {
  kind: "boots",
  present: importedState.boots,
  enchant: bootsDetail?.enchant ?? 0,
  ego: deriveArmourClassEgo(bootsDetail),
  modifiers: bootsDetail ? buildModifierBagFromItem(bootsDetail) : undefined,
  displayName: bootsDetail?.displayName,
  propertiesText: bootsDetail?.propertiesText ?? undefined,
  artifactKind: bootsDetail?.artifactKind,
  source: bootsDetail ? "imported" : undefined,
};

importedState.cloakItem = {
  kind: mapFixedAuxKind("cloak", cloakDetail),
  present: importedState.cloak,
  enchant: cloakDetail?.enchant ?? 0,
  ego: deriveArmourClassEgo(cloakDetail),
  modifiers: cloakDetail ? buildModifierBagFromItem(cloakDetail) : undefined,
  displayName: cloakDetail?.displayName,
  propertiesText: cloakDetail?.propertiesText ?? undefined,
  artifactKind: cloakDetail?.artifactKind,
  source: cloakDetail ? "imported" : undefined,
};
```

Update `fillHeadgearSlots` and `fillAuxArmourSlots` to assign
`ego: deriveArmourClassEgo(detail)`.

- [ ] **Step 5: Run import tests**

Run:

```bash
npm test -- --runInBand src/morgueImport/__tests__/importMorgue.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit import mapping**

Run:

```bash
git add src/morgueImport/importMorgue.ts src/morgueImport/__tests__/importMorgue.test.ts
git commit -m "fix: import parser equipment egos"
```

---

### Task 4: Render Fallback Summaries With Generic Equipment Ego

**Files:**
- Modify: `src/utils/equipmentSummaryText.ts`
- Test: `src/utils/__tests__/equipmentSummaryText.test.ts`

- [ ] **Step 1: Write failing summary tests**

Append to the existing fallback summary test in
`src/utils/__tests__/equipmentSummaryText.test.ts`:

```ts
expect(
  formatShieldSummary({
    kind: "buckler",
    enchant: 2,
    ego: "reflection",
    modifiers: { flags: ["Reflect"] },
  })
).toBe("+2 buckler of reflection {Reflect}");

expect(formatOrbSummary({ kind: "energy", ego: "energy" })).toBe(
  "orb of energy"
);

expect(
  formatHeadgearSummary({
    present: true,
    kind: "hat",
    enchant: 0,
    ego: "intelligence",
    modifiers: { int: 3 },
  })
).toBe("+0 hat of intelligence {Int+3}");

expect(
  formatGlovesSummary({
    present: true,
    enchant: 0,
    ego: "strength",
    modifiers: { str: 3 },
  })
).toBe("+0 pair of gloves of strength {Str+3}");

expect(
  formatFixedAuxSummary({
    kind: "scarf",
    present: true,
    enchant: 0,
    ego: "resistance",
    modifiers: { rF: 1, rC: 1 },
  })
).toBe("+0 scarf of resistance {rF+ rC+}");

expect(
  formatFixedAuxSummary({
    kind: "boots",
    present: true,
    enchant: 1,
    ego: "flying",
    modifiers: { flags: ["Fly"] },
  })
).toBe("+1 pair of boots of flying {Fly}");
```

Also add imported normal-item assertions:

```ts
expect(
  formatShieldSummary({
    kind: "buckler",
    enchant: 2,
    ego: "reflection",
    displayName: "+2 buckler of reflection",
    modifiers: { flags: ["Reflect"] },
    artifactKind: "normal",
    source: "imported",
  })
).toBe("+2 buckler of reflection");

expect(
  formatOrbSummary({
    kind: "energy",
    ego: "energy",
    displayName: "orb of energy",
    modifiers: { flags: ["Energy"] },
    artifactKind: "normal",
    source: "imported",
  })
).toBe("orb of energy");
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts
```

Expected: FAIL because formatter does not use non-body ego fields.

- [ ] **Step 3: Use generic ego item-name helper**

Modify `src/utils/equipmentSummaryText.ts` imports:

```ts
import { getEquipmentEgoItemName } from "@/utils/equipmentEgos";
```

Replace `withBodyArmourEgo` with:

```ts
const withEquipmentEgo = (baseName: string, ego?: EquipmentEgoKey) => {
  const egoItemName = getEquipmentEgoItemName(ego ?? "none");
  return egoItemName ? `${baseName} of ${egoItemName}` : baseName;
};
```

Update fallback summaries:

```ts
const itemName = withEquipmentEgo(baseName, item.ego);
```

For shields:

```ts
return withModifiers(
  withEnchant(item.enchant, withEquipmentEgo(shieldOptions[item.kind].name, item.ego)),
  item.modifiers
);
```

For orbs, keep current `kind` names but prefer the ego item name when present:

```ts
const orbBaseName = item.ego !== "none" ? "orb" : orbOptions[item.kind].name;
return withModifiers(withEquipmentEgo(orbBaseName, item.ego), item.modifiers);
```

For headgear, gloves, and fixed aux:

```ts
const baseName = slot.kind ?? "helmet";
return withModifiers(withEnchant(slot.enchant, withEquipmentEgo(baseName, slot.ego)), slot.modifiers);

return withModifiers(
  withEnchant(slot.enchant, withEquipmentEgo("pair of gloves", slot.ego)),
  slot.modifiers
);

const itemName =
  item.kind === "boots" ? "pair of boots" : item.kind;
return withModifiers(
  withEnchant(item.enchant, withEquipmentEgo(itemName, item.ego)),
  item.modifiers
);
```

- [ ] **Step 4: Run summary tests**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit summary rendering**

Run:

```bash
git add src/utils/equipmentSummaryText.ts src/utils/__tests__/equipmentSummaryText.test.ts
git commit -m "feat: render equipment egos in summaries"
```

---

### Task 5: Add Filtered Ego Selectors To Equipment Modals

**Files:**
- Modify: `src/components/equipment/EquipmentEditModal.tsx`
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/DynamicEquipmentControls.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`

- [ ] **Step 1: Write failing modal tests**

Add to `src/components/__tests__/CalculatorLayout.test.tsx`:

```ts
const renderCalculator = async (state = buildDefaultCalculatorState("trunk")) => {
  await act(async () => {
    root.render(<Calculator state={state} setState={mockSetState} />);
  });
};

const openCalculatorEquipmentRow = async (testId: string) => {
  const row = container.querySelector(
    `[data-testid="${testId}"]`
  ) as HTMLButtonElement;

  if (!row) {
    throw new Error(`Could not find ${testId}`);
  }

  await act(async () => {
    row.click();
  });
};

test("filters body armour ego choices by armour base", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.bodyArmour = {
    ...state.bodyArmour,
    kind: "robe",
    enchant: 0,
    ego: "none",
  };

  await renderCalculator(state);

  await openCalculatorEquipmentRow("equipment-row-body-armour");
  const trigger = document.body.querySelector(
    'button[aria-label="Body armour ego"]'
  );
  expect(trigger).not.toBeNull();
  await act(async () => {
    trigger?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
  });

  expect(document.body.textContent).toContain("Willpower");
  expect(document.body.textContent).not.toContain("Resonance");
});

test("shows shield and orb ego selectors using parser-aligned ego names", async () => {
  const shieldState = buildDefaultCalculatorState("trunk");
  shieldState.shield = "buckler";
  shieldState.shieldItem = {
    kind: "buckler",
    enchant: 2,
    ego: "reflection",
  };

  await renderCalculator(shieldState);
  await openCalculatorEquipmentRow("equipment-row-offhand");

  expect(
    document.body.querySelector('button[aria-label="Shield ego"]')?.textContent
  ).toContain("Reflection");
});
```

Add to `src/components/__tests__/DynamicEquipmentControls.test.tsx`:

```ts
const renderDynamicEquipmentControls = async (
  state = buildDefaultCalculatorState("trunk")
) => {
  await act(async () => {
    root.render(<DynamicEquipmentControls state={state} setState={setState} />);
  });
};

const openDynamicEquipmentRow = async (testId: string) => {
  const row = container.querySelector(
    `[data-testid="${testId}"]`
  ) as HTMLButtonElement;

  if (!row) {
    throw new Error(`Could not find ${testId}`);
  }

  await act(async () => {
    row.click();
  });
};

test("shows filtered ego selectors for scarf, gloves, headgear, and footwear", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.cloakItem = {
    kind: "scarf",
    present: true,
    enchant: 0,
    ego: "resistance",
  };
  state.headgearSlots[0] = {
    present: true,
    enchant: 0,
    kind: "hat",
    ego: "intelligence",
  };
  state.gloveSlots[0] = {
    present: true,
    enchant: 0,
    ego: "strength",
  };
  state.bootsItem = {
    kind: "boots",
    present: true,
    enchant: 1,
    ego: "flying",
  };

  await renderDynamicEquipmentControls(state);

  await openDynamicEquipmentRow("equipment-row-cloak");
  expect(
    document.body.querySelector('button[aria-label="Cloak ego"]')?.textContent
  ).toContain("Resistance");
});
```

Add the helper functions once per file near the existing `setNumberInputValue`
test helper. Do not use browser MCP for this verification.

- [ ] **Step 2: Run modal tests to verify they fail**

Run:

```bash
npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx
```

Expected: FAIL because non-body ego selectors do not exist and body armour
selector is not base-filtered.

- [ ] **Step 3: Add shared ego select component inside modal file**

Modify `src/components/equipment/EquipmentEditModal.tsx`:

```ts
import {
  getEquipmentEgoOptionsForBaseName,
  syncEquipmentEgoModifiers,
  type EquipmentEgoOptionEntry,
} from "@/utils/equipmentEgos";
```

Add helper:

```tsx
const EquipmentEgoSelect = ({
  ariaLabel,
  baseName,
  value,
  modifiers,
  onChange,
}: {
  ariaLabel: string;
  baseName: string | null;
  value: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
  onChange: (next: {
    ego: EquipmentEgoKey;
    modifiers?: EquipmentModifierBag;
  }) => void;
}) => {
  const options = getEquipmentEgoOptionsForBaseName(baseName, value);
  const hasMeaningfulOptions =
    options.some(([key]) => key !== "none") || value !== "none";

  if (!hasMeaningfulOptions) {
    return null;
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      Ego
      <Select
        value={value}
        onValueChange={(nextValue) => {
          const nextEgo = nextValue as EquipmentEgoKey;
          onChange({
            ego: nextEgo,
            modifiers: syncEquipmentEgoModifiers(modifiers, value, nextEgo),
          });
        }}
      >
        <SelectTrigger aria-label={ariaLabel} className="h-8">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          {options.map(([key, option]) => (
            <SelectItem key={key} value={key}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
};
```

- [ ] **Step 4: Use filtered body armour ego options**

In `BodyArmourEditor`, delete the local `bodyArmourEgoEntries` and
`bodyArmourEgoOptions` code. Render:

```tsx
<EquipmentEgoSelect
  ariaLabel="Body armour ego"
  baseName={armourOptions[draft.kind].name}
  value={draft.ego}
  modifiers={draft.modifiers}
  onChange={({ ego, modifiers }) =>
    setDraft((current) => ({
      ...current,
      ego,
      modifiers,
    }))
  }
/>
```

When changing body armour kind, reset an illegal manual ego:

```ts
const nextKind = value as BodyArmourItemState["kind"];
const baseName = nextKind === "none" ? null : armourOptions[nextKind].name;
const keepEgo =
  current.source === "imported" ||
  isEquipmentEgoAllowedForBaseName(baseName, current.ego);

return normalizeBodyArmourDraft({
  ...current,
  kind: nextKind,
  ego: keepEgo ? current.ego : "none",
});
```

- [ ] **Step 5: Add shield and orb ego selectors**

In `ShieldEditor`, render after enchant:

```tsx
{draft.kind !== "none" ? (
  <EquipmentEgoSelect
    ariaLabel="Shield ego"
    baseName={shieldOptions[draft.kind].name}
    value={draft.ego}
    modifiers={draft.modifiers}
    onChange={({ ego, modifiers }) =>
      setDraft((current) => ({
        ...current,
        ego,
        modifiers,
      }))
    }
  />
) : null}
```

In `OrbEditor`, render:

```tsx
{draft.kind !== "none" ? (
  <EquipmentEgoSelect
    ariaLabel="Orb ego"
    baseName="orb"
    value={draft.ego}
    modifiers={draft.modifiers}
    onChange={({ ego, modifiers }) =>
      setDraft((current) => ({
        ...current,
        ego,
        modifiers,
      }))
    }
  />
) : null}
```

- [ ] **Step 6: Add headgear, gloves, and fixed aux ego selectors**

In `HeadgearEditor`, render:

```tsx
{draft.present ? (
  <EquipmentEgoSelect
    ariaLabel="Headgear ego"
    baseName={draft.kind ?? "helmet"}
    value={draft.ego}
    modifiers={draft.modifiers}
    onChange={({ ego, modifiers }) =>
      setDraft((current) => ({
        ...current,
        ego,
        modifiers,
      }))
    }
  />
) : null}
```

In `GlovesEditor`, render with `baseName="gloves"`.

In `FixedAuxEditor`, change the equip selector for the cloak row to support
`cloak`, `scarf`, and `none`:

```tsx
const fixedAuxTypeOptions =
  config.value.kind === "cloak" || config.value.kind === "scarf"
    ? ["none", "cloak", "scarf"]
    : ["none", config.value.kind];
```

When a fixed aux item is present, render:

```tsx
<EquipmentEgoSelect
  ariaLabel={`${config.title} ego`}
  baseName={draft.kind}
  value={draft.ego}
  modifiers={draft.modifiers}
  onChange={({ ego, modifiers }) =>
    setDraft((current) => ({
      ...current,
      ego,
      modifiers,
    }))
  }
/>
```

- [ ] **Step 7: Simplify modal config plumbing**

Remove `bodyArmourEgos` from `EquipmentModalConfig` and from callers in
`src/components/Calculator.tsx`. The modal can now compute legal ego options
from the current base item.

Ensure `clearImportedItemMetadata` does not erase `ego`; changing a modifier
should clear parser display metadata but keep item identity unless the user
explicitly changes the ego selector.

- [ ] **Step 8: Run modal tests**

Run:

```bash
npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit modal UI**

Run:

```bash
git add src/components/equipment/EquipmentEditModal.tsx src/components/Calculator.tsx src/components/DynamicEquipmentControls.tsx src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx
git commit -m "feat: filter equipment ego selectors by base item"
```

---

### Task 6: Final Focused Verification And Documentation Check

**Files:**
- Modify only if verification reveals a bug.

- [ ] **Step 1: Run focused regression tests**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/equipmentEgos.test.ts src/versioning/__tests__/equipmentData.test.ts src/hooks/__tests__/calculatorStatePersistence.test.ts src/morgueImport/__tests__/importMorgue.test.ts src/utils/__tests__/equipmentSummaryText.test.ts src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx src/utils/__tests__/spellCalculations.trunk-20260405-f9e06672.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS with no new errors. The existing
`react-refresh/only-export-components` warning in `src/components/ui/button.tsx`
may still appear.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS. The existing Vite chunk-size warning may still appear.

- [ ] **Step 4: Run full suite and record baseline status**

Run:

```bash
npm test -- --runInBand
```

Expected: The full suite may still fail with the existing spell parity baseline
failures. If failures differ from the previously observed spell-calculation
failures, stop and debug before proceeding.

- [ ] **Step 5: Verify docs registration**

Run:

```bash
rg -n "equipment ego availability|2026-04-25-equipment-ego-availability" docs/meta--catalog.md docs/superpowers/specs/2026-04-25-equipment-ego-availability-design.md docs/superpowers/plans/2026-04-25-equipment-ego-availability.md
```

Expected: Matches in the spec, plan, and catalog.

- [ ] **Step 6: Check final status**

Run:

```bash
git status --short
```

Expected: no uncommitted changes. If verification-only doc notes were added,
commit them with:

```bash
git add docs/superpowers/plans/2026-04-25-equipment-ego-availability.md docs/meta--catalog.md
git commit -m "docs: update equipment ego availability plan"
```
