import type { GameVersion } from "./game";
import { Size } from "@/versioning/speciesModel";
import { species032, species033, speciesTrunk } from "@/versioning/speciesData";

const speciesByVersion = {
  "0.32": species032,
  "0.33": species033,
  trunk: speciesTrunk,
} as const;

type SpeciesMap = typeof speciesByVersion;

export type SpeciesKey<V extends GameVersion> = keyof SpeciesMap[V];

export { Size };

export const speciesOptions = <V extends GameVersion>(
  version: V
): SpeciesMap[V] => {
  return speciesByVersion[version];
};
