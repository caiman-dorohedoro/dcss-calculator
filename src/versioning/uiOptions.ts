import { GameVersion } from "@/types/game";
import { getVersionConfig } from "./versionRegistry";

export type EquipmentToggleKey =
  | "helmet"
  | "cloak"
  | "gloves"
  | "boots"
  | "barding"
  | "secondGloves";

const baseEquipmentToggleKeys = [
  "helmet",
  "cloak",
  "gloves",
  "boots",
  "barding",
] as const satisfies readonly Exclude<EquipmentToggleKey, "secondGloves">[];

export const getEquipmentToggleKeys = (
  version: GameVersion
): EquipmentToggleKey[] => {
  const keys = [...baseEquipmentToggleKeys] as EquipmentToggleKey[];

  if (getVersionConfig(version).features.secondGloves) {
    keys.push("secondGloves");
  }

  return keys;
};
