export type ArmourKey =
  | "robe"
  | "leather_armour"
  | "ring_mail"
  | "scale_mail"
  | "chain_mail"
  | "plate"
  | "crystal_plate"
  | "animal_skin"
  | "troll_leather"
  | "steam_dragon"
  | "acid_dragon"
  | "swamp_dragon"
  | "quicksilver_dragon"
  | "fire_dragon"
  | "ice_dragon"
  | "pearl_dragon"
  | "storm_dragon"
  | "shadow_dragon"
  | "golden_dragon";

export const armourOptions = {
  robe: { name: "robe", baseAC: 2, encumbrance: 0 },
  leather_armour: { name: "leather armour", baseAC: 3, encumbrance: 4 },
  ring_mail: { name: "ring mail", baseAC: 5, encumbrance: 7 },
  scale_mail: { name: "scale mail", baseAC: 6, encumbrance: 10 },
  chain_mail: { name: "chain mail", baseAC: 8, encumbrance: 14 },
  plate: { name: "plate armour", baseAC: 10, encumbrance: 18 },
  crystal_plate: { name: "crystal plate armour", baseAC: 14, encumbrance: 23 },
  animal_skin: { name: "animal skin", baseAC: 2, encumbrance: 0 },
  troll_leather: { name: "troll leather armour", baseAC: 3, encumbrance: 4 },
  steam_dragon: { name: "steam dragon scales", baseAC: 5, encumbrance: 0 },
  acid_dragon: { name: "acid dragon scales", baseAC: 6, encumbrance: 5 },
  swamp_dragon: { name: "swamp dragon scales", baseAC: 7, encumbrance: 7 },
  quicksilver_dragon: {
    name: "quicksilver dragon scales",
    baseAC: 9,
    encumbrance: 7,
  },
  fire_dragon: { name: "fire dragon scales", baseAC: 8, encumbrance: 11 },
  ice_dragon: { name: "ice dragon scales", baseAC: 9, encumbrance: 11 },
  pearl_dragon: { name: "pearl dragon scales", baseAC: 10, encumbrance: 11 },
  storm_dragon: { name: "storm dragon scales", baseAC: 10, encumbrance: 15 },
  shadow_dragon: { name: "shadow dragon scales", baseAC: 11, encumbrance: 15 },
  golden_dragon: { name: "golden dragon scales", baseAC: 12, encumbrance: 23 },
} as const;

export type HeadgearKey = "helmet" | "hat";

export const headgearOptions = {
  helmet: { name: "helmet", baseAC: 1, encumbrance: 0 },
  hat: { name: "hat", baseAC: 0, encumbrance: 0 },
} as const;

export type MiscellaneousKey =
  | "boots"
  | "cloak"
  | "scarf"
  | "gloves"
  | "barding";

export const miscellaneousOptions = {
  boots: { name: "boots", baseAC: 1, encumbrance: 0 },
  cloak: { name: "cloak", baseAC: 1, encumbrance: 0 },
  scarf: { name: "scarf", baseAC: 0, encumbrance: 0 },
  gloves: { name: "gloves", baseAC: 1, encumbrance: 0 },
  barding: { name: "barding", baseAC: 4, encumbrance: -6 },
} as const;

export const calculateAC = (baseAC: number, skill: number): number => {
  return Math.floor(baseAC * (1 + skill / 22));
};

type MixedCalculationsParams = {
  armour?: ArmourKey;
  helmet?: boolean;
  gloves?: boolean;
  boots?: boolean;
  cloak?: boolean;
  barding?: boolean;
  secondGloves?: boolean;
  armourSkill: number;
};

export const mixedCalculations = ({
  armour,
  helmet,
  gloves,
  boots,
  cloak,
  barding,
  secondGloves,
  armourSkill,
}: MixedCalculationsParams): number => {
  let baseAC = 0;

  if (armour) {
    baseAC += armourOptions[armour].baseAC;
  }

  if (helmet) {
    baseAC += headgearOptions.helmet.baseAC;
  }

  if (gloves) {
    baseAC += miscellaneousOptions.gloves.baseAC;
  }

  if (boots) {
    baseAC += miscellaneousOptions.boots.baseAC;
  }

  if (cloak) {
    baseAC += miscellaneousOptions.cloak.baseAC;
  }

  if (barding) {
    baseAC += miscellaneousOptions.barding.baseAC;
  }

  if (secondGloves) {
    baseAC += miscellaneousOptions.gloves.baseAC;
  }

  return calculateAC(baseAC, armourSkill);
};
