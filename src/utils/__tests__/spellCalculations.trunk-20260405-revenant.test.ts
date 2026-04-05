import { describe, expect, test } from "@jest/globals";
import {
  calculateSpellFailureRate,
  getSpellData,
} from "../spellCalculation";

const version = "trunk" as const;
const spellData = getSpellData(version);

const baseState = {
  version,
  species: "revenant" as const,
  strength: 16,
  intelligence: 21,
  spellcasting: 20.1,
  armour: "troll_leather" as const,
  armourSkill: 4.2,
  shield: "none" as const,
  shieldSkill: 0,
  wizardry: 0,
  wildMagic: 0,
};

const defaultUntrainedSkill = 0.2;

const effectiveSchoolSkills: Record<string, number> = {
  conjuration: 12.4,
  translocation: 8.0,
  fire: 6.0,
  ice: 9.0,
  earth: 18.0,
  alchemy: 4.0,
  necromancy: 0.2,
  air: 0.2,
  forgecraft: 0.2,
  hexes: 0.2,
  summoning: 0.2,
};

const expectedFailureRates = {
  Sandblast: 0,
  "Magic Dart": 0,
  "Iskenderun's Mystic Blast": 1,
  "Stone Arrow": 0,
  "Mephitic Cloud": 1,
  "Frozen Ramparts": 1,
  "Permafrost Eruption": 1,
  Passwall: 0,
  Foxfire: 1,
  Shock: 1,
  "Lesser Beckoning": 1,
  "Momentum Strike": 1,
  Hailstorm: 1,
  "Ozocubu's Armour": 1,
  "Awaken Armour": 1,
  "Brom's Barrelling Boulder": 1,
  "Flame Wave": 1,
  Petrify: 1,
  "Soul Splinter": 2,
  "Inner Flame": 2,
  "Ignite Poison": 3,
  Arcjolt: 4,
  "Fugue of the Fallen": 8,
  "Tukima's Dance": 9,
  "Detonation Catalyst": 10,
  "Alistair's Intoxication": 14,
  "Summon Forest": 14,
  Dispersal: 16,
  Airstrike: 19,
  "Forge Lightning Spire": 22,
  "Animate Dead": 24,
  "Dispel Undead": 24,
  Anguish: 26,
  "Manifold Assault": 65,
} as const;

const buildSchoolSkills = (spellName: keyof typeof expectedFailureRates) => {
  const spell = spellData.find((entry) => entry.name === spellName);

  if (!spell) {
    throw new Error(`Spell not found in ${version}: ${spellName}`);
  }

  return Object.fromEntries(
    spell.schools.map((school) => [
      school,
      effectiveSchoolSkills[school] ?? defaultUntrainedSkill,
    ]),
  );
};

describe("trunk snapshot 20260405 (crawl f9e06672)", () => {
  describe("revenant trunk dump regression", () => {
    test.each(Object.entries(expectedFailureRates))(
      "%s matches the dump failure rate",
      (spellName, expectedFailureRate) => {
        const spell = spellData.find((entry) => entry.name === spellName);

        if (!spell) {
          throw new Error(`Spell not found in ${version}: ${spellName}`);
        }

        const failureRate = calculateSpellFailureRate({
          ...baseState,
          targetSpell: spell.name,
          spellDifficulty: spell.level,
          schoolSkills: buildSchoolSkills(
            spellName as keyof typeof expectedFailureRates,
          ),
        });

        expect(failureRate).toBe(expectedFailureRate);
      },
    );
  });
});
