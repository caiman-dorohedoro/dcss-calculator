# Desktop Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the calculator so desktop viewports show graph panels on the left and a sticky control sidebar on the right, while mobile keeps the current stacked layout and all existing interactions.

**Architecture:** Keep the top bar in `App.tsx` and widen only the desktop shell there. Move the responsive split into `Calculator.tsx` so the existing controls stay first on mobile, then shift to the right column on desktop via layout classes instead of state changes. Cover the change with two narrow jsdom component tests: one for the widened app frame, one for the calculator split and sticky control card.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind utility classes, Jest with ts-jest, `jest-environment-jsdom`

---

## File Map

### Create

- `src/components/__tests__/AppLayout.test.tsx`
- `src/components/__tests__/CalculatorLayout.test.tsx`

### Modify

- `src/App.tsx`
- `src/components/Calculator.tsx`

### Existing Tests To Keep Green

- `src/components/__tests__/MorgueImportControls.test.tsx`
- `src/versioning/__tests__/defaultState.test.ts`
- `src/versioning/__tests__/uiOptions.test.ts`

## Task 1: Widen The App Shell Without Moving The Top Bar

**Files:**
- Create: `src/components/__tests__/AppLayout.test.tsx`
- Modify: `src/App.tsx:29-79`
- Test: `src/components/__tests__/AppLayout.test.tsx`

- [ ] **Step 1: Write the failing app-shell regression test**

