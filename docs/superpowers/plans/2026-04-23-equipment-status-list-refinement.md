# Equipment Status List Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the already-added equipment summary rows so the equipment section reads more like Crawl's in-game status equipment list.

**Architecture:** Keep the existing row-and-modal editing architecture. Update the pure summary formatter to show `+0` for equipped enchantable gear, then flatten `DynamicEquipmentControls` into one list ordered after the primary offhand/body rows from `Calculator`.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind CSS, Jest with `jest-environment-jsdom`

---

## File Map

### Modify

- `docs/meta--catalog.md`
- `src/utils/equipmentSummaryText.ts`
- `src/utils/__tests__/equipmentSummaryText.test.ts`
- `src/components/DynamicEquipmentControls.tsx`
- `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- `src/components/Calculator.tsx`
- `src/components/__tests__/CalculatorLayout.test.tsx`
- `src/components/__tests__/SFChart.test.tsx`

### Existing Files To Reference

- `docs/superpowers/specs/2026-04-23-equipment-summary-modal-design.md`
- `docs/superpowers/plans/2026-04-23-equipment-summary-modal.md`
- `src/components/equipment/EquipmentSummaryRow.tsx`
- `src/components/equipment/EquipmentEditModal.tsx`

### Scope Notes

- Keep `Label: item text` row shape. Do not switch to `label - item text`.
- Do not add fake Crawl inventory letters such as `a -` or `m -`.
- Do not add weapon or staff rows; the calculator state does not model a weapon slot.
- Do not change modal fields, import mapping, formula inputs, or aggregation helpers.
- Keep mutation controls separate and inline.

## Task 1: Show `+0` For Equipped Enchantable Gear

**Files:**
- Modify: `src/utils/equipmentSummaryText.ts`
- Modify: `src/utils/__tests__/equipmentSummaryText.test.ts`
- Test: `src/utils/__tests__/equipmentSummaryText.test.ts`

- [ ] **Step 1: Update the formatter tests for explicit zero enchantments**

In `src/utils/__tests__/equipmentSummaryText.test.ts`, replace the existing `"builds in-game-style fallback summaries"` test with this version:

```ts
  test("builds in-game-style fallback summaries", () => {
    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 4,
        ego: "resonance",
        modifiers: { int: 3 },
      })
    ).toBe("+4 leather armour (Resonance) {Int+3}");

    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 0,
        ego: "none",
      })
    ).toBe("+0 leather armour");

    expect(formatShieldSummary({ kind: "kite_shield", enchant: 0 })).toBe(
      "+0 kite shield"
    );
    expect(formatOrbSummary({ kind: "energy", modifiers: { wizardry: 1 } })).toBe(
      "orb of energy {Wiz+1}"
    );
    expect(formatRingSummary({ kind: "protection", plus: 4 })).toBe(
      "ring of protection +4"
    );
    expect(formatAmuletSummary({ kind: "reflection" })).toBe(
      "amulet of reflection"
    );
    expect(formatHeadgearSummary({ present: true, kind: "helmet", enchant: 0 })).toBe(
      "+0 helmet"
    );
    expect(
      formatGlovesSummary({
        present: true,
        enchant: 0,
        modifiers: { str: 2 },
      })
    ).toBe("+0 pair of gloves {Str+2}");
    expect(
      formatFixedAuxSummary({
        kind: "boots",
        present: true,
        enchant: 0,
      })
    ).toBe("+0 pair of boots");
  });
```

- [ ] **Step 2: Run the formatter test to verify it fails**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts`

Expected: FAIL because zero enchantments are still omitted from equipped armour summaries.

- [ ] **Step 3: Update the enchant formatter**

In `src/utils/equipmentSummaryText.ts`, replace `signed` and `withEnchant` with:

```ts
const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

const withEnchant = (enchant: number, itemName: string) =>
  `${signed(enchant)} ${itemName}`;
```

Do not change the early `none` returns in the formatter functions. Those early returns prevent empty slots from showing `+0`.

- [ ] **Step 4: Run the formatter test to verify it passes**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the formatter refinement**

