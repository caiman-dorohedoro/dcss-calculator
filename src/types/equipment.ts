export type ArmourKey =
  | "none"
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
  none: { name: "none", baseAC: 0, encumbrance: 0 },
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
