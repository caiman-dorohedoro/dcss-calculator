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

    expect(
      calculateSH({
        shield: "none",
        shieldSkill: 5,
        dexterity: 27,
      })
    ).toBe(0);

    // Dump SH 36 minus the tower shield's +7 enhancement bonus.
    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 27,
        dexterity: 31,
      })
    ).toBe(29);
  });

  test("shield enchant, reflection, residual SH, bone plates, and equipment dex affect SH", () => {
    const base = calculateSH({
      shield: "tower_shield",
      shieldSkill: 27,
      dexterity: 15,
      equipmentDex: 0,
      shieldEnchant: 0,
      equipmentSH: 0,
      amuletReflection: 0,
      largeBonePlates: 0,
    });

    const modified = calculateSH({
      shield: "tower_shield",
      shieldSkill: 27,
      dexterity: 15,
      equipmentDex: 6,
      shieldEnchant: 3,
      equipmentSH: 4,
      amuletReflection: 1,
      largeBonePlates: 2,
    });

    expect(modified - base).toBe(19);
  });
});