```bash
git add src/utils/equipmentSummaryText.ts src/utils/__tests__/equipmentSummaryText.test.ts
git commit -m "feat: show zero equipment enchantments"
```

## Task 2: Flatten Dynamic Equipment Into One Status-Like List

**Files:**
- Modify: `src/components/DynamicEquipmentControls.tsx`
- Modify: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Modify: `src/components/__tests__/SFChart.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Test: `src/components/__tests__/SFChart.test.tsx`

- [ ] **Step 1: Add failing tests for one continuous dynamic equipment list**

In `src/components/__tests__/DynamicEquipmentControls.test.tsx`, add this test after `"renders formicid glove slots from dynamic counts"`:

```tsx
  test("renders dynamic equipment as one status-like list without nested equipment headings", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "formicid";

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;
    const rowIds = Array.from(
      dynamicEquipmentList.querySelectorAll('[data-testid^="equipment-row-"]')
    ).map((row) => row.getAttribute("data-testid"));
    const headings = Array.from(container.querySelectorAll("h2")).map(
      (heading) => heading.textContent
    );

    expect(rowIds).toEqual([
      "equipment-row-headgear-0",
      "equipment-row-cloak",
      "equipment-row-glove-0",
      "equipment-row-glove-1",
      "equipment-row-boots",
      "equipment-row-barding",
      "equipment-row-amulet-0",
      "equipment-row-ring-0",
      "equipment-row-ring-1",
    ]);
    expect(headings).not.toEqual(
      expect.arrayContaining(["Rings", "Amulets", "Headgear", "Gloves", "Fixed Equipment"])
    );
    expect(headings).toContain("Mutations");
  });
```

- [ ] **Step 2: Update existing dynamic equipment tests to query the list instead of removed subsections**

In `src/components/__tests__/DynamicEquipmentControls.test.tsx`, update the octopode ring test body so it uses `dynamic-equipment-list`:

```tsx
    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;

    expect(dynamicEquipmentList.textContent).toContain("Ring 1");
    expect(dynamicEquipmentList.textContent).toContain("Ring 8");
    expect(
      dynamicEquipmentList.querySelectorAll('[data-testid^="equipment-row-ring-"]')
    ).toHaveLength(8);
```

In the formicid glove test, replace the subsection query with:

```tsx
    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;

    expect(dynamicEquipmentList.textContent).toContain("Glove 1");
    expect(dynamicEquipmentList.textContent).toContain("Glove 2");
    expect(
      dynamicEquipmentList.querySelectorAll('[data-testid^="equipment-row-glove-"]')
    ).toHaveLength(2);
```

In `"renders fixed equipment summary rows and removes old modifier labels"`, replace the `fixedEquipmentSection` query and assertions with `dynamicEquipmentList`:

```tsx
    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;

    expect(
      dynamicEquipmentList.querySelector('[data-testid="equipment-row-cloak"]')
        ?.textContent
    ).toContain("+2 cloak");
    expect(
      dynamicEquipmentList.querySelector('[data-testid="equipment-row-boots"]')
        ?.textContent
    ).toContain("-1 pair of boots");
    expect(
      dynamicEquipmentList.querySelector('[data-testid="equipment-row-barding"]')
        ?.textContent
    ).toContain("+5 barding");
    expect(dynamicEquipmentList.querySelector('input[type="number"]')).toBeNull();
    expect(dynamicEquipmentList.querySelector('input[type="checkbox"]')).toBeNull();
```

In `"renders imported ring text as a summary row and removes the old Modifiers section"`, replace the ring section query with:

```tsx
    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;
    expect(dynamicEquipmentList.querySelector('button[role="combobox"]')).toBeNull();
```

- [ ] **Step 3: Update the mobile SFChart test for the flattened dynamic list**

In `src/components/__tests__/SFChart.test.tsx`, replace the `mobileHeadgearSection` block with:

```tsx
    const mobileDynamicEquipmentList = mobileDynamicEquipmentControls.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;
    const mobileHeadgearRow = mobileDynamicEquipmentList.querySelector(
      '[data-testid="equipment-row-headgear-0"]'
    ) as HTMLButtonElement;
    expect(mobileHeadgearRow.textContent).toContain("Headgear:");
    expect(mobileHeadgearRow.textContent).not.toContain("present");
