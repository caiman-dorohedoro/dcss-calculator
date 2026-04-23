# Equipment Summary Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline equipment controls with Crawl-like equipment summary rows that open a modal editor for every supported equipment slot.

**Architecture:** Keep itemized equipment state, import mapping, aggregation, and formulas unchanged. Add a pure summary formatter, a small row component, and a portal-backed edit modal, then wire the existing body armour, shield, orb, dynamic slot, and fixed auxiliary equipment controls through that shared row-and-modal UI.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind CSS, Jest with `jest-environment-jsdom`, Radix Select primitives already wrapped in `src/components/ui/select.tsx`

---

## File Map

### Create

- `src/utils/equipmentSummaryText.ts`
- `src/utils/__tests__/equipmentSummaryText.test.ts`
- `src/components/equipment/EquipmentSummaryRow.tsx`
- `src/components/equipment/EquipmentEditModal.tsx`

### Modify

- `docs/meta--catalog.md`
- `src/components/Calculator.tsx`
- `src/components/DynamicEquipmentControls.tsx`
- `src/components/__tests__/CalculatorLayout.test.tsx`
- `src/components/__tests__/DynamicEquipmentControls.test.tsx`

### Existing Files To Reference

- `docs/superpowers/specs/2026-04-23-equipment-summary-modal-design.md`
- `src/components/MorgueImportControls.tsx`
- `src/components/EquipmentEnchantInput.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/select.tsx`
- `src/types/equipment.ts`
- `src/types/equipmentItems.ts`
- `src/types/equipmentSlots.ts`

### Scope Notes

- Do not change calculator formulas, item aggregation, morgue import mapping, or saved-state migration.
- Keep mutation and trait modifier controls inline; the modal pattern applies only to equipment.
- Keep all dynamic slots visible, including empty octopode ring slots and formicid glove slots.
- Use `displayName` exactly when it exists. Clear stale imported metadata only when a saved modal draft differs from the original item.

## Task 1: Add Pure Equipment Summary Text Formatting

**Files:**
- Create: `src/utils/equipmentSummaryText.ts`
- Create: `src/utils/__tests__/equipmentSummaryText.test.ts`
- Test: `src/utils/__tests__/equipmentSummaryText.test.ts`

- [ ] **Step 1: Write the failing summary text tests**

```ts
// src/utils/__tests__/equipmentSummaryText.test.ts
import { describe, expect, test } from "@jest/globals";
import {
  formatAmuletSummary,
  formatBodyArmourSummary,
  formatFixedAuxSummary,
  formatGlovesSummary,
  formatHeadgearSummary,
  formatModifierSummary,
  formatOrbSummary,
  formatRingSummary,
  formatShieldSummary,
} from "../equipmentSummaryText";

describe("equipment summary text", () => {
  test("uses imported display names exactly", () => {
    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 4,
        ego: "none",
        displayName:
          "the +4 leather armour of the Plethaurus {Will+ Str+2 Dex+5}",
        modifiers: { str: 2, dex: 5 },
        source: "imported",
      })
    ).toBe("the +4 leather armour of the Plethaurus {Will+ Str+2 Dex+5}");

    expect(
      formatGlovesSummary({
        present: true,
        enchant: 5,
        displayName: "the +5 pair of gloves of Vipholopp {Str+7 Dex+3 SInv}",
        modifiers: { str: 7, dex: 3 },
        source: "imported",
      })
    ).toBe("the +5 pair of gloves of Vipholopp {Str+7 Dex+3 SInv}");
  });

  test("builds in-game-style fallback summaries", () => {
    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 4,
        ego: "resonance",
        modifiers: { int: 3 },
      })
    ).toBe("+4 leather armour (Resonance) {Int+3}");

    expect(formatShieldSummary({ kind: "kite_shield", enchant: 2 })).toBe(
      "+2 kite shield"
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
    expect(formatHeadgearSummary({ present: true, kind: "helmet", enchant: 2 })).toBe(
      "+2 helmet"
    );
    expect(
      formatGlovesSummary({
        present: true,
        enchant: 5,
        modifiers: { str: 2 },
      })
    ).toBe("+5 pair of gloves {Str+2}");
    expect(
      formatFixedAuxSummary({
        kind: "boots",
        present: true,
        enchant: 0,
      })
    ).toBe("pair of boots");
  });

  test("uses none for empty equipment slots", () => {
    expect(formatBodyArmourSummary({ kind: "none", enchant: 0, ego: "none" })).toBe(
      "none"
    );
    expect(formatShieldSummary({ kind: "none", enchant: 0 })).toBe("none");
    expect(formatOrbSummary({ kind: "none" })).toBe("none");
    expect(formatRingSummary({ kind: "none", plus: 0 })).toBe("none");
    expect(formatAmuletSummary({ kind: "none" })).toBe("none");
    expect(formatHeadgearSummary({ present: false, enchant: 0 })).toBe("none");
    expect(formatGlovesSummary({ present: false, enchant: 0 })).toBe("none");
    expect(
      formatFixedAuxSummary({
        kind: "cloak",
        present: false,
        enchant: 0,
      })
    ).toBe("none");
  });

  test("orders item modifiers in Crawl-like display order", () => {
    expect(
      formatModifierSummary({
        dex: 5,
        str: 2,
        int: -1,
        ac: 3,
        ev: -2,
        sh: 4,
        wizardry: 1,
      })
    ).toBe("{Str+2 Dex+5 Int-1 AC+3 EV-2 SH+4 Wiz+1}");
  });
});
```

