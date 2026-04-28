import { describe, expect, test } from "@jest/globals";
import { calculateAC, calculateMixedAC } from "../acCalculation";

describe("AC Calculations", () => {
  test("calculateAC", () => {
    expect(calculateAC(10, 6.3)).toBe(12);
    expect(calculateAC(10, 3.6)).toBe(11);
    expect(calculateAC(6, 4.6)).toBe(7);
    expect(calculateAC(3, 9)).toBe(4);
  });

  test("mixedCalculations", () => {
    // https://crawl.akrasiac.org/rawdata/fnjp/morgue-fnjp-20250205-042438.txt
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "minotaur",
        armour: "plate",
        armourSkill: 27,
        gloves: true,
        cloak: true,
        boots: true,
      })
    ).toBe(28);

    // https://crawl.akrasiac.org/rawdata/fnjp/morgue-fnjp-20250205-042438.txt
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "minotaur",
        armour: "crystal_plate",
        cloak: true,
        gloves: true,
        boots: true,
        armourSkill: 22.6,
      })
    ).toBe(34);

    // https://cbro.berotato.org/morgue/Shard1697/morgue-Shard1697-20250204-221626.txt
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "demonspawn",
        armour: "pearl_dragon",
        boots: true,
        armourSkill: 16.3,
      })
    ).toBe(19);

    // https://cbro.berotato.org/morgue/ojifijod/morgue-ojifijod-20250201-121909.txt
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "formicid",
        armour: "golden_dragon",
        armourSkill: 27,
        cloak: true,
        gloves: true,
        boots: true,
        secondGloves: true,
      })
    ).toBe(35);

    // https://archive.nemelex.cards/morgue/AxeManiac/morgue-AxeManiac-20250202-074753.txt
    expect(
      calculateMixedAC({
        version: "0.34",
        species: "armataur",
        armour: "golden_dragon",
        armourSkill: 27,
        cloak: true,
        gloves: true,
        barding: true,
      })
    ).toBe(29);

    // while in personal gameplay
    expect(
      calculateMixedAC({
        version: "0.34",
        species: "armataur",
        armour: "troll_leather",
        armourSkill: 11.9,
      })
    ).toBe(2);

    // This shows incorrect results, how is the serpent talisman being held in hand?
    // // https://underhound.eu/crawl/morgue/Ge0ff/morgue-Ge0ff-20240125-133758.txt
    // expect(
    //   mixedCalculations({
    //     species: "armataur",
    //     armour: "troll_leather",
    //     armourSkill: 12.6,
    //     gloves: true,
    //     barding: true,
    //     cloak: true,
    //   })
    // ).toBe(12);

    // https://crawl.akrasiac.org/rawdata/kerplink/morgue-kerplink-20250209-042353.txt
    expect(
      calculateMixedAC({
        version: "0.34",
        species: "armataur",
        armour: "acid_dragon",
        armourSkill: 26.5,
        gloves: true,
        barding: true,
      })
    ).toBe(18);
  });

  test("trunk gale centaur applies the deformed-body multiplier to body armour only", () => {
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "galeCentaur",
        armour: "acid_dragon",
        armourSkill: 26.5,
        gloves: true,
        barding: true,
      })
    ).toBe(18);
  });

  test("0.34 armataur applies the deformed-body multiplier to body armour only", () => {
    expect(
      calculateMixedAC({
        version: "0.34",
        species: "armataur",
        armour: "acid_dragon",
        armourSkill: 26.5,
        gloves: true,
        barding: true,
      })
    ).toBe(18);
  });

  test("0.34 naga still keeps the deformed-body armour penalty", () => {
    const minotaurAc = calculateMixedAC({
      version: "0.34",
      species: "minotaur",
      armour: "acid_dragon",
      armourSkill: 26.5,
    });

    const nagaAc = calculateMixedAC({
      version: "0.34",
      species: "naga",
      armour: "acid_dragon",
      armourSkill: 26.5,
    });

    expect(minotaurAc).toBe(13);
    expect(nagaAc).toBe(7);
  });

  test("applies Crawl deformed body, scarf base AC, and icemail AC in the body-armour AC path", () => {
    expect(
      calculateMixedAC({
        version: "0.34",
        species: "demonspawn",
        armour: "plate",
        armourSkill: 22.2,
        bodyArmourEnchant: 7,
        headgearSlots: [{ present: true, enchant: 1, kind: "hat" } as never],
        boots: true,
        bootsEnchant: 3,
        cloak: true,
        cloakBaseAc: 0,
        equipmentAC: 3,
        deformedBody: true,
        icemail: 2,
      })
    ).toBe(36);

    expect(
      calculateMixedAC({
        version: "0.34",
        species: "demonspawn",
        armour: "plate",
        armourSkill: 22.2,
        bodyArmourEnchant: 7,
        headgearSlots: [{ present: true, enchant: 1, kind: "hat" } as never],
        boots: true,
        bootsEnchant: 3,
        cloak: true,
        cloakBaseAc: 0,
        equipmentAC: 3,
        deformedBody: true,
        icemail: 2,
        activeStatusIds: ["icemail_depleted"],
      })
    ).toBe(28);
  });

  test("trunk gale centaur, pearl dragon scales, gloves, barding, armour skill 13.8, AC 17", () => {
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "galeCentaur",
        armour: "pearl_dragon",
        armourSkill: 13.8,
        gloves: true,
        barding: true,
      })
    ).toBe(17);
  });

  test(
    "trunk gale centaur shapeshifter dump: plate plus aux pieces should be 27 AC after removing enchantment bonuses",
    () => {
      // Dump AC 50 minus enchantment bonuses (+11 plate, +4 helmet,
      // +1 cloak, +2 gloves, +5 barding) should leave 27.
      expect(
        calculateMixedAC({
          version: "trunk",
          species: "galeCentaur",
          armour: "plate",
          armourSkill: 24.5,
          helmet: true,
          cloak: true,
          gloves: true,
          barding: true,
        })
      ).toBe(27);
    }
  );

  test("mountain dwarf, scale mail, helmet, cloack, gloves, boots, str 30, 19.4 armour skill, total 13 ac bounus", () => {
    // https://crawl.akrasiac.org/rawdata/acky8/morgue-acky8-20250214-182911.txt
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "mountainDwarf",
        armour: "scale_mail",
        armourSkill: 19.4,
        gloves: true,
        cloak: true,
        boots: true,
        helmet: true,
      })
    ).toBe(18);
  });

  test("signed enchant, protection rings, residual AC, and scales AC all affect AC", () => {
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "human",
        armour: "robe",
        armourSkill: 0,
        headgearSlots: [{ present: true, enchant: -1 }],
        gloveSlots: [{ present: true, enchant: 2 }],
        boots: true,
        bootsEnchant: 0,
        cloak: true,
        cloakEnchant: -1,
        bodyArmourEnchant: 0,
        ringProtection: 4,
        equipmentAC: 2,
        scalesAC: 3,
      })
    ).toBe(15);
  });

  test("applies barding enchant only when barding is equipped", () => {
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "naga",
        armour: "none",
        armourSkill: 0,
        barding: true,
        bardingEnchant: 4,
      })
    ).toBe(8);

    expect(
      calculateMixedAC({
        version: "trunk",
        species: "naga",
        armour: "none",
        armourSkill: 0,
        barding: false,
        bardingEnchant: 4,
      })
    ).toBe(0);
  });

  test("ignores legacy helmet and glove booleans when slot arrays are present", () => {
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "human",
        armour: "none",
        armourSkill: 0,
        headgearSlots: [{ present: false, enchant: 0 }],
        gloveSlots: [{ present: false, enchant: 0 }],
        helmet: true,
        gloves: true,
        secondGloves: true,
      })
    ).toBe(0);
  });

  test("ignores stale body-armour enchant when no body armour is equipped", () => {
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "human",
        armour: "none",
        bodyArmourEnchant: 5,
        armourSkill: 0,
      })
    ).toBe(0);
  });

  test("treats hats as 0 base AC while still applying headgear enchant", () => {
    expect(
      calculateMixedAC({
        version: "trunk",
        species: "human",
        armour: "none",
        armourSkill: 0,
        headgearSlots: [{ present: true, enchant: 4, kind: "hat" } as never],
      })
    ).toBe(4);
  });
});
