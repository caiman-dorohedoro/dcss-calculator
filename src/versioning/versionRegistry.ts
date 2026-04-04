import spells032 from "@/data/generated-spells.0.32.json";
import spells033 from "@/data/generated-spells.0.33.json";
import spellsTrunk from "@/data/generated-spells.trunk.json";
import { GameVersion, gameVersions } from "@/types/game";
import { FormulaProfileName } from "./formulaProfiles";
import { species032, species033, speciesTrunk } from "./speciesData";

type VersionFeatures = {
  secondGloves: boolean;
  enkindle: boolean;
};

type VersionDefaults = {
  species: string;
  targetSpell: string;
};

export const versionRegistry = {
  "0.32": {
    spells: spells032,
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
  },
  "0.33": {
    spells: spells033,
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
  },
  trunk: {
    spells: spellsTrunk,
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
  },
} as const satisfies Record<
  GameVersion,
  {
    spells: readonly unknown[];
    species: Record<string, { name: string; size: string }>;
    formulaProfile: FormulaProfileName;
    features: VersionFeatures;
    defaults: VersionDefaults;
  }
>;

export const getVersionConfig = <V extends GameVersion>(version: V) =>
  versionRegistry[version];

export const getVersionSpellData = <V extends GameVersion>(version: V) =>
  getVersionConfig(version).spells;

export const getVersionSpecies = <V extends GameVersion>(version: V) =>
  getVersionConfig(version).species;

export const getRegisteredVersions = () => gameVersions;
