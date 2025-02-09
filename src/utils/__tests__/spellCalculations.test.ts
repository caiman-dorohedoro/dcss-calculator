import { describe, expect, test } from "@jest/globals";
import { calculateSpellFailureRate } from "../spellCalculation";

describe("Spell Calculations", () => {
  test("robe, low level, stat, 4 level conj/alchemy spell (Fullminant Prism)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 4.5,
      intelligence: 25,
      targetSpell: "Fulminant Prism",
      schoolSkills: {
        Conjuration: 5.3,
        Alchemy: 0,
      },
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(28);
  });

  test("robe, low level, stat, 4 level conj/alchemy spell (Fullminant Prism) - 2", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 4.8,
      intelligence: 25,
      targetSpell: "Fulminant Prism",
      schoolSkills: {
        Conjuration: 5.4,
        Alchemy: 0.8,
      },
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(24);
  });

  test("robe, low level, stat, 4 level conj/alchemy spell (Fullminant Prism) - 3", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 6.2,
      intelligence: 31,
      targetSpell: "Fulminant Prism",
      schoolSkills: {
        Conjuration: 6.3,
        Alchemy: 3.2,
      },
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(7);
  });

  test("robe, low level, stat, 4 level conj/alchemy spell (Fullminant Prism) - 4", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 9.2,
      intelligence: 32,
      targetSpell: "Fulminant Prism",
      schoolSkills: {
        Conjuration: 7.2,
        Alchemy: 4.3,
      },
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(3);
  });

  test("leather armour, 4 level conj/alchemy spell (Fullminant Prism)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 9.2,
      intelligence: 32,
      targetSpell: "Fulminant Prism",
      schoolSkills: {
        Conjuration: 7.2,
        Alchemy: 4.3,
      },
      spellDifficulty: 4,
      armour: "leather_armour",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(5);
  });

  test("chain mail, 4 level conj/alchemy spell (Fullminant Prism)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 9.2,
      intelligence: 32,
      targetSpell: "Fulminant Prism",
      schoolSkills: {
        Conjuration: 7.2,
        Alchemy: 4.3,
      },
      spellDifficulty: 4,
      armour: "chain_mail",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(100);
  });

  test("ring mail, 4 level conj/alchemy spell (Fullminant Prism)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 9.2,
      intelligence: 32,
      targetSpell: "Fulminant Prism",
      schoolSkills: {
        Conjuration: 7.2,
        Alchemy: 4.3,
      },
      spellDifficulty: 4,
      armour: "ring_mail",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(19);
  });

  test("robe, 4 level conj/alchemy spell (Fullminant Prism)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 10.3,
      intelligence: 34,
      targetSpell: "Fulminant Prism",
      schoolSkills: {
        Conjuration: 8,
        Alchemy: 5,
      },
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(1);
  });

  // https://archive.nemelex.cards/morgue/caiman/morgue-caiman-20250131-054317.txt
  test("leather armour, 3 level hex/fire spell (Dazzling Flash)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 13,
      spellcasting: 7,
      intelligence: 13,
      targetSpell: "Dazzling Flash",
      schoolSkills: {
        Hexes: 8,
        Fire: 4,
      },
      spellDifficulty: 3,
      armour: "leather_armour",
      shield: "none",
      armourSkill: 9,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(4);
  });

  // https://archive.nemelex.cards/morgue/caiman/morgue-caiman-20250126-091458.txt
  test("storm dragon scales, kite shield, 4 level tloc/air spell (Vhi's Electric Charge)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 41,
      spellcasting: 15,
      intelligence: 9,
      targetSpell: "Vhi's Electric Charge",
      schoolSkills: {
        Translocation: 14,
        Air: 6,
      },
      spellDifficulty: 4,
      armour: "storm_dragon",
      shield: "kite_shield",
      armourSkill: 15,
      shieldSkill: 18,
    });

    expect(failureRate).toBe(4);
  });

  // https://crawl.akrasiac.org/rawdata/hammy3456/morgue-hammy3456-20250206-022444.txt ==> 0.27 버전이었음
  // WIZARD 모드로 실행하니 다른 수치가 나와서 고침..
  test("tower shield, 5 level hex/air spell (silence)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 12,
      spellcasting: 14,
      intelligence: 25,
      targetSpell: "Silence",
      schoolSkills: {
        Hexes: 8,
        Air: 9,
      },
      spellDifficulty: 5,
      armour: "robe",
      shield: "tower_shield",
      armourSkill: 0,
      shieldSkill: 24.6,
    });

    expect(failureRate).toBe(3);
  });

  // deprecated Spell
  // test("tower shield, 6 level conj/erth spell (Iron Shot) - same case as above", () => {
  //   const failureRate = calculateSpellFailureRate({
  //     strength: 12,
  //     spellcasting: 14,
  //     intelligence: 25,
  //     targetSpell: "Iron Shot",
  //     schoolSkills: {
  //       Conjuration: 14,
  //       Earth: 13,
  //     },
  //     spellDifficulty: 6,
  //     armour: "robe",
  //     shield: "tower_shield",
  //     armourSkill: 0,
  //     shieldSkill: 24.6,
  //   });

  //   expect(failureRate).toBe(2);
  // });

  test("tower shield, 2 level conj/air spell (static discharge) - same case as above", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 12,
      spellcasting: 14,
      intelligence: 25,
      targetSpell: "Static Discharge",
      schoolSkills: {
        Conjuration: 14,
        Air: 9,
      },
      spellDifficulty: 2,
      armour: "robe",
      shield: "tower_shield",
      armourSkill: 0,
      shieldSkill: 24.6,
    });

    expect(failureRate).toBe(1);
  });

  // https://cbro.berotato.org/morgue/mroovka/morgue-mroovka-20250207-023701.txt
  test("tower shield, 8 level conj/alchemy spell (Fulsome Fusillade)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 29,
      spellcasting: 16,
      intelligence: 43,
      targetSpell: "Fulsome Fusillade",
      schoolSkills: {
        Conjuration: 20,
        Alchemy: 19,
      },
      spellDifficulty: 8,
      armour: "robe",
      shield: "tower_shield",
      armourSkill: 0,
      shieldSkill: 15.2,
    });

    expect(failureRate).toBe(3);
  });

  // https://underhound.eu/crawl/morgue/SayItsName/morgue-SayItsName-20250205-225207.txt
  test("buckler, 8 level conj/earth spell (Lehudib's Crystal Spear)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 8,
      spellcasting: 23.3,
      intelligence: 34,
      targetSpell: "Lehudib's Crystal Spear",
      schoolSkills: {
        Conjuration: 14.3,
        Earth: 25.8,
      },
      spellDifficulty: 8,
      armour: "robe",
      shield: "buckler",
      armourSkill: 0,
      shieldSkill: 19,
    });

    expect(failureRate).toBe(1);
  });

  // https://crawl.dcss.io/crawl/morgue/AintCerebovvered/morgue-AintCerebovvered-20250204-194125.txt
  test("tower shield, 9 level conj/air spell (Chain Lightning)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 18,
      spellcasting: 27,
      intelligence: 10,
      targetSpell: "Chain Lightning",
      schoolSkills: {
        Conjuration: 26.5,
        Air: 27,
      },
      spellDifficulty: 9,
      armour: "robe",
      shield: "tower_shield",
      armourSkill: 0,
      shieldSkill: 27,
    });

    expect(failureRate).toBe(4);
  });

  // https://crawl.dcss.io/crawl/morgue/slifty/morgue-slifty-20250201-052559.txt
  test("kite shield, leather armour, 4 level tloc/air spell (Vhi's Electric Charge)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 14,
      spellcasting: 10,
      intelligence: 14,
      targetSpell: "Vhi's Electric Charge",
      schoolSkills: {
        Translocation: 10,
        Air: 5,
      },
      spellDifficulty: 4,
      armour: "leather_armour",
      shield: "kite_shield",
      armourSkill: 24,
      shieldSkill: 21,
    });

    expect(failureRate).toBe(7);
  });

  // https://cbro.berotato.org/morgue/slitherrr/morgue-slitherrr-20250130-190843.txt
  test("naga, tower shield, pearl dragon scales, barding, 7 level ice/necr spell (Rimeblight)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 34,
      spellcasting: 20.3,
      intelligence: 49,
      targetSpell: "Rimeblight",
      schoolSkills: {
        Ice: 27,
        Necromancy: 12,
      },
      spellDifficulty: 7,
      armour: "pearl_dragon",
      shield: "tower_shield",
      armourSkill: 18,
      shieldSkill: 27,
    });

    expect(failureRate).toBe(1);
  });

  // https://crawl.akrasiac.org/rawdata/modargo/morgue-modargo-20250114-190932.txt
  test("naga, tower shield, robe, barding, 9 level Conj/Air spell (Chain Lightning)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 17,
      spellcasting: 15,
      intelligence: 23,
      targetSpell: "Chain Lightning",
      schoolSkills: {
        Conjuration: 24.1,
        Air: 25,
      },
      spellDifficulty: 9,
      armour: "robe",
      shield: "tower_shield",
      armourSkill: 8,
      shieldSkill: 22.8,
    });

    expect(failureRate).toBe(22);
  });

  // https://crawl.akrasiac.org/rawdata/backstreet/morgue-backstreet-20241227-085307.txt
  test("naga, kite shield, plate armour, barding, 4 level Tloc/Air spell (Vhi's Electric Charge)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 21,
      spellcasting: 18,
      intelligence: 51,
      targetSpell: "Vhi's Electric Charge",
      schoolSkills: {
        Translocation: 8,
        Air: 8,
      },
      spellDifficulty: 4,
      armour: "plate",
      shield: "kite_shield",
      armourSkill: 15,
      shieldSkill: 15,
    });

    expect(failureRate).toBe(2);
  });

  // https://crawl.akrasiac.org/rawdata/DarkXAngel/morgue-DarkXAngel-20240926-042247.txt
  test("naga, tower shield, ring mail, barding, 6 level Alch spell (Eringya's Noxious Bog)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 12,
      spellcasting: 16,
      intelligence: 52,
      targetSpell: "Eringya's Noxious Bog",
      schoolSkills: {
        Alchemy: 10,
      },
      spellDifficulty: 6,
      armour: "ring_mail",
      shield: "tower_shield",
      armourSkill: 5,
      shieldSkill: 16,
    });

    expect(failureRate).toBe(9);
  });

  // 개인 플레이 도중
  test("deep elf, steam dragon scales, buckler, 4 level Summoning/Air spell (Summon Lightning Spire)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 4,
      spellcasting: 18,
      intelligence: 29,
      targetSpell: "Summon Lightning Spire",
      schoolSkills: {
        Summoning: 3,
        Air: 4,
      },
      spellDifficulty: 4,
      armour: "steam_dragon",
      shield: "buckler",
      armourSkill: 0,
      shieldSkill: 4.7,
      wizardry: 1,
    });

    expect(failureRate).toBe(2);
  });

  // WIZ 모드 테스트
  test("white draconian, tower shield, 8 level Conj/Earth spell (Lehudib's Crystal Spear)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 12,
      spellcasting: 14,
      intelligence: 25,
      targetSpell: "Lehudib's Crystal Spear",
      schoolSkills: {
        Conjuration: 14,
        Earth: 13,
      },
      spellDifficulty: 8,
      armour: "robe",
      shield: "tower_shield",
      armourSkill: 0,
      shieldSkill: 24.6,
      wizardry: 2,
    });

    expect(failureRate).toBe(28);
  });

  // 개인 플레이 도중
  test("deep elf, robe, wucad mu, 7 level Fire/Earth spell (Hellfire Mortar)", () => {
    const failureRate = calculateSpellFailureRate({
      strength: 6,
      spellcasting: 23.7,
      intelligence: 33,
      targetSpell: "Hellfire Mortar",
      schoolSkills: {
        Fire: 3,
        Earth: 11,
      },
      spellDifficulty: 7,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 5,
      wizardry: 1,
      channel: true,
    });

    expect(failureRate).toBe(26);
  });
});
