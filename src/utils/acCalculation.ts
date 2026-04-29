import {
  ArmourKey,
  armourOptions,
  headgearOptions,
  miscellaneousOptions,
} from "@/types/equipment.ts";
import type { AuxArmourSlotState } from "@/types/equipmentSlots";
import type { GameVersion } from "@/types/game";
import type { SpeciesKey } from "@/types/species.ts";
import type { KnownStatusId } from "dcss-morgue-parser";
import { getVersionSpecies } from "@/versioning/versionRegistry";
import {
  getAuxArmourBaseAc,
  getAuxArmourEnchantTotal,
  getHeadgearBaseAc,
  getHeadgearEnchantTotal,
} from "./equipmentModifiers";
import { hasActiveStatus, KNOWN_STATUS_IDS } from "./statusEffects";

export const calculateAC = (baseAC: number, skill: number): number => {
  return Math.floor(baseAC * (1 + skill / 22));
};

const calculateScaledAC = (baseAC: number, skill: number): number => {
  return Math.floor(baseAC * 100 * (1 + skill / 22));
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
  bardingEnchant?: number;
  secondGloves?: boolean;
  cloakBaseAc?: number;
  ringProtection?: number;
  equipmentAC?: number;
  formAC?: number;
  bodyArmourBaseAcMultiplier?: number;
  scalesAC?: number;
  deformedBody?: boolean;
  icemail?: number;
  sanguineArmour?: number;
  statusAC?: number;
  activeStatusIds?: readonly KnownStatusId[];
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
  bardingEnchant = 0,
  secondGloves,
  cloakBaseAc = miscellaneousOptions.cloak.baseAC,
  ringProtection = 0,
  equipmentAC = 0,
  formAC = 0,
  bodyArmourBaseAcMultiplier = 0,
  scalesAC = 0,
  deformedBody = false,
  icemail = 0,
  sanguineArmour = 0,
  statusAC = 0,
  activeStatusIds,
  armourSkill,
}: MixedCalculationsParams<V>): number => {
  const isDeformed =
    getVersionSpecies(version)[species].deformedBody === true || deformedBody;
  const hasBodyArmour = armour !== undefined && armour !== "none";
  const bodyBaseAc = hasBodyArmour ? armourOptions[armour].baseAC : 0;
  let auxBaseAc = 0;
  const hasHeadgearSlots = headgearSlots !== undefined;
  const hasGloveSlots = gloveSlots !== undefined;

  if (hasHeadgearSlots) {
    auxBaseAc +=
      getHeadgearBaseAc(headgearSlots) * headgearOptions.helmet.baseAC;
  } else if (helmet) {
    auxBaseAc += headgearOptions.helmet.baseAC;
  }

  if (hasGloveSlots) {
    auxBaseAc += getAuxArmourBaseAc(
      gloveSlots,
      miscellaneousOptions.gloves.baseAC
    );
  } else {
    if (gloves) {
      auxBaseAc += miscellaneousOptions.gloves.baseAC;
    }

    if (secondGloves) {
      auxBaseAc += miscellaneousOptions.gloves.baseAC;
    }
  }

  if (boots === true) {
    auxBaseAc += miscellaneousOptions.boots.baseAC;
  }

  if (cloak === true) {
    auxBaseAc += cloakBaseAc;
  }

  if (barding === true) {
    auxBaseAc += miscellaneousOptions.barding.baseAC;
  }

  const scaledBodyAc = calculateScaledAC(bodyBaseAc, armourSkill);
  const formAdjustedBodyAc =
    hasBodyArmour && bodyArmourBaseAcMultiplier !== 0
      ? Math.max(
          0,
          scaledBodyAc +
            Math.trunc((scaledBodyAc * bodyArmourBaseAcMultiplier) / 100)
        )
      : scaledBodyAc;
  const adjustedBodyAc =
    isDeformed && hasBodyArmour
      ? formAdjustedBodyAc + Math.trunc((formAdjustedBodyAc * -40) / 100)
      : formAdjustedBodyAc;
  const scaledAuxAc = calculateScaledAC(auxBaseAc, armourSkill);
  const scaledBaseAc = Math.floor((adjustedBodyAc + scaledAuxAc) / 100);
  const icemailAc =
    icemail > 0 &&
    !hasActiveStatus(activeStatusIds, KNOWN_STATUS_IDS.icemailDepleted)
      ? icemail * 4
      : 0;
  const sanguineArmourAc =
    sanguineArmour > 0 &&
    hasActiveStatus(activeStatusIds, KNOWN_STATUS_IDS.sanguineArmoured)
      ? 3 + sanguineArmour * 3
      : 0;

  return (
    scaledBaseAc +
    (hasBodyArmour ? bodyArmourEnchant : 0) +
    getHeadgearEnchantTotal(headgearSlots) +
    getAuxArmourEnchantTotal(gloveSlots) +
    (boots === true ? bootsEnchant : 0) +
    (cloak === true ? cloakEnchant : 0) +
    (barding === true ? bardingEnchant : 0) +
    ringProtection +
    equipmentAC +
    formAC +
    scalesAC +
    icemailAc +
    sanguineArmourAc +
    statusAC
  );
};