- [ ] **Step 2: Run the summary text test to verify it fails**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts`

Expected: FAIL because `src/utils/equipmentSummaryText.ts` does not exist.

- [ ] **Step 3: Implement the minimal summary formatter**

```ts
// src/utils/equipmentSummaryText.ts
import {
  armourOptions,
  bodyArmourEgoOptions,
  orbOptions,
  shieldOptions,
} from "@/types/equipment";
import type {
  BodyArmourItemState,
  EquipmentModifierBag,
  FixedAuxItemState,
  OrbItemState,
  ShieldItemState,
} from "@/types/equipmentItems";
import type {
  AmuletSlotState,
  AuxArmourSlotState,
  RingSlotState,
} from "@/types/equipmentSlots";

const modifierDisplayOrder: Array<[keyof EquipmentModifierBag, string]> = [
  ["str", "Str"],
  ["dex", "Dex"],
  ["int", "Int"],
  ["ac", "AC"],
  ["ev", "EV"],
  ["sh", "SH"],
  ["wizardry", "Wiz"],
];

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const withEnchant = (enchant: number, itemName: string) =>
  enchant === 0 ? itemName : `${signed(enchant)} ${itemName}`;

const withModifiers = (
  itemName: string,
  modifiers?: EquipmentModifierBag
) => {
  const modifierSummary = formatModifierSummary(modifiers);
  return modifierSummary ? `${itemName} ${modifierSummary}` : itemName;
};

export const formatModifierSummary = (modifiers?: EquipmentModifierBag) => {
  if (!modifiers) {
    return "";
  }

  const parts = modifierDisplayOrder.flatMap(([key, label]) => {
    const value = modifiers[key];
    return value === undefined || value === 0 ? [] : `${label}${signed(value)}`;
  });

  return parts.length > 0 ? `{${parts.join(" ")}}` : "";
};

export const formatBodyArmourSummary = (item: BodyArmourItemState) => {
  if (item.displayName) {
    return item.displayName;
  }
  if (item.kind === "none") {
    return "none";
  }

  const baseName = armourOptions[item.kind].name;
  const egoName =
    item.ego === "none" ? "" : ` (${bodyArmourEgoOptions[item.ego].name})`;
  return withModifiers(
    `${withEnchant(item.enchant, baseName)}${egoName}`,
    item.modifiers
  );
};

export const formatShieldSummary = (item: ShieldItemState) => {
  if (item.displayName) {
    return item.displayName;
  }
  if (item.kind === "none") {
    return "none";
  }

  return withModifiers(
    withEnchant(item.enchant, shieldOptions[item.kind].name),
    item.modifiers
  );
};

export const formatOrbSummary = (item: OrbItemState) => {
  if (item.displayName) {
    return item.displayName;
  }
  if (item.kind === "none") {
    return "none";
  }

  return withModifiers(orbOptions[item.kind].name, item.modifiers);
};

export const formatRingSummary = (slot: RingSlotState) => {
  if (slot.displayName) {
    return slot.displayName;
  }
  if (slot.kind === "none") {
    return "none";
  }

  const baseName =
    slot.kind === "wizardry" ? "ring of wizardry" : `ring of ${slot.kind}`;
  const plus =
    slot.kind === "protection" || slot.kind === "evasion"
      ? ` ${signed(slot.plus)}`
      : "";

  return withModifiers(`${baseName}${plus}`, slot.modifiers);
};

export const formatAmuletSummary = (slot: AmuletSlotState) => {
  if (slot.displayName) {
    return slot.displayName;
  }
  if (slot.kind === "none") {
    return "none";
  }

  return withModifiers(`amulet of ${slot.kind}`, slot.modifiers);
};

export const formatHeadgearSummary = (slot: AuxArmourSlotState) => {
  if (slot.displayName) {
    return slot.displayName;
  }
  if (!slot.present) {
    return "none";
  }

  return withModifiers(
    withEnchant(slot.enchant, slot.kind ?? "helmet"),
    slot.modifiers
  );
};

export const formatGlovesSummary = (slot: AuxArmourSlotState) => {
  if (slot.displayName) {
    return slot.displayName;
  }
  if (!slot.present) {
    return "none";
  }

  return withModifiers(withEnchant(slot.enchant, "pair of gloves"), slot.modifiers);
};

export const formatFixedAuxSummary = (item: FixedAuxItemState) => {
  if (item.displayName) {
    return item.displayName;
  }
  if (!item.present) {
    return "none";
  }

  const itemName = item.kind === "boots" ? "pair of boots" : item.kind;
  return withModifiers(withEnchant(item.enchant, itemName), item.modifiers);
};
```

- [ ] **Step 4: Run the summary text test to verify it passes**

Run: `npm test -- --runInBand src/utils/__tests__/equipmentSummaryText.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the summary formatter**

