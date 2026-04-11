# Spell Controls Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every spell-related control except spell selection into the desktop right sidebar, regroup the sidebar into `Base Stats`, `Skill`, and `Equipment`, and slightly rebalance the desktop frame without changing mobile behavior or calculator semantics.

**Architecture:** Keep `CalculatorState` and all calculation logic unchanged. `Calculator.tsx` becomes the single owner of sidebar rendering for stats, skills, equipment, spellcasting, selected spell-school skills, `wizardry`, `wildMagic`, and `bodyArmourEgo`, while `SpellModeHeader.tsx` shrinks down to the spell picker used by `SFChart`. `App.tsx` only absorbs the small desktop shell-width bump needed to keep `Str / Dex / Int` on one row.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind CSS, Jest with `jest-environment-jsdom`

---

## File Map

### Create

- `src/components/__tests__/SpellModeHeader.test.tsx`

### Modify

- `src/App.tsx:26-59`
- `src/components/Calculator.tsx:1-365`
- `src/components/SpellModeHeader.tsx:1-149`
- `src/components/__tests__/AppLayout.test.tsx:61-104`
- `src/components/__tests__/CalculatorLayout.test.tsx:23-133`

### Existing Tests To Keep Green

- `src/components/__tests__/AppLayout.test.tsx`
- `src/components/__tests__/CalculatorLayout.test.tsx`
- `src/components/__tests__/MorgueImportControls.test.tsx`

### Known Baseline Limits

- `pnpm lint` is not a release gate for this plan because it already fails on unrelated baseline issues in `src/components/ui/button.tsx:57` and `src/versioning/speciesData.ts:51`.
- `pnpm test --runInBand` is not a release gate for this plan because unrelated spell regression suites already fail in `src/utils/__tests__/spellCalculations*.test.ts`.
- Use the targeted Jest commands below plus `pnpm build` as the verification gates for this feature branch.

## Task 1: Add Sidebar Sections And Move Spell Inputs

**Files:**
- Modify: `src/components/Calculator.tsx:1-365`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx:23-133`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`

- [ ] **Step 1: Write the failing sidebar-section test**

```ts
// src/components/__tests__/CalculatorLayout.test.tsx
test("renders base stats, skill, and equipment sidebar sections with spell controls", async () => {
  const state = {
    ...buildDefaultCalculatorState("trunk"),
    targetSpell: "Fireball",
  };

  await act(async () => {
    root.render(<Calculator state={state} setState={mockSetState} />);
  });

  const baseStats = container.querySelector(
    '[data-testid="sidebar-section-base-stats"]'
  ) as HTMLDivElement;
  const skill = container.querySelector(
    '[data-testid="sidebar-section-skill"]'
  ) as HTMLDivElement;
  const equipment = container.querySelector(
    '[data-testid="sidebar-section-equipment"]'
  ) as HTMLDivElement;

  expect(baseStats.textContent).toContain("Base Stats");
  expect(baseStats.textContent).toContain("Species");
  expect(baseStats.textContent).toContain("Str");
  expect(baseStats.textContent).toContain("Dex");
  expect(baseStats.textContent).toContain("Int");

  expect(skill.textContent).toContain("Skill");
  expect(skill.textContent).toContain("Armour");
  expect(skill.textContent).toContain("Shield");
  expect(skill.textContent).toContain("Dodging");
  expect(skill.textContent).toContain("Spellcasting");
  expect(skill.textContent).toContain("conjuration");
  expect(skill.textContent).toContain("fire");
  expect(skill.textContent).not.toContain("translocation");
  expect(skill.textContent).not.toContain("Armour Skill");
  expect(skill.textContent).not.toContain("Shield Skill");
  expect(skill.textContent).not.toContain("Dodging Skill");
  expect(skill.textContent).not.toContain("Spellcasting Skill");

  expect(equipment.textContent).toContain("Equipment");
  expect(equipment.textContent).toContain("Armour:");
  expect(equipment.textContent).toContain("Shield:");
  expect(equipment.textContent).toContain("Orb:");
  expect(equipment.textContent).toContain("ring of wizardry");
  expect(equipment.textContent).toContain("wild magic (mutation)");
  expect(equipment.textContent).toContain("body armour ego");
  expect(equipment.textContent).toContain("Helmet");
});
```

- [ ] **Step 2: Run the test to verify it fails on the current sidebar**

Run: `pnpm test src/components/__tests__/CalculatorLayout.test.tsx --runInBand`

Expected: FAIL because `sidebar-section-base-stats` is missing and the right sidebar still renders `Armour Skill`, `Shield Skill`, and `Dodging Skill` instead of the new sectioned layout.

