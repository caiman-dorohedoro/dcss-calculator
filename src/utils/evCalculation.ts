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
  tiny: 6,
  little: 4,
  small: 2,
  medium: 0,
  large: -2,
  giant: -4,
};

const CRAWL_STAT_SCALE = 100;

const divTrunc = (numerator: number, denominator: number) =>
  Math.trunc(numerator / denominator);

const skillToTenth = (skill: number) => Math.round(skill * 10);

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
  statusEV?: number;
  effectiveSize?: Size;
  formEV?: number;
  formEVScaled?: number;
  evMultiplier?: { numerator: number; denominator: number };
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
    statusEV = 0,
    effectiveSize,
    formEV = 0,
    formEVScaled = formEV * CRAWL_STAT_SCALE,
    evMultiplier,
  } = params;

  const speciesOpts = speciesOptions(version);
  if (!speciesOpts || !speciesOpts[species]) {
    throw new Error(`Invalid species: ${species}, version: ${version}`);
  }

  const sizeFactor = sizeToNumber[effectiveSize ?? speciesOpts[species].size];
  const baseEV = 10 + sizeFactor;
  const shieldEncumbrance = shieldOptions[shield].encumbrance;
  const armourEncumbrance = Math.max(
    0,
    getArmourEncumbrance(version, armour) - sturdyFrame * 2
  );
  const effectiveStrength = strength + equipmentStr;
  const effectiveDexterity = dexterity + equipmentDex;
  const crawlStrength = Math.max(1, effectiveStrength);
  const dodgingSkillTenth = skillToTenth(dodgingSkill);
  const armourSkillTenth = skillToTenth(armourSkill);
  const shieldSkillTenth = skillToTenth(shieldSkill);

  const rawDodgeBonusScaled = divTrunc(
    divTrunc(
      divTrunc(
        (800 + dodgingSkillTenth * effectiveDexterity * 8) * CRAWL_STAT_SCALE,
        20 - sizeFactor
      ),
      10
    ),
    10
  );
  const armourPenaltyForDodge = armourEncumbrance - 3;
  const actualDodgeBonusScaled =
    armourPenaltyForDodge <= 0
      ? rawDodgeBonusScaled
      : armourPenaltyForDodge >= crawlStrength
        ? divTrunc(
            rawDodgeBonusScaled * crawlStrength,
            armourPenaltyForDodge * 2
          )
        : rawDodgeBonusScaled -
          divTrunc(
            rawDodgeBonusScaled * armourPenaltyForDodge,
            crawlStrength * 2
          );
  const rawDodgeBonus = Math.floor(rawDodgeBonusScaled / CRAWL_STAT_SCALE);
  const actualDodgeBonus = Math.floor(
    actualDodgeBonusScaled / CRAWL_STAT_SCALE
  );
  const dodgeModifier =
    rawDodgeBonusScaled === 0
      ? 1
      : actualDodgeBonusScaled / rawDodgeBonusScaled;
  const directBonus =
    ringEvasion +
    equipmentEV +
    gelatinousBody +
    (distortionField > 0 ? distortionField + 1 : 0) +
    (tenguFlight > 0 ? 4 : 0) -
    slowReflexes * 5 +
    statusEV;

  // Shield penalty
  const shieldPenaltyScaled = divTrunc(
    divTrunc(
      2 *
        shieldEncumbrance *
        shieldEncumbrance *
        (270 - shieldSkillTenth) *
        CRAWL_STAT_SCALE,
      25 + 5 * crawlStrength
    ),
    270
  );

  // Armour penalty
  const armourPenaltyScaled = divTrunc(
    divTrunc(
      2 *
        armourEncumbrance *
        armourEncumbrance *
        (450 - armourSkillTenth) *
        CRAWL_STAT_SCALE,
      5 * (crawlStrength + 3)
    ),
    450
  );

  const auxiliaryArmourPenalty = barding
    ? Math.max(0, Math.floor(-miscellaneousOptions.barding.encumbrance / 3))
    : 0;

  const currentEVScaled =
    baseEV * CRAWL_STAT_SCALE +
    actualDodgeBonusScaled -
    shieldPenaltyScaled -
    armourPenaltyScaled -
    auxiliaryArmourPenalty * CRAWL_STAT_SCALE +
    formEVScaled +
    directBonus * CRAWL_STAT_SCALE;
  const multipliedEVScaled = evMultiplier
    ? Math.trunc((currentEVScaled * evMultiplier.numerator) / evMultiplier.denominator)
    : currentEVScaled;
  const currentEV = Math.max(
    1,
    Math.floor(multipliedEVScaled / CRAWL_STAT_SCALE)
  );

  return {
    baseEV,
    rawDodgeBonus,
    actualDodgeBonus,
    dodgeModifier,
    shieldPenalty: shieldPenaltyScaled / CRAWL_STAT_SCALE,
    armourPenalty: Math.floor(armourPenaltyScaled / CRAWL_STAT_SCALE),
    finalEV: currentEV,
  };
}
