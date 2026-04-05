import { describe, expect, test } from "@jest/globals";
import {
  calculateSpellFailureRate,
  getSpellData,
} from "../spellCalculation";

const version = "0.34" as const;

const baseState = {
  version,
  species: "human" as const,
  strength: 7,
  intelligence: 29,
  spellcasting: 2.1,
  armour: "none" as const,
  armourSkill: 0,
  shield: "none" as const,
  shieldSkill: 0,
  wizardry: 0,
  wildMagic: 0,
};

const baseSchoolSkills = {
  conjuration: 7.1,
  summoning: 17.6,
  air: 0,
  fire: 0,
  earth: 0,
  ice: 0,
  alchemy: 0,
  necromancy: 0,
  translocation: 0,
  hexes: 0,
  forgecraft: 0,
} as const;

const spellData = getSpellData(version);

const expectedFailureRates = {
  "Magic Dart": 1,
  "Searing Ray": 1,
  "Call Imp": 0,
  "Summon Hydra": 5,
  "Static Discharge": 3,
  Foxfire: 1,
  Shock: 1,
  "Call Canine Familiar": 1,
  "Stone Arrow": 6,
  Freeze: 9,
  "Poisonous Vapours": 9,
  Sandblast: 9,
  "Soul Splinter": 9,
  Blink: 13,
  "Construct Spike Launcher": 13,
  Scorch: 13,
  "Sublimation of Blood": 13,
  "Confusing Touch": 26,
  "Frozen Ramparts": 26,
  "Fugue of the Fallen": 26,
  "Inner Flame": 26,
  "Ozocubu's Armour": 26,
  Passwall: 26,
  "Teleport Other": 26,
  "Volatile Blastmotes": 26,
  "Fulminant Prism": 19,
  "Iskenderun's Mystic Blast": 19,
  "Ignite Poison": 63,
  "Forge Phalanx Beetle": 100,
  "Manifold Assault": 100,
  "Spellspark Servitor": 100,
  Ignition: 100,
} as const;

const buildSchoolSkills = (spellName: keyof typeof expectedFailureRates) => {
  const spell = spellData.find((entry) => entry.name === spellName);

  if (!spell) {
    throw new Error(`Spell not found in ${version}: ${spellName}`);
  }

  return Object.fromEntries(
    spell.schools.map((school) => [school, baseSchoolSkills[school] ?? 0]),
  );
};

describe("0.34 human Vehumet dump regression", () => {
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
