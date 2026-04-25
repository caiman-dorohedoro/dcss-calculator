# Parser-Aligned Equipment Ego Design

## Summary

Align the app's equipment ego model with `dcss-morgue-parser` and Crawl item
semantics.

The app currently uses `bodyArmour.ego` for a narrow spell-failure subset:
`none`, `command`, `death`, and `resonance`. That is useful for calculation, but
it is not what players or the parser mean by an armour ego. For example, a
`+2 robe of willpower` should have the armour ego `willpower`, not `none`.

The new model should make the item ego represent the real Crawl ego, then derive
spell-failure boosts from that ego only when the selected ego is one of the few
egos that affects spell success.

## Relationship To Existing Specs

This design builds on:

- `2026-04-15-itemized-equipment-modifiers-design.md`
- `2026-04-23-equipment-summary-modal-design.md`

Those specs already moved imported item effects into item-level state and made
the equipment UI display in-game-style item text. This design tightens the data
meaning underneath that UI so imported and manually edited equipment use the
same Crawl-facing vocabulary.

## Problem Statement

Imported equipment now preserves the visible item text well, but the internal
ego field still means "which special spell-failure body armour effect applies"
instead of "what Crawl ego does this item have?"

That creates two mismatches:

- Normal ego items such as `+2 robe of willpower` are imported with
  `bodyArmour.ego = "none"` even though the parser reports `ego = "willpower"`.
- The equipment modal can only choose the spell-failure subset, so users cannot
  inspect or edit common Crawl egos in the place where the app says "ego".

This is technically workable because the modifier bag still contains values
such as `Will+`, but it makes the app's model harder to reason about. A player
who knows the item is "of willpower" should not have to mentally translate that
into "ego none plus Will modifier".

## Goals

- Make `bodyArmour.ego` mean the Crawl/parser armour ego.
- Preserve imported `displayName` and `propertiesText` as the source of the
  equipment row text.
- Keep spell-failure behavior exactly the same for `command`, `death`, and
  `resonance`.
- Trust parser-provided item details for imported numeric values.
- Support common armour egos in the body armour details modal.
- Avoid treating generated Crawl defaults as imported truth for jewellery with
  variable plus values.
- Keep the implementation narrow enough to test without rewriting the whole
  equipment model.

## Non-Goals

- Do not build a full Crawl item generator.
- Do not infer artifact names or artifact property text.
- Do not change `dcss-morgue-parser` unless the app finds a parser bug later.
- Do not make resistance, willpower, stealth, or regeneration panels part of
  calculator math in this change.
- Do not redesign all jewellery editing in the same implementation unless it is
  necessary for parser-aligned body armour ego handling.

## Recommended Approach

Use parser-aligned item ego as the canonical item field, and introduce a small
derived helper for spell-failure boosts.

This is better than adding a second "real ego" field beside the old
`bodyArmour.ego`, because two ego fields would quickly become ambiguous in the
modal, persistence, formatter, and import mapper. The narrower spell-failure
concept should become the derived value because only the spell calculator needs
that subset.

## Data Model

`BodyArmourItemState.ego` should store the real Crawl armour ego:

- `none`
- fixed armour egos such as `willpower`, `resistance`, `fire resistance`,
  `cold resistance`, `positive energy`, `strength`, `dexterity`,
  `intelligence`, and `ponderousness`
- current trunk spell-failure egos such as `command`, `death`, and `resonance`
- parser-provided unknown strings when the app sees an ego it does not yet list

The app should keep a known option list for UI labels, but validation should not
reject an imported ego string only because the local option list is behind
Crawl or the parser.

The old top-level `bodyArmourEgo` field should be treated as legacy spell-boost
state. Existing saved states remain valid because `command`, `death`, and
`resonance` are also real body armour egos. When reading older state, the app
may fold a non-`none` top-level value into `bodyArmour.ego` if the item state
does not already carry a meaningful ego.

## Import Mapping

For imported body armour:

- `bodyArmour.ego` should come from `bodyArmourDetails.ego ?? "none"`.
- `bodyArmour.modifiers` should continue to come from parser item properties.
- `bodyArmour.displayName` should remain the in-game item name used by the
  equipment row.
- `bodyArmour.propertiesText` should remain the raw brace text when the morgue
  line includes one.

The importer should not translate `willpower` into `none + Will+` as the only
representation. It should keep both pieces when the parser provides both: ego
for item identity, modifier bag for calculation and editable property display.

