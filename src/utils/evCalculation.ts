import {ShieldKey, shieldOptions} from "./shCalculation";
import {ArmourKey, armourOptions} from "@/types/equipment.ts";
import {SpeciesKey, speciesOptions} from "@/types/species.ts";

export type Size = "tiny" | "little" | "small" | "medium" | "large" | "giant";

const sizeToNumber: Record<Size, number> = {
  tiny: 2,
  little: 4,
  small: 2,
  medium: 0,
  large: -2,
  giant: 12,
};

export function calculateEV(params: {
  dodgingSkill: number;
  dexterity: number;
  strength: number;
  species: SpeciesKey;
  shield: ShieldKey;
  armour: ArmourKey;
  shieldSkill: number;
  armourSkill: number;
}) {
  const {
    dodgingSkill,
    dexterity,
    strength,
    species,
    shield,
    shieldSkill,
    armourSkill,
    armour,
  } = params;

  const sizeFactor = sizeToNumber[speciesOptions[species].size];
  const baseEV = 10 + sizeFactor;
  const shieldEncumbrance = shieldOptions[shield].encumbrance;

  // Calculate dodge bonus with armor penalty modifier
  const armorPenaltyForDodge = armourOptions[armour].encumbrance - 3;
  let dodgeModifier = 1;

  if (armorPenaltyForDodge > 0) {
    if (armorPenaltyForDodge >= strength) {
      dodgeModifier = strength / (armorPenaltyForDodge * 2);
    } else {
      dodgeModifier = 1 - armorPenaltyForDodge / (strength * 2);
    }
  }

  const rawDodgeBonus = Math.floor(
    (8 + dodgingSkill * dexterity * 0.8) / (20 - sizeFactor)
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
    ((1 / 225) *
      Math.pow(armourOptions[armour].encumbrance, 2) *
      (90 - 2 * armourSkill)) /
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
