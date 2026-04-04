import { describe, expect, test } from "@jest/globals";
import { formulaProfiles } from "../formulaProfiles";

describe("formulaProfiles", () => {
  test("legacy210 caps spell fail chance at 210", () => {
    expect(formulaProfiles.legacy210.applySpellCap(999)).toBe(210);
  });

  test("modern400 caps spell fail chance at 400", () => {
    expect(formulaProfiles.modern400.applySpellCap(999)).toBe(400);
  });
});
