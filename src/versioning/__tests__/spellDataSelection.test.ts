import { describe, expect, test } from "@jest/globals";
import { getSpellData } from "@/utils/spellCalculation";
import { getVersionConfig } from "../versionRegistry";

describe("spell data selection", () => {
  test("0.33 reads from the 0.33 generated dataset instead of falling through", () => {
    expect(getSpellData("0.33")).toBe(getVersionConfig("0.33").spells);
  });

  test("trunk keeps reading from the trunk generated dataset", () => {
    expect(getSpellData("trunk")).toBe(getVersionConfig("trunk").spells);
  });
});
