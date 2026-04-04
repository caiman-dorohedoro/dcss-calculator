import { describe, expect, test } from "@jest/globals";
import { spellCanBeEnkindled } from "../spellCanbeEnkindled";

describe("spellCanBeEnkindled", () => {
  test("returns false when enkindle is disabled for the version", () => {
    expect(spellCanBeEnkindled("0.33", "Hellfire Mortar")).toBe(false);
  });

  test("returns true for Hellfire Mortar on trunk", () => {
    expect(spellCanBeEnkindled("trunk", "Hellfire Mortar")).toBe(true);
  });
});
