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

type SortableAccordionItemMockProps = {
  id: string;
  title: string;
  content: ReactNode;
};

await jest.unstable_mockModule("@/components/chart/SFChart", () => ({
  __esModule: true,
  default: () => <div data-testid="sf-chart">sf chart</div>,
}));

await jest.unstable_mockModule("@/components/chart/EVChart", () => ({
  __esModule: true,
  default: () => <div data-testid="ev-chart">ev chart</div>,
}));

await jest.unstable_mockModule("@/components/chart/ACChart", () => ({
  __esModule: true,
  default: () => <div data-testid="ac-chart">ac chart</div>,
}));

await jest.unstable_mockModule("@/components/chart/SHChart", () => ({
  __esModule: true,
  default: () => <div data-testid="sh-chart">sh chart</div>,
}));

await jest.unstable_mockModule("@/components/SortableAccordionItem", () => ({
  SortableAccordionItem: ({
    id,
    title,
    content,
  }: SortableAccordionItemMockProps) => (
    <section data-testid={`accordion-item-${id}`}>
      <h2>{title}</h2>
      <div>{content}</div>
    </section>
  ),
}));

await jest.unstable_mockModule("@/assets/pixelated-github-white.png", () => ({
  __esModule: true,
  default: "github.png",
}));

const { default: Calculator } = await import("../Calculator");

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
    expect(layout.className).toContain("lg:grid-cols-[minmax(0,1fr)_24rem]");
    expect(
      container.querySelector('[data-testid="calculator-mobile-card"]')
    ).toBeNull();
    const baseStatsRow = container.querySelector(
      '[data-testid="base-stats-row"]'
    ) as HTMLDivElement;
    const baseStatsSection = container.querySelector(
      '[data-testid="sidebar-section-base-stats"]'
    ) as HTMLDivElement;
    expect(
      container.querySelectorAll('[data-testid="calculator-controls-card"]')
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="calculator-graphs-card"]')
    ).toHaveLength(1);
    expect(controls.className).toContain("lg:order-2");
    expect(controls.className).toContain("lg:sticky");
    expect(controls.className).toContain("lg:top-4");
    expect(graphs.className).toContain("min-w-0");
    expect(graphs.className).toContain("lg:order-1");
    const speciesLabel = Array.from(
      baseStatsSection.querySelectorAll("label")
    ).find((label) => label.textContent?.includes("Species"));
    expect(speciesLabel).toBeDefined();
    expect(speciesLabel?.className).toContain("lg:basis-full");
    const desktopSpellControls = container.querySelector(
      '[data-testid="desktop-spell-controls"]'
    ) as HTMLDivElement;
    expect(desktopSpellControls).not.toBeNull();
    expect(desktopSpellControls.className).toContain("hidden");
    expect(desktopSpellControls.className).toContain("lg:flex");
    expect(baseStatsRow).not.toBeNull();
    expect(baseStatsRow.className).toContain("lg:flex-nowrap");
    expect(baseStatsRow.textContent).toContain("Str");
    expect(baseStatsRow.textContent).toContain("Dex");
    expect(baseStatsRow.textContent).toContain("Int");
    expect(baseStatsSection.textContent).toContain("Species");
    expect(
      container.querySelectorAll('[data-testid="accordion-item-sf"]')
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="accordion-item-ev"]')
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="accordion-item-ac"]')
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="accordion-item-sh"]')
    ).toHaveLength(1);
  });

  test("groups the right sidebar into base stats, skill, and equipment sections", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(<Calculator state={state} setState={mockSetState} />);
    });

    const baseStatsSection = container.querySelector(
      '[data-testid="sidebar-section-base-stats"]'
    ) as HTMLDivElement;
    const skillSection = container.querySelector(
      '[data-testid="sidebar-section-skill"]'
    ) as HTMLDivElement;
    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    const desktopSpellControls = container.querySelector(
      '[data-testid="desktop-spell-controls"]'
    ) as HTMLDivElement;

    expect(baseStatsSection).not.toBeNull();
    expect(skillSection).not.toBeNull();
    expect(equipmentSection).not.toBeNull();
    expect(desktopSpellControls).not.toBeNull();

    expect(baseStatsSection.textContent).toContain("Species");
    expect(baseStatsSection.textContent).toContain("Str");
    expect(baseStatsSection.textContent).toContain("Dex");
    expect(baseStatsSection.textContent).toContain("Int");

    expect(skillSection.textContent).toContain("Armour");
    expect(skillSection.textContent).toContain("Shield");
    expect(skillSection.textContent).toContain("Dodging");
    expect(skillSection.textContent).not.toContain("Spellcasting");
    expect(skillSection.textContent).not.toContain("conjuration");
    expect(skillSection.textContent).not.toContain("fire");
    expect(skillSection.textContent).not.toContain("translocation");
    expect(skillSection.textContent).not.toContain("Armour Skill");
    expect(skillSection.textContent).not.toContain("Shield Skill");
    expect(skillSection.textContent).not.toContain("Dodging Skill");
    expect(skillSection.textContent).not.toContain("Spellcasting Skill");

    expect(desktopSpellControls.className).toContain("hidden");
    expect(desktopSpellControls.className).toContain("lg:flex");
    expect(desktopSpellControls.textContent).toContain("Spellcasting");
    expect(desktopSpellControls.textContent).toContain("conjuration");
    expect(desktopSpellControls.textContent).toContain("fire");
    expect(desktopSpellControls.textContent).toContain("ring of wizardry");
    expect(desktopSpellControls.textContent).toContain("wild magic (mutation)");
    expect(desktopSpellControls.textContent).toContain("body armour ego");

    expect(equipmentSection.textContent).toContain("Armour:");
    expect(equipmentSection.textContent).toContain("Shield:");
    expect(equipmentSection.textContent).toContain("Orb:");
    expect(equipmentSection.textContent).toContain("Helmet");
  });
});