- [ ] **Step 3: Write the minimal sidebar implementation in `Calculator.tsx`**

```tsx
// src/components/Calculator.tsx
import {
  ArmourKey,
  armourOptions,
  BodyArmourEgoKey,
  OrbKey,
  orbOptions,
  ShieldKey,
  shieldOptions,
} from "@/types/equipment.ts";
import { getBodyArmourEgoOptions } from "@/versioning/equipmentData";
import { getSpellSchools } from "@/utils/spellCalculation";

const skillAttrKeys: Array<{ label: string; key: keyof CalculatorState<V> }> = [
  { label: "Armour", key: "armourSkill" },
  { label: "Shield", key: "shieldSkill" },
  { label: "Dodging", key: "dodgingSkill" },
  { label: "Spellcasting", key: "spellcasting" },
];

const spellSchools =
  state.targetSpell === undefined
    ? []
    : getSpellSchools(state.version, state.targetSpell);
const bodyArmourEgos = getBodyArmourEgoOptions(state.version);
const selectedBodyArmourEgo =
  state.bodyArmourEgo !== undefined && state.bodyArmourEgo in bodyArmourEgos
    ? state.bodyArmourEgo
    : "none";

const controlsContent = (
  <CardHeader className="flex flex-col gap-4">
    <section
      data-testid="sidebar-section-base-stats"
      className="flex flex-col gap-2"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Base Stats
      </h2>
      <div
        data-testid="base-stats-row"
        className="flex flex-row items-center gap-4 flex-wrap"
      >
        <label className="flex flex-row items-center gap-2 text-sm">
          Species:
          <Select
            value={state.species}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                species: value as SpeciesKey<V>,
              }))
            }
          >
            <SelectTrigger className="w-[180px] h-6">
              <SelectValue placeholder="Species" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(speciesOptions(state.version)).map(
                ([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name} ({value.size})
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </label>
        <AttrInput
          label="Str"
          value={state.strength}
          type="stat"
          onChange={(value) =>
            setState((prev) => ({ ...prev, strength: value }))
          }
        />
        <AttrInput
          label="Dex"
          value={state.dexterity}
          type="stat"
          onChange={(value) =>
            setState((prev) => ({ ...prev, dexterity: value }))
          }
        />
        <AttrInput
          label="Int"
          value={state.intelligence}
          type="stat"
          onChange={(value) =>
            setState((prev) => ({ ...prev, intelligence: value }))
          }
        />
      </div>
    </section>

    <section
      data-testid="sidebar-section-skill"
      className="flex flex-col gap-2"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Skill
      </h2>
      <div className="flex flex-row items-center gap-2 flex-wrap">
        {skillAttrKeys.map(({ label, key }) => (
          <AttrInput
            key={key}
            label={label}
            value={typeof state[key] === "number" ? state[key] : 0}
            type="skill"
            onChange={(value) =>
              setState((prev) => ({ ...prev, [key]: value }))
            }
          />
        ))}
        {spellSchools.map((schoolName) => (
          <AttrInput
            key={schoolName}
            label={schoolName}
            value={state.schoolSkills?.[schoolName] ?? 0}
            type="skill"
            onChange={(value) =>
              setState((prev) => ({
                ...prev,
                schoolSkills: {
                  ...prev.schoolSkills,
                  [schoolName]: value === undefined ? 0 : value,
                },
              }))
            }
          />
        ))}
      </div>
    </section>

    <section
      data-testid="sidebar-section-equipment"
      className="flex flex-col gap-2"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Equipment
      </h2>
      <div className="flex items-center flex-row gap-4 flex-wrap">
        <label className="flex flex-row items-center gap-2 text-sm">
          Armour:
          <Select
            value={state.armour}
            onValueChange={(value) =>
              setState((prev) => ({ ...prev, armour: value as ArmourKey }))
            }
          >
            <SelectTrigger className="min-w-[100px] gap-2 h-6">
              <SelectValue placeholder="Armour" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(armourOptions).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-row items-center gap-2 text-sm">
          Shield:
          <Select
            disabled={state.orb !== "none"}
            value={state.shield}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                shield: value as ShieldKey,
                orb: value === "none" ? prev.orb : "none",
              }))
            }
          >
            <SelectTrigger className="w-[160px] h-6">
              <SelectValue placeholder="Shield" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(shieldOptions).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-row items-center gap-2 text-sm">
          Orb:
          <Select
            disabled={state.shield !== "none"}
            value={state.orb}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                orb: value as OrbKey,
                shield: value === "none" ? prev.shield : "none",
              }))
            }
          >
            <SelectTrigger className="w-[160px] h-6">
              <SelectValue placeholder="Orb" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(orbOptions).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap">
        {checkboxKeys.map((key) => (
          <Fragment key={key}>
            <label htmlFor={key} className="flex flex-row items-center gap-2">
              <Checkbox
                checked={!!state[key]}
                onCheckedChange={(checked) =>
                  setState((prev) => ({ ...prev, [key]: !!checked }))
                }
                id={key}
              />
              {equipmentToggleLabels[key]}
            </label>
            {key === "boots" && <div className="h-3 w-px bg-gray-200"></div>}
          </Fragment>
        ))}
      </div>
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap">
        <AttrInput
          label="ring of wizardry"
          value={state.wizardry ?? 0}
          type="number"
          max={10}
          onChange={(value) =>
            setState((prev) => ({ ...prev, wizardry: value }))
          }
        />
        <AttrInput
          label="wild magic (mutation)"
          value={state.wildMagic ?? 0}
          type="number"
          max={3}
          onChange={(value) =>
            setState((prev) => ({ ...prev, wildMagic: value }))
          }
        />
        <label className="flex flex-row items-center gap-2 text-sm">
          body armour ego
          <Select
            disabled={state.armour === "none"}
            value={selectedBodyArmourEgo}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                bodyArmourEgo: value as BodyArmourEgoKey,
              }))
            }
          >
            <SelectTrigger className="min-w-[120px] h-6 w-auto gap-2">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(bodyArmourEgos) as BodyArmourEgoKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {bodyArmourEgos[key]?.name ?? key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
    </section>
  </CardHeader>
);
```

