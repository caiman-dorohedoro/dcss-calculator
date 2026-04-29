import type {
  ArmourKey,
  BodyArmourEgoKey,
  EquipmentEgoKey,
  OrbKey,
  ShieldKey,
} from "@/types/equipment";

type ArtifactKind = "normal" | "randart" | "unrand";
type EquipmentSource = "manual" | "imported" | "legacy";
export type EquipmentEquipState = "worn" | "haunted" | "melded" | "installed";

export type EquipmentModifierBag = {
  rF?: number;
  rC?: number;
  rN?: number;
  rPois?: number;
  rElec?: number;
  rCorr?: number;
  sInv?: number;
  will?: number;
  str?: number;
  dex?: number;
  int?: number;
  slay?: number;
  ac?: number;
  ev?: number;
  sh?: number;
  hp?: number;
  mp?: number;
  regen?: number;
  regenMP?: number;
  stlth?: number;
  wizardry?: number;
  flags?: string[];
};

type EquipmentItemMeta = {
  displayName?: string;
  propertiesText?: string;
  artifactKind?: ArtifactKind;
  source?: EquipmentSource;
  equipState?: EquipmentEquipState;
};

export type BodyArmourItemState = EquipmentItemMeta & {
  kind: ArmourKey;
  enchant: number;
  ego: BodyArmourEgoKey;
  modifiers?: EquipmentModifierBag;
};

export type ShieldItemState = EquipmentItemMeta & {
  kind: ShieldKey;
  enchant: number;
  ego?: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
};

export type OrbItemState = EquipmentItemMeta & {
  kind: OrbKey;
  ego?: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
};

export type FixedAuxItemState = EquipmentItemMeta & {
  kind: "cloak" | "scarf" | "boots" | "barding";
  present: boolean;
  enchant: number;
  ego?: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
};

export type UnattributedGearState = {
  label: "legacy gear";
  modifiers: EquipmentModifierBag;
  source: "legacy";
};

export const createDefaultBodyArmourItem = (): BodyArmourItemState => ({
  kind: "robe",
  enchant: 0,
  ego: "none",
});

export const createDefaultShieldItem = (): ShieldItemState => ({
  kind: "none",
  enchant: 0,
  ego: "none",
});

export const createDefaultOrbItem = (): OrbItemState => ({
  kind: "none",
  ego: "none",
});

export const createDefaultFixedAuxItem = (
  kind: FixedAuxItemState["kind"]
): FixedAuxItemState => ({
  kind,
  present: false,
  enchant: 0,
  ego: "none",
});
