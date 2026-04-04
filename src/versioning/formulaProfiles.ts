import { GameVersion } from "@/types/game";

export const formulaProfiles = {
  legacy210: {
    spellFailCap: 210,
    applySpellCap(chance: number) {
      return Math.min(chance, 210);
    },
  },
  modern400: {
    spellFailCap: 400,
    applySpellCap(chance: number) {
      return Math.min(chance, 400);
    },
  },
} as const;

export type FormulaProfileName = keyof typeof formulaProfiles;

export const getFormulaProfile = (profileName: FormulaProfileName) =>
  formulaProfiles[profileName];

export const getFormulaProfileForVersion = (
  version: GameVersion,
  lookup: (version: GameVersion) => FormulaProfileName,
) => getFormulaProfile(lookup(version));
