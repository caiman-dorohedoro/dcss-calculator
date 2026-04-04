import type { GameVersion } from "./game";
import type {
  species032,
  species033,
  speciesTrunk,
} from "@/versioning/speciesData";

export enum Size {
  TINY = "tiny",
  LITTLE = "little",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  GIANT = "giant",
}

const speciesByVersion = {
  "0.32": {
    armataur: { name: "Armataur", size: Size.LARGE }, // Hybrid, special case
    barachi: { name: "Barachi", size: Size.MEDIUM },
    coglin: { name: "Coglin", size: Size.MEDIUM },
    deepElf: { name: "Deep Elf", size: Size.MEDIUM },
    demigod: { name: "Demigod", size: Size.MEDIUM },
    demonspawn: { name: "Demonspawn", size: Size.MEDIUM },
    djinni: { name: "Djinni", size: Size.MEDIUM },
    draconian: { name: "Draconian", size: Size.MEDIUM },
    felid: { name: "Felid", size: Size.LITTLE },
    formicid: { name: "Formicid", size: Size.MEDIUM },
    gargoyle: { name: "Gargoyle", size: Size.MEDIUM },
    ghoul: { name: "Ghoul", size: Size.MEDIUM },
    gnoll: { name: "Gnoll", size: Size.MEDIUM },
    human: { name: "Human", size: Size.MEDIUM },
    kobold: { name: "Kobold", size: Size.SMALL },
    mountainDwarf: { name: "Mountain Dwarf", size: Size.MEDIUM },
    merfolk: { name: "Merfolk", size: Size.MEDIUM },
    minotaur: { name: "Minotaur", size: Size.MEDIUM },
    mummy: { name: "Mummy", size: Size.MEDIUM },
    naga: { name: "Naga", size: Size.LARGE }, // Hybrid, special case
    octopode: { name: "Octopode", size: Size.MEDIUM },
    oni: { name: "Oni", size: Size.LARGE },
    spriggan: { name: "Spriggan", size: Size.LITTLE },
    tengu: { name: "Tengu", size: Size.MEDIUM },
    troll: { name: "Troll", size: Size.LARGE },
    vampire: { name: "Vampire", size: Size.MEDIUM },
    vineStalker: { name: "Vine Stalker", size: Size.MEDIUM },
  },
  "0.33": {
    armataur: { name: "Armataur", size: Size.LARGE }, // Hybrid, special case
    barachi: { name: "Barachi", size: Size.MEDIUM },
    coglin: { name: "Coglin", size: Size.MEDIUM },
    deepElf: { name: "Deep Elf", size: Size.MEDIUM },
    demigod: { name: "Demigod", size: Size.MEDIUM },
    demonspawn: { name: "Demonspawn", size: Size.MEDIUM },
    djinni: { name: "Djinni", size: Size.MEDIUM },
    draconian: { name: "Draconian", size: Size.MEDIUM },
    felid: { name: "Felid", size: Size.LITTLE },
    formicid: { name: "Formicid", size: Size.MEDIUM },
    gargoyle: { name: "Gargoyle", size: Size.MEDIUM },
    gnoll: { name: "Gnoll", size: Size.MEDIUM },
    human: { name: "Human", size: Size.MEDIUM },
    kobold: { name: "Kobold", size: Size.SMALL },
    mountainDwarf: { name: "Mountain Dwarf", size: Size.MEDIUM },
    merfolk: { name: "Merfolk", size: Size.MEDIUM },
    minotaur: { name: "Minotaur", size: Size.MEDIUM },
    mummy: { name: "Mummy", size: Size.MEDIUM },
    naga: { name: "Naga", size: Size.LARGE }, // Hybrid, special case
    octopode: { name: "Octopode", size: Size.MEDIUM },
    oni: { name: "Oni", size: Size.LARGE },
    poltergeist: { name: "Poltergeist", size: Size.MEDIUM },
    revenant: { name: "Revenant", size: Size.MEDIUM },
    spriggan: { name: "Spriggan", size: Size.LITTLE },
    tengu: { name: "Tengu", size: Size.MEDIUM },
    troll: { name: "Troll", size: Size.LARGE },
    vineStalker: { name: "Vine Stalker", size: Size.MEDIUM },
  },
  trunk: {
    armataur: { name: "Armataur", size: Size.LARGE }, // Hybrid, special case
    barachi: { name: "Barachi", size: Size.MEDIUM },
    coglin: { name: "Coglin", size: Size.MEDIUM },
    deepElf: { name: "Deep Elf", size: Size.MEDIUM },
    demigod: { name: "Demigod", size: Size.MEDIUM },
    demonspawn: { name: "Demonspawn", size: Size.MEDIUM },
    djinni: { name: "Djinni", size: Size.MEDIUM },
    draconian: { name: "Draconian", size: Size.MEDIUM },
    felid: { name: "Felid", size: Size.LITTLE },
    formicid: { name: "Formicid", size: Size.MEDIUM },
    gargoyle: { name: "Gargoyle", size: Size.MEDIUM },
    gnoll: { name: "Gnoll", size: Size.MEDIUM },
    human: { name: "Human", size: Size.MEDIUM },
    kobold: { name: "Kobold", size: Size.SMALL },
    mountainDwarf: { name: "Mountain Dwarf", size: Size.MEDIUM },
    merfolk: { name: "Merfolk", size: Size.MEDIUM },
    minotaur: { name: "Minotaur", size: Size.MEDIUM },
    mummy: { name: "Mummy", size: Size.MEDIUM },
    naga: { name: "Naga", size: Size.LARGE }, // Hybrid, special case
    octopode: { name: "Octopode", size: Size.MEDIUM },
    oni: { name: "Oni", size: Size.LARGE },
    poltergeist: { name: "Poltergeist", size: Size.MEDIUM },
    revenant: { name: "Revenant", size: Size.MEDIUM },
    spriggan: { name: "Spriggan", size: Size.LITTLE },
    tengu: { name: "Tengu", size: Size.MEDIUM },
    troll: { name: "Troll", size: Size.LARGE },
    vineStalker: { name: "Vine Stalker", size: Size.MEDIUM },
  },
} as const;

type SpeciesMap = {
  "0.32": typeof species032;
  "0.33": typeof species033;
  trunk: typeof speciesTrunk;
};

export type SpeciesKey<V extends GameVersion> = V extends "0.32"
  ? keyof SpeciesMap["0.32"]
  : V extends "0.33"
  ? keyof SpeciesMap["0.33"]
  : keyof SpeciesMap["trunk"];

export const speciesOptions = (
  version: GameVersion
): Record<string, { name: string; size: Size }> => {
  return speciesByVersion[version] as Record<string, { name: string; size: Size }>;
};
