import { calculateEVForSkillLevel } from "@/utils/evCalculations";
import { mixedCalculations } from "@/utils/acCalculations";
import { CalculatorState } from "@/hooks/useEvCalculatorState";
import { calculateSH } from "./shCalculation";
import {
  calculateSpellFailureRate,
  getSpellSchools,
  SpellSchool,
} from "./spellCalculation";
import { spells } from "@/data/spells";

type DataPoint = {
  dodgingSkill: number;
  baseEV: number;
  rawDodgeBonus: number;
  actualDodgeBonus: number;
  dodgeModifier: number;
  shieldPenalty: number;
  armourPenalty: number;
  finalEV: number;
};

type ACDataPoint = {
  armour: number;
  ac: number;
};

export const calculateAcData = (state: CalculatorState): ACDataPoint[] => {
  const result = Array.from({ length: 271 }, (_, i) => i / 10).map(
    (_, index) => {
      const armour = index / 10;

      return {
        armour,
        ac: mixedCalculations({
          species: state.species,
          armour: state.armour,
          helmet: state.helmet,
          gloves: state.gloves,
          boots: state.boots,
          cloak: state.cloak,
          barding: state.barding,
          secondGloves: state.secondGloves,
          armourSkill: armour,
        }),
      };
    }
  );

  return result;
};

export const calculateEvData = (state: CalculatorState): DataPoint[] => {
  const result = Array.from({ length: 271 }, (_, i) => i / 10).map(
    (_, index) => {
      const dodgingSkill = index / 10;
      const calcResult = calculateEVForSkillLevel({
        dodgingSkill,
        dexterity: state.dexterity,
        strength: state.strength,
        species: state.species,
        shield: state.shield,
        armour: state.armour,
        shieldSkill: state.shieldSkill,
        armourSkill: state.armourSkill,
      });

      return {
        dodgingSkill: parseFloat(dodgingSkill.toFixed(1)),
        ...calcResult,
        dodgeModifier: parseFloat(calcResult.dodgeModifier.toFixed(2)),
      };
    }
  );

  return result;
};

export const calculateAcTicks = (state: CalculatorState): number[] => {
  const acData = calculateAcData(state);
  const acChangePoints = new Set<number>();

  let lastAC = 0;
  for (const dataPoint of acData) {
    if (dataPoint.ac !== lastAC && dataPoint.armour < 27) {
      acChangePoints.add(dataPoint.armour);
      lastAC = dataPoint.ac;
    }
  }

  return Array.from(acChangePoints);
};

export const calculateEvTicks = (state: CalculatorState): number[] => {
  const evData = calculateEvData(state);
  const evChangePoints = new Set<number>();

  let lastEV = 0;
  for (const dataPoint of evData) {
    if (dataPoint.finalEV !== lastEV && dataPoint.dodgingSkill < 27) {
      evChangePoints.add(dataPoint.dodgingSkill);
      lastEV = dataPoint.finalEV;
    }
  }

  return Array.from(evChangePoints);
};

export type SHDataPoint = {
  shield: number;
  sh: number;
};

export const calculateSHData = (state: CalculatorState): SHDataPoint[] => {
  const result = Array.from({ length: 271 }, (_, i) => i / 10).map(
    (_, index) => {
      const shield = index / 10;
      return {
        shield,
        sh: calculateSH({
          shield: state.shield,
          shieldSkill: shield,
          dexterity: state.dexterity,
        }),
      };
    }
  );

  return result;
};

export const calculateShTicks = (state: CalculatorState): number[] => {
  const shData = calculateSHData(state);
  const shChangePoints = new Set<number>();

  let lastSH = 0;
  for (const dataPoint of shData) {
    if (dataPoint.sh !== lastSH && dataPoint.shield < 27) {
      shChangePoints.add(dataPoint.shield);
      lastSH = dataPoint.sh;
    }
  }

  return Array.from(shChangePoints);
};

export type SpellFailureRateDataPoint = {
  skillAverage: number;
  spellFailureRate: number;
};

export const calculateSFData = (
  state: CalculatorState
): SpellFailureRateDataPoint[] => {
  const spellDifficulty = spells.find(
    (spell) => spell.name === state.targetSpell
  )?.level;

  if (spellDifficulty === undefined) {
    throw new Error("Spell difficulty not found");
  }

  const result = Array.from({ length: 271 }, (_, i) => i / 10).map(
    (_, index) => {
      if (state.targetSpell === undefined) {
        throw new Error("Target spell not found");
      }

      if (state.schoolSkills === undefined) {
        throw new Error("School skills not found");
      }

      const skillAverage = index / 10;
      const spellSchools = getSpellSchools(state.targetSpell);
      const schoolSkills = spellSchools.reduce((acc, school) => {
        acc[school] = skillAverage / spellSchools.length;
        return acc;
      }, {} as Record<SpellSchool, number>);

      const spellFailureRate = calculateSpellFailureRate({
        strength: state.strength,
        intelligence: state.intelligence,
        spellcasting: state.spellcasting ?? 0,
        targetSpell: state.targetSpell,
        schoolSkills: schoolSkills,
        spellDifficulty,
        armour: state.armour,
        shield: state.shield,
        armourSkill: state.armourSkill,
        shieldSkill: state.shieldSkill,
      });

      return {
        skillAverage,
        spellFailureRate,
      };
    }
  );

  return result;
};