```

- [ ] **Step 4: Run dynamic equipment tests to verify they fail**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/SFChart.test.tsx`

Expected: FAIL because `dynamic-equipment-list` does not exist and nested equipment sections still render.

- [ ] **Step 5: Replace nested equipment sections with a flat list**

In `src/components/DynamicEquipmentControls.tsx`, replace `fixedAuxEquipmentConfigs` with keyed configs:

```ts
  const fixedAuxEquipmentConfigs: Record<
    FixedAuxEquipmentConfig["key"],
    FixedAuxEquipmentConfig
  > = {
    cloak: {
      key: "cloak",
      itemKey: "cloakItem",
      label: "Cloak",
      enchantKey: "cloakEnchant",
    },
    boots: {
      key: "boots",
      itemKey: "bootsItem",
      label: "Boots",
      enchantKey: "bootsEnchant",
    },
    barding: {
      key: "barding",
      itemKey: "bardingItem",
      label: "Barding",
      enchantKey: "bardingEnchant",
    },
  };
```

Add this helper before `renderOpenEquipmentModal`:

```tsx
  const renderFixedAuxRow = (config: FixedAuxEquipmentConfig) => (
    <EquipmentSummaryRow
      key={config.key}
      testId={`equipment-row-${config.key}`}
      label={config.label}
      summary={formatFixedAuxSummary(state[config.itemKey])}
      onOpen={() => setOpenEquipment({ type: "fixedAux", config })}
    />
  );
```

Replace the equipment sections at the top of the return value with one list:

```tsx
      <div data-testid="dynamic-equipment-list" className="flex flex-col gap-3">
        {headgearSlots.map((slot, index) => (
          <EquipmentSummaryRow
            key={`headgear-${index}`}
            testId={`equipment-row-headgear-${index}`}
            label={
              slotCounts.headgearSlots === 1
                ? "Headgear"
                : `Headgear ${index + 1}`
            }
            summary={formatHeadgearSummary(slot)}
            onOpen={() => setOpenEquipment({ type: "headgear", index })}
          />
        ))}
        {renderFixedAuxRow(fixedAuxEquipmentConfigs.cloak)}
        {gloveSlots.map((slot, index) => (
          <EquipmentSummaryRow
            key={`glove-${index}`}
            testId={`equipment-row-glove-${index}`}
            label={`Glove ${index + 1}`}
            summary={formatGlovesSummary(slot)}
            onOpen={() => setOpenEquipment({ type: "gloves", index })}
          />
        ))}
        {renderFixedAuxRow(fixedAuxEquipmentConfigs.boots)}
        {renderFixedAuxRow(fixedAuxEquipmentConfigs.barding)}
        {amuletSlots.map((slot, index) => (
          <EquipmentSummaryRow
            key={`amulet-${index}`}
            testId={`equipment-row-amulet-${index}`}
            label={`Amulet ${index + 1}`}
            summary={formatAmuletSummary(slot)}
            onOpen={() => setOpenEquipment({ type: "amulet", index })}
          />
        ))}
        {ringSlots.map((slot, index) => (
          <EquipmentSummaryRow
            key={`ring-${index}`}
            testId={`equipment-row-ring-${index}`}
            label={`Ring ${index + 1}`}
            summary={formatRingSummary(slot)}
            onOpen={() => setOpenEquipment({ type: "ring", index })}
          />
        ))}
      </div>
```

Keep `{renderOpenEquipmentModal()}` and the mutations section after this list. Keep `SectionHeading` only because the mutations section still uses it.

- [ ] **Step 6: Run dynamic equipment tests to verify they pass**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/SFChart.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit the flattened dynamic equipment list**

```bash
git add src/components/DynamicEquipmentControls.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/SFChart.test.tsx
git commit -m "feat: flatten dynamic equipment list"
```

## Task 3: Reorder Calculator Equipment Rows Around Offhand First

