import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { calculateSHData } from "../calculatorUtils";
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

  test("shieldless SH still includes reflection, residual SH, and bone plates", () => {
    expect(
      calculateSH({
        shield: "none",
        shieldSkill: 0,
        dexterity: 0,
        equipmentDex: 0,
        shieldEnchant: 7,
        equipmentSH: 4,
        amuletReflection: 1,
        largeBonePlates: 2,
      })
    ).toBe(15);
  });

  test("applies status-aware shield bonuses before reckless halves final SH", () => {
    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 19.5,
        dexterity: 12,
        equipmentDex: 6,
        shieldEnchant: 8,
        equipmentSH: 5,
        largeBonePlates: 1,
      })
    ).toBe(39);

    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 19.5,
        dexterity: 12,
        equipmentDex: 6,
        shieldEnchant: 8,
        equipmentSH: 5,
        largeBonePlates: 1,
        condensationShield: 1,
        reckless: true,
      })
    ).toBe(21);

    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 19.5,
        dexterity: 12,
        equipmentDex: 6,
        shieldEnchant: 8,
        equipmentSH: 5,
        largeBonePlates: 1,
        condensationShield: 1,
        ephemeralShield: 1,
        reckless: true,
      })
    ).toBe(21);

    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 19.5,
        dexterity: 12,
        equipmentDex: 6,
        shieldEnchant: 8,
        equipmentSH: 5,
        largeBonePlates: 1,
        condensationShield: 1,
        ephemeralShield: 1,
        activeStatusIds: ["ephemeral_shield"],
        reckless: true,
      })
    ).toBe(25);

    expect(
      calculateSH({
        shield: "tower_shield",
        shieldSkill: 19.5,
        dexterity: 12,
        equipmentDex: 6,
        shieldEnchant: 8,
        equipmentSH: 5,
        largeBonePlates: 1,
        condensationShield: 1,
        activeStatusIds: ["icemail_depleted"],
        reckless: true,
      })
    ).toBe(19);
  });

  test("dragon form melds shield and removes shield SH", () => {
    const state = buildDefaultCalculatorState("trunk");
    state.form = "dragon-form";
    state.shield = "kite_shield";
    state.shieldItem = {
      ...state.shieldItem,
      kind: "kite_shield",
      enchant: 2,
    };
    state.shieldSkill = 15;

    const current = calculateSHData(state).find((point) => point.shield === 15);

    expect(current?.sh).toBe(0);
  });

  test("applies blade parry only while parrying is active", () => {
    expect(
      calculateSH({
        shield: "none",
        shieldSkill: 0,
        dexterity: 10,
        bladeParry: 12,
      })
    ).toBe(0);

    expect(
      calculateSH({
        shield: "none",
        shieldSkill: 0,
        dexterity: 10,
        activeStatusIds: ["parrying"],
        bladeParry: 12,
      })
    ).toBe(12);
  });
});