```bash
git add src/utils/equipmentSummaryText.ts src/utils/__tests__/equipmentSummaryText.test.ts
git commit -m "feat: format equipment summary text"
```

## Task 2: Add Shared Equipment Row And Modal Shell

**Files:**
- Create: `src/components/equipment/EquipmentSummaryRow.tsx`
- Create: `src/components/equipment/EquipmentEditModal.tsx`
- Modify: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`

- [ ] **Step 1: Add failing UI tests for row rendering and portal modal shell**

Append these tests inside `describe("DynamicEquipmentControls", () => { ... })` in `src/components/__tests__/DynamicEquipmentControls.test.tsx`:

```tsx
test("renders equipment rows as plain text and opens a portal modal", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.ringSlots = [
    {
      kind: "protection",
      plus: 4,
      displayName: "the ring of Robustness {AC+8}",
      source: "imported",
    },
  ];

  await act(async () => {
    root.render(<DynamicEquipmentControls state={state} setState={setState} />);
  });

  const ringRow = container.querySelector(
    '[data-testid="equipment-row-ring-0"]'
  ) as HTMLButtonElement;

  expect(ringRow).not.toBeNull();
  expect(ringRow.textContent).toContain("Ring 1");
  expect(ringRow.textContent).toContain("the ring of Robustness {AC+8}");
  expect(ringRow.querySelector('button[role="combobox"]')).toBeNull();
  expect(ringRow.querySelector('input[type="number"]')).toBeNull();

  await act(async () => {
    ringRow.click();
  });

  expect(
    document.body.querySelector('[data-testid="equipment-edit-modal"]')
  ).not.toBeNull();
  expect(document.body.textContent).toContain("Equipment Details");
  expect(document.body.textContent).toContain("Ring 1");
});
```

- [ ] **Step 2: Run the dynamic equipment test to verify it fails**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: FAIL because `equipment-row-ring-0` and `equipment-edit-modal` do not exist.

- [ ] **Step 3: Create the shared row component**

```tsx
// src/components/equipment/EquipmentSummaryRow.tsx
import { cn } from "@/lib/utils";

type EquipmentSummaryRowProps = {
  label: string;
  summary: string;
  onOpen: () => void;
  testId: string;
  className?: string;
};

const EquipmentSummaryRow = ({
  label,
  summary,
  onOpen,
  testId,
  className,
}: EquipmentSummaryRowProps) => (
  <button
    type="button"
    data-testid={testId}
    className={cn(
      "flex w-full min-w-0 items-start gap-3 rounded-sm border border-transparent px-2 py-1 text-left text-sm hover:border-border hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white",
      className
    )}
    onClick={onOpen}
  >
    <span className="shrink-0 text-muted-foreground">{label}:</span>
    <span className="min-w-0 flex-1 break-words font-mono text-lime-300">
      {summary}
    </span>
  </button>
);

export default EquipmentSummaryRow;
```

- [ ] **Step 4: Create the modal shell component**

```tsx
// src/components/equipment/EquipmentEditModal.tsx
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type EquipmentEditModalProps = {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onSave: () => void;
};

const overlayClassName =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6";
const panelClassName =
  "w-full max-w-2xl border border-white bg-card p-6 text-card-foreground shadow-2xl";
const panelStyle = {
  outline: "1px solid white",
  outlineOffset: "-4px",
} as const;

const EquipmentEditModal = ({
  title,
  children,
  onCancel,
  onSave,
}: EquipmentEditModalProps) =>
  createPortal(
    <div
      data-testid="equipment-edit-modal"
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName} style={panelStyle}>
        <h2 className="text-lg font-semibold">Equipment Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button data-testid="save-equipment-edit" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );

export default EquipmentEditModal;
```

- [ ] **Step 5: Temporarily wire ring rows to the modal shell**

In `src/components/DynamicEquipmentControls.tsx`, import the new row, modal, and formatter:

```tsx
import { useState } from "react";
import EquipmentEditModal from "@/components/equipment/EquipmentEditModal";
import EquipmentSummaryRow from "@/components/equipment/EquipmentSummaryRow";
import { formatRingSummary } from "@/utils/equipmentSummaryText";
```

Add local state near `slotCounts`:

```tsx
const [openDraftTitle, setOpenDraftTitle] = useState<string | null>(null);
```

Replace only the ring slot body in this task with rows:

```tsx
{ringSlots.map((slot, index) => (
  <EquipmentSummaryRow
    key={`ring-${index}`}
    testId={`equipment-row-ring-${index}`}
    label={`Ring ${index + 1}`}
    summary={formatRingSummary(slot)}
    onOpen={() => setOpenDraftTitle(`Ring ${index + 1}`)}
  />
))}
{openDraftTitle ? (
  <EquipmentEditModal
    title={openDraftTitle}
    onCancel={() => setOpenDraftTitle(null)}
    onSave={() => setOpenDraftTitle(null)}
  >
    <div className="text-sm text-muted-foreground">
      Ring editor shell
    </div>
  </EquipmentEditModal>
) : null}
```

- [ ] **Step 6: Run the dynamic equipment test to verify it passes**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: PASS for the new row/modal shell test. Existing tests that assert old ring selector behavior may now fail; update only assertions that conflict with the new approved design by checking row text instead of inline ring selector controls.

- [ ] **Step 7: Commit the shared row and modal shell**

```bash
git add src/components/equipment/EquipmentSummaryRow.tsx src/components/equipment/EquipmentEditModal.tsx src/components/DynamicEquipmentControls.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx
git commit -m "feat: add equipment summary row modal shell"
```

## Task 3: Add Draft Editing To The Equipment Modal

**Files:**
- Modify: `src/components/equipment/EquipmentEditModal.tsx`
- Modify: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`

