import { describe, expect, test } from "@jest/globals";
import {
  getEquipmentEgoOptionsForBaseName,
  isEquipmentEgoAllowedForBaseName,
} from "../equipmentEgos";

describe("equipment ego availability", () => {
  test("filters body armour egos by selected base item", () => {
    expect(getEquipmentEgoOptionsForBaseName("robe").map(([key]) => key)).toEqual([
      "none",
      "willpower",
      "cold resistance",
      "fire resistance",
      "positive energy",
      "resistance",
    ]);
    expect(isEquipmentEgoAllowedForBaseName("robe", "resonance")).toBe(false);

    expect(
      getEquipmentEgoOptionsForBaseName("scale mail").map(([key]) => key)
    ).toEqual([
      "none",
      "fire resistance",
      "cold resistance",
      "willpower",
      "poison resistance",
      "positive energy",
      "archery",
      "command",
      "death",
      "resonance",
    ]);
  });

  test("filters non-body armour egos by selected base item", () => {
    expect(getEquipmentEgoOptionsForBaseName("scarf").map(([key]) => key)).toEqual([
      "none",
      "resistance",
      "repulsion",
      "invisibility",
      "harm",
      "shadows",
    ]);
    expect(getEquipmentEgoOptionsForBaseName("gloves").map(([key]) => key)).toEqual([
      "none",
      "dexterity",
      "strength",
      "parrying",
      "hurling",
      "stealth",
      "infusion",
      "fire",
    ]);
    expect(getEquipmentEgoOptionsForBaseName("orb").map(([key]) => key)).toEqual([
      "none",
      "glass",
      "mayhem",
      "guile",
      "energy",
      "pyromania",
      "stardust",
      "mesmerism",
      "attunement",
    ]);
    expect(getEquipmentEgoOptionsForBaseName("tower shield").map(([key]) => key)).toEqual([
      "none",
      "protection",
      "reflection",
      "ponderousness",
      "corrosion resistance",
      "fire resistance",
      "cold resistance",
      "poison resistance",
      "positive energy",
    ]);
  });

  test("normal is a generation bucket and is not exposed as an ego option", () => {
    expect(getEquipmentEgoOptionsForBaseName("robe").map(([key]) => key)).not.toContain(
      "normal"
    );
    expect(
      getEquipmentEgoOptionsForBaseName("buckler").map(([key]) => key)
    ).not.toContain("normal");
  });

  test("preserves unknown current ego options ahead of legal choices", () => {
    expect(
      getEquipmentEgoOptionsForBaseName("robe", "future mystery").map(([key]) => key)
    ).toEqual([
      "future mystery",
      "none",
      "willpower",
      "cold resistance",
      "fire resistance",
      "positive energy",
      "resistance",
    ]);
  });

  test("does not preserve known egos that are illegal for the selected base item", () => {
    expect(
      getEquipmentEgoOptionsForBaseName("robe", "resonance").map(([key]) => key)
    ).not.toContain("resonance");
  });
});
