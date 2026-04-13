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

const leftColumnSpellSkillOrder = [
  "Spellcasting",
  "conjuration",
  "hexes",
  "summoning",
  "necromancy",
  "forgecraft",
];

const rightColumnSpellSkillOrder = [
  "translocation",
  "alchemy",
  "fire",
  "ice",
  "air",
  "earth",
] as const;

const { SpellSkillControls } = await import("../SpellControls");

describe("SpellSkillControls", () => {
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

  test("keeps spell skills collapsed by default and reveals spellcasting in two column-major columns when expanded", async () => {
    const state = buildDefaultCalculatorState("trunk");
    state.targetSpell = "Fireball";

    await act(async () => {
      root.render(
        <SpellSkillControls
          state={state}
          setState={setState}
          testId="spell-skill-controls"
        />
      );
    });

    const controls = container.querySelector(
      '[data-testid="spell-skill-controls"]'
    ) as HTMLDivElement;
    const toggleButton = controls.querySelector("button") as HTMLButtonElement;
    const leftLine = controls.querySelector(
      '[data-testid="spell-skill-toggle-line-left"]'
    ) as HTMLSpanElement;
    const rightLine = controls.querySelector(
      '[data-testid="spell-skill-toggle-line-right"]'
    ) as HTMLSpanElement;

    expect(controls.textContent).toContain("Show spell skills");
    expect(controls.textContent).not.toContain("Spellcasting");
    expect(controls.textContent).not.toContain("conjuration");
    expect(controls.textContent).not.toContain("fire");
    expect(controls.textContent).not.toContain("alchemy");
    expect(toggleButton.className).toContain("w-full");
    expect(toggleButton.className).toContain("justify-center");
    expect(leftLine).not.toBeNull();
    expect(rightLine).not.toBeNull();
    expect(toggleButton.querySelector("svg")).not.toBeNull();

    await act(async () => {
      toggleButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const skillGrid = controls.querySelector(
      '[data-testid="spell-school-grid"]'
    ) as HTMLDivElement;
    const leftColumn = controls.querySelector(
      '[data-testid="spell-school-column-left"]'
    ) as HTMLDivElement;
    const rightColumn = controls.querySelector(
      '[data-testid="spell-school-column-right"]'
    ) as HTMLDivElement;
    const spellcastingInput = controls.querySelector(
      'input[step="0.1"]'
    ) as HTMLInputElement;

    expect(controls.textContent).toContain("Hide spell skills");
    expect(controls.textContent).toContain("Spellcasting");
    expect(controls.textContent).toContain("alchemy");
    expect(controls.textContent).toContain("air");
    expect(controls.textContent).toContain("conjuration");
    expect(controls.textContent).toContain("fire");
    expect(spellcastingInput.className).toContain("w-[80px]");
    expect(skillGrid.className).toContain("grid-cols-2");
    expect(leftColumn).not.toBeNull();
    expect(rightColumn).not.toBeNull();
    expect(
      Array.from(leftColumn.querySelectorAll("label")).map((label) =>
        label.textContent?.replace(":", "")
      )
    ).toEqual(leftColumnSpellSkillOrder);
    expect(
      Array.from(rightColumn.querySelectorAll("label")).map((label) =>
        label.textContent?.replace(":", "")
      )
    ).toEqual(rightColumnSpellSkillOrder);
  });
});
