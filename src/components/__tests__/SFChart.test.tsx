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
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";

await jest.unstable_mockModule("recharts", () => ({
  CartesianGrid: () => null,
  Legend: ({ wrapperStyle }: { wrapperStyle?: React.CSSProperties }) => (
    <div
      data-testid="chart-legend"
      data-margin-left={wrapperStyle?.marginLeft}
    />
  ),
  Line: ({
    dataKey,
    name,
    stroke,
    strokeDasharray,
  }: {
    dataKey?: string;
    name?: string;
    stroke?: string;
    strokeDasharray?: string;
  }) => (
    <div
      data-testid="chart-line"
      data-key={dataKey}
      data-name={name}
      data-stroke={stroke}
      data-stroke-dasharray={strokeDasharray}
    />
  ),
  LineChart: ({ children }: { children?: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Area: ({ dataKey, name }: { dataKey?: string; name?: string }) => (
    <div data-testid="chart-area" data-key={dataKey} data-name={name} />
  ),
  ComposedChart: ({ children }: { children?: ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => null,
  XAxis: ({
    label,
  }: {
    label?: (props: {
      viewBox?: { x: number; y: number; width: number; height: number };
    }) => ReactNode;
  }) => (
    <svg data-testid="x-axis-label">
      {label?.({ viewBox: { x: 0, y: 0, width: 100, height: 20 } })}
    </svg>
  ),
  YAxis: () => null,
}));

await jest.unstable_mockModule("@/components/chart/SkillDotRenderer", () => ({
  __esModule: true,
  default: () => null,
}));

await jest.unstable_mockModule("@/components/chart/CustomSpellTick", () => ({
  __esModule: true,
  default: () => null,
}));

const { default: SFChart } = await import("../chart/SFChart");

describe("SFChart layout", () => {
  let container: HTMLDivElement;
  let root: Root;
  const setState = jest.fn();

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
    setState.mockReset();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
  });

  test("does not render mobile-only controls inside the spell failure panel", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    expect(
      container.querySelector(
        '[data-testid="mobile-spell-controls"]'
      )
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="mobile-spell-skill-controls"]'
      )
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="mobile-dynamic-equipment-controls"]'
      )
    ).toBeNull();
    expect(container.textContent).toContain("Spell:");
    expect(
      container.querySelector('[data-testid="responsive-container"]')
    ).not.toBeNull();
  });

  test("omits the trailing Skill word from the x axis label", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.targetSpell = "Ignite Poison";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    expect(
      container.querySelector('[data-testid="x-axis-label"]')?.textContent
    ).toBe("Skill Average");

    state.targetSpell = "Olgreb's Toxic Radiance";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    expect(
      container.querySelector('[data-testid="x-axis-label"]')?.textContent
    ).toBe("alchemy");
  });

  test("renders a Vehumet preview line only before the success bonus is active", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.god = "Vehumet";
    state.godPietyRank = 1;
    state.godUnderPenance = false;
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    const vehumetLine = container.querySelector(
      '[data-testid="chart-line"][data-key="vehumetPreviewSpellFailureRate"]'
    ) as HTMLDivElement;

    expect(vehumetLine).not.toBeNull();
    expect(vehumetLine.dataset.name).toBe(" Vehumet support preview");
    expect(vehumetLine.dataset.stroke).toBe("#34d399");
    expect(vehumetLine.dataset.strokeDasharray).toBe("4 4");

    await act(async () => {
      root.render(
        <SFChart
          state={{ ...state, godPietyRank: 3, targetSpell: "Fireball" }}
          setState={setState}
        />
      );
    });

    expect(
      container.querySelector(
        '[data-testid="chart-line"][data-key="vehumetPreviewSpellFailureRate"]'
      )
    ).toBeNull();
  });

  test("keeps the default legend offset when fewer than three lines are visible", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    expect(
      container.querySelector('[data-testid="chart-legend"]')?.getAttribute(
        "data-margin-left"
      )
    ).toBe("-150px");
  });

  test("renders a precision range band behind the current failure line", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.targetSpell = "Swiftness";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    const precisionBand = container.querySelector(
      '[data-testid="chart-area"][data-key="spellFailureRange"]'
    ) as HTMLDivElement;

    expect(precisionBand).not.toBeNull();
    expect(precisionBand.dataset.name).toBe(" Precision range");
  });

  test("uses a middle legend offset when one optional line is visible", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.god = "Vehumet";
    state.godPietyRank = 1;
    state.godUnderPenance = false;
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    expect(
      container.querySelector('[data-testid="chart-legend"]')?.getAttribute(
        "data-margin-left"
      )
    ).toBe("-100px");

    await act(async () => {
      root.render(
        <SFChart
          state={{ ...state, god: "No God", species: "revenant" }}
          setState={setState}
        />
      );
    });

    expect(
      container.querySelector('[data-testid="chart-legend"]')?.getAttribute(
        "data-margin-left"
      )
    ).toBe("-100px");
  });

  test("moves the legend right when current, Enkindle, and Vehumet preview are visible", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "revenant";
    state.god = "Vehumet";
    state.godPietyRank = 1;
    state.godUnderPenance = false;
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    expect(container.querySelectorAll('[data-testid="chart-line"]')).toHaveLength(
      3
    );
    expect(
      container.querySelector('[data-testid="chart-legend"]')?.getAttribute(
        "data-margin-left"
      )
    ).toBe("-55px");
  });
});
