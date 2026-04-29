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
import type { ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  clearAmuletSlotMetadata,
  clearAuxArmourSlotMetadata,
  clearRingSlotMetadata,
  applyRingSlotUpdate,
} from "@/types/equipmentSlots";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import AttrInput from "../AttrInput";

const SignedAttrInput = AttrInput as unknown as ComponentType<{
  label: string;
  value: number;
  type: "number";
  min: number;
  onChange: (value: number) => void;
}>;

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

const setTextInputValue = (input: HTMLInputElement, value: string) => {
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

const setSelectValue = (select: HTMLSelectElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    "value"
  )?.set;

  if (!valueSetter) {
    throw new Error("Could not find select value setter");
  }

  valueSetter.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
};

const {
  default: DynamicEquipmentControls,
} = await import("../DynamicEquipmentControls");

describe("DynamicEquipmentControls", () => {
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

  test("passes signed minimum values through AttrInput", async () => {
    await act(async () => {
      root.render(
        <SignedAttrInput
          label="Enchant"
          value={0}
          type="number"
          min={-9}
          onChange={jest.fn()}
        />
      );
    });

    const input = container.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;

    expect(input.min).toBe("-9");
  });

  test("renders octopode ring slots from dynamic counts", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "octopode";

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;

    expect(dynamicEquipmentList.textContent).toContain("Ring 1");
    expect(dynamicEquipmentList.textContent).toContain("Ring 8");
    expect(
      dynamicEquipmentList.querySelectorAll('[data-testid^="equipment-row-ring-"]')
    ).toHaveLength(8);
  });

  test("renders formicid glove slots from dynamic counts", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "formicid";

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;

    expect(dynamicEquipmentList.textContent).toContain("Glove 1");
    expect(dynamicEquipmentList.textContent).toContain("Glove 2");
    expect(
      dynamicEquipmentList.querySelectorAll('[data-testid^="equipment-row-glove-"]')
    ).toHaveLength(2);
  });

  test("renders dynamic equipment as one status-like list without nested equipment headings", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "formicid";

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;
    const rowIds = Array.from(
      dynamicEquipmentList.querySelectorAll('[data-testid^="equipment-row-"]')
    ).map((row) => row.getAttribute("data-testid"));
    const headings = Array.from(container.querySelectorAll("h2")).map(
      (heading) => heading.textContent
    );

    expect(rowIds).toEqual([
      "equipment-row-headgear-0",
      "equipment-row-cloak",
      "equipment-row-glove-0",
      "equipment-row-glove-1",
      "equipment-row-footwear",
      "equipment-row-amulet-0",
      "equipment-row-ring-0",
      "equipment-row-ring-1",
    ]);
    expect(dynamicEquipmentList.className).toContain("gap-1");
    expect(headings).not.toEqual(
      expect.arrayContaining([
        "Rings",
        "Amulets",
        "Headgear",
        "Gloves",
        "Fixed Equipment",
      ])
    );
    expect(headings).toContain("Mutations & Traits");
    expect(dynamicEquipmentList.textContent).toContain("Amulet:");
    expect(dynamicEquipmentList.textContent).not.toContain("Amulet 1");
    expect(dynamicEquipmentList.textContent).toContain("Glove 1");
  });

  test("clears imported metadata when manual slot edits change the slot state", () => {
    expect(
      clearRingSlotMetadata({
        kind: "wizardry",
        plus: 0,
        displayName: "ring of wizardry",
        artifactKind: "randart",
        source: "imported",
        equipState: "melded",
      })
    ).toEqual({
      kind: "wizardry",
      plus: 0,
      displayName: undefined,
      artifactKind: undefined,
      source: undefined,
      equipState: undefined,
    });

    expect(
      clearAmuletSlotMetadata({
        kind: "reflection",
        displayName: "amulet of reflection",
        artifactKind: "normal",
        source: "imported",
        equipState: "worn",
      })
    ).toEqual({
      kind: "reflection",
      displayName: undefined,
      artifactKind: undefined,
      source: undefined,
      equipState: undefined,
    });

    expect(
      clearAuxArmourSlotMetadata(
        {
          present: true,
          enchant: 3,
          displayName: "helmet",
          artifactKind: "unrand",
          source: "imported",
          equipState: "melded",
        },
        false
      )
    ).toEqual({
      present: false,
      enchant: 0,
      kind: undefined,
      ego: "none",
      displayName: undefined,
      propertiesText: undefined,
      artifactKind: undefined,
      source: undefined,
      equipState: undefined,
    });
  });

  test("does not emit duplicate explicit ids", async () => {
    const state = buildDefaultCalculatorState("trunk");

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    expect(container.querySelector('[id="headgear-present-0"]')).toBeNull();
    expect(container.querySelector('[id="glove-present-0"]')).toBeNull();
    expect(container.querySelector('[id="cloak"]')).toBeNull();
    expect(container.querySelector('[id="boots"]')).toBeNull();
    expect(container.querySelector('[id="barding"]')).toBeNull();
  });

  test("allows a signed headgear enchant edit from the modal when the slot is present", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.headgearSlots = [{ present: true, enchant: 0, kind: "helmet" }];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const headgearRow = container.querySelector(
      '[data-testid="equipment-row-headgear-0"]'
    ) as HTMLButtonElement;

    expect(headgearRow.textContent).toContain("Headgear:");
    expect(headgearRow.textContent).toContain("helmet");
    expect(headgearRow.querySelector('input[type="number"]')).toBeNull();

    await act(async () => {
      headgearRow.click();
    });

    const enchantInput = document.body.querySelector(
      'input[aria-label="Headgear enchant"]'
    ) as HTMLInputElement;
    expect(enchantInput.className).toContain("w-16");

    await act(async () => {
      setNumberInputValue(enchantInput, "-2");
    });

    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="save-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;
    const nextState = updater(state);

    expect(nextState.headgearSlots[0].enchant).toBe(-2);
  });

  test("renders glove summary row and opens modal enchant input", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.gloveSlots = [{ present: true, enchant: 1 }];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const gloveRow = container.querySelector(
      '[data-testid="equipment-row-glove-0"]'
    ) as HTMLButtonElement;

    expect(gloveRow.textContent).toContain("Glove:");
    expect(gloveRow.textContent).not.toContain("Glove 1");
    expect(gloveRow.textContent).toContain("+1 pair of gloves");
    expect(gloveRow.querySelectorAll("span")[1].className).toContain(
      "text-[#eaeaea]"
    );
    expect(gloveRow.textContent).not.toContain("Enchant:");
    expect(gloveRow.querySelector('input[type="checkbox"]')).toBeNull();
    expect(gloveRow.querySelector('input[type="number"]')).toBeNull();

    await act(async () => {
      gloveRow.click();
    });

    const enchantInput = document.body.querySelector(
      'input[aria-label="Gloves enchant"]'
    ) as HTMLInputElement;

    expect(enchantInput.className).toContain("w-16");
  });

  test("renders fixed equipment summary rows and groups footwear", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.cloak = true;
    state.cloakEnchant = 2;
    state.cloakItem = {
      ...state.cloakItem,
      present: true,
      enchant: 2,
    };
    state.boots = true;
    state.bootsEnchant = -1;
    state.bootsItem = {
      ...state.bootsItem,
      present: true,
      enchant: -1,
    };
    state.barding = false;

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;

    expect(
      dynamicEquipmentList.querySelector('[data-testid="equipment-row-cloak"]')
        ?.textContent
    ).toContain("+2 cloak");
    expect(
      dynamicEquipmentList.querySelector('[data-testid="equipment-row-footwear"]')
        ?.textContent
    ).toContain("-1 pair of boots");
    expect(
      dynamicEquipmentList.querySelector('[data-testid="equipment-row-boots"]')
    ).toBeNull();
    expect(
      dynamicEquipmentList.querySelector('[data-testid="equipment-row-barding"]')
    ).toBeNull();
    expect(dynamicEquipmentList.querySelector('input[type="number"]')).toBeNull();
    expect(dynamicEquipmentList.querySelector('input[type="checkbox"]')).toBeNull();
    expect(
      container.querySelector('[data-testid="dynamic-equipment-modifiers"]')
    ).toBeNull();

    const bardingState = buildDefaultCalculatorState("trunk");
    bardingState.barding = true;
    bardingState.bardingEnchant = 5;
    bardingState.bardingItem = {
      ...bardingState.bardingItem,
      present: true,
      enchant: 5,
    };

    await act(async () => {
      root.render(
        <DynamicEquipmentControls state={bardingState} setState={setState} />
      );
    });

    expect(
      container.querySelector('[data-testid="equipment-row-footwear"]')
        ?.textContent
    ).toContain("+5 barding");
  });

  test("renders dynamic equipment and fixed auxiliary equipment as summary rows", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "formicid";
    state.amuletSlots = [{ kind: "reflection" }];
    state.headgearSlots = [{ present: true, enchant: 2, kind: "helmet" }];
    state.gloveSlots = [
      {
        present: true,
        enchant: 5,
        modifiers: { str: 2 },
      },
      { present: false, enchant: 0 },
    ];
    state.cloak = true;
    state.cloakItem = { ...state.cloakItem, present: true, enchant: 1 };
    state.boots = true;
    state.bootsItem = { ...state.bootsItem, present: true };
    state.barding = false;

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    expect(
      container.querySelector('[data-testid="equipment-row-amulet-0"]')
        ?.textContent
    ).toContain("amulet of reflection");
    expect(
      container.querySelector('[data-testid="equipment-row-headgear-0"]')
        ?.textContent
    ).toContain("+2 helmet");
    expect(
      container.querySelector('[data-testid="equipment-row-glove-0"]')
        ?.textContent
    ).toContain("+5 pair of gloves {Str+2}");
    expect(
      container.querySelector('[data-testid="equipment-row-glove-1"]')
        ?.textContent
    ).toContain("none");
    expect(
      container.querySelector('[data-testid="equipment-row-cloak"]')?.textContent
    ).toContain("+1 cloak");
    expect(
      container.querySelector('[data-testid="equipment-row-footwear"]')?.textContent
    ).toContain("pair of boots");
    expect(
      container.querySelector('[data-testid="equipment-row-barding"]')
    ).toBeNull();
    expect(container.querySelector('button[role="combobox"]')).toBeNull();
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();
  });

  test("keeps mutation controls collapsed until a calculator-relevant trait is present", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "human";

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const mutationSection = container.querySelector(
      '[data-testid="dynamic-equipment-mutations"]'
    ) as HTMLElement;

    expect(
      mutationSection.querySelector('input[aria-label="icemail"]')
    ).toBeNull();
    expect(
      mutationSection.querySelector('input[aria-label="agile"]')
    ).toBeNull();
    expect(
      mutationSection.querySelector('[aria-label="deformed body"]')
    ).toBeNull();
    expect(
      mutationSection.querySelector('[aria-label="reckless"]')
    ).toBeNull();
    expect(
      mutationSection.querySelector('select[aria-label="Add mutation or trait"]')
    ).not.toBeNull();
  });

  test("renders species calculator traits as read-only context", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "naga";

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const mutationSection = container.querySelector(
      '[data-testid="dynamic-equipment-mutations"]'
    ) as HTMLElement;

    expect(mutationSection.textContent).toContain("Species traits");
    expect(mutationSection.textContent).toContain("deformed body");
    expect(mutationSection.textContent).toContain("already included");
    expect(
      mutationSection.querySelector('[aria-label="deformed body"]')
    ).toBeNull();
  });

  test("adds an editable mutation control from the selector", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "human";

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    await act(async () => {
      setSelectValue(
        container.querySelector(
          'select[aria-label="Add mutation or trait"]'
        ) as HTMLSelectElement,
        "agileMutation"
      );
    });

    const updater = setState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;

    expect(updater(state).agileMutation).toBe(1);
  });

  test("shows concrete stat deltas for active stat mutations", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "human";
    state.agileMutation = 1;

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const effect = container.querySelector(
      '[data-testid="mutation-effect-agileMutation"]'
    ) as HTMLDivElement;
    const control = container.querySelector(
      '[data-testid="mutation-control-agileMutation"]'
    ) as HTMLDivElement;

    expect(effect.textContent).toBe("Dex+4 Str-1 Int-1");
    expect(effect.className).toContain("whitespace-nowrap");
    expect(effect.className).toContain("text-xs");
    expect(control.className).toContain("grid");
  });

  test("shows currently active mutation controls without selector interaction", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "human";
    state.agileMutation = 1;
    state.icemail = 1;
    state.deformedBody = true;

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    expect(
      container.querySelector('input[aria-label="agile"]')
    ).not.toBeNull();
    expect(
      container.querySelector('input[aria-label="icemail"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="deformed body"]')
    ).not.toBeNull();
  });

  test("removes a manually active mutation control", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "human";
    state.agileMutation = 1;

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          'button[aria-label="Remove agile"]'
        ) as HTMLButtonElement
      ).click();
    });

    const updater = setState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;

    expect(updater(state).agileMutation).toBe(0);
  });

  test("expanded mutation controls update new numeric and boolean state fields", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "human";
    state.sturdyFrame = 1;
    state.gelatinousBody = 1;
    state.scalesAC = 4;
    state.deformedBody = true;

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    await act(async () => {
      setNumberInputValue(
        container.querySelector(
          'input[aria-label="sturdy frame"]'
        ) as HTMLInputElement,
        "2"
      );
    });

    let updater = setState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;
    expect(updater(state).sturdyFrame).toBe(2);
    setState.mockReset();

    await act(async () => {
      setNumberInputValue(
        container.querySelector(
          'input[aria-label="gelatinous body"]'
        ) as HTMLInputElement,
        "3"
      );
    });

    updater = setState.mock.calls[0][0] as (prev: typeof state) => typeof state;
    expect(updater(state)).toMatchObject({
      gelatinousBody: 3,
      scalesAC: 6,
    });
    setState.mockReset();

    await act(async () => {
      (
        container.querySelector(
          '[aria-label="deformed body"]'
        ) as HTMLButtonElement
      ).click();
    });

    updater = setState.mock.calls[0][0] as (prev: typeof state) => typeof state;
    expect(updater(state).deformedBody).toBe(false);
  });

  test("opens footwear row with a single modal backed by the active footwear item", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.boots = true;
    state.bootsItem = { ...state.bootsItem, present: true, enchant: 0 };

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const footwearRow = container.querySelector(
      '[data-testid="equipment-row-footwear"]'
    ) as HTMLButtonElement;

    expect(footwearRow.textContent).toContain("Footwear:");
    expect(footwearRow.textContent).toContain("+0 pair of boots");

    await act(async () => {
      footwearRow.click();
    });

    expect(document.body.textContent).toContain("Footwear");

    await act(async () => {
      setNumberInputValue(
        document.body.querySelector(
          'input[aria-label="Footwear enchant"]'
        ) as HTMLInputElement,
        "2"
      );
    });

    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="save-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;
    const nextState = updater(state);

    expect(nextState.boots).toBe(true);
    expect(nextState.bootsItem.enchant).toBe(2);
  });

  test("renders imported ring text as a summary row and removes the old Modifiers section", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.ringSlots = [
      {
        kind: "protection",
        plus: 4,
        modifiers: { int: 3 },
        displayName: "ring of intelligence",
        source: "imported",
      },
      { kind: "wizardry", plus: 0 },
    ];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    expect(container.textContent).toContain("Ring 1");
    expect(container.textContent).toContain("ring of intelligence");
    expect(container.textContent).not.toContain("Modifiers");
    const dynamicEquipmentList = container.querySelector(
      '[data-testid="dynamic-equipment-list"]'
    ) as HTMLDivElement;
    expect(dynamicEquipmentList.querySelector('button[role="combobox"]')).toBeNull();
  });

  test("edits parser-style numeric properties and flags from the modal", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.headgearSlots = [
      {
        present: true,
        enchant: 3,
        kind: "hat",
        displayName: "hat of Pondering",
        modifiers: { flags: ["Ponderous"], will: 1, mp: 10, int: 5 },
        source: "imported",
      },
    ];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const headgearRow = container.querySelector(
      '[data-testid="equipment-row-headgear-0"]'
    ) as HTMLButtonElement;

    expect(headgearRow.textContent).toContain(
      "+3 hat of Pondering {Ponderous, Will+ MP+10 Int+5}"
    );

    await act(async () => {
      headgearRow.click();
    });

    const modifierGrid = document.body.querySelector(
      '[data-testid="equipment-modifier-grid"]'
    ) as HTMLDivElement;
    expect(modifierGrid).not.toBeNull();
    expect(modifierGrid.className).toContain("grid-cols-2");
    expect(modifierGrid.className).toContain("lg:grid-cols-4");

    expect(
      (
        document.body.querySelector(
          'input[aria-label="Other properties"]'
        ) as HTMLInputElement
      ).placeholder
    ).toBe("Example: Ponderous Reflect Spirit +Inv Fly shock");

    expect(
      Array.from(
        document.body.querySelectorAll('input[aria-label$=" modifier"]')
      ).map((input) => input.getAttribute("aria-label"))
    ).toEqual([
      "rF modifier",
      "rC modifier",
      "rN modifier",
      "rPois modifier",
      "rElec modifier",
      "rCorr modifier",
      "Will modifier",
      "AC modifier",
      "EV modifier",
      "SH modifier",
      "Str modifier",
      "Int modifier",
      "Dex modifier",
      "RegenHP modifier",
      "RegenMP modifier",
      "HP modifier",
      "MP modifier",
      "Slay modifier",
      "Stlth modifier",
      "Wiz modifier",
    ]);
    expect(
      Array.from(
        (
          document.body.querySelector(
            '[data-testid="equipment-modifier-column-resists"]'
          ) as HTMLDivElement
        ).querySelectorAll('input[aria-label$=" modifier"]')
      ).map((input) => input.getAttribute("aria-label"))
    ).toEqual([
      "rF modifier",
      "rC modifier",
      "rN modifier",
      "rPois modifier",
      "rElec modifier",
      "rCorr modifier",
      "Will modifier",
    ]);
    const sInvCheckbox = document.body.querySelector(
      'button[aria-label="SInv property"]'
    ) as HTMLButtonElement;
    expect(sInvCheckbox).not.toBeNull();
    expect(
      (
        document.body.querySelector(
          '[data-testid="equipment-modifier-column-resists"]'
        ) as HTMLDivElement
      ).textContent
    ).toContain("SInv");
    expect(
      Array.from(
        (
          document.body.querySelector(
            '[data-testid="equipment-modifier-column-magic"]'
          ) as HTMLDivElement
        ).querySelectorAll('input[aria-label$=" modifier"]')
      ).map((input) => input.getAttribute("aria-label"))
    ).toEqual([
      "Slay modifier",
      "Stlth modifier",
      "Wiz modifier",
    ]);

    await act(async () => {
      setNumberInputValue(
        document.body.querySelector(
          'input[aria-label="Will modifier"]'
        ) as HTMLInputElement,
        "2"
      );
      setNumberInputValue(
        document.body.querySelector(
          'input[aria-label="MP modifier"]'
        ) as HTMLInputElement,
        "7"
      );
      setNumberInputValue(
        document.body.querySelector(
          'input[aria-label="Int modifier"]'
        ) as HTMLInputElement,
        "4"
      );
      setTextInputValue(
        document.body.querySelector(
          'input[aria-label="Other properties"]'
        ) as HTMLInputElement,
        "Reflect Ponderous"
      );
    });
    await act(async () => {
      (
        document.body.querySelector(
          'button[aria-label="SInv property"]'
        ) as HTMLButtonElement
      ).click();
    });

    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="save-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;
    const nextState = updater(state);

    expect(nextState.headgearSlots[0].modifiers).toMatchObject({
      flags: ["Reflect", "Ponderous"],
      will: 2,
      mp: 7,
      int: 4,
      sInv: 1,
    });
  });

  test("shows auxiliary armour ego selectors in equipment modals", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.headgearSlots = [
      {
        present: true,
        kind: "hat",
        enchant: 0,
        ego: "intelligence",
        modifiers: { int: 3 },
      },
    ];
    state.gloveSlots = [
      {
        present: true,
        enchant: 0,
        ego: "strength",
        modifiers: { str: 3 },
      },
    ];
    state.cloak = true;
    state.cloakItem = {
      ...state.cloakItem,
      kind: "scarf",
      present: true,
      ego: "resistance",
      modifiers: { rF: 1, rC: 1 },
    };
    state.boots = true;
    state.bootsItem = {
      ...state.bootsItem,
      present: true,
      enchant: 1,
      ego: "flying",
      modifiers: { flags: ["Fly"] },
    };

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-headgear-0"]'
        ) as HTMLButtonElement
      ).click();
    });
    expect(
      document.body.querySelector('button[aria-label="Headgear ego"]')
        ?.textContent
    ).toContain("Intelligence");
    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="cancel-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-glove-0"]'
        ) as HTMLButtonElement
      ).click();
    });
    expect(
      document.body.querySelector('button[aria-label="Gloves ego"]')?.textContent
    ).toContain("Strength");
    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="cancel-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-cloak"]'
        ) as HTMLButtonElement
      ).click();
    });
    expect(
      document.body.querySelector('button[aria-label="Cloak type"]')?.textContent
    ).toContain("scarf");
    expect(
      document.body.querySelector('button[aria-label="Cloak ego"]')?.textContent
    ).toContain("Resistance");
    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="cancel-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-footwear"]'
        ) as HTMLButtonElement
      ).click();
    });
    expect(
      document.body.querySelector('button[aria-label="Footwear ego"]')
        ?.textContent
    ).toContain("Flying");
  });

  test("renders equipment rows as plain text and opens a portal modal", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.ringSlots = [
      {
        kind: "protection",
        plus: 4,
        displayName: "the ring of Robustness {AC+8}",
        source: "imported",
      },
    ];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const ringRow = container.querySelector(
      '[data-testid="equipment-row-ring-0"]'
    ) as HTMLButtonElement;

    expect(ringRow).not.toBeNull();
    expect(ringRow.textContent).toContain("Ring 1");
    expect(ringRow.textContent).toContain("the ring of Robustness {AC+8}");
    expect(ringRow.querySelector('button[role="combobox"]')).toBeNull();
    expect(ringRow.querySelector('input[type="number"]')).toBeNull();

    await act(async () => {
      ringRow.click();
    });

    expect(
      document.body.querySelector('[data-testid="equipment-edit-modal"]')
    ).not.toBeNull();
    const modal = document.body.querySelector(
      '[data-testid="equipment-edit-modal"]'
    ) as HTMLDivElement;
    const panel = modal.firstElementChild as HTMLDivElement;
    expect(modal.className).toContain("p-0");
    expect(modal.className).toContain("sm:p-6");
    expect(modal.className).toContain("items-stretch");
    expect(modal.className).toContain("sm:items-center");
    expect(panel.className).toContain("h-dvh");
    expect(panel.className).toContain("w-full");
    expect(panel.className).toContain("max-w-none");
    expect(panel.className).toContain("overflow-y-auto");
    expect(panel.className).toContain("p-3");
    expect(panel.className).toContain("sm:h-auto");
    expect(panel.className).toContain("sm:max-w-2xl");
    expect(panel.className).toContain("sm:p-6");
    expect(document.body.textContent).toContain("Equipment Details");
    expect(document.body.textContent).toContain("Ring 1");
  });

  test("hides imported arbitrary ring type and highlights active modifiers", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.ringSlots = [
      {
        kind: "none",
        plus: 0,
        displayName: 'ring "Dori"',
        propertiesText: "rC+ rCorr SInv MP+9 Stlth+",
        artifactKind: "randart",
        modifiers: { rC: 1, rCorr: 1, sInv: 1, mp: 9, stlth: 1 },
        source: "imported",
      },
    ];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-ring-0"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(document.body.querySelector('button[aria-label="Ring type"]')).toBeNull();

    const activeModifierInputs = ["rC", "rCorr", "MP", "Stlth"].map(
      (label) =>
        document.body.querySelector(
          `input[aria-label="${label} modifier"]`
        ) as HTMLInputElement
    );
    for (const input of activeModifierInputs) {
      expect(input.className).toContain("border-[#a7a7a7]");
    }
    expect(
      document.body
        .querySelector('button[aria-label="SInv property"]')
        ?.getAttribute("data-state")
    ).toBe("checked");

    expect(
      (
        document.body.querySelector(
          'input[aria-label="AC modifier"]'
        ) as HTMLInputElement
      ).className
    ).not.toContain("border-[#a7a7a7]");
  });

  test("cancels ring modal edits without updating state", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.ringSlots = [{ kind: "protection", plus: 4 }];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-ring-0"]'
        ) as HTMLButtonElement
      ).click();
    });

    const plusInput = document.body.querySelector(
      'input[aria-label="Ring plus"]'
    ) as HTMLInputElement;

    await act(async () => {
      setNumberInputValue(plusInput, "6");
    });

    await act(async () => {
      (
        document.body.querySelector(
          '[data-testid="cancel-equipment-edit"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(setState).not.toHaveBeenCalled();
    expect(
      document.body.querySelector('[data-testid="equipment-edit-modal"]')
    ).toBeNull();
  });

  test("saves ring modal edits and clears stale imported metadata when changed", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.ringSlots = [
      {
        kind: "protection",
        plus: 4,
        displayName: "the ring of Robustness {AC+8}",
        artifactKind: "randart",
        source: "imported",
      },
    ];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    await act(async () => {
      (
        container.querySelector(
          '[data-testid="equipment-row-ring-0"]'
        ) as HTMLButtonElement
      ).click();
    });

    await act(async () => {
      setNumberInputValue(
        document.body.querySelector(
          'input[aria-label="Ring plus"]'
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

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;
    const nextState = updater(state);

    expect(nextState.ringSlots[0]).toEqual({
      kind: "protection",
      plus: 6,
      displayName: undefined,
      artifactKind: undefined,
      source: undefined,
    });
  });

  test("ring slot updates do not overwrite legacy wizardry", () => {
    const state = buildDefaultCalculatorState("trunk");
    state.wizardry = 1;

    const nextState = applyRingSlotUpdate(state, 0, () => ({
      kind: "wizardry",
      plus: 0,
    }));

    expect(nextState.wizardry).toBe(1);
    expect(nextState.ringSlots[0]).toEqual({
      kind: "wizardry",
      plus: 0,
    });
  });
});
