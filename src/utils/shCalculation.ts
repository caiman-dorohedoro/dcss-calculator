import {ShieldKey, shieldOptions} from "@/types/equipment.ts";

type SHCalculationParams = {
  shield: ShieldKey;
  shieldSkill: number;
  dexterity: number;
  equipmentDex?: number;
  shieldEnchant?: number;
  equipmentSH?: number;
  amuletReflection?: number;
  largeBonePlates?: number;
};

export const calculateSH = (params: SHCalculationParams) => {
  const {
    shield,
    shieldSkill,
    dexterity,
    equipmentDex = 0,
    shieldEnchant = 0,
    equipmentSH = 0,
    amuletReflection = 0,
    largeBonePlates = 0,
  } = params;
  const baseSH = shieldOptions[shield].baseSH;
  const effectiveDexterity = dexterity + equipmentDex;

  if (shield === "none") {
    return 0;
  }

  if (effectiveDexterity === 0) {
    return 0;
  }

  // reflects DCSS formula
  const base = baseSH * 2;

  let sh = base * 50;

  sh += (base * shieldSkill * 5) / 2;

  sh += shieldSkill * 38;

  sh += 3 * 38;

  sh += (effectiveDexterity * 38 * (base + 13)) / 26;
  sh += shieldEnchant * 200;
  sh += equipmentSH * 200;
  sh += amuletReflection * 1000;
  sh += largeBonePlates > 0 ? largeBonePlates * 400 + 400 : 0;

  return Math.floor(sh / 2 / 100);
};