```tsx
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
import App from "../../App";

const mockUseCalculatorState = jest.fn();

jest.mock("@/hooks/useCalculatorState", () => ({
  useCalculatorState: () => mockUseCalculatorState(),
}));

jest.mock("@/components/Calculator", () => ({
  __esModule: true,
  default: () => <div data-testid="calculator-stub">calculator</div>,
}));

jest.mock("@/components/MorgueImportControls", () => ({
  __esModule: true,
  default: () => <div data-testid="morgue-import-stub">import</div>,
}));

describe("App desktop shell", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockUseCalculatorState.mockReturnValue({
      state: buildDefaultCalculatorState("trunk"),
      setState: jest.fn(),
      resetState: jest.fn(),
      changeVersion: jest.fn(),
      flash: false,
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    mockUseCalculatorState.mockReset();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
  });

  test("widens the desktop frame while keeping the top bar layout intact", async () => {
    await act(async () => {
      root.render(<App />);
    });

    const shell = container.querySelector(
      '[data-testid="app-shell"]'
    ) as HTMLDivElement;
    const tabs = container.querySelector(
      '[data-testid="app-tabs"]'
    ) as HTMLDivElement;

    expect(shell.className).toContain("min-h-screen");
    expect(tabs.className).toContain("max-w-6xl");
    expect(tabs.className).not.toContain("max-w-2xl");
    expect(container.textContent).toContain("DCSS Calculator");
    expect(
      container.querySelector('[data-testid="morgue-import-stub"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="calculator-stub"]')
    ).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the app-shell test to verify it fails**

Run: `pnpm test -- --runInBand src/components/__tests__/AppLayout.test.tsx`
Expected: FAIL because `App.tsx` does not yet expose `data-testid="app-shell"` / `data-testid="app-tabs"` and still uses `max-w-2xl`.

- [ ] **Step 3: Widen `App.tsx` and expose stable test hooks**

```tsx
import Calculator from "@/components/Calculator";
import MorgueImportControls from "@/components/MorgueImportControls";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCalculatorState } from "@/hooks/useCalculatorState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameVersion, gameVersions } from "@/types/game";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function App() {
  const { state, setState, resetState, changeVersion, flash } =
    useCalculatorState();
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (flash) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 150);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  return (
    <div
      data-testid="app-shell"
      className="flex min-h-screen w-screen justify-center p-1 md:p-4"
    >
      <Tabs
        defaultValue="ev"
        className="w-full max-w-6xl"
        data-testid="app-tabs"
      >
        <div
          className={cn(
            "relative overflow-hidden transition-all duration-150",
            isFlashing &&
              "bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)] after:absolute after:inset-0 after:bg-white/20 after:pointer-events-none after:z-10"
          )}
        >
          <TabsList
            className="w-full gap-x-2 relative"
            style={{ outline: "1px solid white", outlineOffset: "-4px" }}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-x-2">
              <Select
                value={state.version}
                onValueChange={(value) => changeVersion(value as GameVersion)}
              >
                <SelectTrigger className="h-5 sm:w-[120px] w-[90px] border-[#999] text-white">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  {gameVersions.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mx-auto flex items-center gap-x-2">
              <TabsTrigger value="ev">DCSS Calculator</TabsTrigger>
              <MorgueImportControls
                currentVersion={state.version}
                onApplyImport={(importedState) => setState(importedState)}
              />
            </div>
            <button
              onClick={resetState}
              className="text-sm text-muted-foreground hover:text-foreground absolute right-8"
            >
              <span className="hidden md:block">Reset to Default</span>
              <span className="block md:hidden">Reset</span>
            </button>
          </TabsList>
          <TabsContent value="ev">
            <Calculator state={state} setState={setState} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Run the app-shell test to verify it passes**

Run: `pnpm test -- --runInBand src/components/__tests__/AppLayout.test.tsx`
Expected: PASS with the desktop shell widened to `max-w-6xl` and the top bar still rendering the calculator tab plus import entry point.

- [ ] **Step 5: Commit the app-shell change**

```bash
git add src/App.tsx src/components/__tests__/AppLayout.test.tsx
git commit -m "fix: widen desktop calculator shell"
```

## Task 2: Split `Calculator.tsx` Into Desktop Columns With A Sticky Sidebar

**Files:**
- Create: `src/components/__tests__/CalculatorLayout.test.tsx`
- Modify: `src/components/Calculator.tsx:147-344`
- Test: `src/components/__tests__/CalculatorLayout.test.tsx`

- [ ] **Step 1: Write the failing calculator layout regression test**

```tsx
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
import Calculator from "../Calculator";

jest.mock("@/components/chart/SFChart", () => ({
  __esModule: true,
  default: () => <div data-testid="sf-chart">sf chart</div>,
}));

jest.mock("@/components/chart/EVChart", () => ({
  __esModule: true,
  default: () => <div data-testid="ev-chart">ev chart</div>,
}));

jest.mock("@/components/chart/ACChart", () => ({
  __esModule: true,
  default: () => <div data-testid="ac-chart">ac chart</div>,
}));

jest.mock("@/components/chart/SHChart", () => ({
  __esModule: true,
  default: () => <div data-testid="sh-chart">sh chart</div>,
}));

jest.mock("@/components/SortableAccordionItem", () => ({
  SortableAccordionItem: ({ id, title, content }: any) => (
    <section data-testid={`accordion-item-${id}`}>
      <h2>{title}</h2>
      <div>{content}</div>
    </section>
  ),
}));

jest.mock("@/assets/pixelated-github-white.png", () => ({
  __esModule: true,
  default: "github.png",
}));

describe("Calculator desktop layout", () => {
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

  test("keeps graphs on the left and a sticky control card on the right at desktop breakpoints", async () => {
    await act(async () => {
      root.render(
        <Calculator
          state={buildDefaultCalculatorState("trunk")}
          setState={mockSetState}
        />
      );
    });

    const layout = container.querySelector(
      '[data-testid="calculator-layout"]'
    ) as HTMLDivElement;
    const controls = container.querySelector(
      '[data-testid="calculator-controls-card"]'
    ) as HTMLDivElement;
    const graphs = container.querySelector(
      '[data-testid="calculator-graphs-card"]'
    ) as HTMLDivElement;

    expect(layout.className).toContain("lg:grid");
    expect(layout.className).toContain("lg:grid-cols-[minmax(0,1fr)_22rem]");
    expect(controls.className).toContain("lg:order-2");
    expect(controls.className).toContain("lg:sticky");
    expect(controls.className).toContain("lg:top-4");
    expect(graphs.className).toContain("min-w-0");
    expect(graphs.className).toContain("lg:order-1");
    expect(container.textContent).toContain("Species");
    expect(
      container.querySelector('[data-testid="accordion-item-sf"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="accordion-item-ev"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="accordion-item-ac"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="accordion-item-sh"]')
    ).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the calculator layout test to verify it fails**

Run: `pnpm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`
Expected: FAIL because `Calculator.tsx` still returns a single `Card` and does not yet expose the responsive layout test ids or desktop ordering classes.

- [ ] **Step 3: Restructure `Calculator.tsx` into a responsive mobile stack / desktop split**

```tsx
import { Fragment } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion } from "@/components/ui/accordion";
import AttrInput from "@/components/AttrInput";
import EVChart from "@/components/chart/EVChart";
import ACChart from "@/components/chart/ACChart";
import SHChart from "@/components/chart/SHChart";
import SFChart from "@/components/chart/SFChart";
import { CalculatorState } from "@/hooks/useCalculatorState";
import {
  ArmourKey,
  armourOptions,
  OrbKey,
  orbOptions,
  ShieldKey,
  shieldOptions,
} from "@/types/equipment.ts";
import { SpeciesKey, speciesOptions } from "@/types/species.ts";
import { GameVersion } from "@/types/game";
import {
  EquipmentToggleKey,
  getEquipmentToggleKeys,
} from "@/versioning/uiOptions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableAccordionItem } from "@/components/SortableAccordionItem";
import githubIcon from "@/assets/pixelated-github-white.png";

type CalculatorProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
};

