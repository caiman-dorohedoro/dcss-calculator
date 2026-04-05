import { describe, expect, test } from "@jest/globals";
import { calculateSpellFailureRate } from "../spellCalculation";

describe("0.33 morgue spell calculations (2025-04-30 batch)", () => {
  // The test case below fails - is it because the second decimal place isn't displayed on the game screen?
  // When building and running 0.33 directly and inputting skills in wizard mode, the exact value (10 in this case) is shown in the game screen.
  // https://archive.nemelex.cards/morgue/caiman/morgue-caiman-20250429-233740.txt
  test("deep elf, robe, str 4, int 25, dex 13, splc 8.1, conj 6.1, alch 3, 4 level conj/alchemy spell (Fulminant Prism), 9%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      intelligence: 25,
      spellcasting: 8.1,
      schoolSkills: { conjuration: 6.1, alchemy: 3 },
      targetSpell: "Fulminant Prism",
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(9);
  });

  // https://underhound.eu/crawl/morgue/kush/morgue-kush-20250421-003306.txt
  test("demonspawn, ring mail, str 14, int 38, dex 22, splc 20.3, conj 26.6, earth 10.0, 8 level Conj/Earth spell (Lehudib's Crystal Spear), 4%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "demonspawn",
      strength: 14,
      intelligence: 38,
      spellcasting: 20.3,
      schoolSkills: { conjuration: 26.6, earth: 10.0 },
      targetSpell: "Lehudib's Crystal Spear",
      spellDifficulty: 8,
      armour: "ring_mail",
      shield: "none",
      armourSkill: 6.3,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(4);
  });

  // same case as above
  test("demonspawn, ring mail, str 14, int 38, dex 22, splc 20.3, conj 26.6, air 17.5, 9 level Conj/Air spell (Chain Lightning), 16%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "demonspawn",
      strength: 14,
      intelligence: 38,
      spellcasting: 20.3,
      schoolSkills: { conjuration: 26.6, air: 17.5 },
      targetSpell: "Chain Lightning",
      spellDifficulty: 9,
      armour: "ring_mail",
      shield: "none",
      armourSkill: 6.3,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(16);
  });

  // https://underhound.eu/crawl/morgue/runewalsh/morgue-runewalsh-20250426-131255.txt
  test("octopode, str 6, int 22, dex 17, splc 3.6, conj 6.9, alch 2.0, 4 level conj/alchemy spell (Fulminant Prism), 19%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "octopode",
      strength: 6,
      intelligence: 22,
      spellcasting: 3.6,
      schoolSkills: { conjuration: 6.9, alchemy: 2.0 },
      targetSpell: "Fulminant Prism",
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(19);
  });

  // https://crawl.akrasiac.org/rawdata/MackTheFife/morgue-MackTheFife-20250424-191855.txt
  test("deep elf, robe, buckler, str 4, int 29, dex 13, splc 10.0, conj 10.0, alch 3, 4 level conj/alchemy spell (Fulminant Prism), 5%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      intelligence: 29,
      spellcasting: 10.0,
      schoolSkills: { conjuration: 10.0, alchemy: 3 },
      targetSpell: "Fulminant Prism",
      spellDifficulty: 4,
      armour: "robe",
      shield: "buckler",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(5);
  });

  // same case as above
  test("deep elf, robe, buckler, str 4, int 29, dex 13, splc 10.0, fire 5.0, frge 12.3, 4 level fire/frge spell (Forge Blazeheart Golem), 2%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      intelligence: 29,
      spellcasting: 10.0,
      schoolSkills: { fire: 5.0, forgecraft: 12.3 },
      targetSpell: "Forge Blazeheart Golem",
      spellDifficulty: 4,
      armour: "robe",
      shield: "buckler",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(2);
  });

  // personal gameplay
  test("deep elf, robe, str 4, int 22, dex 13, splc 4.0, conj 4.9, alch 0, 4 level conj/alchemy spell (Fulminant Prism), 38%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      intelligence: 22,
      spellcasting: 4.0,
      schoolSkills: { conjuration: 4.9, alchemy: 0 },
      targetSpell: "Fulminant Prism",
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(38);
  });

  // same case as above
  test("deep elf, robe, str 4, int 25, dex 13, splc 7.1, conj 7.0, alch 2.3, 4 level conj/alchemy spell (Fulminant Prism), 10%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      intelligence: 25,
      spellcasting: 7.1,
      schoolSkills: { conjuration: 7.0, alchemy: 2.3 },
      targetSpell: "Fulminant Prism",
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(10);
  });

  // same case as above, dead. https://archive.nemelex.cards/morgue/caiman/morgue-caiman-20250430-001152.txt
  test("deep elf, robe, str 4, int 28, dex 13, splc 15, conj 9.0, alch 5.0, 4 level conj/alchemy spell (Fulminant Prism), 1%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      intelligence: 28,
      spellcasting: 15,
      schoolSkills: { conjuration: 9.0, alchemy: 5.0 },
      targetSpell: "Fulminant Prism",
      spellDifficulty: 4,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(1);
  });

  // same case as above
  test("deep elf, robe, str 4, int 28, dex 13, splc 15, conj 9.0, earth 7.0, 5 level earth spell 3Lee's Rapid Deconstruction), 3%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      intelligence: 28,
      spellcasting: 15,
      schoolSkills: { earth: 7.0 },
      targetSpell: "Lee's Rapid Deconstruction",
      spellDifficulty: 5,
      armour: "robe",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(3);
  });

  // personal gameplay
  test("octopode, none, str 7, int 19, dex 12, splc 3.3, earth 4.2, conj 1.0, 2 level earth spell (Sandblast), 2%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "octopode",
      strength: 7,
      intelligence: 19,
      spellcasting: 3.3,
      schoolSkills: { earth: 4.2 },
      targetSpell: "Sandblast",
      spellDifficulty: 1,
      armour: "none",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(2);
  });

  test("octopode, none, str 7, int 19, dex 12, splc 3.3, earth 4.2, alch 0, 4 level earth/alchemy spell (Petrify), 52%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "octopode",
      strength: 7,
      intelligence: 19,
      spellcasting: 3.3,
      schoolSkills: { earth: 4.2, alchemy: 0 },
      targetSpell: "Petrify",
      spellDifficulty: 4,
      armour: "none",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(52);
  });

  test("octopode, none, str 7, int 19, dex 12, splc 3.3, earth 4.2, conj 1, 4 level earth/conj spell (Brom's Barrelling Boulder), 45%", () => {
    const failureRate = calculateSpellFailureRate({
      version: "0.33",
      species: "octopode",
      strength: 7,
      intelligence: 19,
      spellcasting: 3.3,
      schoolSkills: { earth: 4.2, conjuration: 1 },
      targetSpell: "Brom's Barrelling Boulder",
      spellDifficulty: 4,
      armour: "none",
      shield: "none",
      armourSkill: 0,
      shieldSkill: 0,
    });

    expect(failureRate).toBe(45);
  });
});
