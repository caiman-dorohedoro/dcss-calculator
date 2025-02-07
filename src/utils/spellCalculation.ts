export type SpellCalculationParams = {
  playerStrength: number;
  playerSpellcasting: number;
  intelligence: number;
  conjurationSkill: number;
  fireSkill: number;
  spellDifficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  equippedArmour: { encumbrance: number };
  equippedShield: { encumbrance: number };
  armourSkill: number;
  shieldSkill: number;
};

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

export type SpellDifficultyLevel = keyof typeof spellDifficulties;

export function calculateSpellSuccess({
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
  // Spell skills 계산
  const averageSpellSchools = (conjurationSkill + fireSkill) / 2;
  const spellSkills = playerSpellcasting / 2 + averageSpellSchools * 2;

  // Spell difficulty (레벨 6)
  const calculatedSpellDifficulty = spellDifficulties[spellDifficulty];

  // Armour penalty 계산
  const armourEncumbrance = equippedArmour.encumbrance;
  const evPenaltyArmour =
    (Math.pow(armourEncumbrance, 2) * (90 - 2 * armourSkill)) /
    (225 * (playerStrength + 3));
  const spellPenaltyArmour = 19 * evPenaltyArmour;

  // Shield penalty 계산
  const shieldEncumbrance = equippedShield.encumbrance;
  const evPenaltyShieldNumerator =
    2 * Math.pow(shieldEncumbrance, 2) * (27 - shieldSkill);
  const evPenaltyShieldDenominator = 5 * (playerStrength + 5) * 27;
  const evPenaltyShield = evPenaltyShieldNumerator / evPenaltyShieldDenominator;
  const spellPenaltyShield = 19 * evPenaltyShield;

  const encumbrancePenalty = spellPenaltyArmour + spellPenaltyShield;

  // Base spell failure 계산
  const spellFailure =
    60 -
    6 * spellSkills -
    2 * intelligence +
    calculatedSpellDifficulty +
    encumbrancePenalty;

  // Step down 처리
  let rawFailure;
  if (spellFailure >= 43) {
    rawFailure = spellFailure;
  } else {
    const x = spellFailure;
    const numerator =
      Math.pow(x, 3) + 426 * Math.pow(x, 2) + 82670 * x + 6983254;
    rawFailure = numerator / 262144;
  }

  // Final Step: 실제 실패율 계산
  let realFailure;
  if (rawFailure < 33) {
    const N = rawFailure * 3;
    realFailure = ((N * (N + 1) * (N + 2)) / (6 * 101 * 101)) * 100;
  } else {
    realFailure = rawFailure;
  }

  // 성공률 계산
  const successRate = 100 - realFailure;
  return successRate;
}

// 테스트 케이스: 모든 패널티가 없는 경우
// const testCase = {
//   playerStrength: 15,
//   playerSpellcasting: 10,
//   conjurationSkill: 15,
//   fireSkill: 15,
//   intelligence: 20,
//   equippedArmour: { encumbrance: 0 }, // 방어구 없음
//   equippedShield: { encumbrance: 0 }, // 방패 없음
//   armourSkill: 0,
//   shieldSkill: 0,
// };

export function calculateSpellFailure({
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
  // 1. Spell Skills 계산
  const averageSpellSchools = (conjurationSkill + fireSkill) / 2;
  const spellSkills = playerSpellcasting / 2 + averageSpellSchools * 2;

  // 2. Spell Difficulty (레벨 6)
  const calculatedSpellDifficulty = spellDifficulties[spellDifficulty];

  // 3. Armour 패널티
  const armourEncumbrance = equippedArmour.encumbrance;
  const evPenaltyArmour =
    (Math.pow(armourEncumbrance, 2) * (90 - 2 * armourSkill)) /
    (225 * (playerStrength + 3));
  const spellPenaltyArmour = 19 * evPenaltyArmour;

  // 4. Shield 패널티
  const shieldEncumbrance = equippedShield.encumbrance;
  const evPenaltyShieldNumerator =
    2 * Math.pow(shieldEncumbrance, 2) * (27 - shieldSkill);
  const evPenaltyShieldDenominator = 5 * (playerStrength + 5) * 27;
  const evPenaltyShield = evPenaltyShieldNumerator / evPenaltyShieldDenominator;
  const spellPenaltyShield = 19 * evPenaltyShield;

  // 5. 총 패널티 계산
  const encumbrancePenalty = spellPenaltyArmour + spellPenaltyShield;

  // 6. Base Failure 계산
  const spellFailure =
    60 -
    6 * spellSkills -
    2 * intelligence +
    calculatedSpellDifficulty +
    encumbrancePenalty;

  // 7. Step-down 처리
  let rawFailure;
  if (spellFailure >= 43) {
    rawFailure = spellFailure;
  } else {
    const x = spellFailure;
    rawFailure = (x ** 3 + 426 * x ** 2 + 82670 * x + 6_983_254) / 262_144;
  }

  // 8. Final Step: 실제 실패율 계산
  let realFailure;
  if (rawFailure < 33) {
    const N = rawFailure * 3;
    realFailure = ((N * (N + 1) * (N + 2)) / (6 * 101 * 101)) * 100;
  } else {
    realFailure = rawFailure;
  }

  return realFailure; // 실패율 반환
}
