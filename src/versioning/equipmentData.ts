import {
  ArmourKey,
  armourOptions,
  BodyArmourEgoKey,
  bodyArmourEgoOptions,
} from "@/types/equipment.ts";
import { GameVersion } from "@/types/game";

const fireDragonEncumbranceByVersion: Record<GameVersion, number> = {
  "0.32": 11,
  "0.33": 11,
  "0.34": 9,
  trunk: 9,
};

const bodyArmourEgoKeysByVersion: Record<
  GameVersion,
  readonly BodyArmourEgoKey[]
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
      bodyArmourEgoOptions[key],
    ])
  ) as Partial<Record<BodyArmourEgoKey, { name: string }>>;
};
