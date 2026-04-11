# Desktop Layout Design

## Summary

Reframe the calculator layout for desktop so the graph panels live in a left
content column while the calculator controls move into a right sticky sidebar.
Keep the current mobile layout unchanged.

This design is intentionally narrow. It changes page structure and responsive
layout only. It does not change calculator logic, state semantics, graph
behavior, or the existing top bar interactions.

## Problem Statement

The current calculator UI stacks the top-level controls and graph panels inside
one narrow card. That works on mobile and smaller screens, but on desktop it
forces a long single-column flow even when there is enough horizontal space to
show the graphs and controls side by side.

The desktop experience would benefit from a layout that lets users:

- scan graphs continuously in one column
- adjust controls without losing sight of the graph area
- keep existing interactions, such as graph accordion ordering and version
  controls, without relearning the app

The design challenge is therefore not adding new features. It is introducing a
desktop-only two-column structure with minimal code and minimal behavior risk.

## Goals

- Move the graph panels into the left side of the desktop layout.
- Move calculator input controls into a right sidebar on desktop.
- Keep the right sidebar sticky while the graph column scrolls.
- Keep the existing top bar in place.
- Keep the current mobile layout and interaction flow.
- Preserve the existing accordion and drag-to-reorder behavior for graph
  panels.
- Avoid changing calculator state logic or version-specific option logic.

## Non-Goals

- Do not redesign the calculator visually beyond layout structure.
- Do not change graph contents, graph ordering behavior, or graph state.
- Do not move version select, morgue import, or reset out of the top bar.
- Do not introduce a separate desktop-only calculator state model.
- Do not refactor adjacent state or import logic unrelated to layout.
- Do not change the current mobile information architecture.

## User-Confirmed Scope Decisions

- On desktop, graphs should appear on the left and controls on the right.
- On mobile, the current layout should remain as-is.
- The top bar should remain in place rather than moving into the sidebar.
- The graph area should keep the current accordion and drag-and-drop ordering.
- The implementation should follow the minimal-change approach rather than a
  broader page redesign.

## Current Repo State

`App.tsx` owns the page frame, top bar, width constraint, and calculator mount
point. Today it limits the main content to `max-w-2xl`, which is too narrow for
an effective desktop two-column layout.

`Calculator.tsx` currently renders:

- a `CardHeader` containing all calculator input controls
- a `CardContent` containing the graph accordion and GitHub link

That means the controls and graphs are structurally coupled into one vertical
stack. The graph panels themselves are already encapsulated and ordered through
the existing accordion plus drag-and-drop state.

This is a good base for a surgical layout change because:

- the graph content can stay grouped together
- the controls already share one render boundary
- `setState`-based updates can remain untouched

## Approaches Considered

### 1. Minimal Change Inside Existing Components

Keep the top bar in `App.tsx`, widen the desktop container, and restructure
`Calculator.tsx` into a responsive one-column / two-column layout.

Pros:

- smallest code change
- lowest regression risk
- preserves existing component responsibilities

Cons:

- the controls remain a collection of existing form groups rather than a deeper
  desktop-specific redesign

### 2. Re-section The Control Area

In addition to the desktop split, rebuild the right column as multiple new
control cards or modules.

Pros:

- cleaner desktop grouping
- more room for future polish

Cons:

- larger implementation surface
- more markup churn than the request requires

### 3. Reframe The Whole Page Shell

Introduce a broader desktop page layout at the `App.tsx` level and redesign the
overall shell around it.

Pros:

- most freedom for a polished desktop experience

Cons:

- too broad for the current request
- more likely to disturb the mobile layout and top bar behavior

## Chosen Design

Use approach 1: keep the page shell mostly intact, widen desktop space in
`App.tsx`, and restructure `Calculator.tsx` into a desktop-only two-column
layout.

## Proposed Design

### 1. Keep The Existing Top Bar

The top bar should remain where it is today and continue to own:

- version selection
- morgue import trigger
- reset action

This preserves the app's current entry points and avoids hiding global actions
inside the calculator sidebar.