const equipmentToggleLabels: Record<EquipmentToggleKey, string> = {
  helmet: "Helmet",
  cloak: "Cloak",
  gloves: "Gloves",
  boots: "Boots",
  barding: "Barding",
  secondGloves: "2nd Gloves",
};

const Calculator = <V extends GameVersion>({
  state,
  setState,
}: CalculatorProps<V>) => {
  const checkboxKeys = getEquipmentToggleKeys(state.version);

  const skillAttrKeys: Array<{ label: string; key: keyof CalculatorState<V> }> =
    [
      { label: "Armour Skill", key: "armourSkill" },
      { label: "Shield Skill", key: "shieldSkill" },
      { label: "Dodging Skill", key: "dodgingSkill" },
    ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const defaultAccordionItems = [
    {
      id: "sf",
      title: "Spell Failure Rate Calculator",
      content: <SFChart state={state} setState={setState} />,
    },
    {
      id: "ev",
      title: "EV Calculator",
      content: <EVChart state={state} />,
    },
    {
      id: "ac",
      title: "AC Calculator",
      content: <ACChart state={state} />,
    },
    {
      id: "sh",
      title: "SH Calculator",
      content: <SHChart state={state} />,
    },
  ];

  const accordionItems = [...defaultAccordionItems].sort((a, b) => {
    const aIndex = state.accordionOrder.indexOf(a.id);
    const bIndex = state.accordionOrder.indexOf(b.id);

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = accordionItems.findIndex(
      (item) => item.id === String(active.id)
    );
    const newIndex = accordionItems.findIndex(
      (item) => item.id === String(over.id)
    );

    const newItems = arrayMove(accordionItems, oldIndex, newIndex);

    setState((prev) => ({
      ...prev,
      accordionOrder: newItems.map((item) => item.id),
    }));
  };

  const controlsContent = (
    <>
      <div className="flex flex-row gap-4 items-center flex-wrap">
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
      </div>
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
    </>
  );

  return (
    <div
      data-testid="calculator-layout"
      className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
    >
      <Card
        data-testid="calculator-controls-card"
        className="lg:order-2 lg:sticky lg:top-4"
      >
        <CardHeader className="flex flex-col gap-2">
          {controlsContent}
        </CardHeader>
      </Card>
      <Card
        data-testid="calculator-graphs-card"
        className="min-w-0 lg:order-1"
      >
        <CardContent className="p-1 pb-0">
          <Accordion
            type="multiple"
            value={state.accordionValue}
            onValueChange={(value) =>
              setState((prev) => ({ ...prev, accordionValue: value }))
            }
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={accordionItems}
                strategy={verticalListSortingStrategy}
              >
                {accordionItems.map((item, index) => (
                  <SortableAccordionItem
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    content={item.content}
                    isLast={index === accordionItems.length - 1}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Accordion>
          <div className="text-right text-xs mb-1 mr-1 hover:cursor-pointer hover:underline">
            <a
              href="https://github.com/caiman-dorohedoro/dcss-calculator"
              className="inline-flex items-center gap-1"
              target="_blank"
            >
              <img src={githubIcon} alt="GitHub" width={12} height={12} />
              github
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calculator;
```

- [ ] **Step 4: Run the calculator layout test to verify it passes**

Run: `pnpm test -- --runInBand src/components/__tests__/CalculatorLayout.test.tsx`
Expected: PASS with the calculator exposing a desktop grid container, a sticky control card, and a graph card that stays first on desktop.

- [ ] **Step 5: Run the related component tests and commit the layout split**

Run: `pnpm test -- --runInBand src/components/__tests__/AppLayout.test.tsx src/components/__tests__/CalculatorLayout.test.tsx src/components/__tests__/MorgueImportControls.test.tsx`
Expected: PASS, confirming the new layout tests and the existing morgue import control test all stay green together.

```bash
git add src/components/Calculator.tsx src/components/__tests__/CalculatorLayout.test.tsx
git commit -m "fix: split desktop calculator layout"
```

## Task 3: Final Verification

**Files:**
- Verify: `src/App.tsx`
- Verify: `src/components/Calculator.tsx`
- Verify: `src/components/__tests__/AppLayout.test.tsx`
- Verify: `src/components/__tests__/CalculatorLayout.test.tsx`
- Verify: `src/components/__tests__/MorgueImportControls.test.tsx`

- [ ] **Step 1: Run lint on the final desktop layout change**

Run: `pnpm lint`
Expected: PASS with no new TypeScript or ESLint issues in `App.tsx`, `Calculator.tsx`, or the new tests.

- [ ] **Step 2: Run the production build**

Run: `pnpm build`
Expected: PASS and emit the Vite production bundle without Tailwind class or TypeScript regressions.

- [ ] **Step 3: Run the full test suite before calling the work complete**

Run: `pnpm test -- --runInBand`
Expected: PASS across the existing calculator, versioning, morgue import, and new layout tests.