- [ ] **Step 4: Run the sidebar test again**

Run: `pnpm test src/components/__tests__/CalculatorLayout.test.tsx --runInBand`

Expected: PASS with both desktop layout tests green, including the new sidebar-section coverage.

- [ ] **Step 5: Commit the sidebar regroup**

```bash
git add src/components/Calculator.tsx src/components/__tests__/CalculatorLayout.test.tsx
git commit -m "fix: move spell controls into calculator sidebar"
```

## Task 2: Trim `SpellModeHeader` Down To Spell Selection

**Files:**
- Create: `src/components/__tests__/SpellModeHeader.test.tsx`
- Modify: `src/components/SpellModeHeader.tsx:1-149`
- Test: `src/components/__tests__/SpellModeHeader.test.tsx`

- [ ] **Step 1: Write the failing picker-only header test**

```ts
/**
 * @jest-environment jsdom
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";

const { default: SpellModeHeader } = await import("../SpellModeHeader");

describe("SpellModeHeader", () => {
  let container: HTMLDivElement;
  let root: Root;
  const mockSetState = jest.fn();

  beforeEach(() => {
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    mockSetState.mockReset();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
  });

  test("renders only spell selection controls for the spell-failure panel", async () => {
    await act(async () => {
      root.render(
        <SpellModeHeader
          state={buildDefaultCalculatorState("trunk")}
          setState={mockSetState}
        />
      );
    });

    expect(container.textContent).toContain("Spell:");
    expect(container.textContent).not.toContain("Spellcasting");
    expect(container.textContent).not.toContain("ring of wizardry");
    expect(container.textContent).not.toContain("wild magic (mutation)");
    expect(container.textContent).not.toContain("body armour ego");
    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the new header test to verify it fails**

Run: `pnpm test src/components/__tests__/SpellModeHeader.test.tsx --runInBand`

Expected: FAIL because `SpellModeHeader.tsx` still renders spellcasting, school-skill inputs, wizardry, wild magic, and body-armour-ego controls.

- [ ] **Step 3: Remove the moved controls from `SpellModeHeader.tsx`**

```tsx
// src/components/SpellModeHeader.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { GameVersion } from "@/types/game";
import { VersionedSpellName } from "@/types/spells";
import { getSpellData } from "@/utils/spellCalculation";
import { spellCanBeEnkindled } from "@/utils/spellCanbeEnkindled";

type SpellModeHeaderProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
};

