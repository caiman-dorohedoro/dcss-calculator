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

const mockUseCalculatorState = jest.fn();

await jest.unstable_mockModule("@/hooks/useCalculatorState", () => ({
  useCalculatorState: () => mockUseCalculatorState(),
}));

await jest.unstable_mockModule("@/components/Calculator", () => ({
  __esModule: true,
  default: () => <div data-testid="calculator-stub">calculator</div>,
}));

await jest.unstable_mockModule("@/components/MorgueImportControls", () => ({
  __esModule: true,
  default: () => <div data-testid="morgue-import-stub">import</div>,
}));

const { default: App } = await import("../../App");

describe("App desktop shell", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockUseCalculatorState.mockReturnValue({
      state: buildDefaultCalculatorState("trunk"),
      setState: jest.fn(),
      resetState: jest.fn(),
      changeVersion: jest.fn(),
      flash: false,
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    mockUseCalculatorState.mockReset();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
  });

  test("widens the desktop frame while keeping the top bar layout intact", async () => {
    await act(async () => {
      root.render(<App />);
    });

    const shell = container.querySelector(
      '[data-testid="app-shell"]'
    ) as HTMLDivElement;
    const tabs = container.querySelector(
      '[data-testid="app-tabs"]'
    ) as HTMLDivElement;
    const tabList = container.querySelector('[role="tablist"]') as HTMLDivElement;
    const [versionCluster, centerCluster, resetButton] = Array.from(
      tabList.children
    ) as HTMLDivElement[];

    expect(shell.className).toContain("min-h-screen");
    expect(tabs.className).toContain("max-w-6xl");
    expect(tabs.className).not.toContain("max-w-2xl");
    expect(tabList.className).toContain("w-full");
    expect(tabList.className).toContain("gap-x-2");
    expect(tabList.className).toContain("relative");
    expect(versionCluster.className).toContain("absolute");
    expect(versionCluster.className).toContain("left-4");
    expect(versionCluster.className).toContain("top-1/2");
    expect(versionCluster.className).toContain("-translate-y-1/2");
    expect(versionCluster.className).toContain("flex items-center gap-x-2");
    expect(versionCluster.textContent).toContain("trunk");
    expect(centerCluster.className).toContain("mx-auto");
    expect(centerCluster.className).toContain("flex items-center gap-x-2");
    expect(centerCluster.textContent).toContain("DCSS Calculator");
    expect(centerCluster.textContent).toContain("import");
    expect(resetButton.className).toContain("absolute");
    expect(resetButton.className).toContain("right-8");
    expect(container.textContent).toContain("DCSS Calculator");
    expect(container.textContent).toContain("trunk");
    expect(container.textContent).toContain("Reset to Default");
    expect(
      container.querySelector('[data-testid="morgue-import-stub"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="calculator-stub"]')
    ).not.toBeNull();
  });
});
