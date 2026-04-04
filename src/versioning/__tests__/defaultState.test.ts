import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "../defaultState";
import { getStartupSavedState } from "@/hooks/useCalculatorState";

describe("buildDefaultCalculatorState", () => {
  test("adds forgecraft to 0.33 school defaults because the spell dataset includes it", () => {
    const state = buildDefaultCalculatorState("0.33");

    expect(state.schoolSkills?.forgecraft).toBe(0);
  });

  test("uses registry defaults for species and target spell", () => {
    const state = buildDefaultCalculatorState("0.33");

    expect(state.species).toBe("armataur");
    expect(state.targetSpell).toBe("Airstrike");
  });

  test("does not expose secondGloves on 0.32 defaults", () => {
    const state = buildDefaultCalculatorState("0.32");

    expect("secondGloves" in state && state.secondGloves !== undefined).toBe(
      false
    );
  });

  test("enables secondGloves on trunk defaults", () => {
    const state = buildDefaultCalculatorState("trunk");

    expect(state.secondGloves).toBe(false);
  });

  test("restores saved state in trunk, then 0.32, then 0.33 order", () => {
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });

    localStorageMock.setItem(
      "calculator_0.33",
      JSON.stringify(buildDefaultCalculatorState("0.33"))
    );
    localStorageMock.setItem(
      "calculator_0.32",
      JSON.stringify(buildDefaultCalculatorState("0.32"))
    );
    localStorageMock.setItem(
      "calculator_trunk",
      JSON.stringify(buildDefaultCalculatorState("trunk"))
    );

    const restored = getStartupSavedState();

    expect(JSON.parse(restored ?? "{}").version).toBe("trunk");
  });
});
