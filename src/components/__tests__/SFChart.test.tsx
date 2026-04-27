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
  Legend: () => null,
  Line: () => null,
  LineChart: ({ children }: { children?: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => null,
  XAxis: () => null,
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
});
