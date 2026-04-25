import {
  bodyArmourEgoOptions,
  type BodyArmourEgoKey,
  type KnownBodyArmourEgoKey,
  type SpellBoostBodyArmourEgoKey,
} from "@/types/equipment";
import type { EquipmentModifierBag } from "@/types/equipmentItems";

const spellBoostBodyArmourEgos = new Set<SpellBoostBodyArmourEgoKey>([
  "none",
  "command",
  "death",
  "resonance",
]);

const isKnownBodyArmourEgo = (
  ego: BodyArmourEgoKey
): ego is KnownBodyArmourEgoKey => ego in bodyArmourEgoOptions;

const bodyArmourEgoModifierMap: Partial<
  Record<KnownBodyArmourEgoKey, EquipmentModifierBag>
> = {
  "fire resistance": { rF: 1 },
  "cold resistance": { rC: 1 },
  "poison resistance": { flags: ["rPois"] },
  "corrosion resistance": { flags: ["rCorr"] },
  "see invisible": { flags: ["SInv"] },
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

const cloneModifierBag = (
  modifiers: EquipmentModifierBag
): EquipmentModifierBag => ({
  ...modifiers,
  flags: modifiers.flags ? [...modifiers.flags] : undefined,
});

export const getBodyArmourEgoLabel = (ego: BodyArmourEgoKey) =>
  isKnownBodyArmourEgo(ego) ? bodyArmourEgoOptions[ego].name : ego;

export const getBodyArmourEgoItemName = (ego: BodyArmourEgoKey) =>
  isKnownBodyArmourEgo(ego)
    ? bodyArmourEgoOptions[ego].itemName
    : ego === "none"
      ? null
      : ego;

export const getSpellBoostBodyArmourEgo = (
  ego: BodyArmourEgoKey | undefined
): SpellBoostBodyArmourEgoKey =>
  ego && spellBoostBodyArmourEgos.has(ego as SpellBoostBodyArmourEgoKey)
    ? (ego as SpellBoostBodyArmourEgoKey)
    : "none";

export const getBodyArmourEgoModifierBag = (
  ego: BodyArmourEgoKey
): EquipmentModifierBag | undefined => {
  if (!isKnownBodyArmourEgo(ego)) {
    return undefined;
  }

  const modifiers = bodyArmourEgoModifierMap[ego];
  return modifiers ? cloneModifierBag(modifiers) : undefined;
};

const removeOwnedEgoModifiers = (
  modifiers: EquipmentModifierBag,
  ego: BodyArmourEgoKey
) => {
  const owned = getBodyArmourEgoModifierBag(ego);
  if (!owned) {
    return modifiers;
  }

  const next: EquipmentModifierBag = {
    ...modifiers,
    flags: modifiers.flags ? [...modifiers.flags] : undefined,
  };

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

export const syncBodyArmourEgoModifiers = (
  modifiers: EquipmentModifierBag | undefined,
  previousEgo: BodyArmourEgoKey,
  nextEgo: BodyArmourEgoKey
): EquipmentModifierBag | undefined => {
  const withoutPrevious = removeOwnedEgoModifiers(modifiers ?? {}, previousEgo);
  const nextOwned = getBodyArmourEgoModifierBag(nextEgo);
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
