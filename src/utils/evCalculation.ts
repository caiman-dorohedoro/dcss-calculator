import {
  ArmourKey,
  miscellaneousOptions,
  ShieldKey,
  shieldOptions,
} from "@/types/equipment.ts";
import { GameVersion } from "@/types/game";
import { Size, SpeciesKey, speciesOptions } from "@/types/species.ts";
import { getArmourEncumbrance } from "@/versioning/equipmentData";

const sizeToNumber: Record<Size, number> = {
  tiny: 2,
  little: 4,
  small: 2,
  medium: 0,
  large: -2,
  giant: 12,
};

export function calculateEV<V extends GameVersion>(params: {
  version: V;
  dodgingSkill: number;
  dexterity: number;
  equipmentDex?: number;
  strength: number;
  equipmentStr?: number;
  species: SpeciesKey<V>;
  shield: ShieldKey;
  armour: ArmourKey;
  barding?: boolean;
  shieldSkill: number;
  armourSkill: number;
  ringEvasion?: number;
  equipmentEV?: number;
  distortionField?: number;
  tenguFlight?: number;
  sturdyFrame?: number;
  gelatinousBody?: number;
  slowReflexes?: number;
}) {
  const {
    version,
    dodgingSkill,
    dexterity,
    equipmentDex = 0,
    strength,
    equipmentStr = 0,
    species,
    shield,
    shieldSkill,
    armourSkill,
    armour,
    barding = false,
    ringEvasion = 0,
    equipmentEV = 0,
    distortionField = 0,
    tenguFlight = 0,
    sturdyFrame = 0,
    gelatinousBody = 0,
    slowReflexes = 0,
  } = params;

  const speciesOpts = speciesOptions(version);
  if (!speciesOpts || !speciesOpts[species]) {
    throw new Error(`Invalid species: ${species}, version: ${version}`);
  }

  const sizeFactor = sizeToNumber[speciesOpts[species].size];
  const baseEV = 10 + sizeFactor;
  const shieldEncumbrance = shieldOptions[shield].encumbrance;
  const armourEncumbrance = Math.max(
    0,
    getArmourEncumbrance(version, armour) - sturdyFrame * 2
  );
  const effectiveStrength = strength + equipmentStr;
  const effectiveDexterity = dexterity + equipmentDex;

  // Calculate dodge bonus with armor penalty modifier
  const armorPenaltyForDodge = armourEncumbrance - 3;
  let dodgeModifier = 1;

  if (armorPenaltyForDodge > 0) {
    if (armorPenaltyForDodge >= effectiveStrength) {
      dodgeModifier = effectiveStrength / (armorPenaltyForDodge * 2);
    } else {
      dodgeModifier = 1 - armorPenaltyForDodge / (effectiveStrength * 2);
    }
  }

  const rawDodgeBonus = Math.floor(
    (8 + dodgingSkill * effectiveDexterity * 0.8) / (20 - sizeFactor)
  );
  const modifiedDodgeBonus = rawDodgeBonus * dodgeModifier;
  const actualDodgeBonus = Math.floor(modifiedDodgeBonus);
  const directBonus =
    ringEvasion +
    equipmentEV +
    gelatinousBody +
    (distortionField > 0 ? distortionField + 1 : 0) +
    (tenguFlight > 0 ? 4 : 0) -
    slowReflexes * 5;

  // Calculate initial EV with dodge bonus
  let currentEV = baseEV + actualDodgeBonus;

  // Shield penalty
  const shieldPenalty =
    (((2 / 5) * Math.pow(shieldEncumbrance, 2)) / (effectiveStrength + 5)) *
    ((27 - shieldSkill) / 27);

  // Armour penalty
  const armourPenalty = Math.floor(
    ((1 / 225) *
      Math.pow(armourEncumbrance, 2) *
      (90 - 2 * armourSkill)) /
      (effectiveStrength + 3)
  );

  const auxiliaryArmourPenalty = barding
    ? Math.max(0, Math.floor(-miscellaneousOptions.barding.encumbrance / 3))
    : 0;

  // Apply penalties
  currentEV =
    baseEV +
    actualDodgeBonus -
    shieldPenalty -
    armourPenalty -
    auxiliaryArmourPenalty +
    directBonus;
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
