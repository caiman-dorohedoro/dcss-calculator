import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "../defaultState";
import { getStartupSavedState } from "@/hooks/useCalculatorState";

describe("buildDefaultCalculatorState", () => {
  test("adds forgecraft to 0.33 school defaults because the spell dataset includes it", () => {
    const state = buildDefaultCalculatorState("0.33");

    expect(state.schoolSkills?.forgecraft).toBe(0);
  });

  test("adds forgecraft to 0.34 school defaults because the spell dataset includes it", () => {
    const state = buildDefaultCalculatorState("0.34");

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

  test("uses gale centaur for trunk defaults", () => {
    const state = buildDefaultCalculatorState("trunk");

    expect(state.species).toBe("galeCentaur");
    expect(state.targetSpell).toBe("Airstrike");
  });

  test("enables secondGloves on 0.34 defaults", () => {
    const state = buildDefaultCalculatorState("0.34");

    expect(state.secondGloves).toBe(false);
  });

  test("restores saved state in trunk, then 0.34, then 0.33, then 0.32 order", () => {
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
      "calculator_0.34",
      JSON.stringify(buildDefaultCalculatorState("0.34"))
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

    expect(restored?.version).toBe("trunk");
  });

  test("falls back to 0.34 before older stable saves when trunk state is absent", () => {
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
      "calculator_0.34",
      JSON.stringify(buildDefaultCalculatorState("0.34"))
    );
    localStorageMock.setItem(
      "calculator_0.32",
      JSON.stringify(buildDefaultCalculatorState("0.32"))
    );

    const restored = getStartupSavedState();

    expect(restored?.version).toBe("0.34");
  });

  test("falls back to 0.33 before 0.32 when newer saves are absent", () => {
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

    const restored = getStartupSavedState();

    expect(restored?.version).toBe("0.33");
  });

  test("skips an old trunk armataur save and falls back to 0.34", () => {
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
      "calculator_trunk",
      JSON.stringify({
        ...buildDefaultCalculatorState("trunk"),
        species: "armataur",
      })
    );
    localStorageMock.setItem(
      "calculator_0.34",
      JSON.stringify(buildDefaultCalculatorState("0.34"))
    );
    localStorageMock.setItem(
      "calculator_0.32",
      JSON.stringify(buildDefaultCalculatorState("0.32"))
    );

    const restored = getStartupSavedState();

    expect(restored?.version).toBe("0.34");
  });

  test("rejects a save whose target spell is not valid for that version", () => {
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
      "calculator_trunk",
      JSON.stringify({
        ...buildDefaultCalculatorState("trunk"),
        targetSpell: "Sting",
      })
    );

    expect(getStartupSavedState()).toBeNull();
  });
});
