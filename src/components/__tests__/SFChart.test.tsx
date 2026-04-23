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
    const mobileDynamicEquipmentControls = mobileSpellControls.querySelector(
      '[data-testid="mobile-dynamic-equipment-controls"]'
    ) as HTMLDivElement;

    expect(mobileSpellControls).not.toBeNull();
    expect(mobileSpellControls.className).toContain("lg:hidden");
    expect(mobileSpellSkillControls).not.toBeNull();
    expect(mobileDynamicEquipmentControls).not.toBeNull();
    expect(container.textContent).toContain("Spell:");
    expect(mobileSpellSkillControls.textContent).toContain("Show spell skills");
    expect(mobileSpellSkillControls.textContent).not.toContain("Spellcasting");
    expect(mobileSpellSkillControls.textContent).not.toContain("conjuration");
    expect(mobileSpellSkillControls.textContent).not.toContain("fire");
    expect(mobileDynamicEquipmentControls.textContent).toContain("Ring 1");
    expect(mobileDynamicEquipmentControls.textContent).toContain("Amulet 1");
    const mobileDynamicEquipmentList = mobileDynamicEquipmentControls.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;
    const mobileHeadgearRow = mobileDynamicEquipmentList.querySelector(
      '[data-testid="equipment-row-headgear-0"]'
    ) as HTMLButtonElement;
    expect(mobileHeadgearRow.textContent).toContain("Headgear:");
    expect(mobileHeadgearRow.textContent).not.toContain("present");
    expect(mobileDynamicEquipmentControls.textContent).toContain("Glove 1");
    expect(mobileDynamicEquipmentControls.textContent).not.toContain(
      "body armour ego"
    );
  });
});
