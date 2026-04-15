# Itemized Equipment Modifiers Design

## Summary

Move calculation-relevant equipment modifiers from flat calculator-level
aggregates into item-level equipment state.

After this change, gear-side bonuses such as `Str`, `Dex`, `Int`, `AC`, `EV`,
`SH`, and `Wiz` should live on the equipment item that provides them instead of
in a separate `Modifiers` section.

This keeps the UI and state model aligned with how players reason about Crawl
equipment:

- a ring should carry its own wizardry or stat bonuses
- armour should carry its own randart stat bonuses
- orb-side spell-failure modifiers should live on the orb entry
- mutation and trait modifiers should remain outside equipment

The parser contract from `dcss-morgue-parser` is the primary source of truth
for how imported items are shaped.

## Relationship To Existing Specs

This design builds on `2026-04-12-morgue-import-state-expansion-design.md` but
changes one important boundary:

- the previous design kept equipment-side additive stat and defense bonuses in
  flat residual fields such as `equipmentStr` and `equipmentAC`
- this design replaces that flat residual model with item-level modifier bags
  for all supported equipment

The earlier spec still stands for:

- dynamic slot counts
- signed enchant support
- parser-driven import
- keeping mutation and trait modifiers editable after import

## Problem Statement

The current calculator mixes two different mental models:

- some equipment is represented as first-class items or slots
- some gear-driven effects are represented only as flat aggregate numbers

Examples of the mismatch today:

- ring and amulet slots exist, but extra stat bonuses still disappear into
  `equipmentStr`, `equipmentDex`, `equipmentInt`, `equipmentAC`, `equipmentEV`,
  and `equipmentSH`
- ring-side wizardry is partly modeled as ring slots and partly mirrored through
  a legacy `wizardry` scalar
- fixed equipment such as cloak, boots, barding, armour, shield, and orb expose
  presence or subtype controls, but not their full calculation-relevant item
  effects

That creates a clumsy editing experience after import:

- users cannot see which item is responsible for a modifier
- users cannot edit an imported randart bonus where the item itself is shown
- gear-side wizardry feels detached from the item that provides it

## Goals

- Make every supported equipment item carry its own calculation-relevant
  modifiers.
- Remove the standalone gear-side `Modifiers` section from the UI.
- Keep imported item identity visible enough to support manual correction.
- Preserve current AC, EV, SH, and spell-failure calculations while changing the
  source of aggregated gear values.
- Align the import model with `dcss-morgue-parser` detail objects instead of
  relying on summary strings or calculator-specific aggregate fields.

## Non-Goals

- Do not build a full item simulator or generic inventory system.
- Do not model non-calculation properties that the app still does not use.
- Do not move mutation or trait modifiers into equipment.
- Do not redesign dynamic slot-count behavior introduced in the earlier spec.
- Do not require the calculator formulas themselves to understand individual
  items directly.

## Parser Contract

`dcss-morgue-parser` detail objects are the import boundary.

Relevant parser facts:

- use `bodyArmourDetails`, `shieldDetails`, `orbDetails`, `helmetDetails`,
  `glovesDetails`, `footwearDetails`, `cloakDetails`, `amuletDetails`, and
  `ringDetails` when semantics matter
- use `displayName`, `baseType`, `enchant`, `ego`, `artifactKind`,
  `subtypeEffect`, `properties.numeric`, and `properties.booleanProps`
- prefer merged `properties` over reconstructing values from
  `intrinsicProperties`, `egoProperties`, and `artifactProperties` unless a
  future edge case proves otherwise

This design therefore treats parser detail objects as the authoritative source
for item-side numeric and boolean modifiers.

## Proposed State Model

### 1. Shared Equipment Modifier Bag

Add a shared modifier bag for supported gear-side calculation effects:

```ts
type EquipmentModifierBag = {
  str?: number;
  dex?: number;
  int?: number;
  ac?: number;
  ev?: number;
  sh?: number;
  wizardry?: number;
};
```

This bag intentionally stays narrow.
It covers only item-side effects that already matter to current calculator
outputs.

`wildMagic`, `subduedMagic`, `antiWizardry`, `runicMagic`,
`bigBrainWizardry`, `distortionField`, `largeBonePlates`, and similar non-item
sources remain outside this bag.

### 2. Slot-Based Equipment Keeps Its Existing Shape

Existing slot families stay in place, but each slot gains an optional modifier
bag.

Illustrative shape:

```ts
type RingSlotState = {
  kind: "none" | "wizardry" | "protection" | "evasion";
  plus: number;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

type AmuletSlotState = {
  kind: "none" | "reflection";
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

type AuxArmourSlotState = {
  present: boolean;
  enchant: number;
  kind?: "helmet" | "hat";
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};
```

This preserves today’s slot semantics:

- a protection ring still uses `kind = "protection"` and `plus`
- a wizardry ring still uses `kind = "wizardry"`
- a reflection amulet still uses `kind = "reflection"`

The modifier bag is for the extra item-side effects that do not already belong
to those first-class slot meanings.

### 3. Fixed Equipment Becomes Item State

Replace flat fixed-equipment booleans and gear-side aggregate fields with item
objects for:

- body armour
- shield
- orb
- cloak
- boots
- barding

Illustrative shape:

```ts
type BodyArmourItemState = {
  kind: ArmourKey;
  enchant: number;
  ego: BodyArmourEgoKey;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

type ShieldItemState = {
  kind: ShieldKey;
  enchant: number;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

type OrbItemState = {
  kind: OrbKey;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

type FixedAuxItemState = {
  present: boolean;
  kind: "cloak" | "boots" | "barding";
  enchant: number;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};
```

