import {ShieldKey, shieldOptions} from "@/types/equipment.ts";

type SHCalculationParams = {
  shield: ShieldKey;
  shieldSkill: number;
  dexterity: number;
};

export const calculateSH = (params: SHCalculationParams) => {
  const { shield, shieldSkill, dexterity } = params;
  const baseSH = shieldOptions[shield].baseSH;

  if (shield === "none") {
    return 0;
  }

  if (dexterity === 0) {
    return 0;
  }

  // reflects DCSS formula
  const base = baseSH * 2;

  let sh = base * 50;

  sh += (base * shieldSkill * 5) / 2;

  sh += shieldSkill * 38;

  sh += 3 * 38;

  sh += (dexterity * 38 * (base + 13)) / 26;

  return Math.floor(sh / 2 / 100);
};
