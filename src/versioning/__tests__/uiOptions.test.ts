import { describe, expect, test } from "@jest/globals";
import { getEquipmentToggleKeys } from "../uiOptions";

describe("getEquipmentToggleKeys", () => {
  test("always exposes only the fixed equipment toggles", () => {
    expect(getEquipmentToggleKeys()).toEqual([
      "cloak",
      "boots",
      "barding",
    ]);
  });
});