This lets imported item-specific stat bonuses stay attached to the item that
provided them.

### 4. Calculator State Boundary

Remove the following calculator-level gear aggregates:

- `equipmentStr`
- `equipmentDex`
- `equipmentInt`
- `equipmentAC`
- `equipmentEV`
- `equipmentSH`

Also stop using the calculator-level `wizardry` scalar as the source of
equipment wizardry.

The only wizardry-like values that should remain outside equipment are true
non-item sources such as `bigBrainWizardry`.

## Aggregation Layer

Keep formula inputs simple by introducing one aggregation helper between
equipment state and calculation code.

Illustrative shape:

```ts
type AggregatedEquipmentEffects = {
  str: number;
  dex: number;
  int: number;
  ac: number;
  ev: number;
  sh: number;
  wizardry: number;
};

function getAggregatedEquipmentEffects(
  state: CalculatorState<GameVersion>
): AggregatedEquipmentEffects
```

The helper should sum:

- all item modifier bags
- slot-native item meanings already modeled by the app

Examples:

- protection ring `plus` contributes `ac`
- evasion ring `plus` contributes `ev`
- wizardry ring `kind` contributes `wizardry += 1`
- reflection amulet still contributes through the current reflection path
- armour, shield, and auxiliary enchant continue contributing through the
  existing enchant logic

The formulas do not need to know which item provided a value.
They only need the final aggregated totals.

## Calculation Flow

The new data flow should be:

1. UI edits item-level equipment state
2. import populates item-level equipment state from parser detail objects
3. a shared aggregation helper computes total gear-side effects
4. AC, EV, SH, and spell-failure functions consume those totals

This keeps the calculation layer stable while the UI and import layer become
more item-aware.

## Import Mapping Rules

### 1. Use Detail Objects Directly

Import code should map parser detail objects into item state instead of first
collapsing them into calculator-level totals.

### 2. Preserve Existing First-Class Meanings

Keep the existing semantic mapping when the app already has a direct concept:

- ring `subtypeEffect = "protection"` -> ring kind `protection`
- ring `subtypeEffect = "evasion"` -> ring kind `evasion`
- ring `booleanProps.Wiz` -> ring kind `wizardry` when the item is a wizardry
  ring
- amulet `booleanProps.Reflect` -> amulet kind `reflection`
- armour `ego` or recognized boolean props -> `bodyArmourEgo`
- `baseType` for armour, shield, and orb continues to drive the subtype key

### 3. Map Remaining Gear Effects Into Item Modifiers

When a detail object has extra calculation-relevant properties, attach them to
that item’s modifier bag.

Examples:

- `properties.numeric.Int = 3` -> `modifiers.int = 3`
- `properties.numeric.AC = 2` -> `modifiers.ac = 2`
- `properties.numeric.SH = 4` -> `modifiers.sh = 4`
- `properties.booleanProps.Wiz = true` on a non-slot-specific gear effect ->
  `modifiers.wizardry = 1`

### 4. Prefer Item Attribution Over Residual Totals

If the parser can attribute a calculation-relevant effect to a specific item,
the calculator should store it on that item.

Only true non-item effects should remain outside equipment.

## UI Design

Remove the standalone `Modifiers` section from equipment controls.

Instead:

- each equipment control shows its own modifiers nearby
- imported `displayName` remains visible when present
- wizardry that comes from an item appears next to that item

Illustrative examples:

```txt
Armour: ring mail [+2] [ego: none]
item modifiers: Int +3

Shield: buckler [+1]
item modifiers: SH +2

Ring 1: wizardry
item modifiers: none

Ring 2: protection [+4]
item modifiers: Int +3

Orb: orb of energy
item modifiers: Wizardry +1
```

Mutation and trait controls remain grouped separately because they are not
equipment.

## Persistence And Migration

Saved-state migration must support three cases:

1. old saves with flat gear aggregates only
2. intermediate saves with slot arrays plus legacy aggregate fields
3. new saves with item-level modifiers

Migration rule:

- when an old save has only flat aggregate values, preserve them by placing
  them in an explicit imported/manual fallback item only if they cannot be
  safely attributed to a specific item
- if a value clearly belongs to an item already represented in saved state, move
  it onto that item
- do not silently discard legacy wizardry or flat equipment stat values

The migration path can keep a short-lived compatibility layer during rollout,
but the target state shape should not keep the old aggregate fields around as a
normal editing surface.

## Risks And Mitigations

### Attribution Risk

Some old saves or edge-case imports may have flat values that cannot be
reliably attributed back to a specific item.

Mitigation:

- support a temporary compatibility migration path
- make unattributed legacy values explicit instead of silently dropping them

### Scope Risk

Turning every equipment type into item state increases migration and UI work.

Mitigation:

- keep the modifier bag narrow
- keep formulas item-agnostic through one aggregation helper
- reuse existing slot models instead of redesigning them

### Parser Contract Drift

If `dcss-morgue-parser` changes item property semantics, import mapping could
drift.

Mitigation:

- keep import tests grounded in parser fixture output
- treat parser detail objects as the single import contract boundary

## Verification Criteria

The change is successful when:

- no standalone gear-side `Modifiers` section remains in the equipment UI
- each supported equipment item can display and edit its own calculation-relevant
  modifiers
- imported item-side `Str`, `Dex`, `Int`, `AC`, `EV`, `SH`, and `Wiz` values
  stay attached to the correct item after import
- AC, EV, SH, and spell-failure calculations still match expected results after
  aggregation
- mutation and trait modifiers remain editable and separate from item state
- old saves continue to load without losing calculation-relevant gear effects
