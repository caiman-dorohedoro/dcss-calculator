import { describe, expect, test } from "@jest/globals";
import { rawSpellFail } from "../spellCalculation";
import { SpellDifficultyLevel } from "../spellCalculation";

describe("Spell Calculations", () => {
  test("should calculate spell success correctly", () => {
    const params = {
      strength: 4,
      spellcastingSkill: 4.5,
      intelligence: 25,
      conjurationSkill: 5.3,
      secondSkill: 0,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(28);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      strength: 4,
      spellcastingSkill: 4.8,
      intelligence: 25,
      conjurationSkill: 5.4,
      secondSkill: 0.8,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(24);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      strength: 4,
      spellcastingSkill: 6.2,
      intelligence: 31,
      conjurationSkill: 6.3,
      secondSkill: 3.2,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(7);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      strength: 4,
      spellcastingSkill: 9.2,
      intelligence: 32,
      conjurationSkill: 7.2,
      secondSkill: 4.3,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(3);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      strength: 4,
      spellcastingSkill: 9.2,
      intelligence: 32,
      conjurationSkill: 7.2,
      secondSkill: 4.3,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 4 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(5);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      strength: 4,
      spellcastingSkill: 9.2,
      intelligence: 32,
      conjurationSkill: 7.2,
      secondSkill: 4.3,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 14 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(100);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      strength: 4,
      spellcastingSkill: 9.2,
      intelligence: 32,
      conjurationSkill: 7.2,
      secondSkill: 4.3,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 7 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(19);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      strength: 4,
      spellcastingSkill: 10.3,
      intelligence: 34,
      conjurationSkill: 8,
      secondSkill: 5,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(1);
  });

  // https://archive.nemelex.cards/morgue/caiman/morgue-caiman-20250131-054317.txt
  test("should calculate spell success correctly", () => {
    const params = {
      strength: 13,
      spellcastingSkill: 7,
      intelligence: 13,
      conjurationSkill: 8,
      secondSkill: 4,
      spellDifficulty: 3 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 4 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 9,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(4);
  });

  // https://archive.nemelex.cards/morgue/caiman/morgue-caiman-20250126-091458.txt
  test("should calculate spell success correctly", () => {
    const params = {
      strength: 41,
      spellcastingSkill: 15,
      intelligence: 9,
      conjurationSkill: 14,
      secondSkill: 6,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 15 },
      equippedShield: { encumbrance: 10 },
      armourSkill: 15,
      shieldSkill: 18,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(4);
  });

  // https://crawl.akrasiac.org/rawdata/hammy3456/morgue-hammy3456-20250206-022444.txt ==> 0.27 버전이었음
  // WIZARD 모드로 실행하니 다른 수치가 나와서 고침..
  test("tower shield, 5 level hex/air spell (silence)", () => {
    const params = {
      strength: 12,
      spellcastingSkill: 14,
      intelligence: 25,
      conjurationSkill: 8,
      secondSkill: 9,
      spellDifficulty: 5 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 15 },
      armourSkill: 0,
      shieldSkill: 24.6,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(3);
  });

  test("tower shield, 6 level conj/erth spell (Iron Shot) - same case as above", () => {
    const params = {
      strength: 12,
      spellcastingSkill: 14,
      intelligence: 25,
      conjurationSkill: 14,
      secondSkill: 13,
      spellDifficulty: 6 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 15 },
      armourSkill: 0,
      shieldSkill: 24.6,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(2);
  });

  test("tower shield, 2 level conj/air spell (static discharge) - same case as above", () => {
    const params = {
      strength: 12,
      spellcastingSkill: 14,
      intelligence: 25,
      conjurationSkill: 14,
      secondSkill: 9,
      spellDifficulty: 2 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 15 },
      armourSkill: 0,
      shieldSkill: 24.6,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(1);
  });

  // https://cbro.berotato.org/morgue/mroovka/morgue-mroovka-20250207-023701.txt
  test("tower shield, 8 level conj/alchemy spell (Fulsome Fusillade)", () => {
    const params = {
      strength: 29,
      spellcastingSkill: 16,
      intelligence: 43,
      conjurationSkill: 20,
      secondSkill: 19,
      spellDifficulty: 8 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 15 },
      armourSkill: 0,
      shieldSkill: 15.2,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(3);
  });

  // https://underhound.eu/crawl/morgue/SayItsName/morgue-SayItsName-20250205-225207.txt
  test("buckler, 8 level conj/earth spell (Lehudib's Crystal Spear)", () => {
    const params = {
      strength: 8,
      spellcastingSkill: 23.3,
      intelligence: 34,
      conjurationSkill: 14.3,
      secondSkill: 25.8,
      spellDifficulty: 8 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 5 },
      armourSkill: 0,
      shieldSkill: 19,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(1);
  });

  // https://crawl.dcss.io/crawl/morgue/AintCerebovvered/morgue-AintCerebovvered-20250204-194125.txt
  test("tower shield, 9 level conj/air spell (Chaing Lightning)", () => {
    const params = {
      strength: 18,
      spellcastingSkill: 27,
      intelligence: 10,
      conjurationSkill: 26.5,
      secondSkill: 27,
      spellDifficulty: 9 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 15 },
      armourSkill: 0,
      shieldSkill: 27,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(4);
  });

  // https://crawl.dcss.io/crawl/morgue/slifty/morgue-slifty-20250201-052559.txt
  test("kite shield, leather armour, 4 level tloc/air spell (Vhi's Electric Charge)", () => {
    const params = {
      strength: 14,
      spellcastingSkill: 10,
      intelligence: 14,
      conjurationSkill: 10,
      secondSkill: 5,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 4 },
      equippedShield: { encumbrance: 10 },
      armourSkill: 24,
      shieldSkill: 21,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(7);
  });
});
