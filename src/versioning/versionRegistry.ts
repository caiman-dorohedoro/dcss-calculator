import spells032 from "@/data/generated-spells.0.32.json";
import spells033 from "@/data/generated-spells.0.33.json";
import spellsTrunk from "@/data/generated-spells.trunk.json";
import { GameVersion, gameVersions } from "@/types/game";
import type { SpeciesKey } from "@/types/species";
import { FormulaProfileName } from "./formulaProfiles";
import type { SpeciesOption } from "./speciesModel";
import type {
  VersionedSpellDatum,
  VersionedSpellName,
} from "@/types/spells";
import { species032, species033, speciesTrunk } from "./speciesData";

type VersionFeatures = {
  secondGloves: boolean;
  enkindle: boolean;
};

type VersionConfig<V extends GameVersion> = {
  spells: readonly VersionedSpellDatum<V>[];
  species: Record<SpeciesKey<V>, SpeciesOption>;
  formulaProfile: FormulaProfileName;
  features: VersionFeatures;
  defaults: {
    species: SpeciesKey<V>;
    targetSpell: VersionedSpellName<V>;
  };
};

const defineVersionConfig = <V extends GameVersion>(config: VersionConfig<V>) =>
  config;

export const versionRegistry = {
  "0.32": defineVersionConfig<"0.32">({
    spells: spells032 as readonly VersionedSpellDatum<"0.32">[],
    species: species032,
    formulaProfile: "legacy210",
    features: {
      secondGloves: false,
      enkindle: false,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  }),
  "0.33": defineVersionConfig<"0.33">({
    spells: spells033 as readonly VersionedSpellDatum<"0.33">[],
    species: species033,
    formulaProfile: "modern400",
    features: {
      secondGloves: true,
      enkindle: false,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  }),
  trunk: defineVersionConfig<"trunk">({
    spells: spellsTrunk as readonly VersionedSpellDatum<"trunk">[],
    species: speciesTrunk,
    formulaProfile: "modern400",
    features: {
      secondGloves: true,
      enkindle: true,
    },
    defaults: {
      species: "armataur",
      targetSpell: "Airstrike",
    },
  }),
} as const satisfies {
  [K in GameVersion]: VersionConfig<K>;
};

export const getVersionConfig = <V extends GameVersion>(
  version: V
): VersionConfig<V> =>
  versionRegistry[version] as unknown as VersionConfig<V>;

export const getVersionSpellData = <V extends GameVersion>(version: V) =>
  getVersionConfig(version).spells;

export const getVersionSpecies = <V extends GameVersion>(version: V) =>
  getVersionConfig(version).species;

export const getRegisteredVersions = () => gameVersions;
