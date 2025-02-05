export type ShieldKey = "none" | "buckler" | "kite_shield" | "tower_shield";
export const shieldOptions = {
  none: { name: "none", encumbrance: 0, baseSH: 0 },
  buckler: { name: "buckler", encumbrance: 5, baseSH: 3 },
  kite_shield: { name: "kite shield", encumbrance: 10, baseSH: 8 },
  tower_shield: { name: "tower shield", encumbrance: 15, baseSH: 13 },
} as const;

type SHCalculationParams = {
  shield: ShieldKey;
  shieldSkill: number;
  dexterity: number;
};

export const calculateSH = (params: SHCalculationParams) => {
  const { shield, shieldSkill, dexterity } = params;
  const baseSH = shieldOptions[shield].baseSH;

  if (dexterity === 0) {
    return 0;
  }

  // DCSS 공식 반영
  const base = baseSH * 2;

  let sh = base * 50;

  sh += (base * shieldSkill * 5) / 2;

  sh += shieldSkill * 38;

  sh += 3 * 38;

  sh += (dexterity * 38 * (base + 13)) / 26;

  return Math.floor(sh / 2 / 100);
};
