import { describe, expect, test } from "@jest/globals";
import {
  getArmourEncumbrance,
  getBodyArmourEgoOptions,
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

  test("only exposes no special body-armour spell ego before 0.34", () => {
    expect(Object.keys(getBodyArmourEgoOptions("0.32"))).toEqual(["none"]);
    expect(Object.keys(getBodyArmourEgoOptions("0.33"))).toEqual(["none"]);
  });

  test("exposes command, death, and resonance egos on 0.34 and trunk", () => {
    expect(Object.keys(getBodyArmourEgoOptions("0.34"))).toEqual([
      "none",
      "command",
      "death",
      "resonance",
    ]);
    expect(Object.keys(getBodyArmourEgoOptions("trunk"))).toEqual([
      "none",
      "command",
      "death",
      "resonance",
    ]);
  });
});
