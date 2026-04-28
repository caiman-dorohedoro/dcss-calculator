import { describe, expect, test } from "@jest/globals";
import { spellCanBeEnkindled } from "../spellCanbeEnkindled";

describe("spellCanBeEnkindled", () => {
  test("returns false when enkindle is disabled for the version", () => {
    expect(spellCanBeEnkindled("0.32", "Hellfire Mortar")).toBe(false);
  });

  test("returns true for Hellfire Mortar on Revenant versions", () => {
    expect(spellCanBeEnkindled("0.33", "Hellfire Mortar")).toBe(true);
    expect(spellCanBeEnkindled("0.34", "Hellfire Mortar")).toBe(true);
    expect(spellCanBeEnkindled("trunk", "Hellfire Mortar")).toBe(true);
  });

  test("matches Crawl's Enkindle exceptions on Revenant versions", () => {
    for (const version of ["0.33", "0.34", "trunk"] as const) {
      expect(spellCanBeEnkindled(version, "Spellspark Servitor")).toBe(false);
      expect(spellCanBeEnkindled(version, "Mephitic Cloud")).toBe(false);
      expect(spellCanBeEnkindled(version, "Dispel Undead")).toBe(true);
    }
  });
});
