import type { CalculatorState } from "@/hooks/useCalculatorState";
import {
  createDefaultBodyArmourItem,
  createDefaultFixedAuxItem,
  createDefaultOrbItem,
  createDefaultShieldItem,
} from "@/types/equipmentItems";
import {
  createDefaultAmuletSlot,
  createDefaultAuxArmourSlot,
  createDefaultRingSlot,
} from "@/types/equipmentSlots";
import type { GameVersion } from "@/types/game";
import type { VersionedSchoolSkillLevels } from "@/types/spells";
import { coerceSlotArrayLength, getDynamicSlotCounts } from "./dynamicSlotCounts";
import { getVersionConfig } from "./versionRegistry";

const baseDefaultState = {
  accordionValue: ["sf"],
  accordionOrder: ["sf", "ev", "ac", "sh"],
  dexterity: 10,
  strength: 10,
  intelligence: 10,
  bodyArmour: createDefaultBodyArmourItem(),
  shieldItem: createDefaultShieldItem(),
  orbItem: createDefaultOrbItem(),
  cloakItem: createDefaultFixedAuxItem("cloak"),
  bootsItem: createDefaultFixedAuxItem("boots"),
  bardingItem: createDefaultFixedAuxItem("barding"),
  shield: "none" as const,
  orb: "none" as const,
  armour: "robe" as const,
  shieldSkill: 0,
  armourSkill: 0,
  dodgingSkill: 0,
  helmet: false,
  gloves: false,
  boots: false,
  cloak: false,
  barding: false,
  bodyArmourEnchant: 0,
  shieldEnchant: 0,
  bootsEnchant: 0,
  cloakEnchant: 0,
  bardingEnchant: 0,
  subduedMagic: 0,
  antiWizardry: 0,
  runicMagic: 0,
  bigBrainWizardry: 0,
  scalesAC: 0,
  distortionField: 0,
  tenguFlight: 0,
  largeBonePlates: 0,
  ephemeralShield: 0,
  icemail: 0,
  condensationShield: 0,
  deformedBody: false,
  reckless: false,
  sturdyFrame: 0,
  gelatinousBody: 0,
  slowReflexes: 0,
  activeStatusIds: [],
  spellcasting: 0,
  wildMagic: 0,
  god: null,
  godPietyDisplay: null,
  godPietyRank: null,
  godUnderPenance: false,
};

const buildSchoolDefaults = <V extends GameVersion>(version: V) => {
  const schools = new Set<string>();

  for (const spell of getVersionConfig(version).spells) {
    for (const school of spell.schools) {
      schools.add(school);
    }
  }

  return Object.fromEntries(
    Array.from(schools)
      .sort()
      .map((school) => [school, 0])
  ) as VersionedSchoolSkillLevels<V>;
};

export const buildDefaultCalculatorState = <V extends GameVersion>(
  version: V
): CalculatorState<V> => {
  const config = getVersionConfig(version);
  const slotCounts = getDynamicSlotCounts(version, config.defaults.species);

  const state: CalculatorState<V> = {
    ...baseDefaultState,
    version,
    species: config.defaults.species,
    targetSpell: config.defaults.targetSpell,
    schoolSkills: buildSchoolDefaults(version),
    ringSlots: coerceSlotArrayLength(
      [],
      slotCounts.ringSlots,
      createDefaultRingSlot
    ),
    amuletSlots: coerceSlotArrayLength(
      [],
      slotCounts.amuletSlots,
      createDefaultAmuletSlot
    ),
    headgearSlots: coerceSlotArrayLength(
      [],
      slotCounts.headgearSlots,
      createDefaultAuxArmourSlot
    ),
    gloveSlots: coerceSlotArrayLength(
      [],
      slotCounts.gloveSlots,
      createDefaultAuxArmourSlot
    ),
  };

  if (config.features.secondGloves) {
    state.secondGloves = false;
  }

  return state;
};
