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
    expect(ringSection.querySelectorAll('[data-testid^="ring-slot-"]')).toHaveLength(8);
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
    state.headgearSlots = [{ present: true, enchant: 0 }];

    await act(async () => {
      root.render(<DynamicEquipmentControls state={state} setState={setState} />);
    });

    const headgearSection = container.querySelector(
      '[data-testid="dynamic-equipment-headgear"]'
    ) as HTMLDivElement;
    const enchantInput = headgearSection.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;

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
