import type { GameVersion } from "./game";
import { Size } from "@/versioning/speciesModel";
import type { SpeciesOption } from "@/versioning/speciesModel";
import {
  species032,
  species033,
  species034,
  speciesTrunk,
} from "@/versioning/speciesData";

const speciesByVersion = {
  "0.32": species032,
  "0.33": species033,
  "0.34": species034,
  trunk: speciesTrunk,
} as const;

type SpeciesMap = typeof speciesByVersion;

export type SpeciesKey<V extends GameVersion> = Extract<
  keyof SpeciesMap[V],
  string
>;

export { Size };

export const speciesOptions = <V extends GameVersion>(
  version: V
): Record<SpeciesKey<V>, SpeciesOption> => {
  return speciesByVersion[version] as Record<SpeciesKey<V>, SpeciesOption>;
};
