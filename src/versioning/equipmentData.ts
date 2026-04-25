import {
  ArmourKey,
  armourOptions,
  type KnownEquipmentEgoKey,
  type SpellBoostBodyArmourEgoKey,
  equipmentEgoOptions,
} from "@/types/equipment.ts";
import { GameVersion } from "@/types/game";

const fireDragonEncumbranceByVersion: Record<GameVersion, number> = {
  "0.32": 11,
  "0.33": 11,
  "0.34": 9,
  trunk: 9,
};

const commonBodyArmourEgoKeys = [
  "none",
  "fire resistance",
  "cold resistance",
  "poison resistance",
  "corrosion resistance",
  "see invisible",
  "invisibility",
  "strength",
  "dexterity",
  "intelligence",
  "ponderousness",
  "flying",
  "willpower",
  "protection",
  "stealth",
  "resistance",
  "positive energy",
  "the Archmagi",
  "reflection",
  "spirit shield",
  "hurling",
  "repulsion",
  "harm",
  "shadows",
  "rampaging",
  "infusion",
  "light",
  "wrath",
  "mayhem",
  "guile",
  "energy",
  "sniping",
  "ice",
  "fire",
  "air",
  "earth",
  "archery",
] as const satisfies readonly KnownEquipmentEgoKey[];

const spellBoostBodyArmourEgoKeys = [
  "command",
  "death",
  "resonance",
] as const satisfies readonly KnownEquipmentEgoKey[];

const bodyArmourEgoKeysByVersion: Record<
  GameVersion,
  readonly KnownEquipmentEgoKey[]
> = {
  "0.32": commonBodyArmourEgoKeys,
  "0.33": commonBodyArmourEgoKeys,
  "0.34": [...commonBodyArmourEgoKeys, ...spellBoostBodyArmourEgoKeys],
  trunk: [...commonBodyArmourEgoKeys, ...spellBoostBodyArmourEgoKeys],
};

const spellBoostBodyArmourEgoKeysByVersion: Record<
  GameVersion,
  readonly SpellBoostBodyArmourEgoKey[]
> = {
  "0.32": ["none"],
  "0.33": ["none"],
  "0.34": ["none", "command", "death", "resonance"],
  trunk: ["none", "command", "death", "resonance"],
};

export const getArmourEncumbrance = <V extends GameVersion>(
  version: V,
  armour: ArmourKey
) => {
  if (armour === "fire_dragon") {
    return fireDragonEncumbranceByVersion[version];
  }

  return armourOptions[armour].encumbrance;
};

export const getBodyArmourEgoOptions = <V extends GameVersion>(version: V) => {
  return Object.fromEntries(
    bodyArmourEgoKeysByVersion[version].map((key) => [
      key,
      equipmentEgoOptions[key],
    ])
  ) as Partial<
    Record<KnownEquipmentEgoKey, { name: string; itemName: string | null }>
  >;
};

export const getSpellBoostBodyArmourEgoOptions = <V extends GameVersion>(
  version: V
) => {
  return Object.fromEntries(
    spellBoostBodyArmourEgoKeysByVersion[version].map((key) => [
      key,
      equipmentEgoOptions[key],
    ])
  ) as Partial<
    Record<
      SpellBoostBodyArmourEgoKey,
      { name: string; itemName: string | null }
    >
  >;
};
