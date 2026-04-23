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

const sequenceSigned = (value: number) => {
  const sign = value >= 0 ? "+" : "-";
  return sign.repeat(Math.abs(value));
};

type NumericModifierKey = Exclude<keyof EquipmentModifierBag, "flags">;

const modifierDisplayOrder: Array<
  [NumericModifierKey, string, "signed" | "sequence"]
> = [
  ["rF", "rF", "sequence"],
  ["rC", "rC", "sequence"],
  ["rN", "rN", "sequence"],
  ["will", "Will", "sequence"],
  ["regenMP", "RegenMP", "sequence"],
  ["regen", "Regen", "sequence"],
  ["mp", "MP", "signed"],
  ["str", "Str", "signed"],
  ["dex", "Dex", "signed"],
  ["int", "Int", "signed"],
  ["slay", "Slay", "signed"],
  ["ac", "AC", "signed"],
  ["ev", "EV", "signed"],
  ["sh", "SH", "signed"],
  ["hp", "HP", "signed"],
  ["stlth", "Stlth", "sequence"],
  ["wizardry", "Wiz", "signed"],
];

const commaPrefixFlags = new Set(["Ponderous", "Reflect"]);

const modifierTokenDisplayOrder: Array<NumericModifierKey | string> = [
  "+Inv",
  "Spirit",
  "Bane",
  "rF",
  "rC",
  "rN",
  "rPois",
  "rElec",
  "will",
  "rCorr",
  "SInv",
  "rMut",
  "Fly",
  "Clar",
  "RMsl",
  "Faith",
  "Acrobat",
  "Rampage",
  "Harm",
  "Shadows",
  "Repulsion",
  "Archmagi",
  "Light",
  "Mayhem",
  "Guile",
  "Energy",
  "Air",
  "Fire",
  "Ice",
  "Earth",
  "Wildshape",
  "Chemistry",
  "Dissipate",
  "Attunement",
  "Mesmerism",
  "Stardust",
  "Hurl",
  "Snipe",
  "Bear",
  "Archery",
  "Command",
  "Death",
  "Resonance",
  "Parrying",
  "Glass",
  "Pyromania",
  "regenMP",
  "regen",
  "mp",
  "str",
  "dex",
  "int",
  "slay",
  "ac",
  "ev",
  "sh",
  "hp",
  "stlth",
  "wizardry",
  "-Cast",
  "*Rage",
  "^Drain",
  "*Corrode",
  "^Contam",
];

const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

const withEnchant = (enchant: number, itemName: string) =>
  `${signed(enchant)} ${itemName}`;

const leadingEnchantPattern = /^(?:(?:the|a|an)\s+)?[+-]\d+\b/;

const withDisplayNameEnchant = (displayName: string, enchant: number) =>
  leadingEnchantPattern.test(displayName)
    ? displayName
    : withEnchant(enchant, displayName);

const inlinePropertiesPattern = /\{[^}]*\}/;

const withDisplayNameModifiers = (
  displayName: string,
  modifiers?: EquipmentModifierBag
) =>
  inlinePropertiesPattern.test(displayName)
    ? displayName
    : withModifiers(displayName, modifiers);

const withEnchantableDisplayName = (
  displayName: string,
  enchant: number,
  modifiers?: EquipmentModifierBag
) => withDisplayNameModifiers(withDisplayNameEnchant(displayName, enchant), modifiers);

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

  const flags = modifiers.flags ?? [];
  const commaFlags = flags.filter((flag) => commaPrefixFlags.has(flag));
  const numericPartByKey = new Map<NumericModifierKey, string>();
  for (const [key, label, style] of modifierDisplayOrder) {
    const value = modifiers[key];
    if (value === undefined || value === 0) {
      continue;
    }

    const suffix = style === "sequence" ? sequenceSigned(value) : signed(value);
    numericPartByKey.set(key, `${label}${suffix}`);
  }

  const orderedParts = modifierTokenDisplayOrder.flatMap((token) => {
    if (numericPartByKey.has(token as NumericModifierKey)) {
      return numericPartByKey.get(token as NumericModifierKey) ?? [];
    }

    return flags.includes(token) && !commaPrefixFlags.has(token) ? token : [];
  });
  const knownOrderedTokens = new Set(modifierTokenDisplayOrder);
  const residualParts = flags.filter(
    (flag) => !commaPrefixFlags.has(flag) && !knownOrderedTokens.has(flag)
  );
  const parts = [...orderedParts, ...residualParts];
  if (commaFlags.length > 0) {
    return parts.length > 0
      ? `{${commaFlags.join(", ")}, ${parts.join(" ")}}`
      : `{${commaFlags.join(", ")}}`;
  }

  return parts.length > 0 ? `{${parts.join(" ")}}` : "";
};

export const formatBodyArmourSummary = (item: BodyArmourItemState) => {
  if (item.displayName) {
    return withEnchantableDisplayName(
      item.displayName,
      item.enchant,
      item.modifiers
    );
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
    return withEnchantableDisplayName(
      item.displayName,
      item.enchant,
      item.modifiers
    );
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
    return withDisplayNameModifiers(item.displayName, item.modifiers);
  }
  if (item.kind === "none") {
    return "none";
  }

  return withModifiers(orbOptions[item.kind].name, item.modifiers);
};

export const formatRingSummary = (slot: RingSlotState) => {
  if (slot.displayName) {
    return withDisplayNameModifiers(slot.displayName, slot.modifiers);
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
    return withDisplayNameModifiers(slot.displayName, slot.modifiers);
  }
  if (slot.kind === "none") {
    return "none";
  }

  return withModifiers(`amulet of ${slot.kind}`, slot.modifiers);
};

export const formatHeadgearSummary = (slot: AuxArmourSlotState) => {
  if (slot.displayName) {
    return withEnchantableDisplayName(
      slot.displayName,
      slot.enchant,
      slot.modifiers
    );
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
    return withEnchantableDisplayName(
      slot.displayName,
      slot.enchant,
      slot.modifiers
    );
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
    return withEnchantableDisplayName(
      item.displayName,
      item.enchant,
      item.modifiers
    );
  }
  if (!item.present) {
    return "none";
  }

  const itemName = item.kind === "boots" ? "pair of boots" : item.kind;
  return withModifiers(withEnchant(item.enchant, itemName), item.modifiers);
};
