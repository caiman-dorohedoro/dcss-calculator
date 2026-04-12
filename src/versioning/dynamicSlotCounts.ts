import type { GameVersion } from "@/types/game";
import type { SpeciesKey } from "@/types/species";
import {
  createDefaultAmuletSlot,
  createDefaultAuxArmourSlot,
  createDefaultRingSlot,
  type AmuletSlotState,
  type AuxArmourSlotState,
  type RingSlotState,
} from "@/types/equipmentSlots";
import { getVersionSpecies } from "./versionRegistry";

export type DynamicSlotCounts = {
  ringSlots: number;
  amuletSlots: number;
  headgearSlots: number;
  gloveSlots: number;
};

const baseSlotCounts: DynamicSlotCounts = {
  ringSlots: 2,
  amuletSlots: 1,
  headgearSlots: 1,
  gloveSlots: 1,
};

export const getDynamicSlotCounts = <V extends GameVersion>(
  version: V,
  species: SpeciesKey<V>
): DynamicSlotCounts => {
  const speciesData = getVersionSpecies(version)[species];

  return {
    ...baseSlotCounts,
    ...speciesData.slotOverrides,
  };
};

export const coerceSlotArrayLength = <T>(
  slots: T[] | undefined,
  count: number,
  makeDefault: () => T
) => {
  const coerced = [...(slots ?? [])].slice(0, count);

  while (coerced.length < count) {
    coerced.push(makeDefault());
  }

  return coerced;
};

export type DynamicEquipmentSlotCollections = {
  ringSlots: RingSlotState[];
  amuletSlots: AmuletSlotState[];
  headgearSlots: AuxArmourSlotState[];
  gloveSlots: AuxArmourSlotState[];
};

export const coerceEquipmentSlotCollections = <V extends GameVersion>(
  version: V,
  species: SpeciesKey<V>,
  slots: DynamicEquipmentSlotCollections
): DynamicEquipmentSlotCollections => {
  const slotCounts = getDynamicSlotCounts(version, species);

  return {
    ringSlots: coerceSlotArrayLength(
      slots.ringSlots,
      slotCounts.ringSlots,
      createDefaultRingSlot
    ),
    amuletSlots: coerceSlotArrayLength(
      slots.amuletSlots,
      slotCounts.amuletSlots,
      createDefaultAmuletSlot
    ),
    headgearSlots: coerceSlotArrayLength(
      slots.headgearSlots,
      slotCounts.headgearSlots,
      createDefaultAuxArmourSlot
    ),
    gloveSlots: coerceSlotArrayLength(
      slots.gloveSlots,
      slotCounts.gloveSlots,
      createDefaultAuxArmourSlot
    ),
  };
};
