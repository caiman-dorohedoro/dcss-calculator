# Spell Controls Sidebar Design

## Summary

Rebalance the desktop calculator layout so the left `Spell Failure Rate`
panel keeps only spell selection, while spell-related inputs move into the
right sidebar alongside the rest of the calculator controls.

This is a follow-up to the desktop layout split. It is intentionally narrow:
rearrange existing controls, adjust section grouping, and tweak the desktop
column balance just enough to keep `Str / Dex / Int` on one row. Do not change
calculator state semantics, spell-failure formulas, or the current mobile flow.

## Problem Statement

After the desktop split, the general calculator inputs live in the right
sidebar, but spell-specific inputs still remain inside `SpellModeHeader` above
the left-side `Spell Failure Rate` chart. That leaves the desktop form divided
across two columns in a way that is harder to scan and edit:

- the right sidebar owns core stats, armour, and equipment
- the left graph column still owns spellcasting controls and spell-school skill
  inputs
- the sidebar width is close to correct, but `Str / Dex / Int` can still wrap
  awkwardly instead of reading as one compact stat row

The design problem is therefore not adding new spell features. It is making the
desktop layout more coherent by consolidating nearly all editable inputs into
the right sidebar, while leaving the spell picker near the spell-failure graph
that it directly drives.

## Goals

- Keep only spell selection on the left-side spell-failure panel.
- Move `Spellcasting`, spell-school skill inputs, `wizardry`, `wildMagic`, and
  `bodyArmourEgo` into the right sidebar.
- Reorganize the right sidebar into clear sections: `Base Stats`, `Skill`, and
  `Equipment`.
- Keep `Armour`, `Shield`, `Dodging`, and `Spellcasting` always visible in the
  `Skill` section.
- Keep spell-school skill inputs conditional on the selected spell, as they are
  today.
- Make `Str / Dex / Int` fit on one row on desktop by slightly widening the
  sidebar and slightly narrowing the graph column.
- Simplify labels such as `Armour Skill` to `Armour`, `Shield Skill` to
  `Shield`, and `Dodging Skill` to `Dodging`.
- Preserve the current mobile flow.

## Non-Goals

- Do not change how spell-school inputs are conditionally revealed.
- Do not redesign the charts or change chart behavior.
- Do not change calculator state keys or the spell-failure formula inputs
  themselves.
- Do not move spell selection into the right sidebar.
- Do not change version selection, import, or reset behavior in the top bar.
- Do not redesign the sidebar into a fundamentally new visual system.

## User-Confirmed Scope Decisions

- The left-side spell-failure area should keep only spell selection.
- `Spellcasting`, spell-school skill inputs, `wizardry`, `wildMagic`, and
  `bodyArmourEgo` should move to the right sidebar.
- `Str / Dex / Int` should stay on one row on desktop.
- The right sidebar should be split into sections, with a `Skill` section and
  an `Equipment` section.
- The `Skill` section should always show `Armour`, `Shield`, `Dodging`, and
  `Spellcasting`.
- Spell-school inputs should remain conditional on the selected spell for now.
- Labels no longer need the `Skill` suffix because they now live inside a
  dedicated `Skill` section.

## Current Repo State

The current desktop branch already has a two-column desktop layout:

- `Calculator.tsx` owns the right sidebar and the graph column layout.
- `SFChart.tsx` still renders `SpellModeHeader` above the spell-failure chart.
- `SpellModeHeader.tsx` currently owns:
  - spell selection
  - spellcasting
  - selected spell-school skill inputs
  - `wizardry`
  - `wildMagic`
  - `bodyArmourEgo`

At the same time, `Calculator.tsx` already owns the rest of the right sidebar:

- species
- `Str / Dex / Int`
- `Armour / Shield / Dodging`
- armour, shield, orb selectors
- equipment toggles

That split is workable functionally, but inconsistent structurally. Spell input
state is already part of the shared `CalculatorState`, so there is no technical
need for those controls to remain in `SpellModeHeader`.

## Approaches Considered

### 1. Move Nearly All Spell Inputs Into The Sidebar

Keep spell selection in `SpellModeHeader`, but move the rest of the spell input
controls into the right sidebar and regroup the sidebar into `Base Stats`,
`Skill`, and `Equipment`.

Pros:

- matches the approved desktop mental model: graphs left, controls right
- minimizes logic churn because state keys remain unchanged
- keeps the spell picker adjacent to the spell-failure graph

Cons:

- requires carefully splitting `SpellModeHeader` responsibilities
- adds a little more conditional rendering to the sidebar

### 2. Keep Spell Inputs On The Left But Restyle Them

Leave `SpellModeHeader` mostly as-is and only improve spacing/labels.

Pros:

- smallest code change

Cons:

- does not solve the core inconsistency of controls being split across both
  columns
- keeps desktop editing flow fragmented

### 3. Move All Spell Controls, Including Spell Selection, Into The Sidebar

Relocate the full spell setup into the right sidebar and leave the chart area
purely visual.

Pros:

- strongest separation between controls and graphs

Cons:

- breaks the user-approved requirement that spell selection remain on the left
- makes the spell-failure graph feel less directly connected to its selected
  spell

## Chosen Design

Use approach 1: keep spell selection on the left, move the rest of the spell
controls into the right sidebar, and reorganize the sidebar into stable
sections.

## Proposed Design

