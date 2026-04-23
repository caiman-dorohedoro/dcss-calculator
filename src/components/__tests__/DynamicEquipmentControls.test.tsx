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

    const ringSection = container.querySelector(
      '[data-testid="dynamic-equipment-rings"]'
    ) as HTMLDivElement;

    expect(ringSection.textContent).toContain("Ring 1");
    expect(ringSection.textContent).toContain("Ring 8");
    expect(
      ringSection.querySelectorAll('[data-testid^="equipment-row-ring-"]')
    ).toHaveLength(8);
  });

  test("renders formicid glove slots from dynamic counts", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "formicid";

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const gloveSection = container.querySelector(
      '[data-testid="dynamic-equipment-gloves"]'
    ) as HTMLDivElement;

    expect(gloveSection.textContent).toContain("Glove 1");
    expect(gloveSection.textContent).toContain("Glove 2");
    expect(gloveSection.querySelectorAll('[data-testid^="glove-slot-"]')).toHaveLength(2);
  });

  test("clears imported metadata when manual slot edits change the slot state", () => {
    expect(
      clearRingSlotMetadata({
        kind: "wizardry",
        plus: 0,
        displayName: "ring of wizardry",
        artifactKind: "randart",
        source: "imported",
      })
    ).toEqual({
      kind: "wizardry",
      plus: 0,
      displayName: undefined,
      artifactKind: undefined,
      source: undefined,
    });

    expect(
      clearAmuletSlotMetadata({
        kind: "reflection",
        displayName: "amulet of reflection",
        artifactKind: "normal",
        source: "imported",
      })
    ).toEqual({
      kind: "reflection",
      displayName: undefined,
      artifactKind: undefined,
      source: undefined,
    });

    expect(
      clearAuxArmourSlotMetadata(
        {
          present: true,
          enchant: 3,
          displayName: "helmet",
          artifactKind: "unrand",
          source: "imported",
        },
        false
      )
    ).toEqual({
      present: false,
      enchant: 0,
      kind: undefined,
      displayName: undefined,
      artifactKind: undefined,
      source: undefined,
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

  test("allows a signed headgear enchant edit when the slot is present", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.headgearSlots = [{ present: true, enchant: 0, kind: "helmet" }];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const headgearSlot = container.querySelector(
      '[data-testid="headgear-slot-0"]'
    ) as HTMLDivElement;
    const enchantInput = headgearSlot.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;
    const selector = headgearSlot.querySelector(
      'button[role="combobox"]'
    ) as HTMLButtonElement;

    expect(headgearSlot.textContent).toContain("Headgear:");
    expect(headgearSlot.textContent).not.toContain("Enchant:");
    expect(enchantInput.className).toContain("w-14");
    expect(
      enchantInput.compareDocumentPosition(selector) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await act(async () => {
      setNumberInputValue(enchantInput, "-2");
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0] as (
      prev: typeof state
    ) => typeof state;
    const nextState = updater(state);

    expect(nextState.headgearSlots[0].enchant).toBe(-2);
  });

  test("renders glove controls with selector-based input and no enchant label", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.gloveSlots = [{ present: true, enchant: 1 }];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const gloveSlot = container.querySelector(
      '[data-testid="glove-slot-0"]'
    ) as HTMLDivElement;
    const enchantInput = gloveSlot.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;
    const selector = gloveSlot.querySelector(
      'button[role="combobox"]'
    ) as HTMLButtonElement;

    expect(gloveSlot.textContent).toContain("Glove 1");
    expect(gloveSlot.textContent).not.toContain("Enchant:");
    expect(gloveSlot.textContent).not.toContain("present");
    expect(gloveSlot.querySelector('input[type="checkbox"]')).toBeNull();
    expect(enchantInput.className).toContain("w-14");
    expect(
      enchantInput.compareDocumentPosition(selector) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  test("renders fixed equipment enchant inputs with the shared width and removes old modifier labels", async () => {
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
    state.barding = true;
    state.bardingEnchant = 5;
    state.bardingItem = {
      ...state.bardingItem,
      present: true,
      enchant: 5,
    };

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const fixedEquipmentSection = container.querySelector(
      '[data-testid="fixed-equipment-controls"]'
    ) as HTMLDivElement;

    const cloakEnchantInput = fixedEquipmentSection.querySelector(
      'input[aria-label="Cloak enchant"]'
    ) as HTMLInputElement;
    const bootsEnchantInput = fixedEquipmentSection.querySelector(
      'input[aria-label="Boots enchant"]'
    ) as HTMLInputElement;
    const bardingEnchantInput = fixedEquipmentSection.querySelector(
      'input[aria-label="Barding enchant"]'
    ) as HTMLInputElement;

    expect(cloakEnchantInput.className).toContain("w-14");
    expect(bootsEnchantInput.className).toContain("w-14");
    expect(bardingEnchantInput.className).toContain("w-14");
    expect(
      container.querySelector('[data-testid="dynamic-equipment-modifiers"]')
    ).toBeNull();
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
    const ringSection = container.querySelector(
      '[data-testid="dynamic-equipment-rings"]'
    ) as HTMLDivElement;
    expect(ringSection.querySelector('button[role="combobox"]')).toBeNull();
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
    expect(document.body.textContent).toContain("Equipment Details");
    expect(document.body.textContent).toContain("Ring 1");
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
