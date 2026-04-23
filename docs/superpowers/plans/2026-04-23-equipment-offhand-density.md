# Equipment Offhand Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the equipment summary list denser and replace separate shield/orb rows with one `Offhand:` row.

**Architecture:** Keep shield and orb state, formatters, and modal configs separate. Add a small selection layer in `Calculator` that chooses which offhand item to display and which modal to open, then tighten row/list spacing through existing Tailwind classes.

**Tech Stack:** TypeScript, React 18, Tailwind CSS, Jest with `jest-environment-jsdom`

---

## File Map

### Modify

- `docs/meta--catalog.md`
- `docs/superpowers/specs/2026-04-23-equipment-summary-modal-design.md`
- `src/components/Calculator.tsx`
- `src/components/DynamicEquipmentControls.tsx`
- `src/components/equipment/EquipmentSummaryRow.tsx`
- `src/components/__tests__/CalculatorLayout.test.tsx`
- `src/components/__tests__/DynamicEquipmentControls.test.tsx`

## Task 1: Render One Offhand Row

**Files:**
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`

- [ ] **Step 1: Update Calculator tests for one `Offhand:` row**

In `src/components/__tests__/CalculatorLayout.test.tsx`, update the equipment order expectation so the first rows are:

```tsx
    expect(rowIds.slice(0, 10)).toEqual([
      "equipment-row-offhand",
      "equipment-row-body-armour",
      "equipment-row-headgear-0",
      "equipment-row-cloak",
      "equipment-row-glove-0",
      "equipment-row-boots",
      "equipment-row-barding",
      "equipment-row-amulet-0",
      "equipment-row-ring-0",
      "equipment-row-ring-1",
    ]);
```

Add this test after the equipment order test:

```tsx
  test("uses one offhand row for mutually exclusive shield and orb equipment", async () => {
    const shieldState = buildDefaultCalculatorState("trunk");
    shieldState.shield = "kite_shield";
    shieldState.shieldItem = {
      ...shieldState.shieldItem,
      kind: "kite_shield",
      enchant: 2,
    };
    shieldState.orb = "none";

    await act(async () => {
      root.render(<Calculator state={shieldState} setState={mockSetState} />);
    });

    let equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    let offhandRow = equipmentSection.querySelector(
      '[data-testid="equipment-row-offhand"]'
    ) as HTMLButtonElement;

    expect(offhandRow.textContent).toContain("Offhand:");
    expect(offhandRow.textContent).toContain("+2 kite shield");
    expect(equipmentSection.textContent).not.toContain("Shield:");
    expect(equipmentSection.textContent).not.toContain("Orb:");

    const orbState = buildDefaultCalculatorState("trunk");
    orbState.shield = "none";
    orbState.orb = "energy";
    orbState.orbItem = {
      ...orbState.orbItem,
      kind: "energy",
      modifiers: { wizardry: 1 },
    };

    await act(async () => {
      root.render(<Calculator state={orbState} setState={mockSetState} />);
    });

    equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    offhandRow = equipmentSection.querySelector(
      '[data-testid="equipment-row-offhand"]'
    ) as HTMLButtonElement;

    expect(offhandRow.textContent).toContain("Offhand:");
    expect(offhandRow.textContent).toContain("orb of energy {Wiz+1}");
    expect(equipmentSection.textContent).not.toContain("Shield:");
    expect(equipmentSection.textContent).not.toContain("Orb:");
  });
```

- [ ] **Step 2: Run the Calculator layout test to verify it fails**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`

Expected: FAIL because `equipment-row-offhand` is not rendered yet.

- [ ] **Step 3: Implement one offhand row in Calculator**

In `src/components/Calculator.tsx`, derive these values near `primaryOrbItem`:

```tsx
  const offhandSummary =
    primaryShieldItem.kind !== "none"
      ? formatShieldSummary(primaryShieldItem)
      : formatOrbSummary(primaryOrbItem);
  const openOffhandModal = () =>
    setOpenPrimaryEquipment(
      primaryShieldItem.kind !== "none"
        ? "shield"
        : primaryOrbItem.kind !== "none"
        ? "orb"
        : "shield"
    );
```

Then replace the separate shield and orb summary rows with:

```tsx
          <EquipmentSummaryRow
            testId="equipment-row-offhand"
            label="Offhand"
            summary={offhandSummary}
            onOpen={openOffhandModal}
          />
```

- [ ] **Step 4: Run the Calculator layout test to verify it passes**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`

Expected: PASS.

## Task 2: Tighten Equipment Row Spacing

**Files:**
- Modify: `src/components/equipment/EquipmentSummaryRow.tsx`
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/DynamicEquipmentControls.tsx`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Modify: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`

- [ ] **Step 1: Add tests for compact equipment spacing**

In `src/components/__tests__/CalculatorLayout.test.tsx`, add this assertion to `"places body armour in a single summary row"`:

```tsx
    expect(bodyArmourRow.className).toContain("py-0.5");
```

In `src/components/__tests__/DynamicEquipmentControls.test.tsx`, add this assertion to `"renders dynamic equipment as one status-like list without nested equipment headings"`:

```tsx
    expect(dynamicEquipmentList.className).toContain("gap-1");
```

- [ ] **Step 2: Run spacing tests to verify they fail**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: FAIL because rows still use `py-1` and lists still use `gap-3`.

- [ ] **Step 3: Reduce row and list spacing**

In `src/components/equipment/EquipmentSummaryRow.tsx`, replace `px-2 py-1` with `px-1.5 py-0.5`.

In `src/components/Calculator.tsx`, change the primary equipment row container from `gap-3` to `gap-1`.

In `src/components/DynamicEquipmentControls.tsx`, change `dynamic-equipment-list` from `gap-3` to `gap-1`.

- [ ] **Step 4: Run focused UI tests**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: PASS.

## Task 3: Final Verification

**Files:**
- Verify only.

- [ ] **Step 1: Run focused equipment tests**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/SFChart.test.tsx src/utils/__tests__/equipmentSummaryText.test.ts`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS with the existing `src/components/ui/button.tsx` Fast Refresh warning only.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS with the existing Vite chunk-size warning only.
