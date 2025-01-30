import { describe, expect, test } from "@jest/globals";
import { calculateEVForSkillLevel } from "../evCalculations";

describe("EV Calculations", () => {
  test("기본 EV 계산 (중간 크기 종족)", () => {
    const result = calculateEVForSkillLevel({
      dodgeSkill: 0,
      dexterity: 10,
      strength: 10,
      species: "medium",
      shield: "none",
      armourER: 0,
      shieldSkill: 0,
      armourSkill: 0,
    });

    expect(result.baseEV).toBe(10);
    expect(result.finalEV).toBe(10);
  });

  test("1 - 코글린, str 13, dex 25, no shield, armour er 0, dodge skill 20.5", () => {
    const result = calculateEVForSkillLevel({
      dodgeSkill: 20.5,
      dexterity: 25,
      strength: 13,
      species: "medium",
      shield: "none",
      armourER: 0,
      shieldSkill: 0,
      armourSkill: 0,
    });

    expect(result.finalEV).toBe(30);
  });

  test("2 - 코글린, str 10, dex 22, no shield, armour er 0, dodge skill 16.7", () => {
    const result = calculateEVForSkillLevel({
      dodgeSkill: 16.7,
      dexterity: 22,
      strength: 10,
      species: "medium",
      shield: "none",
      armourER: 0,
      shieldSkill: 0,
      armourSkill: 0,
    });

    expect(result.finalEV).toBe(25);
  });

  test("3 - formicid, str 21, dex 19, tower shield, armour er 5, dodge skill 16.7, armour skill 8.0, shields skill 13.0", () => {
    const result = calculateEVForSkillLevel({
      dodgeSkill: 16.7,
      dexterity: 19,
      strength: 21,
      species: "medium",
      shield: "large_shield",
      armourER: 5,
      shieldSkill: 13,
      armourSkill: 8,
    });

    expect(result.finalEV).toBe(14);
  });

  test("4 - coglin, str 11, dex 17, armour er 5, dodge skill 4, armour skill 3", () => {
    const result = calculateEVForSkillLevel({
      dodgeSkill: 4,
      dexterity: 17,
      strength: 11,
      species: "medium",
      shield: "none",
      armourER: 5,
      shieldSkill: 0,
      armourSkill: 3,
    });

    expect(result.finalEV).toBe(12);
  });

  test("5 - coglin, str 11, dex 13, armour er 4, dodge skill 1.8, armour skill 0.8", () => {
    const result = calculateEVForSkillLevel({
      dodgeSkill: 1.8,
      dexterity: 13,
      strength: 11,
      species: "medium",
      shield: "none",
      armourER: 4,
      shieldSkill: 0,
      armourSkill: 0.8,
    });

    expect(result.finalEV).toBe(10);
  });

  test("6 - minotaur, str 27, dex 12, tower shield, armour er 23, dodge skill 4.3, armour skill 15.2, shields skill 20.4", () => {
    const result = calculateEVForSkillLevel({
      dodgeSkill: 4.3,
      dexterity: 12,
      strength: 27,
      species: "medium",
      shield: "large_shield",
      armourER: 23,
      shieldSkill: 20.4,
      armourSkill: 15.2,
    });

    expect(result.finalEV).toBe(6);
  });
});
