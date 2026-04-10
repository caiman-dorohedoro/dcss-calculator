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
import type { CalculatorState } from "@/hooks/useCalculatorState";
import type { GameVersion } from "@/types/game";
import MorgueImportControls from "../MorgueImportControls";
import { deepElfConjurer033Morgue } from "@/morgueImport/__fixtures__/deepElfConjurer033";

describe("MorgueImportControls", () => {
  let container: HTMLDivElement;
  let root: Root;
  const setTextareaValue = (textarea: HTMLTextAreaElement, value: string) => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    )?.set;

    if (!valueSetter) {
      throw new Error("Could not find textarea value setter");
    }

    valueSetter.call(textarea, value);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  };

  beforeEach(() => {
    localStorage.clear();
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
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
  });

  test("asks for confirmation when the morgue targets a different version, then applies and shows the summary", async () => {
    const onApplyImport = jest.fn<(state: CalculatorState<GameVersion>) => void>();

    await act(async () => {
      root.render(
        <MorgueImportControls
          currentVersion="trunk"
          onApplyImport={onApplyImport}
        />
      );
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="open-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    const textarea = container.querySelector(
      '[data-testid="morgue-import-textarea"]'
    ) as HTMLTextAreaElement;

    await act(async () => {
      setTextareaValue(textarea, deepElfConjurer033Morgue);
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="apply-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    expect(container.textContent).toContain("0.33");
    expect(onApplyImport).not.toHaveBeenCalled();

    await act(async () => {
      (
        container.querySelector('[data-testid="confirm-version-import"]') as HTMLButtonElement
      ).click();
    });

    expect(onApplyImport).toHaveBeenCalledTimes(1);
    expect(onApplyImport.mock.calls[0][0]).toMatchObject({
      version: "0.33",
      species: "deepElf",
      targetSpell: "Magic Dart",
    });
    expect(container.textContent).toContain("Applied");
    expect(container.textContent).toContain("Skipped");
    expect(container.textContent).toContain("Rings");
  });

  test("shows an inline parser failure without calling onApplyImport", async () => {
    const onApplyImport = jest.fn<(state: CalculatorState<GameVersion>) => void>();

    await act(async () => {
      root.render(
        <MorgueImportControls
          currentVersion="0.34"
          onApplyImport={onApplyImport}
        />
      );
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="open-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    const textarea = container.querySelector(
      '[data-testid="morgue-import-textarea"]'
    ) as HTMLTextAreaElement;

    await act(async () => {
      setTextareaValue(textarea, "not a morgue");
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="apply-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    expect(onApplyImport).not.toHaveBeenCalled();
    expect(container.textContent).toContain("could not be parsed");
  });
});
