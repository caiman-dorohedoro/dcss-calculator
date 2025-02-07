import { describe, expect, test } from "@jest/globals";
import {
  // calculateSpellFailure,
  SpellCalculationParams,
  // calculateSpellSuccess,
  SpellDifficultyLevel,
} from "../spellCalculation";

function calculateSpellPenalty({
  strength,
  armourSkill,
  armourEvPenalty,
  shieldSkill,
  shieldEvPenalty,
}: {
  strength: number;
  armourSkill: number;
  armourEvPenalty: number;
  shieldSkill: number;
  shieldEvPenalty: number;
}) {
  const SCALE = 100;

  // 갑옷 패널티 계산
  function calculateArmourPenalty() {
    const baseEvPenalty = armourEvPenalty;

    let penalty = Math.floor(
      (2 * baseEvPenalty * baseEvPenalty * (450 - armourSkill * 10) * SCALE) /
        (5 * (strength + 3)) /
        450
    );

    penalty *= 19;

    return Math.max(penalty, 0);
  }

  // 방패 패널티 계산
  function calculateShieldPenalty() {
    const baseShieldPenalty = shieldEvPenalty;

    let penalty = Math.floor(
      (2 *
        baseShieldPenalty *
        baseShieldPenalty *
        (270 - shieldSkill * 10) *
        SCALE) /
        (25 + 5 * strength) /
        270
    );

    penalty *= 19;

    return Math.max(penalty, 0);
  }

  // 최종 패널티 계산
  const totalPenalty = calculateArmourPenalty() + calculateShieldPenalty();
  return Math.max(totalPenalty, 0) / SCALE;
}

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

function failureRateToInt(fail: number) {
  if (fail <= 0) return 0;
  else if (fail >= 100) return Math.floor((fail + 100) / 2);
  else return Math.max(1, Math.floor(100 * getTrueFailRate(fail)));
}

function rawSpellFail({
  playerStrength,
  playerSpellcasting,
  intelligence,
  conjurationSkill,
  secondSkill,
  spellDifficulty,
  equippedArmour,
  equippedShield,
  armourSkill,
  shieldSkill,
}: SpellCalculationParams) {
  // 기본 실패율 60%에서 시작
  let chance = 60;

  // 주문 기술력 계산
  const skillCount = 2; // conjuration + fire
  const skillPowerAverage = Math.floor(
    (conjurationSkill * 200 + secondSkill * 200) / skillCount
  );
  const spellPower = Math.floor(
    ((skillPowerAverage + playerSpellcasting * 50) * 6) / 100
  );

  // 주문력으로 실패율 감소
  chance -= spellPower;

  // 지능으로 실패율 감소
  chance -= intelligence * 2;

  // 방어구/방패 페널티 계산
  chance += calculateSpellPenalty({
    strength: playerStrength,
    armourSkill,
    armourEvPenalty: equippedArmour.encumbrance,
    shieldSkill,
    shieldEvPenalty: equippedShield.encumbrance,
  });

  // 주문 난이도별 기본 실패율
  const difficultyByLevel = [0, 3, 15, 35, 70, 100, 150, 200, 260, 340];
  chance += difficultyByLevel[spellDifficulty];

  // 최대값 제한
  chance = Math.min(chance, 210);

  // 3차 다항식을 통한 실패율 계산
  const chance2 = Math.max(
    Math.floor((((chance + 426) * chance + 82670) * chance + 7245398) / 262144),
    0
  );

  // 최종 실패율은 0-100% 사이
  const failRate = Math.min(Math.max(chance2, 0), 100);

  return failureRateToInt(failRate);
}

describe("Spell Calculations", () => {
  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 4.5,
      intelligence: 25,
      conjurationSkill: 5.3,
      secondSkill: 0,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(28);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 4.8,
      intelligence: 25,
      conjurationSkill: 5.4,
      secondSkill: 0.8,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(24);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 6.2,
      intelligence: 31,
      conjurationSkill: 6.3,
      secondSkill: 3.2,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(7);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 9.2,
      intelligence: 32,
      conjurationSkill: 7.2,
      secondSkill: 4.3,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(3);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 9.2,
      intelligence: 32,
      conjurationSkill: 7.2,
      secondSkill: 4.3,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 4 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(5);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 9.2,
      intelligence: 32,
      conjurationSkill: 7.2,
      secondSkill: 4.3,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 14 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(100);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 9.2,
      intelligence: 32,
      conjurationSkill: 7.2,
      secondSkill: 4.3,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 7 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(19);
  });

  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 10.3,
      intelligence: 34,
      conjurationSkill: 8,
      secondSkill: 5,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(1);
  });

  // https://archive.nemelex.cards/morgue/caiman/morgue-caiman-20250131-054317.txt
  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 13,
      playerSpellcasting: 7,
      intelligence: 13,
      conjurationSkill: 8,
      secondSkill: 4,
      spellDifficulty: 3 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 4 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 9,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(4);
  });

  // https://archive.nemelex.cards/morgue/caiman/morgue-caiman-20250126-091458.txt
  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 41,
      playerSpellcasting: 15,
      intelligence: 9,
      conjurationSkill: 14,
      secondSkill: 6,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 15 },
      equippedShield: { encumbrance: 10 },
      armourSkill: 15,
      shieldSkill: 18,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(4);
  });

  // https://crawl.akrasiac.org/rawdata/hammy3456/morgue-hammy3456-20250206-022444.txt
  test("kite shield, 5 level hex/air silence", () => {
    const params = {
      playerStrength: 12,
      playerSpellcasting: 14,
      intelligence: 25,
      conjurationSkill: 8,
      secondSkill: 9,
      spellDifficulty: 5 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 15 },
      armourSkill: 0,
      shieldSkill: 24.6,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(2);
  });
});
