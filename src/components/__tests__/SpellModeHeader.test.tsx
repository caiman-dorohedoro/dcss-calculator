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
import { createRoot, type Root } from "react-dom/client";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import SpellModeHeader from "../SpellModeHeader";

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

    expect(container.textContent).toContain("Spell:");
    expect(container.textContent).not.toContain("conjuration");
    expect(container.textContent).not.toContain("Spellcasting");
    expect(container.textContent).not.toContain("ring of wizardry");
    expect(container.textContent).not.toContain("wild magic (mutation)");
    expect(container.textContent).not.toContain("body armour ego");
    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(1);
  });
});
