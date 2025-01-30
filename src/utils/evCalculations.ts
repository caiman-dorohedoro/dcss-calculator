export type SpeciesKey = "little" | "small" | "medium" | "large";
export type ShieldKey = "none" | "buckler" | "shield" | "large_shield";

export const speciesOptions = {
  little: { name: "아주 작은 크기 (스프리건, 펠리드)", factor: 4 },
  small: { name: "작은 크기 (코볼드)", factor: 2 },
  medium: { name: "중간 크기 (대부분의 종족)", factor: 0 },
  large: { name: "큰 크기 (트롤, 나가 등)", factor: -2 },
} as const;

export const shieldOptions = {
  none: { name: "없음", encumbrance: 0 },
  buckler: { name: "버클러", encumbrance: 5 },
  shield: { name: "카이트 실드", encumbrance: 10 },
  large_shield: { name: "타워 실드", encumbrance: 15 },
} as const;

export function calculateEVForSkillLevel(params: {
  dodgeSkill: number;
  dexterity: number;
  strength: number;
  species: SpeciesKey;
  shield: ShieldKey;
  armourER: number;
  shieldSkill: number;
  armourSkill: number;
}) {
  const {
    dodgeSkill,
    dexterity,
    strength,
    species,
    shield,
    armourER,
    shieldSkill,
    armourSkill,
  } = params;

  const sizeFactor = speciesOptions[species].factor;
  const baseEV = 10 + sizeFactor;
  const shieldEncumbrance = shieldOptions[shield].encumbrance;

  // Calculate dodge bonus with armor penalty modifier
  const armorPenaltyForDodge = armourER - 3;
  let dodgeModifier = 1;

  if (armorPenaltyForDodge > 0) {
    if (armorPenaltyForDodge >= strength) {
      dodgeModifier = strength / (armorPenaltyForDodge * 2);
    } else {
      dodgeModifier = 1 - armorPenaltyForDodge / (strength * 2);
    }
  }

  const rawDodgeBonus = Math.floor(
    (8 + dodgeSkill * dexterity * 0.8) / (20 - sizeFactor)
  );
  const modifiedDodgeBonus = rawDodgeBonus * dodgeModifier;
  const actualDodgeBonus = Math.floor(modifiedDodgeBonus);

  // Calculate initial EV with dodge bonus
  let currentEV = baseEV + actualDodgeBonus;

  // Shield penalty
  const shieldPenalty =
    (((2 / 5) * Math.pow(shieldEncumbrance, 2)) / (strength + 5)) *
    ((27 - shieldSkill) / 27);

  // Armour penalty
  const armourPenalty = Math.floor(
    ((1 / 225) * Math.pow(armourER, 2) * (90 - 2 * armourSkill)) /
      (strength + 3)
  );

  // Apply penalties
  currentEV = baseEV + actualDodgeBonus - shieldPenalty - armourPenalty;
  currentEV = Math.max(1, Math.floor(currentEV));

  return {
    baseEV,
    rawDodgeBonus,
    actualDodgeBonus,
    dodgeModifier,
    shieldPenalty,
    armourPenalty,
    finalEV: currentEV,
  };
}
