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

    let penalty =
      (2 * baseEvPenalty * baseEvPenalty * (450 - armourSkill * 10) * SCALE) /
      (5 * (strength + 3)) /
      450;

    penalty *= 19;

    return Math.max(penalty, 0);
  }

  // 방패 패널티 계산
  function calculateShieldPenalty() {
    const baseShieldPenalty = shieldEvPenalty;

    let penalty =
      (2 *
        baseShieldPenalty *
        baseShieldPenalty *
        (270 - shieldSkill * 10) *
        SCALE) /
      (25 + 5 * strength) /
      270;

    penalty *= 19;

    return Math.max(penalty, 0);
  }

  // 최종 패널티 계산
  const totalPenalty = calculateArmourPenalty() + calculateShieldPenalty();
  return Math.max(totalPenalty / SCALE, 0);
}

function tetrahedralNumber(n: number) {
  return (n * (n + 1) * (n + 2)) / 6;
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
  else return Math.max(1, Math.trunc(100 * getTrueFailRate(fail)));
}

// function failureRateToInt(fail: number) {
//   if (fail <= 0) return 0;
//   else if (fail >= 100) return Math.floor((fail + 100) / 2);
//   else return Math.max(1, Math.trunc(100 * getTrueFailRate(fail)));
// }

function rawSpellFail({
  playerStrength,
  playerSpellcasting,
  intelligence,
  conjurationSkill,
  fireSkill,
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
  const spellPower =
    (((conjurationSkill * 200 + fireSkill * 200) / skillCount +
      playerSpellcasting * 50) *
      6) /
    100;

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
    (((chance + 426) * chance + 82670) * chance + 7245398) / 262144,
    0
  );

  // 최종 실패율은 0-100% 사이
  const failRate = Math.min(Math.max(chance2, 0), 100);

  return failureRateToInt(failRate);
}

// function calculateSpellFailure({
//   playerStrength,
//   playerSpellcasting,
//   intelligence,
//   conjurationSkill,
//   fireSkill,
//   spellDifficulty,
//   equippedArmour,
//   equippedShield,
//   armourSkill,
//   shieldSkill,
// }: SpellCalculationParams) {
//   // 1. Spell skills 계산
//   const spellSkills =
//     playerSpellcasting / 2 + ((conjurationSkill + fireSkill) * 2) / 2;

//   // 2. Spell difficulty
//   const spellDifficultyValues = [0, 3, 15, 35, 70, 100, 150, 200, 260, 340]; // 0 Level is added for index matching
//   const spellDifficultyValue = spellDifficultyValues[spellDifficulty];

//   // 3. Encumbrance penalties 계산 (Armour)
//   const armourEvPenalty =
//     ((1 / 225) * equippedArmour.encumbrance ** 2 * (90 - 2 * armourSkill)) /
//     (playerStrength + 3);
//   const armourSpellPenalty = 19 * armourEvPenalty;

//   // 4. Encumbrance penalties 계산(Shield)
//   const shieldEvPenalty =
//     (((2 / 5) * equippedShield.encumbrance ** 2) / (5 + playerStrength)) *
//     ((27 - shieldSkill) / 27);
//   const shieldSpellPenalty = 19 * shieldEvPenalty;

//   // 5. base failure 계산
//   let spellFailure =
//     60 -
//     6 * spellSkills -
//     2 * intelligence +
//     spellDifficultyValue +
//     armourSpellPenalty +
//     shieldSpellPenalty;

//   // since spellFailure is passed through a 3rd degree polynomial, cap the
//   // value to avoid any overflow issues. We choose 210 by solving for chance2
//   // = 200 in the polynomial -- it gets capped at 100 ultimately, but we
//   // need a bunch of headroom in case some later calculations lower the value
//   // below 100 after this.
//   spellFailure = Math.min(spellFailure, 210);

//   // 6. Stepdown 계산
//   let spellFailureStepped;
//   spellFailureStepped = Math.max(
//     (((spellFailure + 426) * spellFailure + 82670) * spellFailure + 7245398) /
//       262144,
//     0
//   );

//   //   if (spellFailure < 43) {
//   //     spellFailureStepped =
//   //       ((spellFailure ** 3 + 426 * spellFailure ** 2 + 82670 * spellFailure + 6983254) /
//   //         262144);
//   //   } else {
//   //     spellFailureStepped = spellFailure;
//   //   }
//   // }
//   // 7. modifiers (일단 없음)

//   //8. final step ( sigmoid function 근사)
//   /*   let realFailureRate;
//   const n = spellFailureStepped * 3;
//   realFailureRate = (n * (n + 1) * (n + 2)) / 6 / 101 / 101 * 100; */
//   spellFailureStepped = Math.min(spellFailureStepped, 100);

//   return spellFailureStepped;
// }

describe("Spell Calculations", () => {
  // test("should calculate spell success correctly", () => {
  //   const params = {
  //     playerStrength: 4,
  //     playerSpellcasting: 4.5,
  //     intelligence: 25,
  //     conjurationSkill: 5.3,
  //     fireSkill: 1.4,
  //     spellDifficulty: 4 as SpellDifficultyLevel,
  //     equippedArmour: { encumbrance: 0 },
  //     equippedShield: { encumbrance: 0 },
  //     armourSkill: 0,
  //     shieldSkill: 0,
  //   };

  //   const successRate = calculateSpellSuccess(params);
  //   expect(successRate).toBe(100);
  // });
  //
  // test("should calculate spell success correctly", () => {
  //   const params = {
  //     playerStrength: 4,
  //     playerSpellcasting: 4.5,
  //     intelligence: 25,
  //     conjurationSkill: 5.3,
  //     fireSkill: 0,
  //     spellDifficulty: 4 as SpellDifficultyLevel,
  //     equippedArmour: { encumbrance: 0 },
  //     equippedShield: { encumbrance: 0 },
  //     armourSkill: 0,
  //     shieldSkill: 0,
  //   };

  //   const failureRate = rawSpellFail(params);

  //   expect(failureRate).toBe(28);
  // });

  test("should calculate spell success correctly", () => {
    const params = {
      playerStrength: 4,
      playerSpellcasting: 4.8,
      intelligence: 25,
      conjurationSkill: 5.4,
      fireSkill: 0.8,
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
      fireSkill: 3.2,
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
      fireSkill: 4.3,
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
      fireSkill: 4.3,
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
      fireSkill: 4.3,
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
      fireSkill: 4.3,
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
      fireSkill: 5,
      spellDifficulty: 4 as SpellDifficultyLevel,
      equippedArmour: { encumbrance: 0 },
      equippedShield: { encumbrance: 0 },
      armourSkill: 0,
      shieldSkill: 0,
    };

    const failureRate = rawSpellFail(params);

    expect(failureRate).toBe(1);
  });
});
