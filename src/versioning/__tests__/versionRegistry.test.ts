import { describe, expect, test } from "@jest/globals";
import spells032 from "@/data/generated-spells.0.32.json";
import spells033 from "@/data/generated-spells.0.33.json";
import spellsTrunk from "@/data/generated-spells.trunk.json";
import { getVersionConfig, versionRegistry } from "../versionRegistry";

describe("versionRegistry", () => {
  test("returns the generated spell dataset for each version", () => {
    expect(getVersionConfig("0.32").spells).toBe(spells032);
    expect(getVersionConfig("0.33").spells).toBe(spells033);
    expect(getVersionConfig("trunk").spells).toBe(spellsTrunk);
  });

  test("keeps 0.32-only and trunk-only species separate", () => {
    expect("ghoul" in versionRegistry["0.32"].species).toBe(true);
    expect("ghoul" in versionRegistry["0.33"].species).toBe(false);
    expect("revenant" in versionRegistry.trunk.species).toBe(true);
    expect("revenant" in versionRegistry["0.32"].species).toBe(false);
  });

  test("selects the expected formula profile per version", () => {
    expect(versionRegistry["0.32"].formulaProfile).toBe("legacy210");
    expect(versionRegistry["0.33"].formulaProfile).toBe("modern400");
    expect(versionRegistry.trunk.formulaProfile).toBe("modern400");
  });
});
