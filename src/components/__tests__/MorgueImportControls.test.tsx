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

  test("renders modals in a portal, then shows a temporary imported status after success", async () => {
    const onApplyImport = jest.fn<(state: CalculatorState<GameVersion>) => void>();
    jest.useFakeTimers();

    try {
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

      expect(container.querySelector('[data-testid="morgue-import-modal"]')).toBeNull();
      expect(
        document.body.querySelector('[data-testid="morgue-import-modal"]')
      ).not.toBeNull();
      const modalPanel = document.body.querySelector(
        '[data-testid="morgue-import-modal"] > div'
      ) as HTMLDivElement;
      expect(modalPanel.className).toContain("bg-card");
      expect(modalPanel.className).toContain("text-card-foreground");
      expect(modalPanel.className).toContain("border-white");
      expect(modalPanel.style.outline).toBe("1px solid white");
      expect(modalPanel.style.outlineOffset).toBe("-4px");

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
      expect(
        container.querySelector('[data-testid="morgue-import-success"]')
          ?.textContent
      ).toContain("Imported!");
      expect(
        container.querySelector('[data-testid="morgue-import-success"]')
          ?.className
      ).toContain("absolute");
      expect(
        container.querySelector('[data-testid="morgue-import-success"]')
          ?.className
      ).toContain("left-full");
      expect(
        container.querySelector('[data-testid="morgue-import-success-anchor"]')
          ?.className
      ).toContain("relative");
      expect(document.body.textContent).not.toContain("Applied");
      expect(document.body.textContent).not.toContain("Skipped");

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(
        container.querySelector('[data-testid="morgue-import-success"]')
      ).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test("renders an icon-only import trigger with an accessible label", async () => {
    const onApplyImport = jest.fn<(state: CalculatorState<GameVersion>) => void>();

    await act(async () => {
      root.render(
        <MorgueImportControls
          currentVersion="0.34"
          onApplyImport={onApplyImport}
        />
      );
    });

    const trigger = container.querySelector(
      '[data-testid="open-morgue-import"]'
    ) as HTMLButtonElement;

    expect(trigger.getAttribute("aria-label")).toBe("Import Morgue");
    expect(trigger.textContent?.trim()).toBe("");
    expect(trigger.className).toContain("hover:!bg-transparent");
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