Imported normal items still should not synthesize brace text from modifiers.
For example, `+2 robe of willpower` should display as `+2 robe of willpower`,
not `+2 robe of willpower {Will+}`.

## Spell Calculation

Spell calculation should stop depending directly on the full ego option list.
Instead, it should call a helper that maps the item ego to the spell-failure
boost subset:

- `command` enables command armour behavior.
- `death` enables death armour behavior.
- `resonance` enables resonance armour behavior.
- every other ego maps to `none` for spell-failure purposes.

The existing spell-failure formulas and tests should remain unchanged after
that mapping.

## Armour Ego Modifiers

Known armour egos have fixed Crawl property meanings. For example, current Crawl
source reports fixed terse properties such as:

- `willpower` -> `Will+`
- `strength` -> `Str+3`
- `dexterity` -> `Dex+3`
- `intelligence` -> `Int+3`
- `protection` -> `AC+3`
- `resistance` -> `rC+ rF+`
- `ponderousness` -> `Ponderous`

The app should use a small helper for known armour ego property effects. This
helper is appropriate for manual editing and fallback display because armour
ego effects are fixed.

Imported items remain parser-authoritative. If the parser supplies modifier
values, those values should be preserved instead of recomputed from the app's
helper. This avoids overwriting parser behavior when Crawl changes before the
app's option table is updated.

## Manual Editing

The body armour details modal should offer Crawl-facing armour ego choices
rather than only the spell-failure subset.

Selecting a known ego on a manually edited normal body armour item should update
the relevant ego-derived modifier values. This keeps the modal honest: choosing
`willpower` should visibly produce the same item semantics the player expects.

This synchronization should be careful:

- It should update only the modifier keys owned by the previous and next armour
  ego.
- It should avoid wiping unrelated artifact or manual modifiers.
- It should allow users to edit the resulting modifier inputs afterward.
- It should leave unknown imported ego strings visible instead of forcing them
  to `none`.

## Jewellery Guardrail

Jewellery should not get fixed imported defaults from Crawl source.

Some jewellery subtypes have variable plus values. Crawl source currently marks
slaying, protection, evasion, strength, intelligence, and dexterity rings as
plus-bearing. Generated defaults such as stat ring `+6`, protection `+4`, and
evasion `+5` are useful as new-item starting values, but an imported item's
actual enchantment or parser property value is the truth.

For this body armour ego change:

- imported ring values should continue to come from parser item details
- normal `ring of willpower` should stay display-only without synthesized brace
  text
- future ring type expansion should model plus-bearing ring subtypes with an
  editable plus instead of hard-coding one fixed modifier value

## Summary Text And Modal Display

Equipment row text should keep the existing priority:

1. use imported `displayName`
2. otherwise build fallback text from item state
3. otherwise show `none`

Fallback body armour text should use the real ego name when no imported
`displayName` exists. For example, a manual robe with `enchant = 2` and
`ego = "willpower"` should read like `+2 robe of willpower`.

The modal may show both the human-readable ego label and modifier inputs. Ego
is item identity; modifier inputs are the editable property values that feed
display and calculation.

## Persistence And Versioning

Saved state validation should allow parser-aligned ego strings. It should not
index into the old four-option spell-boost map as if that map defined every
valid armour ego.

Version-specific availability can still control which known ego options appear
in the modal, but persisted imported data must remain loadable even when it
contains an ego outside the current local options.

## Testing

Implementation should add or update tests for:

- importing `+2 robe of willpower` as `bodyArmour.ego = "willpower"` with
  parser-derived `Will+`
- displaying imported `+2 robe of willpower` without synthesized `{Will+}`
- formatting manual fallback body armour as `+2 robe of willpower`
- preserving spell-failure behavior for `command`, `death`, and `resonance`
- accepting unknown imported armour ego strings without crashing summary or
  persistence validation
- ensuring armour ego modifier synchronization does not wipe unrelated item
  modifiers

If ring model work is included later, add separate tests for imported plus
values such as `+2 ring of strength` and `+4 ring of protection`.

## Open Decisions For Implementation Planning

The implementation plan should decide the smallest safe phase boundary:

- Phase 1 can align body armour ego, import, summary fallback, modal options,
  and spell calculation.
- Jewellery plus-bearing ring expansion can remain a separate follow-up unless
  the body armour changes touch shared option infrastructure enough to include
  it cheaply.

The recommended first phase is body armour only. It fixes the misleading
`robe of willpower` case directly while keeping ring behavior parser-trusting
and low-risk.
