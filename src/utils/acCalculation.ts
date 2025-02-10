import {ArmourKey, armourOptions, headgearOptions, miscellaneousOptions} from "@/types/equipment.ts";
import {SpeciesKey} from "@/types/species.ts";

export const calculateAC = (baseAC: number, skill: number): number => {
  return Math.floor(baseAC * (1 + skill / 22));
};

type MixedCalculationsParams = {
  species: SpeciesKey;
  armour?: ArmourKey;
  helmet?: boolean;
  gloves?: boolean;
  boots?: boolean;
  cloak?: boolean;
  barding?: boolean;
  secondGloves?: boolean;
  armourSkill: number;
};

export const calculateMixedAC = ({
  species,
  armour,
  helmet,
  gloves,
  boots,
  cloak,
  barding,
  secondGloves,
  armourSkill,
}: MixedCalculationsParams): number => {
  const isDeformed = species === "armataur" || species === "naga";
  let baseAC = 0;

  if (armour) {
    baseAC += armourOptions[armour].baseAC;
  }

  if (helmet) {
    baseAC += headgearOptions.helmet.baseAC;
  }

  if (gloves) {
    baseAC += miscellaneousOptions.gloves.baseAC;
  }

  if (boots) {
    baseAC += miscellaneousOptions.boots.baseAC;
  }

  if (cloak) {
    baseAC += miscellaneousOptions.cloak.baseAC;
  }

  if (barding) {
    baseAC += miscellaneousOptions.barding.baseAC;
  }

  if (secondGloves) {
    baseAC += miscellaneousOptions.gloves.baseAC;
  }

  return (
    calculateAC(baseAC, armourSkill) -
    (isDeformed && armour ? Math.floor(armourOptions[armour].baseAC * 0.5) : 0)
  );
};
