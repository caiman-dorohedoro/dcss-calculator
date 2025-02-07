import { ArmourKey, armourOptions } from "./acCalculations";
import { ShieldKey, shieldOptions } from "./shCalculation";

type SpellSkill = {
  name: string;
  skill: number;
};

export type SpellCalculationParams = {
  strength: number;
  spellcastingSkill: number;
  intelligence: number;
  spellSkills: SpellSkill[];
  spellDifficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  armour: ArmourKey;
  shield: ShieldKey;
  armourSkill: number;
  shieldSkill: number;
};

export type SpellDifficultyLevel = keyof typeof spellDifficulties;

const spellDifficulties = {
  1: 3,
  2: 15,
  3: 35,
  4: 70,
  5: 100,
  6: 150,
  7: 200,
  8: 260,
  9: 340,
};

function tetrahedralNumber(n: number) {
  return Math.floor((n * (n + 1) * (n + 2)) / 6);
}

function getTrueFailRate(rawFail: number) {
  const outcomes = 101 * 101 * 100; // 총 가능한 결과의 수
  const target = rawFail * 3;

  if (target <= 100) {
    return tetrahedralNumber(target) / outcomes;
  }
  if (target <= 200) {
    return (
      (tetrahedralNumber(target) -
        2 * tetrahedralNumber(target - 101) -
        tetrahedralNumber(target - 100)) /
      outcomes
    );
  }
  return (outcomes - tetrahedralNumber(300 - target)) / outcomes;
}

type CalculateArmourPenaltyParams = {
  armour: ArmourKey;
  armourSkill: number;
  strength: number;
  SCALE: number;
};

// 갑옷 패널티 계산
function calculateArmourPenalty({
  armour,
  armourSkill,
  strength,
  SCALE,
}: CalculateArmourPenaltyParams) {
  const baseEvPenalty = armourOptions[armour].encumbrance;

  let penalty = Math.floor(
    Math.floor(
      (2 * baseEvPenalty * baseEvPenalty * (450 - armourSkill * 10) * SCALE) /
        (5 * (strength + 3))
    ) / 450
  );

  penalty *= 19;

  return Math.max(penalty, 0);
}

type CalculateShieldPenaltyParams = {
  shield: ShieldKey;
  shieldSkill: number;
  strength: number;
  SCALE: number;
};

// 방패 패널티 계산
function calculateShieldPenalty({
  shield,
  shieldSkill,
  strength,
  SCALE,
}: CalculateShieldPenaltyParams) {
  const baseShieldPenalty = shieldOptions[shield].encumbrance;

  let penalty = Math.floor(
    Math.floor(
      (2 *
        baseShieldPenalty *
        baseShieldPenalty *
        (270 - shieldSkill * 10) *
        SCALE) /
        (25 + 5 * strength)
    ) / 270
  );

  penalty *= 19;

  return Math.max(penalty, 0);
}

type armourShieldSpellPenaltyParams = {
  strength: number;
  armourSkill: number;
  armour: ArmourKey;
  shieldSkill: number;
  shield: ShieldKey;
};

function calculateArmourShieldSpellPenalty({
  strength,
  armourSkill,
  armour,
  shieldSkill,
  shield,
}: armourShieldSpellPenaltyParams) {
  const SCALE = 100;

  const totalPenalty =
    calculateArmourPenalty({
      armour,
      armourSkill,
      strength,
      SCALE,
    }) +
    calculateShieldPenalty({
      shield,
      shieldSkill,
      strength,
      SCALE,
    });

  return Math.floor(Math.max(totalPenalty, 0) / SCALE);
}

function failureRateToInt(fail: number) {
  if (fail <= 0) return 0;
  else if (fail >= 100) return Math.floor((fail + 100) / 2);
  else return Math.max(1, Math.floor(100 * getTrueFailRate(fail)));
}

function rawSpellFail({
  strength,
  intelligence,
  spellDifficulty,
  armour,
  shield,
  spellSkills,
  spellcastingSkill,
  armourSkill,
  shieldSkill,
}: SpellCalculationParams) {
  // 기본 실패율 60%에서 시작
  let chance = 60;

  // 주문 기술력 계산
  const skillCount = spellSkills.length;
  const skillPowerAverage = Math.floor(
    spellSkills.reduce((acc, skill) => acc + skill.skill * 200, 0) / skillCount
  );
  const spellPower = Math.floor(
    ((skillPowerAverage + spellcastingSkill * 50) * 6) / 100
  );

  // 주문력으로 실패율 감소
  chance -= spellPower;

  // 지능으로 실패율 감소
  chance -= intelligence * 2;

  // 방어구/방패 페널티 계산
  chance += calculateArmourShieldSpellPenalty({
    strength: strength,
    armourSkill,
    armour,
    shieldSkill,
    shield,
  });

  // 주문 난이도별 기본 실패율
  chance += spellDifficulties[spellDifficulty];

  // 최대값 제한
  chance = Math.min(chance, 210);

  // 3차 다항식을 통한 실패율 계산
  const chance2 = Math.max(
    Math.floor((((chance + 426) * chance + 82670) * chance + 7245398) / 262144),
    0
  );

  // 최종 실패율은 0-100% 사이
  const failRate = Math.min(Math.max(chance2, 0), 100);

  return failRate;
}

export const calculateSpellFailureRate = (params: SpellCalculationParams) => {
  const failRate = rawSpellFail(params);

  return failureRateToInt(failRate);
};
