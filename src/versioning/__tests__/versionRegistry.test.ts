import { describe, expect, test } from "@jest/globals";
import spells032 from "@/data/generated-spells.0.32.json";
import spells033 from "@/data/generated-spells.0.33.json";
import spells034 from "@/data/generated-spells.0.34.json";
import spellsTrunk from "@/data/generated-spells.trunk.json";
import { getVersionConfig, versionRegistry } from "../versionRegistry";

describe("versionRegistry", () => {
  test("returns the generated spell dataset for each version", () => {
    expect(getVersionConfig("0.32").spells).toBe(spells032);
    expect(getVersionConfig("0.33").spells).toBe(spells033);
    expect(getVersionConfig("0.34").spells).toBe(spells034);
    expect(getVersionConfig("trunk").spells).toBe(spellsTrunk);
  });

  test("keeps version-specific species separate", () => {
    expect("ghoul" in versionRegistry["0.32"].species).toBe(true);
    expect("ghoul" in versionRegistry["0.33"].species).toBe(false);
    expect("ghoul" in versionRegistry["0.34"].species).toBe(false);
    expect("revenant" in versionRegistry["0.34"].species).toBe(true);
    expect("revenant" in versionRegistry.trunk.species).toBe(true);
    expect("revenant" in versionRegistry["0.32"].species).toBe(false);
  });

  test("selects the expected formula profile per version", () => {
    expect(versionRegistry["0.32"].formulaProfile).toBe("legacy210");
    expect(versionRegistry["0.33"].formulaProfile).toBe("modern400");
    expect(versionRegistry["0.34"].formulaProfile).toBe("modern400");
    expect(versionRegistry.trunk.formulaProfile).toBe("modern400");
  });

  test("exposes the expected feature flags and defaults per version", () => {
    expect(versionRegistry["0.32"].features.secondGloves).toBe(false);
    expect(versionRegistry["0.32"].features.enkindle).toBe(false);
    expect(versionRegistry["0.32"].defaults).toEqual({
      species: "armataur",
      targetSpell: "Airstrike",
    });

    expect(versionRegistry["0.33"].features.secondGloves).toBe(true);
    expect(versionRegistry["0.33"].features.enkindle).toBe(false);
    expect(versionRegistry["0.33"].defaults).toEqual({
      species: "armataur",
      targetSpell: "Airstrike",
    });

    expect(versionRegistry["0.34"].features.secondGloves).toBe(true);
    expect(versionRegistry["0.34"].features.enkindle).toBe(false);
    expect(versionRegistry["0.34"].defaults).toEqual({
      species: "armataur",
      targetSpell: "Airstrike",
    });

    expect(versionRegistry.trunk.features.secondGloves).toBe(true);
    expect(versionRegistry.trunk.features.enkindle).toBe(true);
    expect(versionRegistry.trunk.defaults).toEqual({
      species: "armataur",
      targetSpell: "Airstrike",
    });
  });
});
