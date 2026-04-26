import {
  equipmentEgoOptions,
  type EquipmentEgoKey,
  type KnownEquipmentEgoKey,
  type SpellBoostBodyArmourEgoKey,
} from "@/types/equipment";
import type { EquipmentModifierBag } from "@/types/equipmentItems";

export type EquipmentEgoOptionEntry = [
  EquipmentEgoKey,
  { name: string; itemName: string | null },
];

const spellBoostBodyArmourEgos = new Set<SpellBoostBodyArmourEgoKey>([
  "none",
  "command",
  "death",
  "resonance",
]);

const isKnownEquipmentEgo = (
  ego: EquipmentEgoKey
): ego is KnownEquipmentEgoKey => ego in equipmentEgoOptions;

const equipmentEgoModifierMap: Partial<
  Record<KnownEquipmentEgoKey, EquipmentModifierBag>
> = {
  "fire resistance": { rF: 1 },
  "cold resistance": { rC: 1 },
  "poison resistance": { rPois: 1 },
  "corrosion resistance": { rCorr: 1 },
  "see invisible": { sInv: 1 },
  invisibility: { flags: ["+Inv"] },
  strength: { str: 3 },
  dexterity: { dex: 3 },
  intelligence: { int: 3 },
  ponderousness: { flags: ["Ponderous"] },
  flying: { flags: ["Fly"] },
  willpower: { will: 1 },
  protection: { ac: 3 },
  stealth: { stlth: 1 },
  resistance: { rC: 1, rF: 1 },
  "positive energy": { rN: 1 },
  "the Archmagi": { flags: ["Archmagi"] },
  reflection: { flags: ["Reflect"] },
  "spirit shield": { flags: ["Spirit"] },
  hurling: { flags: ["Hurl"] },
  repulsion: { flags: ["Repulsion"] },
  harm: { flags: ["Harm"] },
  shadows: { flags: ["Shadows"] },
  rampaging: { flags: ["Rampage"] },
  infusion: { flags: ["Infuse"] },
  light: { flags: ["Light"] },
  wrath: { flags: ["*Rage"] },
  mayhem: { flags: ["Mayhem"] },
  guile: { flags: ["Guile"] },
  energy: { flags: ["Energy"] },
  sniping: { flags: ["Snipe"] },
  ice: { flags: ["Ice"] },
  fire: { flags: ["Fire"] },
  air: { flags: ["Air"] },
  earth: { flags: ["Earth"] },
  archery: { flags: ["Archery"] },
  command: { flags: ["Command"] },
  death: { flags: ["Death"] },
  resonance: { flags: ["Resonance"] },
  parrying: { flags: ["Parrying"] },
  glass: { flags: ["Glass"] },
  pyromania: { flags: ["Pyromania"] },
  stardust: { flags: ["Stardust"] },
  mesmerism: { flags: ["Mesmerism"] },
  attunement: { flags: ["Attunement"] },
};

