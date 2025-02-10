import { parseSpellBlock } from "../extractSpellDataHeader";

describe("parseSpellBlock", () => {
  test("simple spell data", () => {
    const spell = `{
  SPELL_SUMMON_SMALL_MAMMAL, "Summon Small Mammal",
  spschool::summoning,
  spflag::none,
  1,
  25,
  -1, -1,
  0,
  TILEG_SUMMON_SMALL_MAMMAL,
},
`;

    const parsedSpell = parseSpellBlock(spell);

    expect(parsedSpell).toBeDefined();
    expect(parsedSpell?.id).toBe("SPELL_SUMMON_SMALL_MAMMAL");
    expect(parsedSpell?.name).toBe("Summon Small Mammal");
    expect(parsedSpell?.schools).toStrictEqual(["summoning"]);
    expect(parsedSpell?.flags).toStrictEqual([]);
  });
});
