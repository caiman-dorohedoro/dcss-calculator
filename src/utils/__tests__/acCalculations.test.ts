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
        species: "demonspawn",
        armour: "pearl_dragon",
        boots: true,
        armourSkill: 16.3,
      })
    ).toBe(19);

    // https://cbro.berotato.org/morgue/ojifijod/morgue-ojifijod-20250201-121909.txt
    expect(
      calculateMixedAC({
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
        species: "armataur",
        armour: "golden_dragon",
        armourSkill: 27,
        cloak: true,
        gloves: true,
        barding: true,
      })
    ).toBe(34);

    // while in personal gameplay
    expect(
      calculateMixedAC({
        species: "armataur",
        armour: "troll_leather",
        armourSkill: 11.9,
      })
    ).toBe(3);

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
        species: "armataur",
        armour: "acid_dragon",
        armourSkill: 26.5,
        gloves: true,
        barding: true,
      })
    ).toBe(21);
  });

  test("mountain dwarf, scale mail, helmet, cloack, gloves, boots, str 30, 19.4 armour skill, total 13 ac bounus", () => {
    // https://crawl.akrasiac.org/rawdata/acky8/morgue-acky8-20250214-182911.txt
    expect(
      calculateMixedAC({
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
});
