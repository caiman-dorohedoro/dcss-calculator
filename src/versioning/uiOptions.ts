export type EquipmentToggleKey =
  | "cloak"
  | "boots"
  | "barding";

const baseEquipmentToggleKeys = ["cloak", "boots", "barding"] as const;

export const getEquipmentToggleKeys = (): EquipmentToggleKey[] =>
  [...baseEquipmentToggleKeys] as EquipmentToggleKey[];
