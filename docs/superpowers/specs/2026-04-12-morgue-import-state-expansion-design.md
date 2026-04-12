# Morgue Import State Expansion Design

## Summary

Expand the calculator state, import mapping, and manual controls so morgue
imports can populate more Crawl-relevant modifiers while still leaving every
imported value manually editable afterward.

This batch intentionally focuses on values that already matter for current
calculator outputs:

- body armour, shield, headgear, and glove enchantment
- additive equipment stat and defense modifiers
- ring and amulet effects that directly affect AC, EV, SH, or spell failure
- a targeted subset of mutations and traits that affect AC, EV, SH, or spell
  failure

The implementation should stop short of building a full item simulator. The app
should represent only the pieces it needs for current AC, EV, SH, and spell
failure calculations.

## Problem Statement

The current morgue import boundary maps a narrow subset of parser data into the
calculator. That worked for phase 1, but it drops several high-value sources of
parity:

- armour and shield enchant
- auxiliary armour enchant
- jewellery bonuses that directly affect AC, EV, SH, or spell success
- mutation and trait modifiers beyond wild magic
- additive randart and item property bonuses that the current slot model cannot
  express

The first follow-up note already identified these as the highest-value next
steps, but the original calculator state shape is too flat in the wrong places.
For example:

- `secondGloves` is hardcoded instead of being a dynamic glove-slot concept
- `wizardry` is a single scalar instead of something that can be partly derived
  from ring slots and partly derived from mutations
- jewellery is not modeled as slots at all

That means simply adding more flat numbers would make imports possible, but
would leave the post-import manual-edit experience clumsy and opaque.

## Goals

- Let morgue import populate more parity-relevant values without hiding them in
  import-only state.
- Make the new values manually editable through the regular calculator UI.
- Replace hardcoded secondary-slot assumptions with dynamic slot counts for the
  supported slot families in scope.
- Preserve a clear boundary between:
  - slot-modeled equipment effects
  - residual additive modifiers that still affect calculations
- Keep the scope focused on current calculator outputs:
  - `AC`
  - `EV`
  - `SH`
  - spell failure

## Non-Goals

- Do not model full Crawl item semantics for every ring, amulet, talisman, or
  randart.
- Do not add general-purpose item inventory browsing or item detail editors.
- Do not model temporary statuses that the parser does not currently expose in a
  stable way.
- Do not try to resolve every parser property token into first-class editable
  controls in this batch.
- Do not implement full talisman or form support here.

## Current Repo State

Today the calculator keeps almost all editable inputs in one flat
`CalculatorState`, with React components directly updating that state. This is
still a good fit for the next expansion, but only if equipment slots that vary
by species or gear are promoted from ad-hoc booleans into dynamic arrays.

Today the relevant boundaries are:

- `useCalculatorState` owns persistence and saved-state validation
- `Calculator.tsx` owns equipment and stat UI wiring
- `SpellControls.tsx` owns spell-adjacent inputs like `wizardry`,
  `wildMagic`, and `bodyArmourEgo`
- `importMorgue.ts` builds a fresh versioned calculator state from parser data
- `acCalculation.ts`, `evCalculation.ts`, `shCalculation.ts`, and
  `spellCalculation.ts` implement the current formulas

## User-Confirmed Scope Decisions

- New importable values must remain manually editable after import.
- Ring, amulet, headgear, and glove support should use dynamic slot counts
  instead of hardcoded one-off fields.
- Octopode-style many-ring cases should be representable by the slot model.
- Formicid double gloves should be represented through the same dynamic slot
  mechanism instead of a dedicated `secondGloves` flag.
- If slot capacity shrinks after a species or equipment change, the calculator
  should immediately truncate the extra slots instead of keeping hidden values
  around.
- Randarts should use a hybrid model:
  - slot-compatible subtype information goes into slot state
  - extra calculation-relevant effects go into residual additive fields
  - original item identity can be kept only as optional display metadata, not
    as a full editable item model

## Proposed Design

