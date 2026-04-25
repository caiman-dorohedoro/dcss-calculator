# Equipment Summary Modal Design

## Summary

Replace the current always-expanded equipment controls with a unified equipment
list that reads like Crawl's equipment view.

Each equipment slot should show a plain text item summary in the main
calculator controls. Selecting a row opens a details modal for editing that
slot's type, enchant, first-class effect, and calculation-relevant modifiers.

This keeps imported morgue equipment recognizable while avoiding a dense
equipment section full of selectors and number inputs.

## Relationship To Existing Specs

This design builds on `2026-04-15-itemized-equipment-modifiers-design.md`.

That earlier design moved gear-side effects into item-level state. This design
keeps that state model and changes the editing surface:

- itemized equipment state remains the source of calculation inputs
- morgue import continues to populate `displayName` and item modifiers
- aggregation helpers and calculator formulas should not need new behavior
- the visible equipment UI changes from inline controls to summary rows plus a
  modal editor

## Problem Statement

The itemized equipment UI exposes too many controls at once.

After morgue import, equipment like randart armour, rings, and gloves should be
easy to scan as the player saw them in-game. Instead, the current UI expands
selectors, enchant inputs, and modifier inputs for each supported item. This
makes the equipment section feel like a configuration form rather than a Crawl
equipment list.

The problem is especially visible for imported artifacts:

- the important thing is the item identity, such as `the +4 leather armour of
  the Plethaurus {Will+ Str+2 Dex+5}`
- users rarely need to edit every field immediately after import
- showing every possible field beside every item creates visual noise

## Goals

- Show all equipment slots with a consistent plain text row.
- Prefer imported in-game item names exactly as provided by `displayName`.
- Generate fallback text that uses in-game-style item names such as `pair of
  gloves`, `leather armour`, and `orb of energy`.
- Keep enchantment values visible for enchantable equipped gear, including
  explicit `+0` values such as `+0 cloak`.
- Present the equipment rows as one compact list in an order that feels close
  to Crawl's status equipment view.
- Move all equipment selectors, enchant controls, and item modifier controls
  into a details modal.
- Keep every dynamic slot visible, including octopode ring slots and formicid
  glove slots.
- Preserve existing calculator behavior and itemized equipment state.

## Non-Goals

- Do not build a full Crawl item-name generator.
- Do not infer flavor names or artifact names when no imported `displayName`
  exists.
- Do not change morgue parser behavior.
- Do not change equipment aggregation or calculator formulas.
- Do not redesign mutation and trait modifier controls.

## Recommended Approach

Use summary rows plus a modal editor for every equipment item.

The main equipment section should contain a list of clickable rows. Each row has
the slot label and a single item summary string. The row itself, or a small edit
button inside it, opens the details modal.

This approach is preferred over inline expansion because it most directly solves
the visual density problem: the default view becomes a readable equipment list,
while the editing UI is still available one click away.

## Equipment Rows

Rows should cover all currently supported equipment:

- body armour
- offhand, backed by shield or orb state
- rings
- amulets
- headgear
- gloves
- cloak
- boots
- barding

The equipment section should not introduce additional visual subsections such
as `Rings`, `Amulets`, `Headgear`, or `Fixed Equipment`. The calculator already
has larger sections for stats, skills, equipment, and mutations; inside the
equipment section, rows should read as one continuous equipment list.

The list should be ordered to resemble Crawl's in-game equipment status view,
without trying to reproduce unsupported inventory concepts:

1. offhand equipment
2. body armour
3. headgear
4. cloak
5. gloves
6. boots
7. barding
8. amulets
9. rings

Weapon or staff rows are out of scope because the current calculator state does
not model a weapon slot.

Shield and orb state remain separate internally because they use different
modal fields and state keys, but the main equipment list should show one
`Offhand:` row. If a shield is equipped, the row displays the shield summary and
opens the shield modal. If no shield is equipped and an orb is equipped, the row
displays the orb summary and opens the orb modal. If both are empty, the row
shows `none` and opens the shield modal as the default offhand editor.

