import type { GameVersion } from "@/types/game";
import type { SpeciesKey } from "@/types/species";
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