### 1. Expand Calculator State With Dynamic Slot Families

Replace the current fixed-field approach for the slot families in scope with
dynamic arrays.

New slot families:

- `ringSlots: RingSlotState[]`
- `amuletSlots: AmuletSlotState[]`
- `headgearSlots: AuxArmourSlotState[]`
- `gloveSlots: AuxArmourSlotState[]`

Where:

```ts
type RingSlotKind = "none" | "wizardry" | "protection" | "evasion";

type RingSlotState = {
  kind: RingSlotKind;
  plus: number;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

type AmuletSlotKind = "none" | "reflection";

type AmuletSlotState = {
  kind: AmuletSlotKind;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

type AuxArmourSlotState = {
  present: boolean;
  enchant: number;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};
```

The metadata fields are optional and read-only from the calculator's point of
view. They exist to keep imported randart identity visible without forcing the
app to become a full item editor.

### 2. Keep Residual Additive Fields For Non-Slot Effects

Some Crawl-relevant effects are important for parity but do not belong in the
minimal slot model for this batch.

Keep or add explicit numeric residual fields for:

- `bodyArmourEnchant`
- `shieldEnchant`
- `bootsEnchant`
- `cloakEnchant`
- `equipmentStr`
- `equipmentDex`
- `equipmentInt`
- `equipmentAC`
- `equipmentEV`
- `equipmentSH`
- `wildMagic`
- `subduedMagic`
- `antiWizardry`
- `runicMagic`
- `bigBrainWizardry`
- `scalesAC`
- `distortionField`
- `tenguFlight`
- `largeBonePlates`

Important distinction:

- slot families represent equipment the user can reason about directly
- residual fields represent calculation-relevant leftovers that do not yet have
  a first-class slot or object model

This keeps the scope bounded while still preserving real Crawl modifiers.

### 3. Add A Dynamic Slot Resolver Layer

Introduce a small version-aware resolver that determines how many slots each
slot family should currently have.

The resolver should depend on:

- version
- species
- currently selected equipment state when it can add slot capacity

At minimum, it must support:

- many ring slots for Octopode
- two glove slots for Formicid
- future extra ring, amulet, or headgear capacity from gear without requiring a
  state redesign

The resolver should return a simple object like:

```ts
type DynamicSlotCounts = {
  ringSlots: number;
  amuletSlots: number;
  headgearSlots: number;
  gloveSlots: number;
};
```

When counts change:

- slot arrays should be expanded with sensible defaults when capacity grows
- slot arrays should be truncated immediately when capacity shrinks

This keeps current state and current legal equipment capacity aligned at all
times.

### 4. Move Wizardry And Jewellery Effects Into The Slot Model

The current calculator exposes `wizardry` as a single scalar. After this batch,
wizardry should be computed from two sources:

- wizardry ring slots
- non-ring sources stored in residual fields

Concretely:

- each `ringSlots[i].kind === "wizardry"` contributes `1`
- `bigBrainWizardry` contributes its explicit mutation-derived wizardry count
- if residual imported equipment later needs extra wizardry that is not from a
  ring slot, that should be represented by a dedicated residual field instead of
  overloading ring counts

For this batch, a separate residual `equipmentWizardry` field is not required.
The supported non-ring wizardry source is only `bigBrainWizardry`.

Likewise:

- protection rings contribute AC through ring slots
- evasion rings contribute EV through ring slots
- reflection amulets contribute SH through amulet slots

This makes manual editing legible: users adjust actual rings and amulets rather
than mysterious aggregate numbers.

### 5. Extend Calculation Inputs Without Rewriting The Formula Core

The calculation modules should stay recognizable and only expand where the new
inputs must be applied.

#### AC

`AC` should incorporate:

- existing base armour and auxiliary-armour AC
- body armour enchant
- headgear slot enchant totals
- glove slot enchant totals
- existing boots and cloak presence plus their enchant values
- `ring of protection` plus totals from ring slots
- residual `equipmentAC`
- `scalesAC`