const equipmentEgoAvailabilityByBaseName = {
  "animal skin": [],
  robe: [
    ["resistance", 1],
    ["cold resistance", 2],
    ["fire resistance", 2],
    ["positive energy", 2],
    ["normal", 4],
    ["willpower", 4],
  ],
  "leather armour": [
    ["fire resistance", 7],
    ["cold resistance", 7],
    ["poison resistance", 5],
    ["willpower", 4],
    ["positive energy", 2],
  ],
  "ring mail": [
    ["fire resistance", 7],
    ["cold resistance", 7],
    ["poison resistance", 5],
    ["willpower", 4],
    ["positive energy", 2],
  ],
  "scale mail": [
    ["fire resistance", 20],
    ["cold resistance", 20],
    ["poison resistance", 10],
    ["willpower", 15],
    ["positive energy", 7],
    ["archery", 7],
    ["command", 7],
    ["death", 7],
    ["resonance", 7],
    ["normal", 4],
  ],
  "chain mail": [
    ["fire resistance", 21],
    ["cold resistance", 21],
    ["poison resistance", 16],
    ["willpower", 15],
    ["ponderousness", 7],
    ["archery", 5],
    ["command", 5],
    ["death", 5],
    ["resonance", 5],
  ],
  "plate armour": [
    ["fire resistance", 21],
    ["cold resistance", 21],
    ["poison resistance", 16],
    ["willpower", 15],
    ["ponderousness", 7],
    ["archery", 5],
    ["command", 5],
    ["death", 5],
    ["resonance", 5],
  ],
  "crystal plate armour": [],
  "troll leather armour": [],
  cloak: [
    ["poison resistance", 2],
    ["willpower", 2],
    ["stealth", 2],
    ["corrosion resistance", 2],
    ["air", 1],
  ],
  scarf: [
    ["resistance", 1],
    ["repulsion", 1],
    ["invisibility", 1],
    ["harm", 1],
    ["shadows", 1],
  ],
  gloves: [
    ["dexterity", 1],
    ["strength", 1],
    ["parrying", 1],
    ["hurling", 1],
    ["stealth", 1],
    ["infusion", 1],
    ["fire", 1],
  ],
  helmet: [
    ["light", 2],
    ["intelligence", 2],
    ["sniping", 2],
    ["ice", 1],
  ],
  cap: [],
  hat: [
    ["willpower", 3],
    ["stealth", 2],
    ["intelligence", 2],
    ["see invisible", 2],
    ["ice", 2],
    ["sniping", 1],
  ],
  boots: [
    ["flying", 2],
    ["stealth", 2],
    ["rampaging", 2],
    ["earth", 1],
  ],
  "centaur barding": [],
  barding: [
    ["flying", 2],
    ["cold resistance", 2],
    ["fire resistance", 2],
    ["stealth", 2],
    ["earth", 1],
  ],
  orb: [
    ["glass", 1],
    ["mayhem", 1],
    ["guile", 1],
    ["energy", 1],
    ["pyromania", 1],
    ["stardust", 1],
    ["mesmerism", 1],
    ["attunement", 1],
  ],
  buckler: [
    ["resistance", 2],
    ["fire resistance", 5],
    ["cold resistance", 5],
    ["poison resistance", 5],
    ["positive energy", 5],
    ["normal", 5],
    ["reflection", 9],
    ["protection", 14],
  ],
  "kite shield": [
    ["fire resistance", 4],
    ["cold resistance", 4],
    ["poison resistance", 4],
    ["positive energy", 4],
    ["normal", 4],
    ["corrosion resistance", 4],
    ["reflection", 13],
    ["protection", 10],
  ],
  "tower shield": [
    ["fire resistance", 3],
    ["cold resistance", 3],
    ["poison resistance", 3],
    ["positive energy", 3],
    ["ponderousness", 5],
    ["corrosion resistance", 5],
    ["reflection", 9],
    ["protection", 15],
  ],
  "steam dragon scales": [],
  "acid dragon scales": [],
  "quicksilver dragon scales": [],
  "swamp dragon scales": [],
  "fire dragon scales": [],
  "ice dragon scales": [],
  "pearl dragon scales": [],
  "storm dragon scales": [],
  "shadow dragon scales": [],
  "golden dragon scales": [],
} as const satisfies Record<
  string,
  readonly (readonly [KnownEquipmentEgoKey | "normal", number])[]
>;

const equipmentEgoAvailabilityMap: Record<
  string,
  readonly (readonly [KnownEquipmentEgoKey | "normal", number])[]
> = equipmentEgoAvailabilityByBaseName;

const cloneModifierBag = (
  modifiers: EquipmentModifierBag
): EquipmentModifierBag => ({
  ...modifiers,
  flags: modifiers.flags ? [...modifiers.flags] : undefined,
});

export const getEquipmentEgoLabel = (ego: EquipmentEgoKey) =>
  isKnownEquipmentEgo(ego) ? equipmentEgoOptions[ego].name : ego;

export const getEquipmentEgoItemName = (ego: EquipmentEgoKey) =>
  isKnownEquipmentEgo(ego)
    ? equipmentEgoOptions[ego].itemName
    : ego === "none"
      ? null
      : ego;