### 1. Reduce `SpellModeHeader` To Spell Selection Only

`SpellModeHeader` should stop rendering:

- `Spellcasting`
- selected spell-school skill inputs
- `wizardry`
- `wildMagic`
- `bodyArmourEgo`

It should keep only the spell picker, including the current revenant
`Enkindle` marker behavior.

This keeps the left spell-failure area focused on choosing which spell the
chart is analyzing.

### 2. Reorganize The Right Sidebar Into Named Sections

The right sidebar in `Calculator.tsx` should be grouped into three sections:

- `Base Stats`
- `Skill`
- `Equipment`

These are display sections only. They do not introduce new state boundaries.

### 3. Base Stats Section

`Base Stats` should contain:

- `Species`
- `Str`
- `Dex`
- `Int`

On desktop, `Str / Dex / Int` should fit on one row. The sidebar width should
increase slightly to make that reliable, while the left graph column should
shrink slightly to compensate.

On mobile, the existing stacked flow should remain unchanged.

### 4. Skill Section

The `Skill` section should always include:

- `Armour`
- `Shield`
- `Dodging`
- `Spellcasting`

The labels should be shortened from:

- `Armour Skill` → `Armour`
- `Shield Skill` → `Shield`
- `Dodging Skill` → `Dodging`
- `Spellcasting Skill` → `Spellcasting`

When a spell is selected, the selected spell's school inputs should appear in
this same section underneath or after the always-visible skills. The current
conditional behavior should remain intact: no selected spell means no
spell-school inputs.

### 5. Equipment Section

The `Equipment` section should contain the existing gear-related controls:

- `Armour`
- `Shield`
- `Orb`
- equipment toggles (`Helmet`, `Cloak`, `Gloves`, `Boots`, `Barding`,
  `2nd Gloves` when supported)
- `wizardry`
- `wildMagic`
- `body armour ego`

This keeps all equipment-like and gear-modifier inputs together instead of
leaving some of them embedded in the spell chart header.

### 6. Adjust Desktop Column Balance Slightly

The current desktop split is close, but the right column needs a little more
room and the left chart column can give a little back.

This should be a small ratio adjustment only. The goal is to support:

- one-line `Str / Dex / Int`
- clearer sidebar grouping
- no dramatic visual change to the existing desktop split

## Component Boundaries

### `SpellModeHeader.tsx`

Responsibilities after the change:

- render spell selection only
- keep spell selection wiring to `targetSpell`
- keep current selected-spell option rendering and revenant marker behavior

### `Calculator.tsx`

Responsibilities after the change:

- own all right-sidebar grouping and section layout
- render spell-related inputs that move out of `SpellModeHeader`
- derive conditional spell-school inputs from the selected spell
- preserve all existing state update paths

No new state container is needed. This is a render-responsibility change only.

## Verification Criteria

The change is successful when all of the following are true:

- the left spell-failure header shows spell selection only
- the right sidebar shows `Base Stats`, `Skill`, and `Equipment` sections
- `Skill` always includes `Armour`, `Shield`, `Dodging`, and `Spellcasting`
- spell-school inputs only appear when the selected spell has schools to edit
- `wizardry`, `wildMagic`, and `body armour ego` appear in `Equipment`
- `Str / Dex / Int` stay on one row on desktop
- mobile keeps the current single-flow layout
- spell selection, chart updates, accordion behavior, DnD ordering, import, and
  reset behavior all still work

## Risks And Mitigations

### Risk: Split Responsibility Between `SpellModeHeader` And `Calculator`

Moving spell-related inputs out of `SpellModeHeader` can create confusion about
which component owns spell setup.

Mitigation:

- make `SpellModeHeader` spell-picker only
- make `Calculator` own all sidebar spell inputs
- avoid splitting one logical input group across multiple components after this
  change

### Risk: Sidebar Width Change Disturbs Desktop Balance

Widening the sidebar too much could make the graph column feel cramped.

Mitigation:

- make only a small ratio adjustment
- optimize for the stats row fitting cleanly rather than a broad visual
  redesign

### Risk: Conditional Spell-School Rendering Becomes Less Obvious

When spell-school inputs move into the sidebar, it may be less obvious why they
appear and disappear.

Mitigation:

- keep them inside the `Skill` section directly near `Spellcasting`
- keep their current conditional behavior unchanged for now rather than
  redesigning reveal logic at the same time

### Risk: Mobile Layout Regressions

Desktop-focused sidebar changes can accidentally affect small screens.

Mitigation:

- preserve the current mobile structure
- keep this as a grouping and width change, not a mobile information
  architecture rewrite

## Testing Strategy

- Extend the desktop layout regression tests to assert the new sidebar sections
  and relocated spell controls.
- Add or update focused component tests so they verify:
  - `SpellModeHeader` no longer renders spellcasting-related inputs
  - `Calculator` renders the right sidebar sections and conditional spell-school
    inputs
- Keep calculator logic tests unchanged unless a rendering move reveals an
  integration issue.
- Verify through targeted component tests plus local build; do not rely on
  browser automation.

## Implementation Notes

- Prefer moving existing input markup and state wiring over introducing new
  abstractions.
- Reuse the current spell-selection and spell-school derivation logic rather
  than inventing parallel helpers unless duplication becomes unavoidable.
- Keep changes focused on `SpellModeHeader.tsx`, `Calculator.tsx`, and the
  relevant component tests.
