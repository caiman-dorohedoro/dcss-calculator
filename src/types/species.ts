import { GameVersion } from "./game";

type BaseSpeciesKey =
  | "armataur"
  | "barachi"
  | "coglin"
  | "deepElf"
  | "demigod"
  | "demonspawn"
  | "djinni"
  | "draconian"
  | "felid"
  | "formicid"
  | "gargoyle"
  | "gnoll"
  | "human"
  | "kobold"
  | "mountainDwarf"
  | "merfolk"
  | "minotaur"
  | "mummy"
  | "naga"
  | "octopode"
  | "oni"
  | "spriggan"
  | "tengu"
  | "troll"
  | "vineStalker";

type SpeciesKey032 = BaseSpeciesKey | "ghoul" | "vampire";

type SpeciesKeyTrunk = BaseSpeciesKey | "poltergeist" | "revenant";

export type SpeciesKey<V extends GameVersion> = V extends "0.32"
  ? SpeciesKey032
  : SpeciesKeyTrunk;

// export type Size = "tiny" | "little" | "small" | "medium" | "large" | "giant";
export enum Size {
  TINY = "tiny",
  LITTLE = "little",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  GIANT = "giant",
}

export const speciesOptions = (version: GameVersion) => {
  if (version === "0.32") {
    return {
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
    };
  }

  if (version === "trunk") {
    return {
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
    };
  }

  throw new Error(`Invalid version: ${version}`);
};
