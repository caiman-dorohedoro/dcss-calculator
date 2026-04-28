import {
  ArmourKey,
  BodyArmourEgoKey,
  OrbKey,
  ShieldKey,
  shieldOptions,
} from "@/types/equipment.ts";
import { GameVersion } from "@/types/game";
import { getSpellBoostBodyArmourEgo } from "@/utils/bodyArmourEgos";
import {
  VersionedSchoolSkillLevels,
  VersionedSpellDatum,
  VersionedSpellFlag,
  VersionedSpellName,
  VersionedSpellSchool,
} from "@/types/spells";
import { SpeciesKey } from "@/types/species";
import {
  getArmourEncumbrance,
  getSpellBoostBodyArmourEgoOptions,
} from "@/versioning/equipmentData";
import { getFormulaProfile } from "@/versioning/formulaProfiles";
import { getVersionConfig } from "@/versioning/versionRegistry";

export type SpellCalculationParams<V extends GameVersion> = {
  version: V;
  species: SpeciesKey<V>;
  strength: number;
  equipmentStr?: number;
  spellcasting: number;
  intelligence: number;
  equipmentInt?: number;
  targetSpell: VersionedSpellName<V>;
  schoolSkills: VersionedSchoolSkillLevels<V>;
  spellDifficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  armour: ArmourKey;
  bodyArmourEgo?: BodyArmourEgoKey;
  orb?: OrbKey;
  shield: ShieldKey;
  armourSkill: number;
  shieldSkill: number;
  wizardry?: number;
  ringWizardry?: number;
  bigBrainWizardry?: number;
  subduedMagic?: number;
  antiWizardry?: number;
  runicMagic?: number;
  wildMagic?: number;
  enkindle?: boolean;
  god?: string | null;
  godPietyRank?: number | null;
  godUnderPenance?: boolean;
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

function tetrahedralNumber(n: number) {
  return Math.floor((n * (n + 1) * (n + 2)) / 6);
}

function getTrueFailRate(rawFail: number) {
  const outcomes = 101 * 101 * 100; // total number of possible outcomes
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

const getSkillPower = <V extends GameVersion>(
  version: V,
  targetSpell: VersionedSpellName<V>,
  schoolSkills: VersionedSchoolSkillLevels<V>,
  spellCasting: number
) => {
  let power = 0;

  const spellSchools = getSpellSchools<V>(version, targetSpell);
  const spellSchoolSkills = spellSchools
    .map((school) => schoolSkills[school])
    .filter((skill) => skill !== undefined);

  for (const skill of spellSchoolSkills) {
    power += skill * 200;
  }

  power = Math.floor(power / spellSchoolSkills.length);

  return power + spellCasting * 50;
};

type CalculateArmourPenaltyParams<V extends GameVersion> = {
  version: V;
  species: SpeciesKey<V>;
  armour: ArmourKey;
  armourSkill: number;
  strength: number;
  SCALE: number;
};

function calculateArmourPenalty<V extends GameVersion>({
  version,
  species,
  armour,
  armourSkill,
  strength,
  SCALE,
}: CalculateArmourPenaltyParams<V>) {
  const baseEvPenalty = getArmourEncumbrance(version, armour);

  const penalty = Math.floor(
    Math.floor(
      (2 * baseEvPenalty * baseEvPenalty * (450 - armourSkill * 10) * SCALE) /
        (5 * (strength + 3))
    ) / 450
  );

  if (species === "mountainDwarf") {
    return Math.floor(Math.max(penalty * 19, 0) / 4);
  }

  return Math.max(penalty * 19, 0);
}

type CalculateShieldPenaltyParams = {
  shield: ShieldKey;
  shieldSkill: number;
  strength: number;
  SCALE: number;
};

// shield penalty calculation
function calculateShieldPenalty({
  shield,
  shieldSkill,
  strength,
  SCALE,
}: CalculateShieldPenaltyParams) {
  const baseShieldPenalty = shieldOptions[shield].encumbrance;

  const penalty = Math.floor(
    Math.floor(
      (2 *
        baseShieldPenalty *
        baseShieldPenalty *
        (270 - shieldSkill * 10) *
        SCALE) /
        (25 + 5 * strength)
    ) / 270
  );

  return Math.max(penalty * 19, 0);
}

type armourShieldSpellPenaltyParams<V extends GameVersion> = {
  version: V;
  species: SpeciesKey<V>;
  strength: number;
  armourSkill: number;
  armour: ArmourKey;
  shieldSkill: number;
  shield: ShieldKey;
  runicMagic?: number;
};

function calculateArmourShieldSpellPenalty<V extends GameVersion>({
  version,
  species,
  strength,
  armourSkill,
  armour,
  shieldSkill,
  shield,
  runicMagic = 0,
}: armourShieldSpellPenaltyParams<V>) {
  const SCALE = 100;
  let bodyArmourPenalty = calculateArmourPenalty({
    version,
    species,
    armour,
    armourSkill,
    strength,
    SCALE,
  });

  if (runicMagic > 0) {
    bodyArmourPenalty = Math.floor(bodyArmourPenalty / 4);
  }

  const totalPenalty =
    bodyArmourPenalty +
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

export const getSpellData = <V extends GameVersion>(version: V) => {
  return getVersionConfig(version).spells as VersionedSpellDatum<V>[];
};

export const getSpellSchools = <V extends GameVersion>(
  version: V,
  targetSpell?: VersionedSpellName<V>
): VersionedSpellSchool<V>[] => {
  const spellData = getSpellData<V>(version);

  if (!spellData) {
    throw new Error("spellData is undefined");
  }

  const spell = spellData.find((spell) => spell.name === targetSpell);
  if (!spell) {
    throw new Error("Spell not found");
  }

  return spell.schools;
};

export const getSpellFlags = <V extends GameVersion>(
  version: V,
  targetSpell?: VersionedSpellName<V>
): VersionedSpellFlag<V>[] => {
  const spellData = getSpellData<V>(version);

  if (!spellData) {
    throw new Error("spellData is undefined");
  }

  const spell = spellData.find((spell) => spell.name === targetSpell);
  if (!spell) {
    throw new Error("Spell not found");
  }

  return spell.flags;
};

export const vehumetSupportsSpell = <V extends GameVersion>(
  version: V,
  targetSpell: VersionedSpellName<V>
) => {
  const spellSchools = getSpellSchools(version, targetSpell);
  const spellFlags = getSpellFlags(version, targetSpell);

  return (
    spellSchools.some((school) => school === "conjuration") ||
    spellFlags.some((flag) => flag === "destructive")
  );
};

type ApplySpellSuccessBoostsParams<V extends GameVersion> = {
  version: V;
  targetSpell: VersionedSpellName<V>;
  armour: ArmourKey;
  bodyArmourEgo: BodyArmourEgoKey;
  orb: OrbKey;
  armourSkill: number;
  chance: number;
  wizardry: number;
  god?: string | null;
  godPietyRank?: number | null;
  godUnderPenance?: boolean;
};

const applySpellSuccessBoosts = <V extends GameVersion>({
  version,
  targetSpell,
  armour,
  bodyArmourEgo,
  orb,
  armourSkill,
  chance,
  wizardry,
  god,
  godPietyRank,
  godUnderPenance = false,
}: ApplySpellSuccessBoostsParams<V>) => {
  const spellSchools = getSpellSchools(version, targetSpell);
  const supportedBodyArmourEgos = getSpellBoostBodyArmourEgoOptions(version);
  const spellBoostBodyArmourEgo = getSpellBoostBodyArmourEgo(bodyArmourEgo);
  let boostedChance = chance;
  let failReduce = 100;

  if (orb === "energy" || orb === "wucad_mu") {
    boostedChance += 10;
  }

  if (
    god === "Vehumet" &&
    (godPietyRank ?? 0) >= 3 &&
    !godUnderPenance &&
    vehumetSupportsSpell(version, targetSpell)
  ) {
    failReduce = Math.floor((failReduce * 2) / 3);
  }

  if (
    armour !== "none" &&
    spellBoostBodyArmourEgo in supportedBodyArmourEgos &&
    spellBoostBodyArmourEgo === "death" &&
    spellSchools.some((school) => school === "necromancy")
  ) {
    failReduce = Math.floor(failReduce / 2);
  }

  if (
    armour !== "none" &&
    spellBoostBodyArmourEgo in supportedBodyArmourEgos &&
    spellBoostBodyArmourEgo === "command" &&
    spellSchools.some((school) => school === "summoning")
  ) {
    failReduce = Math.floor((failReduce * 180) / (180 + armourSkill * 10));
  }

  if (
    armour !== "none" &&
    spellBoostBodyArmourEgo in supportedBodyArmourEgos &&
    spellBoostBodyArmourEgo === "resonance" &&
    spellSchools.some((school) => school === "forgecraft")
  ) {
    failReduce = Math.floor((failReduce * 2) / 3);
  }

  if (wizardry > 0) {
    failReduce = Math.floor((failReduce * 6) / (7 + wizardry));
  }

  return Math.floor((boostedChance * failReduce) / 100);
};

function rawSpellFail<V extends GameVersion>({
  version,
  species,
  strength,
  equipmentStr = 0,
  intelligence,
  equipmentInt = 0,
  spellDifficulty,
  armour,
  bodyArmourEgo = "none",
  orb = "none",
  shield,
  targetSpell,
  schoolSkills,
  spellcasting,
  armourSkill,
  shieldSkill,
  wizardry = 0,
  ringWizardry = 0,
  bigBrainWizardry = 0,
  subduedMagic = 0,
  antiWizardry = 0,
  runicMagic = 0,
  wildMagic = 0,
  enkindle = false,
  god,
  godPietyRank,
  godUnderPenance = false,
}: SpellCalculationParams<V>) {
  const config = getVersionConfig(version);
  const formula = getFormulaProfile(config.formulaProfile);
  const effectiveStrength = strength + equipmentStr;
  const effectiveIntelligence = intelligence + equipmentInt;
  const totalWizardry = wizardry + ringWizardry + bigBrainWizardry;

  // start with base failure rate of 60%
  let chance = 60;

  // calculate spell skill power
  const spellPower = Math.floor(
    (getSkillPower<V>(version, targetSpell, schoolSkills, spellcasting) * 6) /
      100
  );

  // reduce failure rate with spell power
  chance -= spellPower;

  // reduce failure rate with intelligence
  chance -= effectiveIntelligence * 2;

  // calculate armor/shield penalty
  const armourShieldSpellPenalty = calculateArmourShieldSpellPenalty({
    version,
    species,
    strength: effectiveStrength,
    armourSkill,
    armour,
    shieldSkill,
    shield,
    runicMagic,
  });

  if (!enkindle) {
    chance += armourShieldSpellPenalty;
  }

  // base failure rate by spell difficulty
  chance += spellDifficulties[spellDifficulty];
  chance = formula.applySpellCap(chance);

  // calculate failure rate through cubic polynomial
  let chance2 = Math.max(
    Math.floor((((chance + 426) * chance + 82670) * chance + 7245398) / 262144),
    0
  );

  if (wildMagic > 0) {
    chance2 += wildMagic * 4;
  }

  chance2 -= 2 * subduedMagic;
  chance2 += 4 * antiWizardry;

  chance2 = applySpellSuccessBoosts({
    version,
    targetSpell,
    armour,
    bodyArmourEgo,
    orb,
    armourSkill,
    chance: chance2,
    wizardry: totalWizardry,
    god,
    godPietyRank,
    godUnderPenance,
  });

  if (enkindle) {
    chance2 = Math.floor((chance2 * 3) / 4) - 5;
  }

  // final failure rate is between 0-100%
  const failRate = Math.min(Math.max(chance2, 0), 100);

  return failRate;
}

export const calculateSpellFailureRate = <V extends GameVersion>(
  params: SpellCalculationParams<V>
) => {
  const failRate = rawSpellFail(params);

  return failureRateToInt(failRate);
};