### 2. Widen The Desktop Frame In `App.tsx`

The current `max-w-2xl` width cap is the main reason the UI stays visually
single-column on desktop. `App.tsx` should widen the main container for larger
screens while keeping the current mobile spacing.

Expected behavior:

- mobile and small tablet widths continue to render as today
- larger screens gain enough width for a readable left graph column and right
  control sidebar

This should remain a responsive width adjustment, not a page-shell rewrite.

### 3. Split `Calculator.tsx` Into Responsive Columns

`Calculator.tsx` should become the main layout boundary for the desktop split.

On mobile:

- keep the current stacked flow
- controls render first
- graphs render below

On desktop:

- left column: graph accordion and footer link
- right column: control groups in one sticky sidebar card

This keeps the existing UI elements but changes how they are arranged.

### 4. Make The Right Sidebar Sticky On Desktop

The desktop control area should remain visible while the user scrolls through
the graph column. The sticky behavior should begin below the top bar and should
not overlap it.

The sticky sidebar should contain the existing control groups:

- species
- Str / Dex / Int
- Armour / Shield / Dodging skill inputs
- armour, shield, and orb selectors
- equipment toggles

The sidebar should reuse existing inputs and labels rather than inventing new
behavior.

### 5. Preserve Graph Interaction Behavior Exactly

The graph column should keep:

- the current accordion open-state handling
- the current drag-and-drop ordering
- the current chart rendering

The design only changes layout placement. It should not change graph state or
interaction semantics.

### 6. Keep Mobile Behavior Stable

The responsive split should activate only at a desktop breakpoint. Below that
breakpoint, the current layout should remain intact.

The safest interpretation is:

- desktop breakpoint: `lg` and above
- below `lg`: keep the current stacked layout

This avoids accidental churn for phones and smaller tablets.

## Component Boundaries

### `App.tsx`

Responsibilities after the change:

- preserve top bar behavior and structure
- provide enough horizontal room for the desktop layout
- continue mounting one calculator view

### `Calculator.tsx`

Responsibilities after the change:

- define the responsive layout split
- render the desktop sidebar and graph column
- preserve existing state wiring and graph order handling

No new state boundary is needed for this change.

## Verification Criteria

The change is successful when all of the following are true:

- on desktop-sized viewports, the page shows a top bar plus a two-column body
- the left column contains the graph accordion
- the right column contains the calculator controls in a sticky sidebar
- the top bar remains above the body layout
- on mobile-sized viewports, the current stacked layout remains intact
- graph accordion open/close behavior still works
- drag-and-drop graph reordering still works
- version switching, reset, and morgue import still work as before

## Risks And Mitigations

### Risk: Desktop Width Still Feels Cramped

If `App.tsx` is not widened enough, the desktop split will technically exist but
still feel crowded.

Mitigation:

- adjust desktop max width in `App.tsx`
- keep the graph column dominant and the sidebar narrower

### Risk: Sticky Sidebar Overlaps The Top Bar

If the sticky offset is wrong, the sidebar could slide under or into the top
bar.

Mitigation:

- keep sticky behavior scoped to the calculator body area
- use a desktop offset that leaves the top bar visually clear

### Risk: Mobile Layout Regressions

A careless responsive rewrite could accidentally alter control ordering or
spacing on small screens.

Mitigation:

- make the new split desktop-only
- preserve the current stacked markup flow for smaller breakpoints

### Risk: Unnecessary State Churn

If state logic is touched while moving layout markup, regressions become harder
to isolate.

Mitigation:

- keep the change structural
- reuse the current state update paths unchanged

## Testing Strategy

- Run existing automated tests to catch unrelated behavior regressions.
- Add or update layout-oriented component tests only if needed to cover the new
  responsive structure.
- Verify through local build and code inspection rather than browser automation.

## Implementation Notes

- Prefer moving existing markup over introducing new abstractions.
- Keep changes focused on `App.tsx` and `Calculator.tsx` unless tests require a
  narrow additional edit.
- Leave the graph components, state hooks, and morgue import logic untouched
  unless the layout change reveals a direct rendering issue.
