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

export type ShieldKey = "none" | "buckler" | "kite_shield" | "tower_shield";

export const shieldOptions = {
  none: {name: "none", encumbrance: 0, baseSH: 0},
  buckler: {name: "buckler", encumbrance: 5, baseSH: 3},
  kite_shield: {name: "kite shield", encumbrance: 10, baseSH: 8},
  tower_shield: {name: "tower shield", encumbrance: 15, baseSH: 13},
} as const;

export type OrbKey = "none" | "energy" | "wucad_mu";

export const orbOptions = {
  none: { name: "none" },
  energy: { name: "orb of energy" },
  wucad_mu: { name: "crystal ball of Wucad Mu" },
} as const;

export const headgearOptions = {
  helmet: {name: "helmet", baseAC: 1, encumbrance: 0},
  hat: {name: "hat", baseAC: 0, encumbrance: 0},
} as const;

export const miscellaneousOptions = {
  boots: {name: "boots", baseAC: 1, encumbrance: 0},
  cloak: {name: "cloak", baseAC: 1, encumbrance: 0},
  scarf: {name: "scarf", baseAC: 0, encumbrance: 0},
  gloves: {name: "gloves", baseAC: 1, encumbrance: 0},
  barding: {name: "barding", baseAC: 4, encumbrance: -6},
} as const;

export const bodyArmourEgoOptions = {
  none: { name: "None", itemName: null },
  "fire resistance": { name: "Fire resistance", itemName: "fire resistance" },
  "cold resistance": { name: "Cold resistance", itemName: "cold resistance" },
  "poison resistance": {
    name: "Poison resistance",
    itemName: "poison resistance",
  },
  "corrosion resistance": {
    name: "Corrosion resistance",
    itemName: "corrosion resistance",
  },
  "see invisible": { name: "See invisible", itemName: "see invisible" },
  invisibility: { name: "Invisibility", itemName: "invisibility" },
  strength: { name: "Strength", itemName: "strength" },
  dexterity: { name: "Dexterity", itemName: "dexterity" },
  intelligence: { name: "Intelligence", itemName: "intelligence" },
  ponderousness: { name: "Ponderousness", itemName: "ponderousness" },
  flying: { name: "Flying", itemName: "flying" },
  willpower: { name: "Willpower", itemName: "willpower" },
  protection: { name: "Protection", itemName: "protection" },
  stealth: { name: "Stealth", itemName: "stealth" },
  resistance: { name: "Resistance", itemName: "resistance" },
  "positive energy": { name: "Positive energy", itemName: "positive energy" },
  "the Archmagi": { name: "The Archmagi", itemName: "the Archmagi" },
  reflection: { name: "Reflection", itemName: "reflection" },
  "spirit shield": { name: "Spirit shield", itemName: "spirit shield" },
  hurling: { name: "Hurling", itemName: "hurling" },
  repulsion: { name: "Repulsion", itemName: "repulsion" },
  harm: { name: "Harm", itemName: "harm" },
  shadows: { name: "Shadows", itemName: "shadows" },
  rampaging: { name: "Rampaging", itemName: "rampaging" },
  infusion: { name: "Infusion", itemName: "infusion" },
  light: { name: "Light", itemName: "light" },
  wrath: { name: "Wrath", itemName: "wrath" },
  mayhem: { name: "Mayhem", itemName: "mayhem" },
  guile: { name: "Guile", itemName: "guile" },
  energy: { name: "Energy", itemName: "energy" },
  sniping: { name: "Sniping", itemName: "sniping" },
  ice: { name: "Ice", itemName: "ice" },
  fire: { name: "Fire", itemName: "fire" },
  air: { name: "Air", itemName: "air" },
  earth: { name: "Earth", itemName: "earth" },
  archery: { name: "Archery", itemName: "archery" },
  command: { name: "Command", itemName: "command" },
  death: { name: "Death", itemName: "death" },
  resonance: { name: "Resonance", itemName: "resonance" },
  parrying: { name: "Parrying", itemName: "parrying" },
  glass: { name: "Glass", itemName: "glass" },
  pyromania: { name: "Pyromania", itemName: "pyromania" },
  stardust: { name: "Stardust", itemName: "stardust" },
  mesmerism: { name: "Mesmerism", itemName: "mesmerism" },
  attunement: { name: "Attunement", itemName: "attunement" },
} as const;

export type KnownBodyArmourEgoKey = keyof typeof bodyArmourEgoOptions;
export type BodyArmourEgoKey = KnownBodyArmourEgoKey | (string & {});
export type SpellBoostBodyArmourEgoKey =
  | "none"
  | "command"
  | "death"
  | "resonance";
