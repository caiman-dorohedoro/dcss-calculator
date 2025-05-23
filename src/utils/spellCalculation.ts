import {
  ArmourKey,
  armourOptions,
  ShieldKey,
  shieldOptions,
} from "@/types/equipment.ts";
import { GameVersion } from "@/types/game";
import {
  VersionedSchoolSkillLevels,
  VersionedSpellDatum,
  VersionedSpellFlag,
  VersionedSpellName,
  VersionedSpellSchool,
} from "@/types/spells";
import spells032 from "@/data/generated-spells.0.32.json" assert { type: "json" };
import spellsTrunk from "@/data/generated-spells.trunk.json" assert { type: "json" };
import { SpeciesKey } from "@/types/species";

export type SpellCalculationParams<V extends GameVersion> = {
  version: GameVersion;
  species: SpeciesKey<V>;
  strength: number;
  spellcasting: number;
  intelligence: number;
  targetSpell: VersionedSpellName<V>;
  schoolSkills: VersionedSchoolSkillLevels<V>;
  spellDifficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  armour: ArmourKey;
  shield: ShieldKey;
  armourSkill: number;
  shieldSkill: number;
  wizardry?: number;
  channel?: boolean;
  wildMagic?: number;
  enkindle?: boolean;
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
  version: GameVersion,
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
  species: SpeciesKey<V>;
  armour: ArmourKey;
  armourSkill: number;
  strength: number;
  SCALE: number;
};

function calculateArmourPenalty<V extends GameVersion>({
  species,
  armour,
  armourSkill,
  strength,
  SCALE,
}: CalculateArmourPenaltyParams<V>) {
  const baseEvPenalty = armourOptions[armour].encumbrance;

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
  species: SpeciesKey<V>;
  strength: number;
  armourSkill: number;
  armour: ArmourKey;
  shieldSkill: number;
  shield: ShieldKey;
};

function calculateArmourShieldSpellPenalty<V extends GameVersion>({
  species,
  strength,
  armourSkill,
  armour,
  shieldSkill,
  shield,
}: armourShieldSpellPenaltyParams<V>) {
  const SCALE = 100;

  const totalPenalty =
    calculateArmourPenalty({
      species,
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

export const getSpellData = <V extends GameVersion>(version: GameVersion) => {
  return version === "0.32"
    ? (spells032 as VersionedSpellDatum<"0.32">[] as VersionedSpellDatum<V>[])
    : (spellsTrunk as VersionedSpellDatum<"trunk">[] as VersionedSpellDatum<V>[]);
};

export const getSpellSchools = <V extends GameVersion>(
  version: GameVersion,
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
  version: GameVersion,
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

const applyWizardryBoost = (chance: number, wizardry: number) => {
  let failReduce = 100;

  if (wizardry > 0) {
    failReduce = Math.floor((failReduce * 6) / (7 + wizardry));
  }

  return Math.floor((chance * failReduce) / 100);
};

function rawSpellFail<V extends GameVersion>({
  version,
  species,
  strength,
  intelligence,
  spellDifficulty,
  armour,
  shield,
  targetSpell,
  schoolSkills,
  spellcasting,
  armourSkill,
  shieldSkill,
  wizardry = 0,
  channel = false,
  wildMagic = 0,
  enkindle = false,
}: SpellCalculationParams<V>) {
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
  chance -= intelligence * 2;

  // calculate armor/shield penalty
  const armourShieldSpellPenalty = calculateArmourShieldSpellPenalty({
    species,
    strength: strength,
    armourSkill,
    armour,
    shieldSkill,
    shield,
  });

  if (!enkindle) {
    chance += armourShieldSpellPenalty;
  }

  // base failure rate by spell difficulty
  chance += spellDifficulties[spellDifficulty];

  // limit maximum value
  // For version 0.32 and below it's 210, for 0.33 and above it's 400, changed on 2025-04-09 (c42be)
  if (version !== "0.33" && version !== "trunk") {
    chance = Math.min(chance, 210);
  } else {
    chance = Math.min(chance, 400);
  }

  // calculate failure rate through cubic polynomial
  let chance2 = Math.max(
    Math.floor((((chance + 426) * chance + 82670) * chance + 7245398) / 262144),
    0
  );

  if (wildMagic > 0) {
    chance2 += wildMagic * 4;
  }

  if (channel) {
    chance2 += 10;
  }

  if (wizardry > 0) {
    chance2 = applyWizardryBoost(chance2, wizardry);
  }

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
