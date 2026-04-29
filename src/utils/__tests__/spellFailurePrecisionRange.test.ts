import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { calculateAvgSFData } from "../calculatorUtils";

describe("spell failure precision range", () => {
  test("shows the possible Crawl failure range for one-decimal morgue skills", () => {
    const state = buildDefaultCalculatorState("trunk");
    state.species = "demonspawn";
    state.strength = 29;
    state.intelligence = 11;
    state.spellcasting = 7.3;
    state.armour = "plate";
    state.shield = "buckler";
    state.armourSkill = 14;
    state.shieldSkill = 15.7;
    state.targetSpell = "Swiftness";
    state.schoolSkills = {
      ...state.schoolSkills,
      air: 3.3,
    };

    const data = calculateAvgSFData(state);
    const swiftnessAtDisplayedAir33 = data.find(
      (point) => point.spellSkill === 3.3
    );

    expect(swiftnessAtDisplayedAir33).toMatchObject({
      spellFailureRate: 65,
      spellFailureRange: [63, 65],
      spellFailureRangeMin: 63,
      spellFailureRangeMax: 65,
    });
  });

  test("caps the precision range at the maximum skill", () => {
    const state = buildDefaultCalculatorState("trunk");
    state.spellcasting = 27;
    state.targetSpell = "Swiftness";
    state.schoolSkills = {
      ...state.schoolSkills,
      air: 27,
    };

    const data = calculateAvgSFData(state);
    const maxSkillPoint = data.find((point) => point.spellSkill === 27);

    expect(maxSkillPoint?.spellFailureRange).toEqual([
      maxSkillPoint?.spellFailureRangeMin,
      maxSkillPoint?.spellFailureRangeMax,
    ]);
    expect(maxSkillPoint?.spellFailureRangeMin).toBe(
      maxSkillPoint?.spellFailureRangeMax
    );
  });
});