export const getSpellBoostBodyArmourEgo = (
  ego: EquipmentEgoKey | undefined
): SpellBoostBodyArmourEgoKey =>
  ego && spellBoostBodyArmourEgos.has(ego as SpellBoostBodyArmourEgoKey)
    ? (ego as SpellBoostBodyArmourEgoKey)
    : "none";

export const getEquipmentEgoModifierBag = (
  ego: EquipmentEgoKey
): EquipmentModifierBag | undefined => {
  if (!isKnownEquipmentEgo(ego)) {
    return undefined;
  }

  const modifiers = equipmentEgoModifierMap[ego];
  return modifiers ? cloneModifierBag(modifiers) : undefined;
};

const isVisibleAvailabilityEntry = (
  entry: readonly [KnownEquipmentEgoKey | "normal", number]
): entry is readonly [KnownEquipmentEgoKey, number] => entry[0] !== "normal";

export const getEquipmentEgoOptionsForBaseName = (
  baseName: string | null | undefined,
  currentEgo?: EquipmentEgoKey
): EquipmentEgoOptionEntry[] => {
  const legal = baseName
    ? [...(equipmentEgoAvailabilityMap[baseName] ?? [])]
        .filter(isVisibleAvailabilityEntry)
        .sort((left, right) => right[1] - left[1])
    : [];

  const entries: EquipmentEgoOptionEntry[] = [
    ["none", equipmentEgoOptions.none],
    ...legal.map(
      ([key]) => [key, equipmentEgoOptions[key]] as EquipmentEgoOptionEntry
    ),
  ];

  if (
    currentEgo &&
    currentEgo !== "none" &&
    !isKnownEquipmentEgo(currentEgo) &&
    !entries.some(([key]) => key === currentEgo)
  ) {
    return [
      [
        currentEgo,
        {
          name: getEquipmentEgoLabel(currentEgo),
          itemName: getEquipmentEgoItemName(currentEgo),
        },
      ],
      ...entries,
    ];
  }

  return entries;
};

export const isEquipmentEgoAllowedForBaseName = (
  baseName: string | null | undefined,
  ego: EquipmentEgoKey
) =>
  ego === "none" ||
  getEquipmentEgoOptionsForBaseName(baseName).some(([key]) => key === ego);

const removeOwnedEgoModifiers = (
  modifiers: EquipmentModifierBag,
  ego: EquipmentEgoKey
) => {
  const owned = getEquipmentEgoModifierBag(ego);
  if (!owned) {
    return modifiers;
  }

  const next: EquipmentModifierBag = cloneModifierBag(modifiers);

  for (const [key, value] of Object.entries(owned)) {
    if (key === "flags") {
      continue;
    }

    const modifierKey = key as Exclude<keyof EquipmentModifierBag, "flags">;
    if (next[modifierKey] === value) {
      delete next[modifierKey];
    }
  }

  if (owned.flags && next.flags) {
    const ownedFlags = new Set(owned.flags);
    next.flags = next.flags.filter((flag) => !ownedFlags.has(flag));
    if (next.flags.length === 0) {
      delete next.flags;
    }
  }

  return next;
};

const isEmptyModifierBag = (modifiers: EquipmentModifierBag) =>
  Object.keys(modifiers).length === 0;

export const syncEquipmentEgoModifiers = (
  modifiers: EquipmentModifierBag | undefined,
  previousEgo: EquipmentEgoKey,
  nextEgo: EquipmentEgoKey
): EquipmentModifierBag | undefined => {
  const withoutPrevious = removeOwnedEgoModifiers(modifiers ?? {}, previousEgo);
  const nextOwned = getEquipmentEgoModifierBag(nextEgo);
  const next = nextOwned
    ? {
        ...withoutPrevious,
        ...nextOwned,
        flags: [
          ...(withoutPrevious.flags ?? []),
          ...(nextOwned.flags ?? []).filter(
            (flag) => !(withoutPrevious.flags ?? []).includes(flag)
          ),
        ],
      }
    : withoutPrevious;

  if (next.flags?.length === 0) {
    delete next.flags;
  }

  return isEmptyModifierBag(next) ? undefined : next;
};