**Files:**
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`

- [ ] **Step 1: Add a failing Calculator equipment order test**

In `src/components/__tests__/CalculatorLayout.test.tsx`, add this test after `"groups the right sidebar into base stats, skill, and equipment sections"`:

```tsx
  test("orders equipment rows like the supported subset of Crawl status equipment", async () => {
    await act(async () => {
      root.render(
        <Calculator
          state={buildDefaultCalculatorState("trunk")}
          setState={mockSetState}
        />
      );
    });

    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    const rowIds = Array.from(
      equipmentSection.querySelectorAll('[data-testid^="equipment-row-"]')
    ).map((row) => row.getAttribute("data-testid"));

    expect(rowIds.slice(0, 11)).toEqual([
      "equipment-row-shield",
      "equipment-row-orb",
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
  });
```

- [ ] **Step 2: Update the grouped sidebar test for the flattened dynamic list**

In the `"groups the right sidebar into base stats, skill, and equipment sections"` test, replace the `desktopHeadgearSection` block with:

```tsx
    const desktopDynamicEquipmentList = desktopDynamicEquipmentControls.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;
    const desktopHeadgearRow = desktopDynamicEquipmentList.querySelector(
      '[data-testid="equipment-row-headgear-0"]'
    ) as HTMLButtonElement;
    expect(desktopHeadgearRow.textContent).toContain("Headgear:");
    expect(desktopHeadgearRow.textContent).not.toContain("present");
```

Also add these assertions near the other equipment section assertions:

```tsx
    const equipmentHeadings = Array.from(
      equipmentSection.querySelectorAll("h2")
    ).map((heading) => heading.textContent);
    expect(equipmentHeadings).not.toEqual(
      expect.arrayContaining(["Rings", "Amulets", "Headgear", "Gloves", "Fixed Equipment"])
    );
```

- [ ] **Step 3: Run the Calculator layout test to verify it fails**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`

Expected: FAIL because the primary rows still render as armour, shield, orb.

- [ ] **Step 4: Reorder the primary equipment rows**

In `src/components/Calculator.tsx`, replace the primary equipment row block inside `sidebar-section-equipment` with:

```tsx
        <div className="flex flex-col gap-3">
          <EquipmentSummaryRow
            testId="equipment-row-shield"
            label="Shield"
            summary={formatShieldSummary(primaryShieldItem)}
            onOpen={() => setOpenPrimaryEquipment("shield")}
          />
          <EquipmentSummaryRow
            testId="equipment-row-orb"
            label="Orb"
            summary={formatOrbSummary(primaryOrbItem)}
            onOpen={() => setOpenPrimaryEquipment("orb")}
          />
          <EquipmentSummaryRow
            testId="equipment-row-body-armour"
            label="Armour"
            summary={formatBodyArmourSummary(primaryBodyArmour)}
            onOpen={() => setOpenPrimaryEquipment("bodyArmour")}
          />
        </div>
```

- [ ] **Step 5: Run the Calculator layout test to verify it passes**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the primary row order**

```bash
git add src/components/Calculator.tsx src/components/__tests__/CalculatorLayout.test.tsx
git commit -m "feat: order equipment rows like status view"
```

## Task 4: Final Verification

**Files:**
- Verify only.

- [ ] **Step 1: Run focused equipment tests**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts src/components/__tests__/DynamicEquipmentControls.test.tsx src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/SFChart.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS. The existing `react-refresh/only-export-components` warning in `src/components/ui/button.tsx` may still appear.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS. Vite may still print the existing chunk-size warning.

- [ ] **Step 4: Check full test suite status**

Run: `npm test -- --runInBand`

Expected: The same pre-existing spell calculation failures may still fail. If the only failures are the baseline spell calculation suites already seen before this refinement, do not change unrelated spell calculation code in this task.

- [ ] **Step 5: Confirm no uncommitted verification changes remain**

Run: `git status --short`

Expected: no output. If this shows files changed by verification tooling,
inspect those files and either commit intentional changes with the task-specific
commit message from the previous task, or revert generated noise only after
confirming it was not user-authored work.