Residual `equipmentStr`, `equipmentDex`, and `equipmentInt` do not directly add
to AC, but may affect other calculations.

#### EV

`EV` should incorporate:

- existing formula inputs
- effective strength: `strength + equipmentStr`
- effective dexterity: `dexterity + equipmentDex`
- ring-of-evasion totals from ring slots
- residual `equipmentEV`
- `distortionField`
- `tenguFlight`

Shield and armour penalties should continue to use effective strength. Dodge and
shield-dex contributions should continue to use effective dexterity.

#### SH

`SH` should incorporate:

- existing shield formula inputs
- effective dexterity: `dexterity + equipmentDex`
- shield enchant
- residual `equipmentSH`
- amulet-of-reflection slot contributions
- `largeBonePlates`

#### Spell Failure

Spell failure should incorporate:

- effective strength: `strength + equipmentStr`
- effective intelligence: `intelligence + equipmentInt`
- ring-slot wizardry total
- `bigBrainWizardry`
- `wildMagic`
- `subduedMagic`
- `antiWizardry`
- `runicMagic`

The current spell-success support for `bodyArmourEgo`, `orb`, and existing
version-aware school checks should remain in place.

The expanded spell-failure logic should still avoid bringing in unrelated spell
power features like `Archmagi`, which affect spell power but not failure rate.

### 6. Hybrid Randart Handling

Imported randarts should not create a parallel full-item model.

Instead:

- slot-compatible subtype information should populate the appropriate slot
  family
- slot-compatible numeric plus values should populate slot `plus` or enchant
  fields
- additional calculation-relevant modifiers should flow into residual additive
  fields
- optional slot metadata should retain imported item identity for display

Examples:

- randart ring of protection `+5` -> ring slot kind `protection`, `plus = 5`
- randart amulet of reflection -> amulet slot kind `reflection`
- randart hat with `Str +3` and `AC +2` -> headgear slot present/enchant plus
  residual `equipmentStr += 3`, `equipmentAC += 2`

This preserves parity-relevant effects without turning the UI into an artefact
property editor.

### 7. Morgue Import Mapping Rules

Import should use this order:

1. normalize version
2. build fresh default state
3. resolve legal slot counts for that version/species
4. populate direct slot-modeled items
5. populate residual additive modifiers from remaining parser properties
6. populate mutation-derived fields
7. generate applied/skipped summary

Specific mapping rules:

- body armour and shield
  - base type still maps to existing `armour` and `shield`
  - `enchant` maps to `bodyArmourEnchant` and `shieldEnchant`
- boots and cloak
  - existing worn-state mapping remains in the current fixed controls
  - `enchant` maps to `bootsEnchant` and `cloakEnchant`
- headgear and gloves
  - each parsed equipped item fills the next legal slot
  - slot enchant comes from the parsed item `enchant`
- rings
  - wizardry / protection / evasion rings map into ring slots
  - plus-valued rings carry their parsed plus value into `plus`
  - unsupported ring types do not create custom slot kinds
- amulets
  - reflection maps into amulet slots
  - unsupported amulets do not create custom slot kinds
- parser numeric item properties
  - `Str`, `Dex`, `Int`, `AC`, `EV`, `SH` not already accounted for by slot
    semantics flow into the corresponding residual fields
- parser mutations
  - `wild magic` -> `wildMagic`
  - `subdued magic` -> `subduedMagic`
  - `anti-wizardry` -> `antiWizardry`
  - `runic magic` -> `runicMagic`
  - `big brain` level 3 -> `bigBrainWizardry = 1`
  - AC-granting scales and body traits -> aggregated `scalesAC`
  - `distortion field` -> numeric level
  - `tengu flight` -> boolean-or-count field used by EV logic
  - `large bone plates` -> numeric level

If an imported item or mutation affects the current outputs but cannot be
represented by the slot model, the importer should prefer a residual additive
field over skipping it.

If a parsed concept still cannot be expressed even through residual fields, it
should remain in `Skipped`.

