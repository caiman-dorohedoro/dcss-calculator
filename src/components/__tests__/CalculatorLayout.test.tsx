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
    expect(layout.className).toContain("lg:grid-cols-[minmax(0,1fr)_28rem]");
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
    const desktopSpellSkillControls = skillSection.querySelector(
      '[data-testid="desktop-spell-skill-controls"]'
    ) as HTMLDivElement;
    const desktopDynamicEquipmentControls = equipmentSection.querySelector(
      '[data-testid="desktop-dynamic-equipment-controls"]'
    ) as HTMLDivElement;

    expect(baseStatsSection).not.toBeNull();
    expect(skillSection).not.toBeNull();
    expect(equipmentSection).not.toBeNull();
    expect(desktopSpellSkillControls).not.toBeNull();
    expect(desktopDynamicEquipmentControls).not.toBeNull();

    expect(baseStatsSection.textContent).toContain("Species");
    expect(baseStatsSection.textContent).toContain("Str");
    expect(baseStatsSection.textContent).toContain("Dex");
    expect(baseStatsSection.textContent).toContain("Int");

    expect(skillSection.textContent).toContain("Armour");
    expect(skillSection.textContent).toContain("Shield");
    expect(skillSection.textContent).toContain("Dodging");
    expect(skillSection.textContent).toContain("Spellcasting");
    expect(skillSection.textContent).toContain("Show spell skills");
    expect(skillSection.textContent).not.toContain("conjuration");
    expect(skillSection.textContent).not.toContain("fire");
    expect(skillSection.textContent).not.toContain("translocation");
    expect(skillSection.textContent).not.toContain("Armour Skill");
    expect(skillSection.textContent).not.toContain("Shield Skill");
    expect(skillSection.textContent).not.toContain("Dodging Skill");
    expect(skillSection.textContent).not.toContain("Spellcasting Skill");
    expect(desktopSpellSkillControls.className).toContain("hidden");
    expect(desktopSpellSkillControls.className).toContain("lg:flex");
    expect(desktopSpellSkillControls.textContent).toContain("Spellcasting");
    expect(desktopSpellSkillControls.textContent).toContain("Show spell skills");
    expect(desktopSpellSkillControls.textContent).not.toContain("conjuration");
    expect(desktopSpellSkillControls.textContent).not.toContain("fire");

    expect(equipmentSection.textContent).toContain("Armour:");
    expect(equipmentSection.textContent).toContain("Shield:");
    expect(equipmentSection.textContent).toContain("Orb:");
    expect(desktopDynamicEquipmentControls.className).toContain("hidden");
    expect(desktopDynamicEquipmentControls.className).toContain("lg:flex");
    expect(desktopDynamicEquipmentControls.textContent).toContain("Ring 1");
    expect(desktopDynamicEquipmentControls.textContent).toContain("Amulet 1");
    const desktopHeadgearSection = desktopDynamicEquipmentControls.querySelector(
      '[data-testid="dynamic-equipment-headgear"]'
    ) as HTMLDivElement;
    expect(desktopHeadgearSection.textContent).toContain("Headgear:");
    expect(desktopHeadgearSection.textContent).not.toContain("present");
    expect(desktopDynamicEquipmentControls.textContent).toContain("Glove 1");
    expect(desktopDynamicEquipmentControls.textContent).not.toContain(
      "body armour ego"
    );
    expect(desktopDynamicEquipmentControls.textContent).not.toContain(
      "body armour enchant"
    );
    expect(desktopDynamicEquipmentControls.textContent).not.toContain(
      "shield enchant"
    );

    expect(equipmentSection.textContent).toContain("Ring 1");
    expect(equipmentSection.textContent).toContain("Amulet 1");
    expect(equipmentSection.textContent).toContain("Headgear:");
    expect(equipmentSection.textContent).toContain("Glove 1");
    expect(equipmentSection.textContent).toContain("Cloak");
    expect(equipmentSection.textContent).toContain("Boots");
    expect(equipmentSection.textContent).toContain("Barding");
    expect(equipmentSection.textContent).not.toContain("body armour enchant");
    expect(equipmentSection.textContent).not.toContain("body armour ego");
    expect(equipmentSection.textContent).not.toContain("shield enchant");
  });

  test("shows body armour enchant and ego only when body armour is equipped", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    const none = buildDefaultCalculatorState("trunk");
    none.armour = "none";

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    expect(
      container.querySelector('[data-testid="body-armour-enchant-control"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="body-armour-ego-control"]')
    ).not.toBeNull();
    expect(container.textContent).not.toContain("body armour enchant");
    expect(container.textContent).not.toContain("body armour ego");

    await act(async () => {
      root.render(<Calculator state={none} setState={mockSetState} />);
    });

    expect(container.textContent).not.toContain("body armour enchant");
    expect(container.textContent).not.toContain("body armour ego");
  });

  test("places body armour controls in the requested order", async () => {
    const equipped = buildDefaultCalculatorState("trunk");

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    const bodyArmourControls = equipmentSection.querySelector(
      '[data-testid="body-armour-controls"]'
    ) as HTMLDivElement;

    expect(bodyArmourControls).not.toBeNull();
    expect(bodyArmourControls.className).toContain("flex-nowrap");

    const armourLabel = equipmentSection.querySelector(
      '[data-testid="body-armour-label"]'
    ) as HTMLElement;
    const enchantControl = equipmentSection.querySelector(
      '[data-testid="body-armour-enchant-control"]'
    ) as HTMLElement;
    const selectorControl = equipmentSection.querySelector(
      '[data-testid="body-armour-selector-control"]'
    ) as HTMLElement;
    const egoControl = equipmentSection.querySelector(
      '[data-testid="body-armour-ego-control"]'
    ) as HTMLElement;

    expect(armourLabel.compareDocumentPosition(enchantControl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(enchantControl.compareDocumentPosition(selectorControl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(selectorControl.compareDocumentPosition(egoControl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  test("keeps the body armour selector shrinkable for long armour names", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.armour = "quicksilver_dragon";

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    const bodyArmourControls = container.querySelector(
      '[data-testid="body-armour-controls"]'
    ) as HTMLDivElement;
    const selectorControl = container.querySelector(
      '[data-testid="body-armour-selector-control"]'
    ) as HTMLDivElement;
    const selectorTrigger = selectorControl.querySelector("button") as HTMLButtonElement;

    expect(bodyArmourControls.className).toContain("min-w-0");
    expect(bodyArmourControls.className).toContain("max-w-full");
    expect(selectorControl.className).toContain("min-w-0");
    expect(selectorControl.className).toContain("flex-1");
    expect(selectorTrigger.className).toContain("min-w-0");
    expect(selectorTrigger.className).toContain("max-w-full");
  });

  test("shows shield enchant only when a shield is equipped", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.shield = "buckler";
    const none = buildDefaultCalculatorState("trunk");
    none.shield = "none";

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    expect(
      container.querySelector('[data-testid="shield-enchant-control"]')
    ).not.toBeNull();
    expect(container.textContent).not.toContain("shield enchant");

    await act(async () => {
      root.render(<Calculator state={none} setState={mockSetState} />);
    });

    expect(
      container.querySelector('[data-testid="shield-enchant-control"]')
    ).toBeNull();
    expect(container.textContent).not.toContain("shield enchant");
  });

  test("places shield controls with enchant before the shield selector", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.shield = "buckler";

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    const shieldLabel = equipmentSection.querySelector(
      '[data-testid="shield-label"]'
    ) as HTMLElement;
    const enchantControl = equipmentSection.querySelector(
      '[data-testid="shield-enchant-control"]'
    ) as HTMLElement;
    const selectorControl = equipmentSection.querySelector(
      '[data-testid="shield-selector-control"]'
    ) as HTMLElement;

    expect(shieldLabel.compareDocumentPosition(enchantControl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(enchantControl.compareDocumentPosition(selectorControl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});
