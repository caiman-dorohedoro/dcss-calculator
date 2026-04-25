# Equipment Ego Availability Design

## Summary

Extend parser-aligned equipment ego editing from body armour to the rest of the
armour-class equipment slots.

The app should use the Crawl base-item ego availability table to decide which
ego choices appear for each equipped item. A `robe` should not offer
`resonance`, a `scarf` should offer scarf egos rather than cloak egos, and an
`orb` should offer orb egos such as `energy`, `guile`, or `attunement`.

## Relationship To Existing Specs

This design builds on:

- `2026-04-15-itemized-equipment-modifiers-design.md`
- `2026-04-23-equipment-summary-modal-design.md`
- `2026-04-23-equipment-status-list-refinement.md`
- `2026-04-23-equipment-offhand-density.md`
- `2026-04-25-parser-aligned-equipment-ego-design.md`

Those specs already made item-level equipment state and in-game-style summary
rows the UI source of truth. This design fills the remaining gap: ego choices
should be valid for the selected base item, not a global undifferentiated list.

## Parser Contract

`dcss-morgue-parser@0.6.2` already exposes the semantic distinction this design
needs:

- Normal armour-class items use `ego`.
- Armour-class slots include body armour, shields, headgear, gloves, footwear,
  cloaks or scarves, and orbs.
- The parser also emits `egoProperties`, so downstream tools can tell which
  properties came from the ego.
- Randarts and unrands do not use `ego`; their visible effects belong to
  `artifactProperties` and often `propertiesText`.
- Jewellery does not use `ego`; normal jewellery uses `subtypeEffect`.

Examples:

- `+2 robe of willpower` -> `baseType = "robe"`, `ego = "willpower"`,
  `egoProperties = Will+`.
- `+2 buckler of reflection` -> `baseType = "buckler"`,
  `ego = "reflection"`.
- `orb of energy` -> `baseType = "orb"`, `ego = "energy"`.
- `scarf of resistance` -> `baseType = "scarf"`, `ego = "resistance"`.
- `ring of willpower` -> `ego = null`, `subtypeEffect = "willpower"`.
- `hat of Pondering` -> `artifactKind = "unrand"`, `ego = null`.

The app should follow that model. Armour-like equipment gets ego selectors;
jewellery remains subtype/modifier based.

## Problem Statement

After the parser-aligned body armour change, only body armour can represent
Crawl ego identity directly in app state. Other slots still expose only base
type, enchant, and raw modifiers.

That leaves several mismatches:

- Imported `scarf of resistance`, `orb of energy`, or `buckler of reflection`
  can carry parser `ego`, but the app has no state field to preserve it.
- Manual editing can only recreate the same item by typing modifier tokens
  directly, even when Crawl has a named ego for those tokens.
- The body armour ego selector is global by version, so a `robe` can currently
  see egos that only belong on heavier armour.
- Cloak and scarf are currently collapsed in app state even though Crawl gives
  them different legal ego sets.

## Goals

- Add parser-aligned ego state to all armour-class equipment slots modeled by
  the app.
- Filter ego selector choices by the selected base item.
- Use the supplied ego weights for selector ordering, not calculation.
- Preserve parser-provided unknown ego strings instead of dropping them.
- Keep imported `displayName` and `propertiesText` as the source of summary row
  text.
- Keep jewellery separate: rings and amulets should not become armour ego
  selectors.
- Keep spell-failure behavior unchanged by deriving spell boosts only from
  body armour egos that affect spell success.

## Non-Goals

- Do not implement random item generation from weights.
- Do not display ego weights in the UI.
- Do not infer randart or unrand ego identity where the parser reports
  `ego = null`.
- Do not convert jewellery `subtypeEffect` into `ego`.
- Do not add resistance, willpower, stealth, regeneration, or status panels to
  calculator math beyond the existing modifier aggregation.
- Do not rewrite the full equipment model beyond the fields needed for
  parser-aligned ego editing.

## Recommended Approach

Create a shared equipment ego availability layer used by import, summary text,
and equipment modals.

This is better than adding ad hoc selector lists to each modal because the same
source table answers three questions:

- Which egos can this base item choose?
- Which fixed modifier bag does this selected ego imply?
- How should fallback summary text name the item?

The data layer should keep `normal` from the Crawl table as app `none`.
`normal` is a generation weight bucket, not a player-facing ego name.

## Data Model

Introduce a shared `EquipmentEgoKey` type backed by the parser/Crawl ego names:

