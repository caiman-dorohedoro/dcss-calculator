import { describe, expect, test } from "@jest/globals";
import { calculateSH } from "../shCalculation";

describe("SH Calculations", () => {
  test("calculateSH", () => {
    // https://underhound.eu/crawl/morgue/Lymetel/morgue-Lymetel-20250205-171922.txt
    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 23.9,
        dexterity: 15,
      })
    ).toBe(23);

    // https://crawl.akrasiac.org/rawdata/Kuromaro/morgue-Kuromaro-20250205-163947.txt
    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 27,
        dexterity: 18,
      })
    ).toBe(26);

    // https://archive.nemelex.cards/morgue/malfuriongg/morgue-malfuriongg-20250205-122315.txt
    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 25.5,
        dexterity: 14,
      })
    ).toBe(24);
  });
});
