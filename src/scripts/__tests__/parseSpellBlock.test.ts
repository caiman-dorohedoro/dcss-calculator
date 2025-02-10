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
    expect(parsedSpell?.level).toBe(1);
  });

  test("spell with flags", () => {
    const spell = `{
    SPELL_DEATHS_DOOR, "Death's Door",
    spschool::necromancy,
    spflag::utility | spflag::no_ghost,
    9,
    200,
    -1, -1,
    0,
    TILEG_DEATHS_DOOR,
},
`;

    const parsedSpell = parseSpellBlock(spell);

    expect(parsedSpell).toBeDefined();
    expect(parsedSpell?.id).toBe("SPELL_DEATHS_DOOR");
    expect(parsedSpell?.name).toBe("Death's Door");
    expect(parsedSpell?.schools).toStrictEqual(["necromancy"]);
    expect(parsedSpell?.flags).toStrictEqual(["utility", "no_ghost"]);
    expect(parsedSpell?.level).toBe(9);
  });

  test("spell with multiple tags, schools", () => {
    const spell = `{
    SPELL_MEPHITIC_CLOUD, "Mephitic Cloud",
    spschool::conjuration | spschool::alchemy | spschool::air,
    spflag::dir_or_target | spflag::area
        | spflag::needs_tracer | spflag::cloud,
    3,
    100,
    4, 4,
    0,
    TILEG_MEPHITIC_CLOUD,
},
`;

    const parsedSpell = parseSpellBlock(spell);

    expect(parsedSpell).toBeDefined();
    expect(parsedSpell?.id).toBe("SPELL_MEPHITIC_CLOUD");
    expect(parsedSpell?.name).toBe("Mephitic Cloud");
    expect(parsedSpell?.schools).toStrictEqual([
      "conjuration",
      "alchemy",
      "air",
    ]);
    expect(parsedSpell?.flags).toStrictEqual([
      "dir_or_target",
      "area",
      "needs_tracer",
      "cloud",
    ]);
    expect(parsedSpell?.level).toBe(3);
  });

  test("comment in flags", () => {
    const spell = `{
    SPELL_CONFUSING_TOUCH, "Confusing Touch",
    spschool::hexes,
    spflag::selfench | spflag::WL_check, // Show success in the static targeter
    3,
    100,
    -1, -1,
    0,
    TILEG_CONFUSING_TOUCH,
}
`;

    const parsedSpell = parseSpellBlock(spell);

    expect(parsedSpell).toBeDefined();
    expect(parsedSpell?.id).toBe("SPELL_CONFUSING_TOUCH");
    expect(parsedSpell?.name).toBe("Confusing Touch");
    expect(parsedSpell?.schools).toStrictEqual(["hexes"]);
    expect(parsedSpell?.flags).toStrictEqual(["selfench", "WL_check"]);
    expect(parsedSpell?.level).toBe(3);
  });

  test("comment in name", () => {
    const spell = `{
    SPELL_SUMMON_DRAGON, "Summon Dragon", // see also, SPELL_DRAGON_CALL
    spschool::summoning,
    spflag::mons_abjure | spflag::monster,
    9,
    200,
    -1, -1,
    0,
    TILEG_SUMMON_DRAGON,
},
`;

    const parsedSpell = parseSpellBlock(spell);

    expect(parsedSpell).toBeDefined();
    expect(parsedSpell?.id).toBe("SPELL_SUMMON_DRAGON");
    expect(parsedSpell?.name).toBe("Summon Dragon");
    expect(parsedSpell?.schools).toStrictEqual(["summoning"]);
    expect(parsedSpell?.flags).toStrictEqual(["mons_abjure", "monster"]);
    expect(parsedSpell?.level).toBe(9);
  });
});
