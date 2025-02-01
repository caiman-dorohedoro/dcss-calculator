import { describe, expect, test } from "@jest/globals";
import { calculateAC } from "../acCalculations";

describe("EV Calculations", () => {
  test("calculateAC", () => {
    expect(calculateAC(10, 6.3)).toBe(12);
    expect(calculateAC(10, 3.6)).toBe(11);
    expect(calculateAC(6, 4.6)).toBe(7);
    expect(calculateAC(3, 9)).toBe(4);
  });
});
