import { describe, expect, test } from "@jest/globals";
import { getEquipmentToggleKeys } from "../uiOptions";

describe("getEquipmentToggleKeys", () => {
  test("0.32 excludes secondGloves", () => {
    expect(getEquipmentToggleKeys("0.32")).toEqual([
      "helmet",
      "cloak",
      "gloves",
      "boots",
      "barding",
    ]);
  });

  test("0.33 includes secondGloves", () => {
    expect(getEquipmentToggleKeys("0.33")).toEqual([
      "helmet",
      "cloak",
      "gloves",
      "boots",
      "barding",
      "secondGloves",
    ]);
  });

  test("trunk includes secondGloves", () => {
    expect(getEquipmentToggleKeys("trunk")).toEqual([
      "helmet",
      "cloak",
      "gloves",
      "boots",
      "barding",
      "secondGloves",
    ]);
  });
});