- [ ] **Step 1: Add failing tests for Cancel, Save, and imported metadata invalidation**

Append these tests in `src/components/__tests__/DynamicEquipmentControls.test.tsx`:

```tsx
test("cancels ring modal edits without updating state", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.ringSlots = [{ kind: "protection", plus: 4 }];

  await act(async () => {
    root.render(<DynamicEquipmentControls state={state} setState={setState} />);
  });

  await act(async () => {
    (
      container.querySelector('[data-testid="equipment-row-ring-0"]') as HTMLButtonElement
    ).click();
  });

  const plusInput = document.body.querySelector(
    'input[aria-label="Ring plus"]'
  ) as HTMLInputElement;
  setNumberInputValue(plusInput, "6");

  await act(async () => {
    (
      document.body.querySelector('[data-testid="cancel-equipment-edit"]') as HTMLButtonElement
    ).click();
  });

  expect(setState).not.toHaveBeenCalled();
  expect(
    document.body.querySelector('[data-testid="equipment-edit-modal"]')
  ).toBeNull();
});

test("saves ring modal edits and clears stale imported metadata when changed", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.ringSlots = [
    {
      kind: "protection",
      plus: 4,
      displayName: "the ring of Robustness {AC+8}",
      artifactKind: "randart",
      source: "imported",
    },
  ];

  await act(async () => {
    root.render(<DynamicEquipmentControls state={state} setState={setState} />);
  });

  await act(async () => {
    (
      container.querySelector('[data-testid="equipment-row-ring-0"]') as HTMLButtonElement
    ).click();
  });

  setNumberInputValue(
    document.body.querySelector('input[aria-label="Ring plus"]') as HTMLInputElement,
    "6"
  );

  await act(async () => {
    (
      document.body.querySelector('[data-testid="save-equipment-edit"]') as HTMLButtonElement
    ).click();
  });

  expect(setState).toHaveBeenCalledTimes(1);
  const updater = setState.mock.calls[0][0] as (prev: typeof state) => typeof state;
  const nextState = updater(state);

  expect(nextState.ringSlots[0]).toEqual({
    kind: "protection",
    plus: 6,
    displayName: undefined,
    artifactKind: undefined,
    source: undefined,
  });
});
```

- [ ] **Step 2: Run the dynamic equipment test to verify it fails**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: FAIL because the modal has no editable ring fields and no cancel test id.

- [ ] **Step 3: Extend the modal to support ring drafts**

Replace `src/components/equipment/EquipmentEditModal.tsx` with this component:

```tsx
import { useState } from "react";
import { createPortal } from "react-dom";
import EquipmentEnchantInput from "@/components/EquipmentEnchantInput";
import { EquipmentModifierInputs } from "@/components/DynamicEquipmentControls";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EquipmentModifierBag } from "@/types/equipmentItems";
import type { RingSlotState } from "@/types/equipmentSlots";

type RingModalConfig = {
  type: "ring";
  title: string;
  value: RingSlotState;
  onSave: (next: RingSlotState, changed: boolean) => void;
};

type EquipmentEditModalProps = {
  config: RingModalConfig;
  onCancel: () => void;
};

const overlayClassName =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6";
const panelClassName =
  "w-full max-w-2xl border border-white bg-card p-6 text-card-foreground shadow-2xl";
const panelStyle = {
  outline: "1px solid white",
  outlineOffset: "-4px",
} as const;

const ringKinds = ["none", "wizardry", "protection", "evasion"] as const;

const isRingBonusKind = (kind: RingSlotState["kind"]) =>
  kind === "protection" || kind === "evasion";

const normalizeRingDraft = (draft: RingSlotState): RingSlotState => ({
  ...draft,
  plus: isRingBonusKind(draft.kind) ? draft.plus : 0,
});

const sameRing = (a: RingSlotState, b: RingSlotState) =>
  JSON.stringify(normalizeRingDraft(a)) === JSON.stringify(normalizeRingDraft(b));

const EquipmentEditModal = ({ config, onCancel }: EquipmentEditModalProps) => {
  const [ringDraft, setRingDraft] = useState<RingSlotState>(config.value);
  const normalizedDraft = normalizeRingDraft(ringDraft);

  return createPortal(
    <div
      data-testid="equipment-edit-modal"
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName} style={panelStyle}>
        <h2 className="text-lg font-semibold">Equipment Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">{config.title}</p>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Ring type
            <Select
              value={ringDraft.kind}
              onValueChange={(value) =>
                setRingDraft((current) =>
                  normalizeRingDraft({
                    ...current,
                    kind: value as RingSlotState["kind"],
                  })
                )
              }
            >
              <SelectTrigger aria-label="Ring type" className="h-8">
                <SelectValue placeholder="none" />
              </SelectTrigger>
              <SelectContent>
                {ringKinds.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {isRingBonusKind(ringDraft.kind) ? (
            <EquipmentEnchantInput
              ariaLabel="Ring plus"
              value={ringDraft.plus}
              onChange={(plus) =>
                setRingDraft((current) => ({
                  ...current,
                  plus,
                }))
              }
            />
          ) : null}
          <EquipmentModifierInputs
            modifiers={ringDraft.modifiers}
            onChange={(modifiers: EquipmentModifierBag | undefined) =>
              setRingDraft((current) => ({
                ...current,
                modifiers,
              }))
            }
          />
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            data-testid="cancel-equipment-edit"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            data-testid="save-equipment-edit"
            onClick={() => config.onSave(normalizedDraft, !sameRing(config.value, normalizedDraft))}
          >
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EquipmentEditModal;
```

