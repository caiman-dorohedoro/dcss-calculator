import type {
  ArmourKey,
  BodyArmourEgoKey,
  OrbKey,
  ShieldKey,
} from "@/types/equipment";

type ArtifactKind = "normal" | "randart" | "unrand";
type EquipmentSource = "manual" | "imported" | "legacy";

export type EquipmentModifierBag = {
  rF?: number;
  rC?: number;
  rN?: number;
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
  modifiers?: EquipmentModifierBag;
};

export type OrbItemState = EquipmentItemMeta & {
  kind: OrbKey;
  modifiers?: EquipmentModifierBag;
};

export type FixedAuxItemState = EquipmentItemMeta & {
  kind: "cloak" | "boots" | "barding";
  present: boolean;
  enchant: number;
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
});

export const createDefaultOrbItem = (): OrbItemState => ({
  kind: "none",
});

export const createDefaultFixedAuxItem = (
  kind: FixedAuxItemState["kind"]
): FixedAuxItemState => ({
  kind,
  present: false,
  enchant: 0,
});