All dynamic slots stay visible even when empty. For example, octopodes still see
all ring rows, and formicids still see both glove rows. Empty slots should use a
clear fallback such as `none`.

The row label identifies the app slot, while the summary text should read like
an in-game item name. Rows should keep the existing `Label: item text` shape;
the UI should not switch to `label - item text`. For example:

- `Armour: the +4 leather armour of the Plethaurus {Will+ Str+2 Dex+5}`
- `Offhand: +2 kite shield`
- `Offhand: orb of energy`
- `Ring 1: a ring of protection +4`
- `Glove 1: +5 pair of gloves {Str+2}`
- `Cloak: +0 cloak`
- `Boots: none`

The app does not need to reproduce Crawl inventory letters such as `a -` or
`p -`. Slot labels are enough context for this calculator.

Equipment rows should be visually compact. Keep enough hover/focus affordance
to make rows clickable, but use tighter vertical padding and smaller gaps than
form controls so the list scans more like an in-game equipment readout.

## Summary Text Rules

Summary text should be generated with this priority:

1. Use `displayName` when it exists.
2. Otherwise build a fallback from the current item state.
3. If the slot is empty, show `none`.

Imported `displayName` is authoritative for item identity. For enchantable
equipment, if the imported display name does not already start with an
enchantment such as `+0`, `+4`, or `-2`, prefix the state enchantment before
displaying it. This preserves imported artifact names like `the +4 leather
armour of the Plethaurus ...` while still showing `+0 pair of boots` when the
parser provides `pair of boots`.

Fallback text should stay intentionally narrow. It should use known equipment
names from the app's option tables and item state, then append calculation
modifiers when present.

Fallback examples:

- body armour: `+4 leather armour (resonance) {Int+3}`
- shield: `+2 kite shield`
- orb: `orb of energy {Wiz+1}`
- ring: `ring of protection +4`
- amulet: `amulet of reflection`
- headgear: `+0 helmet`
- gloves: `+5 pair of gloves {Str+2}`
- cloak: `+1 cloak`
- boots: `+0 pair of boots`
- barding: `+5 barding`

Fallback text should include `+0` for enchantable equipment when the item is
present. Rings keep their existing plus behavior: only ring kinds that actually
have a ring plus, such as protection or evasion, append that plus value.

Modifier summaries should include only item-level effects that already exist in
`EquipmentModifierBag`: `Str`, `Dex`, `Int`, `AC`, `EV`, `SH`, and `Wiz`.

## Details Modal

Selecting an equipment row opens an `Equipment Details` modal.

The modal should use the existing portal modal pattern from
`MorgueImportControls` so the app keeps one visual language for modal overlays.

The modal edits a local draft copy of the selected item. `Cancel` closes the
modal without changing calculator state. `Save` applies the draft to calculator
state and closes the modal.

This draft flow avoids accidental calculator changes when a user opens a row
just to inspect it.

## Modal Fields

The modal fields should match the selected equipment type:

- body armour: armour type, enchant, ego, item modifiers
- shield: shield type, enchant, item modifiers
- orb: orb type, item modifiers
- ring: ring type, plus for protection or evasion, item modifiers
- amulet: amulet type, item modifiers
- headgear: equipped or none, kind, enchant, item modifiers
- gloves: equipped or none, enchant, item modifiers
- cloak, boots, barding: equipped or none, enchant, item modifiers

The modal can reuse the existing `Select`, `EquipmentEnchantInput`, and
`EquipmentModifierInputs` controls. The key change is location: these controls
belong inside the modal, not in the main equipment list.

## Imported Name Invalidation

Imported `displayName` should remain visible until the user changes that item in
the details modal.

If the user saves a real edit to an imported item, clear that item's
`displayName`, `artifactKind`, and imported `source` metadata where the current
clear helpers already do so. After that save, the main row should use fallback
text generated from the edited state.

This avoids showing stale item text after manual edits. For example, if an
imported `the +5 pair of gloves ... {Str+7}` is edited to a different modifier,
continuing to show the original imported name would be misleading.

