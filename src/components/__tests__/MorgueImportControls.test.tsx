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
  let summaryHost: HTMLDivElement;
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
    summaryHost = document.createElement("div");
    summaryHost.setAttribute("data-testid", "summary-host");
    document.body.appendChild(container);
    document.body.appendChild(summaryHost);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    summaryHost.remove();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
  });

  test("renders modals in a portal, then applies into a dismissible summary host", async () => {
    const onApplyImport = jest.fn<(state: CalculatorState<GameVersion>) => void>();

    await act(async () => {
      root.render(
        <MorgueImportControls
          currentVersion="trunk"
          onApplyImport={onApplyImport}
          summaryHost={summaryHost}
        />
      );
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="open-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    expect(container.querySelector('[data-testid="morgue-import-modal"]')).toBeNull();
    expect(
      document.body.querySelector('[data-testid="morgue-import-modal"]')
    ).not.toBeNull();

    const textarea = document.body.querySelector(
      '[data-testid="morgue-import-textarea"]'
    ) as HTMLTextAreaElement;

    await act(async () => {
      setTextareaValue(textarea, deepElfConjurer033Morgue);
    });

    await act(async () => {
      (
        document.body.querySelector('[data-testid="apply-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    expect(
      document.body.querySelector('[data-testid="morgue-import-confirm-modal"]')
    ).not.toBeNull();
    expect(document.body.textContent).toContain("0.33");
    expect(onApplyImport).not.toHaveBeenCalled();

    await act(async () => {
      (
        document.body.querySelector('[data-testid="confirm-version-import"]') as HTMLButtonElement
      ).click();
    });

    expect(onApplyImport).toHaveBeenCalledTimes(1);
    expect(onApplyImport.mock.calls[0][0]).toMatchObject({
      version: "0.33",
      species: "deepElf",
      targetSpell: "Magic Dart",
    });
    expect(summaryHost.textContent).toContain("Applied");
    expect(summaryHost.textContent).toContain("Skipped");
    expect(summaryHost.textContent).toContain("Rings");

    await act(async () => {
      (
        summaryHost.querySelector(
          '[data-testid="dismiss-morgue-import-summary"]'
        ) as HTMLButtonElement
      ).click();
    });

    expect(summaryHost.textContent).not.toContain("Applied");
  });

  test("shows an inline parser failure without calling onApplyImport", async () => {
    const onApplyImport = jest.fn<(state: CalculatorState<GameVersion>) => void>();

    await act(async () => {
      root.render(
        <MorgueImportControls
          currentVersion="0.34"
          onApplyImport={onApplyImport}
          summaryHost={summaryHost}
        />
      );
    });

    await act(async () => {
      (
        container.querySelector('[data-testid="open-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    const textarea = document.body.querySelector(
      '[data-testid="morgue-import-textarea"]'
    ) as HTMLTextAreaElement;

    await act(async () => {
      setTextareaValue(textarea, "not a morgue");
    });

    await act(async () => {
      (
        document.body.querySelector('[data-testid="apply-morgue-import"]') as HTMLButtonElement
      ).click();
    });

    expect(onApplyImport).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("could not be parsed");
  });
});