- `none`
- normal armour egos such as `willpower`, `resistance`, `reflection`,
  `flying`, `stealth`, `energy`, `attunement`, and the current body armour
  spell egos
- unknown parser-provided strings for forward compatibility

Add an optional or defaulted `ego` field to app-modeled armour-class state:

- `BodyArmourItemState`
- `ShieldItemState`
- `OrbItemState`
- `FixedAuxItemState`
- `AuxArmourSlotState`

Default manually created items should use `ego = "none"`.

Existing saved states without `ego` should load as `none`. Existing imported
metadata should remain authoritative for display text.

## Base Item Coverage

The availability table should use Crawl-facing base names as keys because the
parser emits those strings as `baseType`.

The app should map its state kinds to those base names:

- body armour: use `armourOptions[kind].name`
- shield: use `shieldOptions[kind].name`
- orb: use `"orb"`
- gloves: use `"gloves"`
- headgear: use `helmet`, `hat`, and future `cap` as distinct bases where the
  app can represent them
- footwear: use `boots` or `barding`
- cloak slot: split `cloak` and `scarf` so scarf-specific egos can be edited

Base types present in the supplied table but not yet represented in app state
may remain data-only until the state can represent them. The implementation
should not invent an inaccurate selector by mapping them to a different base.

## Ego Availability And Ordering

Each base item gets a list of legal egos with weights. The selector should show:

1. `None`
2. the current unknown or unavailable ego, if one is already present
3. legal known egos for the selected base item

Legal known egos should be ordered by descending weight. For equal weights, keep
the order from the source table. This makes common egos easier to find without
pretending the app is generating random loot.

Empty availability lists mean the base has no normal ego choices. In that case,
the modal should hide the ego selector unless the current item already has a
non-`none` ego that needs preservation.

## Ego Modifier Synchronization

Selecting a known ego should synchronize only ego-owned fixed modifiers:

- remove the exact modifiers owned by the previous known ego
- apply the fixed modifiers owned by the next known ego
- preserve unrelated manual, parser, artefact, or inscription-derived
  modifiers

This matches the existing body armour rule and extends it to other
armour-class slots. Imported parser values remain authoritative when present;
the app should not recompute and overwrite imported property bags on import.

## Import Mapping

For each parser equipment detail object:

- If `objectClass = "armour"` and `artifactKind = "normal"`, copy
  `detail.ego ?? "none"` into the corresponding app item state.
- Preserve `displayName`, `propertiesText`, `artifactKind`, `source`, and
  modifier bags exactly as today.
- If `artifactKind` is `randart` or `unrand`, set app ego to `none` unless an
  older saved state already carries an explicit ego string.
- Do not synthesize brace text for imported normal ego items.

For example, imported `orb of energy` should retain `displayName =
"orb of energy"` and `ego = "energy"`, but it should still display as
`orb of energy`, not `orb of energy {Energy}`.

## Summary Text

Imported item text keeps the current priority:

1. `displayName`
2. `propertiesText`
3. fallback state formatting

Fallback manual text should include the selected ego in Crawl style:

- `+2 robe of willpower`
- `+2 buckler of reflection`
- `scarf of resistance`
- `orb of energy`
- `+1 pair of boots of flying`

The formatter should not append `of none`.

## UI Behavior

Each equipment modal for an armour-class item should show an ego selector when
that item is equipped and the selected base supports egos.

Changing the base item should recompute the available ego list. If the current
ego is no longer legal for the new base:

- preserve it if the item came from import or has an unknown value
- otherwise reset it to `none`

This protects imported edge cases while keeping manual editing sane.

Jewellery modals stay separate. A `ring of willpower` is still a jewellery
`subtypeEffect` concept, not an armour ego.

## Testing

Add focused tests before implementation:

- availability helper returns only legal egos for representative bases:
  `robe`, `scale mail`, `scarf`, `gloves`, `orb`, and `tower shield`
- `normal` table entries become app `none` and are not shown as `normal`
- unknown current ego is preserved in option lists
- manual fallback summaries include selected ego names for shield, orb, scarf,
  gloves, headgear, and footwear
- imported normal ego items preserve parser `ego` but do not synthesize brace
  text
- jewellery import still uses `subtypeEffect` and does not set `ego`
- persistence loads older states without per-slot ego fields as `none`

Run the existing focused equipment import, summary, layout, persistence, and
spell tests after each slice. The full suite may still show the previously
observed spell-parity baseline failures; any new failures in touched equipment
areas must be fixed before merging this feature.
