import {
  ArmourKey,
  armourOptions,
  headgearOptions,
  miscellaneousOptions,
} from "@/types/equipment.ts";
import type { AuxArmourSlotState } from "@/types/equipmentSlots";
import type { GameVersion } from "@/types/game";
import type { SpeciesKey } from "@/types/species.ts";
import { getVersionSpecies } from "@/versioning/versionRegistry";
import {
  getAuxArmourBaseAc,
  getAuxArmourEnchantTotal,
} from "./equipmentModifiers";

export const calculateAC = (baseAC: number, skill: number): number => {
  return Math.floor(baseAC * (1 + skill / 22));
};

type MixedCalculationsParams<V extends GameVersion> = {
  version: V;
  species: SpeciesKey<V>;
  armour?: ArmourKey;
  bodyArmourEnchant?: number;
  headgearSlots?: AuxArmourSlotState[];
  gloveSlots?: AuxArmourSlotState[];
  helmet?: boolean;
  gloves?: boolean;
  boots?: boolean;
  bootsEnchant?: number;
  cloak?: boolean;
  cloakEnchant?: number;
  barding?: boolean;
  secondGloves?: boolean;
  ringProtection?: number;
  equipmentAC?: number;
  scalesAC?: number;
  armourSkill: number;
};

export const calculateMixedAC = <V extends GameVersion>({
  version,
  species,
  armour,
  bodyArmourEnchant = 0,
  headgearSlots,
  gloveSlots,
  helmet,
  gloves,
  boots,
  bootsEnchant = 0,
  cloak,
  cloakEnchant = 0,
  barding,
  secondGloves,
  ringProtection = 0,
  equipmentAC = 0,
  scalesAC = 0,
  armourSkill,
}: MixedCalculationsParams<V>): number => {
  const isDeformed = getVersionSpecies(version)[species].deformedBody === true;
  let baseAC = 0;
  const hasHeadgearSlots = headgearSlots?.some((slot) => slot.present) ?? false;
  const hasGloveSlots = gloveSlots?.some((slot) => slot.present) ?? false;

  if (armour) {
    baseAC += armourOptions[armour].baseAC;
  }

  if (hasHeadgearSlots) {
    baseAC += getAuxArmourBaseAc(headgearSlots, headgearOptions.helmet.baseAC);
  } else if (helmet) {
    baseAC += headgearOptions.helmet.baseAC;
  }

  if (hasGloveSlots) {
    baseAC += getAuxArmourBaseAc(gloveSlots, miscellaneousOptions.gloves.baseAC);
  } else {
    if (gloves) {
      baseAC += miscellaneousOptions.gloves.baseAC;
    }

    if (secondGloves) {
      baseAC += miscellaneousOptions.gloves.baseAC;
    }
  }

  if (boots === true) {
    baseAC += miscellaneousOptions.boots.baseAC;
  }

  if (cloak === true) {
    baseAC += miscellaneousOptions.cloak.baseAC;
  }

  if (barding === true) {
    baseAC += miscellaneousOptions.barding.baseAC;
  }

  const scaledBaseAc = calculateAC(baseAC, armourSkill);
  const deformedPenalty =
    isDeformed && armour ? Math.floor(armourOptions[armour].baseAC * 0.5) : 0;

  return (
    scaledBaseAc +
    bodyArmourEnchant +
    getAuxArmourEnchantTotal(headgearSlots) +
    getAuxArmourEnchantTotal(gloveSlots) +
    (boots === true ? bootsEnchant : 0) +
    (cloak === true ? cloakEnchant : 0) +
    ringProtection +
    equipmentAC +
    scalesAC -
    deformedPenalty
  );
};