const SpellModeHeader = <V extends GameVersion>({
  state,
  setState,
}: SpellModeHeaderProps<V>) => {
  const spells = getSpellData<V>(state.version);

  return (
    <div className="flex flex-col gap-2 pl-2 pr-4 pb-4">
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap flex-start">
        <div className="flex flex-row items-center gap-2">
          Spell:
          <Select
            value={state.targetSpell}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                targetSpell: value as VersionedSpellName<V>,
              }))
            }
          >
            <SelectTrigger className="min-w-[160px] h-6 w-auto gap-2">
              <SelectValue placeholder="Apportation" />
            </SelectTrigger>
            <SelectContent>
              {spells
                .toSorted((a, b) => a.name.localeCompare(b.name))
                .map((spell) => (
                  <SelectItem key={spell.name} value={spell.name}>
                    <span className="inline-flex items-center gap-2">
                      <span>{spell.name}</span>
                      {state.species === "revenant" &&
                        spellCanBeEnkindled(state.version, spell.name) && (
                          <span className="text-[#60FDFF] transform translate-y-0.5">
                            *
                          </span>
                        )}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SpellModeHeader;
```

- [ ] **Step 4: Run the focused header and sidebar tests together**

Run: `pnpm test src/components/__tests__/SpellModeHeader.test.tsx src/components/__tests__/CalculatorLayout.test.tsx --runInBand`

Expected: PASS with `SpellModeHeader` reduced to the picker and the sidebar still carrying the moved spell controls.

- [ ] **Step 5: Commit the header cleanup**

```bash
git add src/components/SpellModeHeader.tsx src/components/__tests__/SpellModeHeader.test.tsx
git commit -m "fix: trim spell mode header controls"
```

## Task 3: Rebalance Desktop Width And Lock The Regression Checks

**Files:**
- Modify: `src/App.tsx:26-59`
- Modify: `src/components/Calculator.tsx:147-365`
- Modify: `src/components/__tests__/AppLayout.test.tsx:61-104`
- Modify: `src/components/__tests__/CalculatorLayout.test.tsx:84-133`
- Test: `src/components/__tests__/AppLayout.test.tsx`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`

- [ ] **Step 1: Update the desktop shell and stat-row tests first**

```ts
// src/components/__tests__/AppLayout.test.tsx
expect(tabs.className).toContain("max-w-7xl");
expect(tabs.className).not.toContain("max-w-6xl");
```

```ts
// src/components/__tests__/CalculatorLayout.test.tsx
const baseStatsRow = container.querySelector(
  '[data-testid="base-stats-row"]'
) as HTMLDivElement;

expect(layout.className).toContain("lg:grid-cols-[minmax(0,1fr)_24rem]");
expect(baseStatsRow.className).toContain("lg:flex-nowrap");
```

- [ ] **Step 2: Run the updated regression tests to verify the width assertions fail**

Run: `pnpm test src/components/__tests__/AppLayout.test.tsx src/components/__tests__/CalculatorLayout.test.tsx --runInBand`

Expected: FAIL because `App.tsx` still uses `max-w-6xl`, `Calculator.tsx` still uses the `22rem` desktop sidebar width, and the base stats row still wraps freely on desktop.

- [ ] **Step 3: Apply the small desktop width rebalance**

```tsx
// src/App.tsx
<Tabs defaultValue="ev" data-testid="app-tabs" className="w-full max-w-7xl">
```

```tsx
// src/components/Calculator.tsx
<div
  data-testid="calculator-layout"
  className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-2"
>
```

```tsx
// src/components/Calculator.tsx
<div
  data-testid="base-stats-row"
  className="flex flex-row items-center gap-3 flex-wrap lg:flex-nowrap"
>
  <label className="flex flex-row items-center gap-2 text-sm shrink-0">
    Species:
    <Select
      value={state.species}
      onValueChange={(value) =>
        setState((prev) => ({
          ...prev,
          species: value as SpeciesKey<V>,
        }))
      }
    >
      <SelectTrigger className="w-[170px] h-6">
        <SelectValue placeholder="Species" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(speciesOptions(state.version)).map(([key, value]) => (
          <SelectItem key={key} value={key}>
            {value.name} ({value.size})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </label>
  <AttrInput
    label="Str"
    value={state.strength}
    type="stat"
    onChange={(value) =>
      setState((prev) => ({ ...prev, strength: value }))
    }
  />
  <AttrInput
    label="Dex"
    value={state.dexterity}
    type="stat"
    onChange={(value) =>
      setState((prev) => ({ ...prev, dexterity: value }))
    }
  />
  <AttrInput
    label="Int"
    value={state.intelligence}
    type="stat"
    onChange={(value) =>
      setState((prev) => ({ ...prev, intelligence: value }))
    }
  />
</div>
```

- [ ] **Step 4: Run the full targeted verification set**

Run: `pnpm test src/components/__tests__/AppLayout.test.tsx src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/SpellModeHeader.test.tsx src/components/__tests__/MorgueImportControls.test.tsx --runInBand`

Expected: PASS across all four component suites.

Run: `pnpm build`

Expected: PASS with a production build.

- [ ] **Step 5: Commit the desktop width rebalance**

```bash
git add src/App.tsx src/components/Calculator.tsx src/components/__tests__/AppLayout.test.tsx src/components/__tests__/CalculatorLayout.test.tsx
git commit -m "fix: rebalance desktop calculator columns"
```
