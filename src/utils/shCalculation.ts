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
  condensationShield?: number;
  ephemeralShield?: number;
  reckless?: boolean;
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
    condensationShield = 0,
    ephemeralShield = 0,
    reckless = false,
  } = params;
  const baseSH = shieldOptions[shield].baseSH;
  const effectiveDexterity = dexterity + equipmentDex;
  const hasShield = shield !== "none";

  let sh = 0;

  if (hasShield && effectiveDexterity > 0) {
    // reflects DCSS formula
    const base = baseSH * 2;

    sh = base * 50;
    sh += (base * shieldSkill * 5) / 2;
    sh += shieldSkill * 38;
    sh += 3 * 38;
    sh += (effectiveDexterity * 38 * (base + 13)) / 26;
  }

  sh += hasShield ? shieldEnchant * 200 : 0;
  sh += equipmentSH * 200;
  sh += amuletReflection * 1000;
  sh += largeBonePlates > 0 ? largeBonePlates * 400 + 400 : 0;
  sh += condensationShield > 0 ? 800 : 0;
  sh += ephemeralShield > 0 ? ephemeralShield * 1400 : 0;

  if (reckless) {
    sh = Math.floor(sh / 2);
  }

  return Math.floor(sh / 2 / 100);
};
