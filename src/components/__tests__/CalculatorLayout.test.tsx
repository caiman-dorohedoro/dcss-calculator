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

type SortableAccordionItemMockProps = {
  id: string;
  title: string;
  content: ReactNode;
};

await jest.unstable_mockModule("@/components/chart/SFChart", () => ({
  __esModule: true,
  default: () => <div data-testid="sf-chart">sf chart</div>,
}));

await jest.unstable_mockModule("@/components/chart/EVChart", () => ({
  __esModule: true,
  default: () => <div data-testid="ev-chart">ev chart</div>,
}));

await jest.unstable_mockModule("@/components/chart/ACChart", () => ({
  __esModule: true,
  default: () => <div data-testid="ac-chart">ac chart</div>,
}));

await jest.unstable_mockModule("@/components/chart/SHChart", () => ({
  __esModule: true,
  default: () => <div data-testid="sh-chart">sh chart</div>,
}));

await jest.unstable_mockModule("@/components/SortableAccordionItem", () => ({
  SortableAccordionItem: ({
    id,
    title,
    content,
  }: SortableAccordionItemMockProps) => (
    <section data-testid={`accordion-item-${id}`}>
      <h2>{title}</h2>
      <div>{content}</div>
    </section>
  ),
}));

await jest.unstable_mockModule("@/assets/pixelated-github-white.png", () => ({
  __esModule: true,
  default: "github.png",
}));

const { default: Calculator } = await import("../Calculator");

describe("Calculator desktop layout", () => {
  let container: HTMLDivElement;
  let root: Root;
  const mockSetState = jest.fn();

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
    mockSetState.mockReset();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
  });

  test("keeps graphs on the left and a sticky control card on the right at desktop breakpoints", async () => {
    await act(async () => {
      root.render(
        <Calculator
          state={buildDefaultCalculatorState("trunk")}
          setState={mockSetState}
        />
      );
    });

    const layout = container.querySelector(
      '[data-testid="calculator-layout"]'
    ) as HTMLDivElement;
    const controls = container.querySelector(
      '[data-testid="calculator-controls-card"]'
    ) as HTMLDivElement;
    const graphs = container.querySelector(
      '[data-testid="calculator-graphs-card"]'
    ) as HTMLDivElement;
    const mobileCard = container.querySelector(
      '[data-testid="calculator-mobile-card"]'
    ) as HTMLDivElement;

    expect(layout.className).toContain("lg:grid");
    expect(layout.className).toContain("lg:grid-cols-[minmax(0,1fr)_22rem]");
    expect(mobileCard.className).toContain("lg:hidden");
    expect(controls.className).toContain("lg:order-2");
    expect(controls.className).toContain("lg:sticky");
    expect(controls.className).toContain("lg:top-4");
    expect(controls.className).toContain("hidden");
    expect(controls.className).toContain("lg:block");
    expect(graphs.className).toContain("min-w-0");
    expect(graphs.className).toContain("lg:order-1");
    expect(graphs.className).toContain("hidden");
    expect(graphs.className).toContain("lg:block");
    expect(container.textContent).toContain("Species");
    expect(
      container.querySelector('[data-testid="accordion-item-sf"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="accordion-item-ev"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="accordion-item-ac"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="accordion-item-sh"]')
    ).not.toBeNull();
  });
});
