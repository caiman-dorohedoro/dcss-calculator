import { Size } from "@/versioning/speciesModel";
import type { SpeciesOption } from "@/versioning/speciesModel";

export { Size };
export type { SpeciesOption };

export const baseSpecies = {
  armataur: { name: "Armataur", size: Size.LARGE, deformedBody: true },
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
  naga: { name: "Naga", size: Size.LARGE, deformedBody: true },
  octopode: { name: "Octopode", size: Size.MEDIUM },
  oni: { name: "Oni", size: Size.LARGE },
  spriggan: { name: "Spriggan", size: Size.LITTLE },
  tengu: { name: "Tengu", size: Size.MEDIUM },
  troll: { name: "Troll", size: Size.LARGE },
  vineStalker: { name: "Vine Stalker", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

export const species032 = {
  ...baseSpecies,
  ghoul: { name: "Ghoul", size: Size.MEDIUM },
  vampire: { name: "Vampire", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

export const species033 = {
  ...baseSpecies,
  poltergeist: { name: "Poltergeist", size: Size.MEDIUM },
  revenant: { name: "Revenant", size: Size.MEDIUM },
} as const satisfies Record<string, SpeciesOption>;

export const species034 = {
  ...species033,
} as const satisfies Record<string, SpeciesOption>;

const { armataur: _armataur, ...species034WithoutArmataur } = species034;

export const speciesTrunk = {
  ...species034WithoutArmataur,
  galeCentaur: {
    name: "Gale Centaur",
    size: Size.LARGE,
    deformedBody: true,
  },
} as const satisfies Record<string, SpeciesOption>;
