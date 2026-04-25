import { describe, expect, test } from "@jest/globals";
import {
  getArmourEncumbrance,
  getBodyArmourEgoOptions,
  getSpellBoostBodyArmourEgoOptions,
} from "../equipmentData";

describe("equipmentData", () => {
  test("keeps fire dragon scales at encumbrance 11 on 0.32 and 0.33", () => {
    expect(getArmourEncumbrance("0.32", "fire_dragon")).toBe(11);
    expect(getArmourEncumbrance("0.33", "fire_dragon")).toBe(11);
  });

  test("uses fire dragon scales encumbrance 9 on 0.34 and trunk", () => {
    expect(getArmourEncumbrance("0.34", "fire_dragon")).toBe(9);
    expect(getArmourEncumbrance("trunk", "fire_dragon")).toBe(9);
  });

  test("does not change unrelated armour encumbrance across versions", () => {
    expect(getArmourEncumbrance("0.32", "acid_dragon")).toBe(5);
    expect(getArmourEncumbrance("0.34", "acid_dragon")).toBe(5);
    expect(getArmourEncumbrance("trunk", "acid_dragon")).toBe(5);
  });

  test("exposes common Crawl body-armour egos on all supported versions", () => {
    for (const version of ["0.32", "0.33", "0.34", "trunk"] as const) {
      expect(Object.keys(getBodyArmourEgoOptions(version))).toEqual(
        expect.arrayContaining([
          "none",
          "willpower",
          "strength",
          "dexterity",
          "intelligence",
          "protection",
          "resistance",
          "ponderousness",
        ])
      );
    }
  });

  test("exposes command, death, and resonance as spell-boost egos only on 0.34 and trunk", () => {
    expect(Object.keys(getSpellBoostBodyArmourEgoOptions("0.32"))).toEqual([
      "none",
    ]);
    expect(Object.keys(getSpellBoostBodyArmourEgoOptions("0.33"))).toEqual([
      "none",
    ]);
    expect(Object.keys(getSpellBoostBodyArmourEgoOptions("0.34"))).toEqual([
      "none",
      "command",
      "death",
      "resonance",
    ]);
    expect(Object.keys(getSpellBoostBodyArmourEgoOptions("trunk"))).toEqual([
      "none",
      "command",
      "death",
      "resonance",
    ]);
  });
});
