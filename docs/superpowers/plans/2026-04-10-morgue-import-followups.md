# Morgue Import Follow-Ups

## Purpose

This note captures parser-backed import opportunities that are intentionally out
of scope for the first morgue import release.

Phase 1 only adds:

- browser paste import
- version confirmation
- best-effort overwrite of calculator fields the app already models
- `Applied` / `Skipped` feedback

The parser already exposes more Crawl-relevant state than the calculator can
store. This document records those gaps so later follow-up work can improve
parity without re-discovering the same scope decisions.

## Current Phase 1 Boundary

The current import flow maps:

- version
- species
- strength, dexterity, intelligence
- armour, shield, orb
- armour, shield, dodging, and spellcasting skills
- school skills supported by the current calculator state
- helmet, gloves, boots, cloak, barding, second gloves
- `wizardry`
- `wildMagic`
- `bodyArmourEgo` for the currently modeled ego subset
- one chosen `targetSpell`

The current import flow intentionally does not model:

- jewellery slots as first-class state
- gizmos
- talismans
- form state
- full mutation state
- item enchantment values
- artifact numeric stat modifiers
- Crawl-reported `ac`, `ev`, `sh`, or spell failure values as comparison data

## Parser Data The Calculator Still Leaves On The Table

The parser already exposes the following data that can matter for real Crawl
combat or spell-failure parity:

### 1. Crawl Output Values

The parser record includes:

- `ac`
- `ev`
- `sh`
- per-spell `failurePercent`

These are the actual values shown by Crawl in the morgue. The calculator does
not currently store or render them as imported reference values.

This is useful even before deeper state modeling because it would let the UI
show:

- imported Crawl value
- calculated app value
- difference

That creates an immediate parity/debugging surface for AC, EV, SH, and spell
failure regressions.

### 2. Item Enchant Values

The parser's equipment detail records include `enchant` for body armour, shield,
helmet, gloves, boots, cloak, rings, amulets, gizmos, and talismans when
applicable.

The calculator state currently only stores the item base type and a few
booleans. It does not model:

- `+2 helmet`
- `+5 kite shield`
- `+8 plate armour`

This is one of the biggest missing pieces for AC and SH parity.

### 3. Item Numeric Property Bags

The parser exposes structured item property bags with numeric values for keys
such as:

- `AC`
- `EV`
- `SH`
- `Str`
- `Int`
- `Dex`
- `Will`
- `Slay`

These may come from:

- intrinsic base-item properties
- ego properties
- randart properties
- unrand properties

The current calculator state has no place to store imported numeric modifiers
from equipment. That means real Crawl bonuses that alter AC, EV, SH, strength,
dexterity, or intelligence are lost during import.

### 4. Item Boolean Property Bags

The parser also exposes normalized boolean properties for keys such as:

- `Wiz`
- `Energy`
- `Command`
- `Death`
- `Resonance`
- `Archmagi`
- `Guile`
- `Light`
- `Mayhem`
- `-Cast`

Phase 1 uses only a narrow subset:

- `Wiz`
- `Energy` when represented by an existing orb option
- `Command`
- `Death`
- `Resonance`

Any other spell-affecting property remains unavailable to the calculator.

### 5. Jewellery, Gizmo, Talisman, And Form State

The parser already distinguishes:

- `amuletDetails`
- `ringDetails`
- `gizmoDetails`
- `talismanDetails`
- `form`

These matter because real Crawl calculations can be altered by:

- jewellery stat bonuses
- jewellery AC/EV/SH modifiers
- spellcasting-affecting jewellery and gizmo effects
- talisman/form-derived body changes

The first release intentionally skips these because the calculator state does
not have first-class slots for them.

### 6. Mutation And Trait Detail

The parser includes the full `A:` line as structured entries with:

- `name`
- `level`
- `suppressed`
- `transient`

Phase 1 only extracts `wildMagic` from that structure. Any other mutation,
innate trait, or suppressed/transient state remains unused, even when it may
affect parity with real Crawl values.

### 7. Equipment State Granularity

The parser distinguishes details the calculator currently compresses away, for
example:

- `hat` vs `helmet`
- `scarf` vs `cloak`
- `melded` equipment vs normal worn state
- installed gizmos

That means import can currently end up "close but not exact" even when the
parser understood the item correctly.

## Recommended Follow-Up Order

### Priority 1: Show Imported Crawl Values Next To Calculator Results

Add optional imported reference fields for:

- `importedAC`
- `importedEV`
- `importedSH`
- imported per-spell failure

Why first:

- highest user value for the least modeling work
- makes parity bugs visible immediately
- helps explain why imported characters do not perfectly match yet

### Priority 2: Add Item Enchant Support

Extend calculator state to store enchantment for:

- body armour
- shield
- auxiliary armour pieces

Why next:

- direct AC/SH parity gain
- parser already provides the values cleanly
- lower design risk than full jewellery support

### Priority 3: Add Imported Equipment Stat Modifiers

Model imported equipment-driven modifiers for:

- `strength`
- `dexterity`
- `intelligence`
- direct `AC`
- direct `EV`
- direct `SH`

This can be done either as:

- raw additive equipment modifiers stored separately from base stats
- or first-class equipment effect fields in calculator state

Why next:

- large parity win for AC, EV, SH, and spell failure
- parser already distinguishes intrinsic vs ego vs artifact sources

### Priority 4: Add First-Class Jewellery Modeling

Introduce state for:

- one or more amulet slots as required by supported versions
- ring slots

Minimum useful scope:

- item presence
- enchant when relevant
- normalized numeric/boolean spell and defense effects

Why later:

- very valuable
- but broader UI/state design than enchant-only follow-ups

### Priority 5: Add Talisman/Form/Mutation Expansion

Use parser data to model:

- talisman selection
- form state
- more mutations beyond `wildMagic`

Why later:

- likely strongest parity improvement after jewellery
- but requires the most calculator-model expansion and source validation

## Suggested Future Scope Cuts

To keep future follow-up tasks tractable, avoid bundling all parser features at
once. Recommended separate work items are:

1. imported Crawl reference values
2. armour and shield enchant support
3. equipment numeric modifier support
4. jewellery slot modeling
5. talisman/form/mutation modeling

Each of those can be planned, tested, and reviewed independently.

## Guardrails For Future Work

- Do not assume every parser-exposed field should immediately become a visible
  UI control.
- Prefer storing imported comparison values separately from editable calculator
  inputs when the goal is parity diagnostics rather than manual simulation.
- Keep parser-to-state translation in `src/morgueImport/importMorgue.ts` or a
  dedicated adjacent mapper layer rather than leaking parser details into UI
  components.
- For any parity-sensitive expansion, anchor the work with real morgue-based
  regression tests before changing formulas.