- [ ] **Step 4: Wire ring save behavior in `DynamicEquipmentControls`**

Use this save callback for ring modal saves:

```tsx
const clearImportedRingMetadata = (
  next: RingSlotState,
  changed: boolean
): RingSlotState =>
  changed
    ? {
        ...next,
        displayName: undefined,
        artifactKind: undefined,
        source: undefined,
      }
    : next;
```

Render the modal with a ring config:

```tsx
{openRingIndex !== null ? (
  <EquipmentEditModal
    config={{
      type: "ring",
      title: `Ring ${openRingIndex + 1}`,
      value: ringSlots[openRingIndex] ?? createDefaultRingSlot(),
      onSave: (next, changed) => {
        updateRingSlot(openRingIndex, () =>
          clearImportedRingMetadata(next, changed)
        );
        setOpenRingIndex(null);
      },
    }}
    onCancel={() => setOpenRingIndex(null)}
  />
) : null}
```

- [ ] **Step 5: Run the dynamic equipment test to verify it passes**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit ring modal draft editing**

```bash
git add src/components/equipment/EquipmentEditModal.tsx src/components/DynamicEquipmentControls.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx
git commit -m "feat: edit ring equipment in modal"
```

## Task 4: Convert Dynamic Equipment And Fixed Auxiliary Slots To Summary Rows

**Files:**
- Modify: `src/components/DynamicEquipmentControls.tsx`
- Modify: `src/components/equipment/EquipmentEditModal.tsx`
- Modify: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`

- [ ] **Step 1: Add failing tests for dynamic slot summaries and hidden inline controls**

Replace tests that assert inline selectors or checkboxes for amulets, headgear,
gloves, cloak, boots, or barding with row-based assertions like these:

```tsx
test("renders dynamic equipment and fixed auxiliary equipment as summary rows", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.species = "formicid";
  state.amuletSlots = [{ kind: "reflection" }];
  state.headgearSlots = [{ present: true, enchant: 2, kind: "helmet" }];
  state.gloveSlots = [
    {
      present: true,
      enchant: 5,
      modifiers: { str: 2 },
    },
    { present: false, enchant: 0 },
  ];
  state.cloak = true;
  state.cloakItem = { ...state.cloakItem, present: true, enchant: 1 };
  state.boots = true;
  state.bootsItem = { ...state.bootsItem, present: true };
  state.barding = false;

  await act(async () => {
    root.render(<DynamicEquipmentControls state={state} setState={setState} />);
  });

  expect(container.querySelector('[data-testid="equipment-row-amulet-0"]')?.textContent).toContain(
    "amulet of reflection"
  );
  expect(container.querySelector('[data-testid="equipment-row-headgear-0"]')?.textContent).toContain(
    "+2 helmet"
  );
  expect(container.querySelector('[data-testid="equipment-row-glove-0"]')?.textContent).toContain(
    "+5 pair of gloves {Str+2}"
  );
  expect(container.querySelector('[data-testid="equipment-row-glove-1"]')?.textContent).toContain(
    "none"
  );
  expect(container.querySelector('[data-testid="equipment-row-cloak"]')?.textContent).toContain(
    "+1 cloak"
  );
  expect(container.querySelector('[data-testid="equipment-row-boots"]')?.textContent).toContain(
    "pair of boots"
  );
  expect(container.querySelector('[data-testid="equipment-row-barding"]')?.textContent).toContain(
    "none"
  );
  expect(container.querySelector('button[role="combobox"]')).toBeNull();
  expect(container.querySelector('input[type="checkbox"]')).toBeNull();
});
```

- [ ] **Step 2: Run the dynamic equipment test to verify it fails**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: FAIL because non-ring equipment still renders inline controls.

- [ ] **Step 3: Extend modal config for all dynamic equipment kinds**

Extend `EquipmentEditModal.tsx` with configs for:

```ts
type EquipmentModalConfig =
  | {
      type: "ring";
      title: string;
      value: RingSlotState;
      onSave: (next: RingSlotState, changed: boolean) => void;
    }
  | {
      type: "amulet";
      title: string;
      value: AmuletSlotState;
      onSave: (next: AmuletSlotState, changed: boolean) => void;
    }
  | {
      type: "headgear";
      title: string;
      value: AuxArmourSlotState;
      onSave: (next: AuxArmourSlotState, changed: boolean) => void;
    }
  | {
      type: "gloves";
      title: string;
      value: AuxArmourSlotState;
      onSave: (next: AuxArmourSlotState, changed: boolean) => void;
    }
  | {
      type: "fixedAux";
      title: string;
      value: FixedAuxItemState;
      onSave: (next: FixedAuxItemState, changed: boolean) => void;
    };
