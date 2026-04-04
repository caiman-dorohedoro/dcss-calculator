import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "../defaultState";

describe("buildDefaultCalculatorState", () => {
  test("adds forgecraft to 0.33 school defaults because the spell dataset includes it", () => {
    const state = buildDefaultCalculatorState("0.33");

    expect(state.schoolSkills?.forgecraft).toBe(0);
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
});
