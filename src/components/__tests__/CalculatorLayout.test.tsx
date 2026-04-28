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
    expect(layout.className).toContain("lg:grid-cols-[minmax(0,1fr)_32rem]");
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
    const speciesSelectTrigger = speciesLabel?.querySelector(
      'button[role="combobox"]'
    ) as HTMLButtonElement;
    expect(speciesSelectTrigger).not.toBeNull();
    expect(speciesSelectTrigger.className).not.toContain("w-[180px]");
    expect(speciesSelectTrigger.className).toContain("w-full");
    expect(baseStatsRow).not.toBeNull();
    expect(baseStatsRow.className).toContain("grid");
    expect(baseStatsRow.className).toContain("grid-cols-3");
    expect(baseStatsRow.className).toContain("gap-2");
    expect(baseStatsRow.className).not.toContain("flex-wrap");
    const baseStatInputs = Array.from(
      baseStatsRow.querySelectorAll('input[type="number"]')
    ) as HTMLInputElement[];
    expect(baseStatInputs).toHaveLength(3);
    expect(baseStatInputs.map((input) => input.className)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("w-14"),
        expect.stringContaining("w-14"),
        expect.stringContaining("w-14"),
      ])
    );
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
    const skillStatsRow = skillSection.querySelector(
      '[data-testid="skill-stats-row"]'
    ) as HTMLDivElement;
    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    const sidebarSpellSkillControls = skillSection.querySelector(
      '[data-testid="sidebar-spell-skill-controls"]'
    ) as HTMLDivElement;
    const sidebarDynamicEquipmentControls = equipmentSection.querySelector(
      '[data-testid="sidebar-dynamic-equipment-controls"]'
    ) as HTMLDivElement;

    expect(baseStatsSection).not.toBeNull();
    expect(skillSection).not.toBeNull();
    expect(equipmentSection).not.toBeNull();
    expect(sidebarSpellSkillControls).not.toBeNull();
    expect(sidebarDynamicEquipmentControls).not.toBeNull();

    expect(baseStatsSection.textContent).toContain("Species");
    expect(baseStatsSection.textContent).toContain("Str");
    expect(baseStatsSection.textContent).toContain("Dex");
    expect(baseStatsSection.textContent).toContain("Int");

    expect(skillSection.textContent).toContain("Armour");
    expect(skillSection.textContent).toContain("Shield");
    expect(skillSection.textContent).toContain("Dodging");
    expect(skillSection.textContent).toContain("Show spell skills");
    expect(skillSection.textContent).not.toContain("Spellcasting");
    expect(skillSection.textContent).not.toContain("conjuration");
    expect(skillSection.textContent).not.toContain("fire");
    expect(skillSection.textContent).not.toContain("translocation");
    expect(skillSection.textContent).not.toContain("Armour Skill");
    expect(skillSection.textContent).not.toContain("Shield Skill");
    expect(skillSection.textContent).not.toContain("Dodging Skill");
    expect(skillSection.textContent).not.toContain("Spellcasting Skill");
    expect(skillStatsRow.className).toContain("lg:flex-nowrap");
    expect(sidebarSpellSkillControls.className).not.toContain("hidden");
    expect(sidebarSpellSkillControls.className).not.toContain("lg:flex");
    expect(sidebarSpellSkillControls.textContent).toContain("Show spell skills");
    expect(sidebarSpellSkillControls.textContent).not.toContain("Spellcasting");
    expect(sidebarSpellSkillControls.textContent).not.toContain("conjuration");
    expect(sidebarSpellSkillControls.textContent).not.toContain("fire");

    expect(equipmentSection.textContent).toContain("Offhand:");
    expect(equipmentSection.textContent).toContain("Armour:");
    expect(equipmentSection.textContent).not.toContain("Shield:");
    expect(equipmentSection.textContent).not.toContain("Orb:");
    expect(sidebarDynamicEquipmentControls.className).not.toContain("hidden");
    expect(sidebarDynamicEquipmentControls.className).not.toContain("lg:flex");
    expect(sidebarDynamicEquipmentControls.textContent).toContain("Ring 1");
    expect(sidebarDynamicEquipmentControls.textContent).toContain("Amulet:");
    expect(sidebarDynamicEquipmentControls.textContent).not.toContain("Amulet 1");
    const sidebarDynamicEquipmentList = sidebarDynamicEquipmentControls.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;
    const sidebarHeadgearRow = sidebarDynamicEquipmentList.querySelector(
      '[data-testid="equipment-row-headgear-0"]'
    ) as HTMLButtonElement;
    expect(sidebarHeadgearRow.textContent).toContain("Headgear:");
    expect(sidebarHeadgearRow.textContent).not.toContain("present");
    expect(sidebarDynamicEquipmentControls.textContent).toContain("Glove:");
    expect(sidebarDynamicEquipmentControls.textContent).not.toContain("Glove 1");
    expect(sidebarDynamicEquipmentControls.textContent).not.toContain(
      "body armour ego"
    );
    expect(sidebarDynamicEquipmentControls.textContent).not.toContain(
      "body armour enchant"
    );
    expect(sidebarDynamicEquipmentControls.textContent).not.toContain(
      "shield enchant"
    );

    expect(equipmentSection.textContent).toContain("Ring 1");
    expect(equipmentSection.textContent).toContain("Amulet:");
    expect(equipmentSection.textContent).toContain("Headgear:");
    expect(equipmentSection.textContent).toContain("Glove:");
    expect(equipmentSection.textContent).toContain("Cloak");
    expect(equipmentSection.textContent).toContain("Footwear");
    expect(equipmentSection.textContent).not.toContain("Boots");
    expect(equipmentSection.textContent).not.toContain("Barding");
    const equipmentHeadings = Array.from(
      equipmentSection.querySelectorAll("h2")
    ).map((heading) => heading.textContent);
    expect(equipmentHeadings).not.toEqual(
      expect.arrayContaining([
        "Rings",
        "Amulets",
        "Headgear",
        "Gloves",
        "Fixed Equipment",
      ])
    );
    expect(equipmentSection.textContent).not.toContain("body armour enchant");
    expect(equipmentSection.textContent).not.toContain("body armour ego");
    expect(equipmentSection.textContent).not.toContain("shield enchant");
  });

  test("shows imported god and active success bonus above species as read-only sidebar text", async () => {
    const state = {
      ...buildDefaultCalculatorState("trunk"),
      god: "Vehumet",
      godPietyDisplay: "***...",
      godPietyRank: 3,
      godUnderPenance: false,
    };

    await act(async () => {
      root.render(<Calculator state={state} setState={mockSetState} />);
    });

    const godStatus = container.querySelector(
      '[data-testid="god-status"]'
    ) as HTMLDivElement;

    const baseStatsSection = container.querySelector(
      '[data-testid="sidebar-section-base-stats"]'
    ) as HTMLDivElement;
    const baseStatsText = baseStatsSection.textContent ?? "";

    expect(godStatus).not.toBeNull();
    expect(baseStatsText.indexOf("God:")).toBeLessThan(
      baseStatsText.indexOf("Species")
    );
    expect(godStatus.textContent).toContain("God:");
    expect(godStatus.textContent).toContain("Vehumet [***...]");
    expect(godStatus.textContent).toContain("Success bonus active");
    const activeBadge = Array.from(godStatus.querySelectorAll("span")).find(
      (span) => span.textContent === "Success bonus active"
    ) as HTMLSpanElement;
    expect(activeBadge.className).toContain("text-emerald");
    expect(activeBadge.className).not.toContain("text-muted-foreground");
    expect(godStatus.querySelector("input")).toBeNull();
    expect(godStatus.querySelector('button[role="combobox"]')).toBeNull();
  });

  test("orders equipment rows like the supported subset of Crawl status equipment", async () => {
    await act(async () => {
      root.render(
        <Calculator
          state={buildDefaultCalculatorState("trunk")}
          setState={mockSetState}
        />
      );
    });

    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    const rowIds = Array.from(
      equipmentSection.querySelectorAll('[data-testid^="equipment-row-"]')
    ).map((row) => row.getAttribute("data-testid"));

    expect(rowIds.slice(0, 10)).toEqual([
      "equipment-row-offhand",
      "equipment-row-body-armour",
      "equipment-row-headgear-0",
      "equipment-row-cloak",
      "equipment-row-glove-0",
      "equipment-row-footwear",
      "equipment-row-amulet-0",
      "equipment-row-ring-0",
      "equipment-row-ring-1",
    ]);
  });

  test("uses one offhand row for mutually exclusive shield and orb equipment", async () => {
    const shieldState = buildDefaultCalculatorState("trunk");
    shieldState.shield = "kite_shield";
    shieldState.shieldItem = {
      ...shieldState.shieldItem,
      kind: "kite_shield",
      enchant: 2,
    };
    shieldState.orb = "none";

    await act(async () => {
      root.render(<Calculator state={shieldState} setState={mockSetState} />);
    });

    let equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    let offhandRow = equipmentSection.querySelector(
      '[data-testid="equipment-row-offhand"]'
    ) as HTMLButtonElement;

    expect(offhandRow.textContent).toContain("Offhand:");
    expect(offhandRow.textContent).toContain("+2 kite shield");
    expect(equipmentSection.textContent).not.toContain("Shield:");
    expect(equipmentSection.textContent).not.toContain("Orb:");

    const orbState = buildDefaultCalculatorState("trunk");
    orbState.shield = "none";
    orbState.orb = "energy";
    orbState.orbItem = {
      ...orbState.orbItem,
      kind: "energy",
      modifiers: { wizardry: 1 },
    };

    await act(async () => {
      root.render(<Calculator state={orbState} setState={mockSetState} />);
    });

    equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    offhandRow = equipmentSection.querySelector(
      '[data-testid="equipment-row-offhand"]'
    ) as HTMLButtonElement;

    expect(offhandRow.textContent).toContain("Offhand:");
    expect(offhandRow.textContent).toContain("orb of energy {Wiz+1}");
    expect(equipmentSection.textContent).not.toContain("Shield:");
    expect(equipmentSection.textContent).not.toContain("Orb:");
  });

  test("renders body armour and offhand equipment as summary rows", async () => {
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

    expect(
      equipmentSection.querySelector('[data-testid="equipment-row-body-armour"]')
        ?.textContent
    ).toContain("+4 leather armour of resonance {Int+3}");
    expect(
      equipmentSection.querySelector('[data-testid="equipment-row-offhand"]')
        ?.textContent
    ).toContain("+2 kite shield");
    expect(equipmentSection.textContent).not.toContain("Orb:");
    expect(
      equipmentSection.querySelector(
        '[data-testid="body-armour-selector-control"]'
      )
    ).toBeNull();
    expect(
      equipmentSection.querySelector('[data-testid="shield-selector-control"]')
    ).toBeNull();
  });

  test("shows body armour enchant and ego in the modal only when body armour is equipped", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    const none = buildDefaultCalculatorState("trunk");
    none.armour = "none";
    none.bodyArmour = {
      ...none.bodyArmour,
      kind: "none",
      enchant: 0,
      ego: "none",
    };

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-body-armour"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('input[aria-label="Body armour enchant"]')
    ).not.toBeNull();
    expect(
      document.body.querySelector('button[aria-label="Body armour ego"]')
    ).not.toBeNull();
    expect(container.textContent).not.toContain("body armour enchant");
    expect(container.textContent).not.toContain("body armour ego");

    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="cancel-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    await act(async () => {
      root.render(<Calculator state={none} setState={mockSetState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-body-armour"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('input[aria-label="Body armour enchant"]')
    ).toBeNull();
    expect(
      document.body.querySelector('button[aria-label="Body armour ego"]')
    ).toBeNull();
    expect(container.textContent).not.toContain("body armour enchant");
    expect(container.textContent).not.toContain("body armour ego");
  });

  test("shows parser-aligned body armour ego in the modal", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.armour = "robe";
    equipped.bodyArmour = {
      ...equipped.bodyArmour,
      kind: "robe",
      enchant: 2,
      ego: "willpower",
      modifiers: { will: 1 },
    };

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-body-armour"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('button[aria-label="Body armour ego"]')
        ?.textContent
    ).toContain("Willpower");
  });

  test("places body armour in a single summary row", async () => {
    const equipped = buildDefaultCalculatorState("trunk");

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    const bodyArmourRow = equipmentSection.querySelector(
      '[data-testid="equipment-row-body-armour"]'
    ) as HTMLButtonElement;

    expect(bodyArmourRow).not.toBeNull();
    expect(bodyArmourRow.textContent).toContain("Armour:");
    expect(bodyArmourRow.className).toContain("py-0.5");
    expect(bodyArmourRow.querySelector('input[type="number"]')).toBeNull();
    expect(bodyArmourRow.querySelector('button[role="combobox"]')).toBeNull();
  });

  test("keeps the body armour row shrinkable for long armour names", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.armour = "quicksilver_dragon";
    equipped.bodyArmour = {
      ...equipped.bodyArmour,
      kind: "quicksilver_dragon",
    };

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    const bodyArmourRow = container.querySelector(
      '[data-testid="equipment-row-body-armour"]'
    ) as HTMLButtonElement;

    expect(bodyArmourRow.className).toContain("min-w-0");
    expect(bodyArmourRow.textContent).toContain("quicksilver dragon scales");
  });

  test("renders body armour and equipped offhand modifiers in summary rows", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.bodyArmour = {
      ...equipped.bodyArmour,
      modifiers: { int: 3 },
    };
    equipped.shield = "kite_shield";
    equipped.shieldItem = {
      ...equipped.shieldItem,
      kind: "kite_shield",
      modifiers: { sh: 2 },
    };

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;

    expect(equipmentSection.textContent).toContain("Armour");
    expect(equipmentSection.textContent).toContain("Offhand");
    expect(equipmentSection.textContent).toContain("Int+3");
    expect(equipmentSection.textContent).toContain("SH+2");
    expect(equipmentSection.textContent).not.toContain("Modifiers");
    expect(
      equipmentSection
        .querySelector('[data-testid="equipment-row-body-armour"]')
        ?.querySelector('input[type="number"]')
    ).toBeNull();
    expect(
      equipmentSection
        .querySelector('[data-testid="equipment-row-offhand"]')
        ?.querySelector('input[type="number"]')
    ).toBeNull();
  });

  test("shows shield enchant in the modal only when a shield is equipped", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.shield = "buckler";
    equipped.shieldItem = {
      ...equipped.shieldItem,
      kind: "buckler",
    };
    const none = buildDefaultCalculatorState("trunk");
    none.shield = "none";

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-offhand"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('input[aria-label="Shield enchant"]')
    ).not.toBeNull();
    expect(container.textContent).not.toContain("shield enchant");

    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="cancel-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    await act(async () => {
      root.render(<Calculator state={none} setState={mockSetState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-offhand"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('input[aria-label="Shield enchant"]')
    ).toBeNull();
    expect(container.textContent).not.toContain("shield enchant");
  });

  test("opens shield modal controls from the offhand summary row", async () => {
    const equipped = buildDefaultCalculatorState("trunk");
    equipped.shield = "buckler";
    equipped.shieldItem = {
      ...equipped.shieldItem,
      kind: "buckler",
    };

    await act(async () => {
      root.render(<Calculator state={equipped} setState={mockSetState} />);
    });

    const equipmentSection = container.querySelector(
      '[data-testid="sidebar-section-equipment"]'
    ) as HTMLDivElement;
    const shieldRow = equipmentSection.querySelector(
      '[data-testid="equipment-row-offhand"]'
    ) as HTMLButtonElement;

    expect(shieldRow.textContent).toContain("Offhand:");
    expect(shieldRow.querySelector('input[type="number"]')).toBeNull();

    await act(async () => {
      shieldRow.click();
    });

    expect(document.body.textContent).toContain("Equipment Details");
    expect(document.body.querySelector('button[aria-label="Shield"]')).not.toBeNull();
    expect(
      document.body.querySelector('input[aria-label="Shield enchant"]')
    ).not.toBeNull();
    expect(
      (
        document.body.querySelector(
          'input[aria-label="Shield enchant"]'
        ) as HTMLInputElement
      ).className
    ).toContain("h-8");
    expect(
      (
        document.body.querySelector(
          'input[aria-label="Shield enchant"]'
        ) as HTMLInputElement
      ).className
    ).toContain("w-16");
    expect(
      Array.from(
        (
          document.body.querySelector(
            '[data-testid="shield-enchant-type-row"]'
          ) as HTMLDivElement
        ).querySelectorAll("input,button")
      ).map((control) => control.getAttribute("aria-label"))
    ).toEqual(["Shield enchant", "Shield"]);
  });

  test("shows shield and orb equipment ego selectors in offhand modals", async () => {
    const shieldState = buildDefaultCalculatorState("trunk");
    shieldState.shield = "buckler";
    shieldState.shieldItem = {
      ...shieldState.shieldItem,
      kind: "buckler",
      enchant: 2,
      ego: "reflection",
      modifiers: { flags: ["Reflect"] },
    };

    await act(async () => {
      root.render(<Calculator state={shieldState} setState={mockSetState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-offhand"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('button[aria-label="Shield ego"]')?.textContent
    ).toContain("Reflection");

    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="cancel-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    const orbState = buildDefaultCalculatorState("trunk");
    orbState.shield = "none";
    orbState.orb = "energy";
    orbState.orbItem = {
      ...orbState.orbItem,
      kind: "energy",
      ego: "energy",
    };

    await act(async () => {
      root.render(<Calculator state={orbState} setState={mockSetState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-offhand"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('button[aria-label="Orb ego"]')?.textContent
    ).toContain("Energy");
  });

  test("clears imported body armour display metadata only after a saved edit", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.armour = "robe";
    state.bodyArmour = {
      kind: "robe",
      enchant: 5,
      ego: "none",
      displayName: "justicar's regalia",
      propertiesText: "Inspire Amulet+ Str+4",
      artifactKind: "unrand",
      source: "imported",
      modifiers: { flags: ["Inspire", "Amulet+"], str: 4 },
    };

    await act(async () => {
      root.render(<Calculator state={state} setState={mockSetState} />);
    });

    expect(
      (
        container.querySelector(
          '[data-testid="equipment-row-body-armour"]'
        ) as HTMLButtonElement
      ).textContent
    ).toContain("+5 justicar's regalia {Inspire Amulet+ Str+4}");

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-body-armour"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(document.body.textContent).not.toContain("Imported item");
    expect(document.body.textContent).toContain("justicar's regalia");
    expect(document.body.textContent).toContain("robe");
    const titleRow = document.body.querySelector(
      '[data-testid="equipment-modal-title-row"]'
    ) as HTMLDivElement;
    expect(titleRow.className).toContain("gap-5");
    expect(titleRow.textContent).toContain("Armour");
    expect(titleRow.textContent).toContain(
      "+5 justicar's regalia {Inspire Amulet+ Str+4}"
    );
    expect(document.body.textContent).not.toContain("Base armour");
    expect(
      document.body.querySelector(
        '[data-testid="equipment-modal-imported-summary"]'
      )?.textContent
    ).toBe("+5 justicar's regalia {Inspire Amulet+ Str+4}");
    expect(
      Array.from(
        (
          document.body.querySelector(
            '[data-testid="body-armour-enchant-type-row"]'
          ) as HTMLDivElement
        ).querySelectorAll("input,button")
      ).map((control) => control.getAttribute("aria-label"))
    ).toEqual(["Body armour enchant", "Armour"]);

    await act(async () => {
      setNumberInputValue(
        document.body.querySelector(
          'input[aria-label="Body armour enchant"]'
        ) as HTMLInputElement,
        "6"
      );
    });

    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="save-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(mockSetState).toHaveBeenCalledTimes(1);
    const updater = mockSetState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;
    const nextState = updater(state);

    expect(nextState.bodyArmour).toMatchObject({
      kind: "robe",
      enchant: 6,
      ego: "none",
      displayName: undefined,
      propertiesText: undefined,
      artifactKind: undefined,
      source: undefined,
    });
  });
});
