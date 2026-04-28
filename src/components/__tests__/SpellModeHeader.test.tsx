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

type SelectMockProps = {
  children?: ReactNode;
  className?: string;
  placeholder?: string;
  value?: string;
};

const selectMockState = { value: "" };

await jest.unstable_mockModule("@/components/ui/select", () => ({
  Select: ({ children, value }: SelectMockProps) => {
    selectMockState.value = value ?? "";
    return <div>{children}</div>;
  },
  SelectContent: ({ children }: SelectMockProps) => <div>{children}</div>,
  SelectItem: ({ children, value }: SelectMockProps) => (
    <div role="option" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, className }: SelectMockProps) => (
    <button className={className} role="combobox">
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: SelectMockProps) => (
    <span>{selectMockState.value || placeholder}</span>
  ),
}));

const { default: SpellModeHeader } = await import("../SpellModeHeader");

describe("SpellModeHeader", () => {
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

  test("renders only spell selection controls", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(
        <SpellModeHeader state={state} setState={setState} />
      );
    });

    const combobox = container.querySelector('[role="combobox"]');

    expect(container.textContent).toContain("Spell:");
    expect(combobox).not.toBeNull();
    expect(combobox?.textContent).toContain("Fireball");
    expect(container.textContent).not.toContain("conjuration");
    expect(container.textContent).not.toContain("Spellcasting");
    expect(container.textContent).not.toContain("ring of wizardry");
    expect(container.textContent).not.toContain("wild magic (mutation)");
    expect(container.textContent).not.toContain("body armour ego");
    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(1);
  });

  test("uses the Enkindle graph color for eligible spell markers", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "revenant";
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(
        <SpellModeHeader state={state} setState={setState} />
      );
    });

    const fireballOption = container.querySelector(
      '[role="option"][data-value="Fireball"]'
    ) as HTMLDivElement;
    const enkindleMarker = fireballOption.querySelector(
      '[data-testid="enkindle-spell-marker"]'
    ) as HTMLSpanElement;

    expect(enkindleMarker).not.toBeNull();
    expect(enkindleMarker.style.color).toBe("rgb(182, 130, 47)");
    expect(enkindleMarker.className).not.toContain("text-[#60FDFF]");
  });

  test("shows separate markers for Enkindle and Vehumet-supported spells", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "revenant";
    state.god = "Vehumet";
    state.godPietyRank = 1;
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(
        <SpellModeHeader state={state} setState={setState} />
      );
    });

    const fireballOption = container.querySelector(
      '[role="option"][data-value="Fireball"]'
    ) as HTMLDivElement;

    expect(fireballOption.textContent).toContain("Fireball**");
    expect(
      fireballOption.querySelector('[data-testid="enkindle-spell-marker"]')
    ).not.toBeNull();
    expect(
      fireballOption.querySelector('[data-testid="vehumet-spell-marker"]')
    ).not.toBeNull();
  });
});