```

Implement one draft state initialized from `config.value`, type-specific fields,
and `JSON.stringify(config.value) !== JSON.stringify(nextDraft)` for the changed
flag. Use existing constants:

```ts
const amuletKinds = ["none", "reflection"] as const;
const headgearKinds = ["none", "hat", "helmet"] as const;
const gloveKinds = ["none", "gloves"] as const;
```

For fixed auxiliary equipment, use one equipped selector:

```tsx
<Select
  value={draft.present ? "equipped" : "none"}
  onValueChange={(value) =>
    setDraft((current) => ({
      ...current,
      present: value === "equipped",
      enchant: value === "equipped" ? current.enchant : 0,
    }))
  }
>
  <SelectTrigger aria-label={`${config.title} equipped`} className="h-8">
    <SelectValue placeholder="none" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">none</SelectItem>
    <SelectItem value="equipped">equipped</SelectItem>
  </SelectContent>
</Select>
```

- [ ] **Step 4: Replace dynamic inline controls with summary rows**

In `DynamicEquipmentControls.tsx`, render sections using these formatters:

```tsx
formatAmuletSummary(slot)
formatHeadgearSummary(slot)
formatGlovesSummary(slot)
formatFixedAuxSummary(state[itemKey])
```

Each row should use stable test ids:

```tsx
equipment-row-amulet-${index}
equipment-row-headgear-${index}
equipment-row-glove-${index}
equipment-row-cloak
equipment-row-boots
equipment-row-barding
```

On save, update the same state fields that inline controls currently update:

```tsx
setState((prev) => ({
  ...prev,
  cloak: next.present,
  cloakEnchant: next.enchant,
  cloakItem: next,
}))
```

For headgear and gloves, preserve compatibility mirrors:

```tsx
helmet: nextSlots[0]?.kind === "helmet"
gloves: nextSlots[0]?.present ?? false
secondGloves: nextSlots[1]?.present ?? false
```

- [ ] **Step 5: Run the dynamic equipment test to verify it passes**

Run: `npm test -- --runInBand src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit dynamic equipment row conversion**

```bash
git add src/components/DynamicEquipmentControls.tsx src/components/equipment/EquipmentEditModal.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx
git commit -m "feat: show dynamic equipment as summary rows"
```

## Task 5: Convert Body Armour, Shield, And Orb To Summary Rows

**Files:**
- Modify: `src/components/Calculator.tsx`
- Modify: `src/components/equipment/EquipmentEditModal.tsx`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`

- [ ] **Step 1: Add failing tests for top-level equipment rows**

Replace old body armour, shield, and orb inline-control tests with this behavior:

```tsx
test("renders body armour, shield, and orb as summary rows", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.armour = "leather_armour";
  state.bodyArmour = {
    ...state.bodyArmour,
    kind: "leather_armour",
    enchant: 4,
    ego: "resonance",
    modifiers: { int: 3 },
  };
  state.shield = "kite_shield";
  state.shieldItem = {
    ...state.shieldItem,
    kind: "kite_shield",
    enchant: 2,
  };
  state.orb = "none";

  await act(async () => {
    root.render(<Calculator state={state} setState={mockSetState} />);
  });

  const equipmentSection = container.querySelector(
    '[data-testid="sidebar-section-equipment"]'
  ) as HTMLDivElement;

  expect(equipmentSection.querySelector('[data-testid="equipment-row-body-armour"]')?.textContent).toContain(
    "+4 leather armour (Resonance) {Int+3}"
  );
  expect(equipmentSection.querySelector('[data-testid="equipment-row-shield"]')?.textContent).toContain(
    "+2 kite shield"
  );
  expect(equipmentSection.querySelector('[data-testid="equipment-row-orb"]')?.textContent).toContain(
    "none"
  );
  expect(equipmentSection.querySelector('[data-testid="body-armour-selector-control"]')).toBeNull();
  expect(equipmentSection.querySelector('[data-testid="shield-selector-control"]')).toBeNull();
  expect(equipmentSection.querySelector('button[role="combobox"]')).toBeNull();
});
```

- [ ] **Step 2: Run the calculator layout test to verify it fails**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`

Expected: FAIL because top-level equipment still renders inline controls.

- [ ] **Step 3: Extend modal config for body armour, shield, and orb**