### 8. Manual Editing UI

The UI should remain grouped by user intent rather than by raw state shape.

Recommended structure inside the existing `Equipment` area:

- body armour / shield / orb / ego controls
- dynamic auxiliary slot controls
  - headgear slots
  - glove slots
- jewellery slot controls
  - ring slots
  - amulet slots
- residual equipment modifiers
  - `equipmentStr`
  - `equipmentDex`
  - `equipmentInt`
  - `equipmentAC`
  - `equipmentEV`
  - `equipmentSH`
- mutation and spell-affecting modifiers
  - `wildMagic`
  - `subduedMagic`
  - `antiWizardry`
  - `runicMagic`
  - `bigBrainWizardry`
  - `scalesAC`
  - `distortionField`
  - `tenguFlight`
  - `largeBonePlates`

The UI should not expose the metadata fields as primary editable controls.
Showing imported display names next to slots is fine, but editing should happen
through the normalized slot kind, plus, enchant, and residual fields.

### 9. Saved-State Migration

Saved-state compatibility must be maintained.

Migration strategy:

- if a saved state lacks the new slot arrays, initialize them from defaults
- if an older saved state has `secondGloves`, convert it into `gloveSlots`
- if an older saved state has scalar `wizardry`, map it into leading
  `wizardry` ring slots as far as current slot capacity allows
- any leftover scalar wizardry beyond current slot capacity should be dropped
  rather than preserved in hidden state

The saved-state validator should continue rejecting malformed state rather than
trying to coerce arbitrary shapes.

### 10. Testing Strategy

Add tests in three layers.

#### Import mapper tests

Cover:

- ring and amulet slot population from parsed items
- enchant extraction for body armour, shield, headgear, and gloves
- residual additive property extraction from parser numeric bags
- mutation aggregation into the new mutation fields
- dynamic slot truncation and expansion behavior during import

#### Calculation tests

Cover:

- body armour, shield, headgear, glove, boots, and cloak enchant effects
- ring protection and ring evasion slot effects
- amulet reflection effects
- residual equipment stat modifiers changing derived AC, EV, SH, or spell fail
- subdued magic, anti-wizardry, runic magic, big brain wizardry, scales AC,
  distortion field, tengu flight, and large bone plates

#### Component and state tests

Cover:

- slot resolver behavior by species
- Octopode ring-slot rendering
- Formicid double-glove rendering
- slot truncation when species or slot-granting equipment changes
- saved-state migration from the old shape

## Risks And Mitigations

### Risk: State Expansion Becomes Opaque

Adding too many new flat fields could make the state harder to reason about.

Mitigation:

- keep real equipment slots in dedicated arrays
- reserve residual fields only for effects that genuinely lack a slot model
- avoid introducing a generic property bag into calculator state

### Risk: Import Double-Counts Slot And Residual Effects

It would be easy for imported ring or randart effects to be applied once via a
slot and again via residual fields.

Mitigation:

- importer should explicitly classify each effect source
- tests must cover slot-supported randart examples to ensure no double-counting

### Risk: Dynamic Slot Shrink Loses User Input

Immediate truncation discards values when slot counts shrink.

Mitigation:

- keep the behavior explicit and predictable
- rely on import or manual re-entry rather than hidden restoration logic
- document this behavior in the UI copy if needed

### Risk: Scope Drift Into Full Equipment Modeling

Once slot arrays and randart metadata exist, it becomes tempting to model every
property token.

Mitigation:

- keep slot kinds tightly limited to the supported calculation outputs
- use residual numeric fields as the escape hatch for this batch
- defer talisman/form/full randart semantics to later dedicated work

## Implementation Boundary

This batch should produce a calculator that:

- can import and manually edit the new parity-relevant values
- uses dynamic slot arrays for rings, amulets, headgear, and gloves
- updates AC, EV, SH, and spell failure from those values
- does not yet become a full Crawl equipment simulator

That is the right stopping point for the next implementation plan.