If the user opens the modal and cancels, or saves without changing the draft,
the imported `displayName` should remain unchanged.

## Component Boundaries

Implementation should keep the change mostly in the UI layer:

- a pure summary helper formats item row text
- a summary row component renders the slot label and item text
- an equipment details modal owns draft editing for the selected row
- `Calculator` and `DynamicEquipmentControls` use the same row-and-modal pattern
  for their respective equipment groups

The existing item state types, import mapping, aggregation helper, and
calculator formulas should remain stable unless a small adapter is needed for
the modal save path.

## Testing

Add tests before implementation for the new visible behavior:

- imported `displayName` renders unchanged in an equipment row
- fallback text uses in-game-style names such as `pair of gloves`, `leather
  armour`, and `orb of energy`
- fallback text includes `+0` for equipped enchantable gear
- the equipment section orders rows like the supported subset of Crawl's status
  equipment view
- the equipment section does not render nested headings such as `Rings`,
  `Amulets`, or `Fixed Equipment`
- the main equipment section no longer renders equipment selectors, checkboxes,
  or modifier inputs directly
- clicking a row opens the details modal
- `Cancel` discards modal edits
- `Save` applies modal edits
- editing an imported item clears stale imported display metadata and switches
  the row to fallback text

Existing calculation and import tests should remain valid because this design
does not change formula inputs or parser semantics.

## Follow-up: Parser Property Modifiers

The summary rows should not depend on imported `displayName` containing the raw
`{...}` property block. `dcss-morgue-parser` intentionally keeps display names
and property bags separate, so the app must rebuild the visible property
summary from item-level modifier state when a display name has no braces.

`EquipmentModifierBag` should preserve the parser-visible item properties that
users expect to see in Crawl-style equipment text, including:

- numeric sequence properties such as `rF+`, `rC+`, `rN++`, `Will+`,
  `RegenMP+`, `Regen+`, and `Stlth+`
- signed numeric properties such as `Str+4`, `Int+5`, `Dex+2`, `Slay+4`,
  `AC+3`, `EV+2`, `SH+4`, `HP+7`, and `MP+10`
- boolean or named flags such as `Ponderous`, `Reflect`, `Spirit`, `SInv`,
  `rCorr`, `+Inv`, `Bane`, `^Contam`, and parser `opaqueTokens`

Only the existing calculation-relevant fields should affect formulas. The
additional parser properties are display and editing state until the calculator
models those mechanics directly.

The details modal should keep numeric properties editable through compact
number inputs and expose flags as editable item-property tokens. This keeps the
UI from adding a selector for every Crawl artefact flag while still allowing
users to correct imported properties such as `{Ponderous, Will+ MP+10 Int+5}`.
Inputs with non-zero imported or edited values should be visually emphasized
without dimming the surrounding zero-value inputs, so users can quickly spot
which parser-derived modifiers are active.

For normal imported rings such as `ring of willpower`, the summary row should
not invent a Crawl property block like `{Will+}` when the parser did not provide
raw `propertiesText`. The modifier remains editable in the details modal for
calculation parity, but the row text should stay close to Crawl's visible item
name. Imported arbitrary or artefact rings should still show parser
`propertiesText` when available, for example `ring "Dori" {rC+ MP+9 Stlth+}`.
When such an imported arbitrary ring opens in the details modal, hide the
manual `Ring type` selector and keep the modal focused on modifier correction.

For imported body armour, the summary row should prefer the parser's original
item name and raw `propertiesText` over any regenerated modifier text. This is
especially important for unrand names such as `justicar's regalia`, where the
calculator may normalize the base armour to `robe` for calculations while the
UI should continue showing `+5 justicar's regalia {Inspire Amulet+ Str+4}`.

The body armour details modal should expose that split explicitly:

- `Imported item`: read-only Crawl-style imported name and raw property text
- `Base armour`: read-only normalized armour base used by the calculator
- editable controls below remain based on normalized state such as `Armour type`
  and enchant
