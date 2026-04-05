import { describe, expect, test } from "@jest/globals";
import { calculateSpellFailureRate } from "../spellCalculation";

const grandjackalBase = {
  // 0.35-a0 dumps map to the current trunk dataset in this repo.
  version: "trunk" as const,
  species: "human" as const,
  strength: 8,
  intelligence: 31,
  spellcasting: 9.0,
  armour: "acid_dragon" as const,
  armourSkill: 0,
  shield: "buckler" as const,
  shieldSkill: 6.0,
  wizardry: 0,
  wildMagic: 0,
};

const grandjackalCases = [
  {
    spell: "Magic Dart",
    level: 1,
    schoolSkills: { conjuration: 10.0 },
    expectedFailureRate: 1,
  },
  {
    spell: "Searing Ray",
    level: 2,
    schoolSkills: { conjuration: 10.0 },
    expectedFailureRate: 1,
  },
  {
    spell: "Iskenderun's Mystic Blast",
    level: 4,
    schoolSkills: { conjuration: 10.0, translocation: 7.8 },
    expectedFailureRate: 2,
  },
  {
    spell: "Blink",
    level: 2,
    schoolSkills: { translocation: 7.8 },
    expectedFailureRate: 1,
  },
  {
    spell: "Airstrike",
    level: 4,
    schoolSkills: { air: 10.5 },
    expectedFailureRate: 1,
  },
  {
    spell: "Swiftness",
    level: 3,
    schoolSkills: { air: 10.5 },
    expectedFailureRate: 1,
  },
  {
    spell: "Arcjolt",
    level: 5,
    schoolSkills: { conjuration: 10.0, air: 10.5 },
    expectedFailureRate: 3,
  },
  {
    spell: "Lee's Rapid Deconstruction",
    level: 5,
    schoolSkills: { earth: 10.1 },
    expectedFailureRate: 4,
  },
  {
    spell: "Vhi's Electric Charge",
    level: 4,
    schoolSkills: { translocation: 7.8, air: 10.5 },
    expectedFailureRate: 2,
  },
  {
    spell: "Passage of Golubria",
    level: 4,
    schoolSkills: { translocation: 7.8 },
    expectedFailureRate: 3,
  },
  {
    spell: "Volatile Blastmotes",
    level: 3,
    schoolSkills: { fire: 0, translocation: 7.84 },
    expectedFailureRate: 5,
  },
  {
    spell: "Fulminant Prism",
    level: 4,
    schoolSkills: { conjuration: 10.0, alchemy: 0 },
    expectedFailureRate: 12,
  },
  // This mismatch is left intentional.
  // The dump shows Earth Magic as 10.1, but the visible one-decimal value is
  // not enough to reproduce the in-game 22% exactly. With the displayed
  // skills, the current calculator lands on 24%; matching 22% requires a
  // slightly higher hidden value (for example, Earth ~= 10.17).
  {
    spell: "Bombard",
    level: 6,
    schoolSkills: { conjuration: 10.0, earth: 10.1 },
    expectedFailureRate: 22,
  },
  {
    spell: "Lehudib's Crystal Spear",
    level: 8,
    schoolSkills: { conjuration: 10.0, earth: 10.1 },
    expectedFailureRate: 100,
  },
  {
    spell: "Chain Lightning",
    level: 9,
    schoolSkills: { conjuration: 10.0, air: 10.5 },
    expectedFailureRate: 100,
  },
] as const;

describe("trunk snapshot 20260405 (crawl f9e06672)", () => {
  describe("grandjackal trunk dump regression", () => {
    test.each(grandjackalCases)(
      "$spell matches the dump failure rate",
      ({ spell, level, schoolSkills, expectedFailureRate }) => {
        const failureRate = calculateSpellFailureRate({
          ...grandjackalBase,
          targetSpell: spell,
          spellDifficulty: level,
          schoolSkills,
        });

        expect(failureRate).toBe(expectedFailureRate);
      },
    );
  });
});
