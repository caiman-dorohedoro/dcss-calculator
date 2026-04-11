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
    const mobileSpellSkillControls = mobileSpellControls.querySelector(
      '[data-testid="mobile-spell-skill-controls"]'
    ) as HTMLDivElement;
    const mobileSpellEquipmentControls = mobileSpellControls.querySelector(
      '[data-testid="mobile-spell-equipment-controls"]'
    ) as HTMLDivElement;

    expect(mobileSpellControls).not.toBeNull();
    expect(mobileSpellControls.className).toContain("lg:hidden");
    expect(mobileSpellSkillControls).not.toBeNull();
    expect(mobileSpellEquipmentControls).not.toBeNull();
    expect(container.textContent).toContain("Spell:");
    expect(mobileSpellSkillControls.textContent).toContain("Spellcasting");
    expect(mobileSpellSkillControls.textContent).toContain("conjuration");
    expect(mobileSpellSkillControls.textContent).toContain("fire");
    expect(mobileSpellEquipmentControls.textContent).toContain(
      "ring of wizardry"
    );
    expect(mobileSpellEquipmentControls.textContent).toContain(
      "wild magic (mutation)"
    );
    expect(mobileSpellEquipmentControls.textContent).toContain(
      "body armour ego"
    );
  });
});