Add configs:

```ts
| {
    type: "bodyArmour";
    title: string;
    value: BodyArmourItemState;
    bodyArmourEgos: Record<BodyArmourEgoKey, { name: string }>;
    onSave: (next: BodyArmourItemState, changed: boolean) => void;
  }
| {
    type: "shield";
    title: string;
    value: ShieldItemState;
    disabledReason?: string;
    onSave: (next: ShieldItemState, changed: boolean) => void;
  }
| {
    type: "orb";
    title: string;
    value: OrbItemState;
    disabledReason?: string;
    onSave: (next: OrbItemState, changed: boolean) => void;
  }
```

Use these option lists in the modal:

```tsx
{Object.entries(armourOptions).map(([key, value]) => (
  <SelectItem key={key} value={key}>
    {value.name}
  </SelectItem>
))}

{(Object.keys(bodyArmourEgos) as BodyArmourEgoKey[]).map((key) => (
  <SelectItem key={key} value={key}>
    {bodyArmourEgos[key]?.name ?? key}
  </SelectItem>
))}

{Object.entries(shieldOptions).map(([key, value]) => (
  <SelectItem key={key} value={key}>
    {value.name}
  </SelectItem>
))}

{Object.entries(orbOptions).map(([key, value]) => (
  <SelectItem key={key} value={key}>
    {value.name}
  </SelectItem>
))}
```

- [ ] **Step 4: Replace top-level inline controls in `Calculator.tsx`**

Import shared row, modal, and formatters:

```tsx
import { useState } from "react";
import EquipmentEditModal from "@/components/equipment/EquipmentEditModal";
import EquipmentSummaryRow from "@/components/equipment/EquipmentSummaryRow";
import {
  formatBodyArmourSummary,
  formatOrbSummary,
  formatShieldSummary,
} from "@/utils/equipmentSummaryText";
```

Track the open top-level equipment row:

```tsx
const [openEquipment, setOpenEquipment] = useState<
  "bodyArmour" | "shield" | "orb" | null
>(null);
```

Render three rows before `DynamicEquipmentControls`:

```tsx
<EquipmentSummaryRow
  testId="equipment-row-body-armour"
  label="Armour"
  summary={formatBodyArmourSummary(state.bodyArmour)}
  onOpen={() => setOpenEquipment("bodyArmour")}
/>
<EquipmentSummaryRow
  testId="equipment-row-shield"
  label="Shield"
  summary={formatShieldSummary(state.shieldItem)}
  onOpen={() => setOpenEquipment("shield")}
/>
<EquipmentSummaryRow
  testId="equipment-row-orb"
  label="Orb"
  summary={formatOrbSummary(state.orbItem)}
  onOpen={() => setOpenEquipment("orb")}
/>
```

On body armour save, update both legacy mirrors and item state:

```tsx
setState((prev) => ({
  ...prev,
  armour: next.kind,
  bodyArmourEnchant: next.enchant,
  bodyArmourEgo: next.ego,
  bodyArmour: next,
}));
```

On shield save, keep shield/orb exclusivity:

```tsx
setState((prev) => ({
  ...prev,
  shield: next.kind,
  shieldEnchant: next.enchant,
  shieldItem: next,
  orb: next.kind === "none" ? prev.orb : "none",
  orbItem:
    next.kind === "none"
      ? prev.orbItem
      : {
          ...prev.orbItem,
          kind: "none",
        },
}));
```

On orb save, keep orb/shield exclusivity:

```tsx
setState((prev) => ({
  ...prev,
  orb: next.kind,
  orbItem: next,
  shield: next.kind === "none" ? prev.shield : "none",
  shieldItem:
    next.kind === "none"
      ? prev.shieldItem
      : {
          ...prev.shieldItem,
          kind: "none",
        },
}));
```

- [ ] **Step 5: Run the calculator layout test to verify it passes**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit top-level equipment row conversion**

```bash
git add src/components/Calculator.tsx src/components/equipment/EquipmentEditModal.tsx src/components/__tests__/CalculatorLayout.test.tsx
git commit -m "feat: show primary equipment as summary rows"
```

## Task 6: Add End-To-End UI Coverage For Modal Save Semantics

**Files:**
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Modify: `src/components/__tests__/DynamicEquipmentControls.test.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`
- Test: `src/components/__tests__/DynamicEquipmentControls.test.tsx`

- [ ] **Step 1: Add failing test for imported top-level item invalidation**

Add this test to `src/components/__tests__/CalculatorLayout.test.tsx`:

```tsx
test("clears imported body armour display metadata only after a saved edit", async () => {
  const state = buildDefaultCalculatorState("trunk");
  state.armour = "leather_armour";
  state.bodyArmour = {
    kind: "leather_armour",
    enchant: 4,
    ego: "none",
    displayName: "the +4 leather armour of the Plethaurus {Will+ Str+2 Dex+5}",
    artifactKind: "randart",
    source: "imported",
    modifiers: { str: 2, dex: 5 },
  };

  await act(async () => {
    root.render(<Calculator state={state} setState={mockSetState} />);
  });

  await act(async () => {
    (
      container.querySelector('[data-testid="equipment-row-body-armour"]') as HTMLButtonElement
    ).click();
  });

  setNumberInputValue(
    document.body.querySelector(
      'input[aria-label="Body armour enchant"]'
    ) as HTMLInputElement,
    "5"
  );

  await act(async () => {
    (
      document.body.querySelector('[data-testid="save-equipment-edit"]') as HTMLButtonElement
    ).click();
  });

  expect(mockSetState).toHaveBeenCalledTimes(1);
  const updater = mockSetState.mock.calls[0][0] as (prev: typeof state) => typeof state;
  const nextState = updater(state);

  expect(nextState.bodyArmour).toMatchObject({
    kind: "leather_armour",
    enchant: 5,
    ego: "none",
    displayName: undefined,
    artifactKind: undefined,
    source: undefined,
  });
});
```

If `setNumberInputValue` is not available in `CalculatorLayout.test.tsx`, copy
the helper from `DynamicEquipmentControls.test.tsx` exactly:

```ts
const setNumberInputValue = (input: HTMLInputElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  if (!valueSetter) {
    throw new Error("Could not find input value setter");
  }

  valueSetter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
```

- [ ] **Step 2: Run focused layout test to verify it fails**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`

Expected: FAIL if imported metadata is not yet cleared for body armour saves.

- [ ] **Step 3: Apply consistent stale metadata clearing**

Add a helper near each save boundary or in `EquipmentEditModal.tsx`:

```ts
const clearImportedItemMetadata = <T extends {
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: string;
}>(
  item: T,
  changed: boolean
): T =>
  changed
    ? {
        ...item,
        displayName: undefined,
        artifactKind: undefined,
        source: undefined,
      }
    : item;
```

Use it for all modal save paths:

```tsx
const nextItem = clearImportedItemMetadata(next, changed);
```

- [ ] **Step 4: Run focused UI tests to verify they pass**

Run: `npm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit save semantics coverage**

```bash
git add src/components/Calculator.tsx src/components/DynamicEquipmentControls.tsx src/components/equipment/EquipmentEditModal.tsx src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/DynamicEquipmentControls.test.tsx
git commit -m "feat: preserve equipment modal save semantics"
```

## Task 7: Cleanup, Catalog, And Full Verification

**Files:**
- Modify: `docs/meta--catalog.md`
- Modify: imports in `src/components/Calculator.tsx`
- Modify: imports in `src/components/DynamicEquipmentControls.tsx`
- Test: full test suite and production build

- [ ] **Step 1: Remove dead imports and deleted helper code**

Remove now-unused imports from `Calculator.tsx`:

```tsx
Select
SelectContent
SelectItem
SelectTrigger
SelectValue
EquipmentEnchantInput
EquipmentModifierInputs
ArmourKey
BodyArmourEgoKey
OrbKey
ShieldKey
armourOptions
orbOptions
shieldOptions
```

Remove now-unused imports from `DynamicEquipmentControls.tsx`:

```tsx
Checkbox
EquipmentEnchantInput
Select
SelectContent
SelectItem
SelectTrigger
SelectValue
```

Keep `EquipmentModifierInputs` exported from `DynamicEquipmentControls.tsx` if
`EquipmentEditModal.tsx` imports it. If that creates a circular import during
testing, move `EquipmentModifierInputs` into `src/components/equipment/EquipmentModifierInputs.tsx`
and update both imports in the same commit.

- [ ] **Step 2: Update the document catalog**

Add this row to `docs/meta--catalog.md` under implementation plans:

```md
| `2026-04-23-equipment-summary-modal.md` | 장비 섹션을 인게임풍 텍스트 행과 상세 수정 모달로 바꾸는 구현 계획 | `/docs/superpowers/plans` |
```

Keep `최종 업데이트: 2026-04-23`.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS with no ESLint errors.

- [ ] **Step 4: Run the full test suite**

Run: `npm test -- --runInBand`

Expected: PASS.

- [ ] **Step 5: Run production build**

Run: `npm run build`

Expected: PASS. The TypeScript build should not report unused imports or type
errors, and Vite should complete successfully.

- [ ] **Step 6: Commit cleanup and catalog updates**

```bash
git add docs/meta--catalog.md src/components/Calculator.tsx src/components/DynamicEquipmentControls.tsx src/components/equipment/EquipmentEditModal.tsx
git commit -m "chore: verify equipment summary modal implementation"
```

## Self-Review Checklist

- Spec coverage: Tasks 1 through 6 cover summary text priority, in-game-style fallbacks, rows for all equipment, modal editing, cancel/save behavior, and imported metadata invalidation.
- Non-goals preserved: No task changes morgue parser semantics, formula inputs, aggregation, saved-state migration, mutation controls, or trait controls.
- TDD order: Every implementation task starts with a failing focused test, then implementation, then passing verification.
- File boundaries: Summary formatting is pure utility code, row rendering is presentational, modal editing owns draft state, and existing container components only wire state to rows and saves.
- Verification: Task 7 includes lint, full Jest suite, and production build before the final cleanup commit.
