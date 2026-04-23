import {
  armourOptions,
  bodyArmourEgoOptions,
  orbOptions,
  shieldOptions,
} from "@/types/equipment";
import type {
  BodyArmourItemState,
  EquipmentModifierBag,
  FixedAuxItemState,
  OrbItemState,
  ShieldItemState,
} from "@/types/equipmentItems";
import type {
  AmuletSlotState,
  AuxArmourSlotState,
  RingSlotState,
} from "@/types/equipmentSlots";

const modifierDisplayOrder: Array<[keyof EquipmentModifierBag, string]> = [
  ["str", "Str"],
  ["dex", "Dex"],
  ["int", "Int"],
  ["ac", "AC"],
  ["ev", "EV"],
  ["sh", "SH"],
  ["wizardry", "Wiz"],
];

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const withEnchant = (enchant: number, itemName: string) =>
  enchant === 0 ? itemName : `${signed(enchant)} ${itemName}`;

const withModifiers = (
  itemName: string,
  modifiers?: EquipmentModifierBag
) => {
  const modifierSummary = formatModifierSummary(modifiers);
  return modifierSummary ? `${itemName} ${modifierSummary}` : itemName;
};

export const formatModifierSummary = (modifiers?: EquipmentModifierBag) => {
  if (!modifiers) {
    return "";
  }

  const parts = modifierDisplayOrder.flatMap(([key, label]) => {
    const value = modifiers[key];
    return value === undefined || value === 0 ? [] : `${label}${signed(value)}`;
  });

  return parts.length > 0 ? `{${parts.join(" ")}}` : "";
};

export const formatBodyArmourSummary = (item: BodyArmourItemState) => {
  if (item.displayName) {
    return item.displayName;
  }
  if (item.kind === "none") {
    return "none";
  }

  const baseName = armourOptions[item.kind].name;
  const egoName =
    item.ego === "none" ? "" : ` (${bodyArmourEgoOptions[item.ego].name})`;

  return withModifiers(
    `${withEnchant(item.enchant, baseName)}${egoName}`,
    item.modifiers
  );
};

export const formatShieldSummary = (item: ShieldItemState) => {
  if (item.displayName) {
    return item.displayName;
  }
  if (item.kind === "none") {
    return "none";
  }

  return withModifiers(
    withEnchant(item.enchant, shieldOptions[item.kind].name),
    item.modifiers
  );
};

export const formatOrbSummary = (item: OrbItemState) => {
  if (item.displayName) {
    return item.displayName;
  }
  if (item.kind === "none") {
    return "none";
  }

  return withModifiers(orbOptions[item.kind].name, item.modifiers);
};

export const formatRingSummary = (slot: RingSlotState) => {
  if (slot.displayName) {
    return slot.displayName;
  }
  if (slot.kind === "none") {
    return "none";
  }

  const baseName =
    slot.kind === "wizardry" ? "ring of wizardry" : `ring of ${slot.kind}`;
  const plus =
    slot.kind === "protection" || slot.kind === "evasion"
      ? ` ${signed(slot.plus)}`
      : "";

  return withModifiers(`${baseName}${plus}`, slot.modifiers);
};

export const formatAmuletSummary = (slot: AmuletSlotState) => {
  if (slot.displayName) {
    return slot.displayName;
  }
  if (slot.kind === "none") {
    return "none";
  }

  return withModifiers(`amulet of ${slot.kind}`, slot.modifiers);
};

export const formatHeadgearSummary = (slot: AuxArmourSlotState) => {
  if (slot.displayName) {
    return slot.displayName;
  }
  if (!slot.present) {
    return "none";
  }

  return withModifiers(
    withEnchant(slot.enchant, slot.kind ?? "helmet"),
    slot.modifiers
  );
};

export const formatGlovesSummary = (slot: AuxArmourSlotState) => {
  if (slot.displayName) {
    return slot.displayName;
  }
  if (!slot.present) {
    return "none";
  }

  return withModifiers(
    withEnchant(slot.enchant, "pair of gloves"),
    slot.modifiers
  );
};

export const formatFixedAuxSummary = (item: FixedAuxItemState) => {
  if (item.displayName) {
    return item.displayName;
  }
  if (!item.present) {
    return "none";
  }

  const itemName = item.kind === "boots" ? "pair of boots" : item.kind;
  return withModifiers(withEnchant(item.enchant, itemName), item.modifiers);
};
