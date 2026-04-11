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

describe("SFChart mobile spell controls", () => {
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

  test("renders mobile spell controls with the spell failure panel", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(<SFChart state={state} setState={setState} />);
    });

    const mobileSpellControls = container.querySelector(
      '[data-testid="mobile-spell-controls"]'
    ) as HTMLDivElement;

    expect(mobileSpellControls).not.toBeNull();
    expect(mobileSpellControls.className).toContain("lg:hidden");
    expect(container.textContent).toContain("Spell:");
    expect(container.textContent).toContain("Spellcasting");
    expect(container.textContent).toContain("conjuration");
    expect(container.textContent).toContain("fire");
    expect(container.textContent).toContain("ring of wizardry");
    expect(container.textContent).toContain("wild magic (mutation)");
    expect(container.textContent).toContain("body armour ego");
  });
});
