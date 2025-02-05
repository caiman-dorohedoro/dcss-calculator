import { describe, expect, test } from "@jest/globals";
import { calculateAC, mixedCalculations } from "../acCalculations";

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
      mixedCalculations({
        armour: "plate",
        armourSkill: 27,
        gloves: true,
        cloak: true,
        boots: true,
      })
    ).toBe(28);

    // https://crawl.akrasiac.org/rawdata/fnjp/morgue-fnjp-20250205-042438.txt
    expect(
      mixedCalculations({
        armour: "crystal_plate",
        cloak: true,
        gloves: true,
        boots: true,
        armourSkill: 22.6,
      })
    ).toBe(34);

    // https://cbro.berotato.org/morgue/Shard1697/morgue-Shard1697-20250204-221626.txt
    expect(
      mixedCalculations({
        armour: "pearl_dragon",
        boots: true,
        armourSkill: 16.3,
      })
    ).toBe(19);

    // https://cbro.berotato.org/morgue/ojifijod/morgue-ojifijod-20250201-121909.txt
    expect(
      mixedCalculations({
        armour: "golden_dragon",
        armourSkill: 27,
        cloak: true,
        gloves: true,
        boots: true,
        secondGloves: true,
      })
    ).toBe(35);
  });
});
