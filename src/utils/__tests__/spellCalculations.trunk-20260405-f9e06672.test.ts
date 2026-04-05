import { describe, expect, test } from "@jest/globals";
import { calculateSpellFailureRate } from "../spellCalculation";

const boodzGaleCentaurBase = {
  version: "trunk" as const,
  species: "galeCentaur" as const,
  strength: 13,
  intelligence: 15,
  spellcasting: 0,
  armour: "pearl_dragon" as const,
  shield: "none" as const,
  armourSkill: 13.8,
  shieldSkill: 0,
};

const mnemeGaleCentaurBase = {
  version: "trunk" as const,
  species: "galeCentaur" as const,
  strength: 44,
  intelligence: 11,
  spellcasting: 0,
  armour: "plate" as const,
  shield: "tower_shield" as const,
  armourSkill: 24.5,
  shieldSkill: 27,
};

const zeroSkillLevels = <T extends string>(...schools: T[]): Partial<Record<T, number>> =>
  Object.fromEntries(schools.map((school) => [school, 0])) as Partial<
    Record<T, number>
  >;

describe("trunk snapshot 20260405 (crawl f9e06672)", () => {
  describe("0.35-a0-181-g84ebf06 Boodz Gale Centaur Hunter", () => {
    test("pearl dragon scales, 3 level air spell (Swiftness), 30%", () => {
      const failureRate = calculateSpellFailureRate({
        ...boodzGaleCentaurBase,
        targetSpell: "Swiftness",
        schoolSkills: { air: 5.6 },
        spellDifficulty: 3,
      });

      expect(failureRate).toBe(30);
    });

    test("pearl dragon scales, 2 level translocation spell (Blink), 7%", () => {
      const failureRate = calculateSpellFailureRate({
        ...boodzGaleCentaurBase,
        targetSpell: "Blink",
        schoolSkills: { translocation: 7.5 },
        spellDifficulty: 2,
      });

      expect(failureRate).toBe(7);
    });

    test("pearl dragon scales, 1 level translocation spell (Apportation), 4%", () => {
      const failureRate = calculateSpellFailureRate({
        ...boodzGaleCentaurBase,
        targetSpell: "Apportation",
        schoolSkills: { translocation: 7.5 },
        spellDifficulty: 1,
      });

      expect(failureRate).toBe(4);
    });

    test("pearl dragon scales, 4 level hexes/translocation spell (Dimensional Bullseye), 50%", () => {
      const failureRate = calculateSpellFailureRate({
        ...boodzGaleCentaurBase,
        targetSpell: "Dimensional Bullseye",
        schoolSkills: { hexes: 6.5, translocation: 7.5 },
        spellDifficulty: 4,
      });

      expect(failureRate).toBe(50);
    });
  });

  describe("0.35-a0-256-g859e8e3ba0 Mneme Gale Centaur Shapeshifter", () => {
    test.each([
      {
        label: "Kiss of Death",
        targetSpell: "Kiss of Death" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("conjuration", "necromancy"),
        expected: 9,
      },
      {
        label: "Soul Splinter",
        targetSpell: "Soul Splinter" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("necromancy"),
        expected: 9,
      },
      {
        label: "Grave Claw",
        targetSpell: "Grave Claw" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("necromancy"),
        expected: 13,
      },
      {
        label: "Gloom",
        targetSpell: "Gloom" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("hexes", "necromancy"),
        expected: 24,
      },
      {
        label: "Vampiric Draining",
        targetSpell: "Vampiric Draining" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("necromancy"),
        expected: 24,
      },
      {
        label: "Anguish",
        targetSpell: "Anguish" as const,
        spellDifficulty: 4 as const,
        schoolSkills: zeroSkillLevels("hexes", "necromancy"),
        expected: 54,
      },
      {
        label: "Animate Dead",
        targetSpell: "Animate Dead" as const,
        spellDifficulty: 4 as const,
        schoolSkills: zeroSkillLevels("necromancy"),
        expected: 54,
      },
      {
        label: "Dispel Undead",
        targetSpell: "Dispel Undead" as const,
        spellDifficulty: 4 as const,
        schoolSkills: zeroSkillLevels("necromancy"),
        expected: 54,
      },
      {
        label: "Martyr's Knell",
        targetSpell: "Martyr's Knell" as const,
        spellDifficulty: 4 as const,
        schoolSkills: zeroSkillLevels("summoning", "necromancy"),
        expected: 54,
      },
      {
        label: "Curse of Agony",
        targetSpell: "Curse of Agony" as const,
        spellDifficulty: 5 as const,
        schoolSkills: zeroSkillLevels("necromancy"),
        expected: 85,
      },
    ])("dump regression: $label should be $expected%", ({
      targetSpell,
      spellDifficulty,
      schoolSkills,
      expected,
    }) => {
      const failureRate = calculateSpellFailureRate({
        ...mnemeGaleCentaurBase,
        targetSpell,
        schoolSkills,
        spellDifficulty,
      });

      expect(failureRate).toBe(expected);
    });

    test.each([
      {
        label: "Apportation",
        targetSpell: "Apportation" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("translocation"),
        expected: 61,
      },
      {
        label: "Freeze",
        targetSpell: "Freeze" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("ice"),
        expected: 61,
      },
      {
        label: "Kinetic Grapnel",
        targetSpell: "Kinetic Grapnel" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("forgecraft"),
        expected: 61,
      },
      {
        label: "Magic Dart",
        targetSpell: "Magic Dart" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("conjuration"),
        expected: 61,
      },
      {
        label: "Shock",
        targetSpell: "Shock" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("conjuration", "air"),
        expected: 61,
      },
      {
        label: "Slow",
        targetSpell: "Slow" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("hexes"),
        expected: 61,
      },
      {
        label: "Summon Small Mammal",
        targetSpell: "Summon Small Mammal" as const,
        spellDifficulty: 1 as const,
        schoolSkills: zeroSkillLevels("summoning"),
        expected: 61,
      },
      {
        label: "Blink",
        targetSpell: "Blink" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("translocation"),
        expected: 75,
      },
      {
        label: "Call Imp",
        targetSpell: "Call Imp" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("summoning"),
        expected: 75,
      },
      {
        label: "Construct Spike Launcher",
        targetSpell: "Construct Spike Launcher" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("forgecraft"),
        expected: 75,
      },
      {
        label: "Ensorcelled Hibernation",
        targetSpell: "Ensorcelled Hibernation" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("hexes", "ice"),
        expected: 75,
      },
      {
        label: "Lesser Beckoning",
        targetSpell: "Lesser Beckoning" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("translocation"),
        expected: 75,
      },
      {
        label: "Mercury Arrow",
        targetSpell: "Mercury Arrow" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("alchemy", "conjuration"),
        expected: 75,
      },
      {
        label: "Momentum Strike",
        targetSpell: "Momentum Strike" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("conjuration", "translocation"),
        expected: 75,
      },
      {
        label: "Scorch",
        targetSpell: "Scorch" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("fire"),
        expected: 75,
      },
      {
        label: "Static Discharge",
        targetSpell: "Static Discharge" as const,
        spellDifficulty: 2 as const,
        schoolSkills: zeroSkillLevels("conjuration", "air"),
        expected: 75,
      },
      {
        label: "Call Canine Familiar",
        targetSpell: "Call Canine Familiar" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("summoning"),
        expected: 93,
      },
      {
        label: "Confusing Touch",
        targetSpell: "Confusing Touch" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("hexes"),
        expected: 93,
      },
      {
        label: "Frozen Ramparts",
        targetSpell: "Frozen Ramparts" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("ice"),
        expected: 93,
      },
      {
        label: "Hailstorm",
        targetSpell: "Hailstorm" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("conjuration", "ice"),
        expected: 93,
      },
      {
        label: "Inner Flame",
        targetSpell: "Inner Flame" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("hexes", "fire"),
        expected: 93,
      },
      {
        label: "Launch Clockwork Bee",
        targetSpell: "Launch Clockwork Bee" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("forgecraft"),
        expected: 93,
      },
      {
        // The dump predates the Portable Pile -> Portable Piledriver rename.
        label: "Maxwell's Portable Pile",
        targetSpell: "Maxwell's Portable Piledriver" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("translocation"),
        expected: 93,
      },
      {
        label: "Mephitic Cloud",
        targetSpell: "Mephitic Cloud" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("conjuration", "alchemy", "air"),
        expected: 93,
      },
      {
        label: "Passwall",
        targetSpell: "Passwall" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("earth"),
        expected: 93,
      },
      {
        label: "Sigil of Binding",
        targetSpell: "Sigil of Binding" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("hexes"),
        expected: 93,
      },
      {
        label: "Summon Ice Beast",
        targetSpell: "Summon Ice Beast" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("ice", "summoning"),
        expected: 93,
      },
      {
        label: "Swiftness",
        targetSpell: "Swiftness" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("air"),
        expected: 93,
      },
      {
        label: "Teleport Other",
        targetSpell: "Teleport Other" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("translocation"),
        expected: 93,
      },
      {
        label: "Tukima's Dance",
        targetSpell: "Tukima's Dance" as const,
        spellDifficulty: 3 as const,
        schoolSkills: zeroSkillLevels("hexes"),
        expected: 93,
      },
    ])("dump parity: $label is $expected%", ({
      targetSpell,
      spellDifficulty,
      schoolSkills,
      expected,
    }) => {
      const failureRate = calculateSpellFailureRate({
        ...mnemeGaleCentaurBase,
        targetSpell,
        schoolSkills,
        spellDifficulty,
      });

      expect(failureRate).toBe(expected);
    });
  });
});
