import { describe, expect, test } from "@jest/globals";
import spells033 from "@/data/generated-spells.0.33.json";
import spells034 from "@/data/generated-spells.0.34.json";
import spellsTrunk from "@/data/generated-spells.trunk.json";
import { getSpellData } from "@/utils/spellCalculation";

describe("spell data selection", () => {
  test("0.33 reads from the 0.33 generated dataset instead of falling through", () => {
    expect(getSpellData("0.33")).toBe(spells033);
    expect(getSpellData("0.33")).not.toBe(spellsTrunk);
  });

  test("0.34 reads from the 0.34 generated dataset instead of falling through", () => {
    expect(getSpellData("0.34")).toBe(spells034);
    expect(getSpellData("0.34")).not.toBe(spellsTrunk);
  });

  test("trunk keeps reading from the trunk generated dataset", () => {
    expect(getSpellData("trunk")).toBe(spellsTrunk);
  });
});
