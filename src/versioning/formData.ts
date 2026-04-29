import type { GameVersion } from "@/types/game";
import { Size } from "@/types/species";

export const formKeys = [
  "none",
  "aqua-form",
  "bat-form",
  "bat-swarm-form",
  "blade-form",
  "crab-form",
  "death-form",
  "dragon-form",
  "eel-form",
  "flux-form",
  "fungus-form",
  "hive-form",
  "jelly-form",
  "maw-form",
  "medusa-form",
  "pig-form",
  "quill-form",
  "scarab-form",
  "scroll-form",
  "serpent-form",
  "sphinx-form",
  "spider-form",
  "spore-form",
  "statue-form",
  "storm-form",
  "tree-form",
  "vampire-form",
  "werewolf-form",
  "wisp-form",
  "yak-form",
  "amphisbaena-form",
] as const;

export type FormKey = (typeof formKeys)[number];

export type EquipmentSlotForMeld =
  | "weapon"
  | "offhand"
  | "body"
  | "helmet"
  | "gloves"
  | "boots"
  | "barding"
  | "cloak"
  | "ring"
  | "amulet";

export type EquipmentMeldGroup =
  | EquipmentSlotForMeld
  | "held"
  | "aux"
  | "jewellery"
  | "physical"
  | "all";

export type FormScaling = {
  base?: number;
  scaling?: number;
  xlBased?: boolean;
};

export type FormDefinition = {
  key: FormKey;
  minSkill: number;
  maxSkill: number;
  melds: EquipmentMeldGroup[];
  size?: Size;
  strMod?: number;
  dexMod?: number;
  intMod?: number;
  ac?: FormScaling;
  ev?: FormScaling;
  bodyAcMult?: FormScaling;
  changesAnatomy?: boolean;
  changesSubstance?: boolean;
  special?: {
    dragonDraconianAcPenalty?: number;
    statueEvMultiplier?: { numerator: number; denominator: number };
    bladeParry?: FormScaling;
  };
};

export type FormDefinitionMap = Partial<Record<FormKey, FormDefinition>>;

type FormValueParams = {
  shapeshiftingSkill: number;
  experienceLevel: number;
  form: FormDefinition;
};

const physicalSlots: EquipmentSlotForMeld[] = [
  "weapon",
  "offhand",
  "body",
  "helmet",
  "gloves",
  "boots",
  "barding",
  "cloak",
];

const heldSlots: EquipmentSlotForMeld[] = ["weapon", "offhand"];
const auxSlots: EquipmentSlotForMeld[] = [
  "helmet",
  "gloves",
  "boots",
  "barding",
  "cloak",
];
const jewellerySlots: EquipmentSlotForMeld[] = ["ring", "amulet"];
const allSlots: EquipmentSlotForMeld[] = [...physicalSlots, ...jewellerySlots];

const groupSlots: Record<EquipmentMeldGroup, readonly EquipmentSlotForMeld[]> = {
  weapon: ["weapon"],
  offhand: ["offhand"],
  body: ["body"],
  helmet: ["helmet"],
  gloves: ["gloves"],
  boots: ["boots"],
  barding: ["barding"],
  cloak: ["cloak"],
  ring: ["ring"],
  amulet: ["amulet"],
  held: heldSlots,
  aux: auxSlots,
  jewellery: jewellerySlots,
  physical: physicalSlots,
  all: allSlots,
};

const noForm: FormDefinition = {
  key: "none",
  minSkill: 0,
  maxSkill: 0,
  melds: [],
};

const trunkForms: FormDefinitionMap = {
  "aqua-form": {
    key: "aqua-form",
    minSkill: 12,
    maxSkill: 20,
    melds: ["body"],
    ev: { base: 6, scaling: 7 },
    changesSubstance: true,
  },
  "bat-form": {
    key: "bat-form",
    minSkill: 0,
    maxSkill: 0,
    melds: ["physical", "ring"],
    size: Size.TINY,
    dexMod: 5,
    changesAnatomy: true,
  },
  "bat-swarm-form": {
    key: "bat-swarm-form",
    minSkill: 17,
    maxSkill: 25,
    melds: ["physical"],
    size: Size.TINY,
    dexMod: 5,
    ev: { base: 15, scaling: 20 },
    changesAnatomy: true,
  },
  "blade-form": {
    key: "blade-form",
    minSkill: 17,
    maxSkill: 25,
    melds: [],
    bodyAcMult: { base: -50, scaling: 30 },
    special: {
      bladeParry: { base: 6, scaling: 6 },
    },
  },
  "crab-form": {
    key: "crab-form",
    minSkill: 12,
    maxSkill: 20,
    melds: ["offhand", "aux"],
    ac: { base: 3 },
    bodyAcMult: { base: 70, scaling: 80 },
    changesAnatomy: true,
  },
  "death-form": {
    key: "death-form",
    minSkill: 26,
    maxSkill: 27,
    melds: [],
  },
  "dragon-form": {
    key: "dragon-form",
    minSkill: 17,
    maxSkill: 25,
    melds: ["physical"],
    size: Size.GIANT,
    strMod: 10,
    ac: { base: 12, scaling: 6 },
    changesAnatomy: true,
    special: {
      dragonDraconianAcPenalty: 6,
    },
  },
  "eel-form": {
    key: "eel-form",
    minSkill: 12,
    maxSkill: 20,
    melds: ["held", "gloves"],
  },
  "flux-form": {
    key: "flux-form",
    minSkill: 5,
    maxSkill: 14,
    melds: ["held", "body", "gloves"],
    ev: { base: 6, scaling: 10 },
  },
  "fungus-form": {
    key: "fungus-form",
    minSkill: 0,
    maxSkill: 0,
    melds: ["physical"],
    size: Size.TINY,
    ac: { base: 12 },
    changesAnatomy: true,
    changesSubstance: true,
  },
  "hive-form": {
    key: "hive-form",
    minSkill: 17,
    maxSkill: 25,
    melds: ["body", "helmet"],
    ac: { base: 5 },
  },
  "jelly-form": {
    key: "jelly-form",
    minSkill: 0,
    maxSkill: 0,
    melds: ["physical"],
    ac: { base: 1, scaling: 7, xlBased: true },
    changesAnatomy: true,
    changesSubstance: true,
  },
  "maw-form": {
    key: "maw-form",
    minSkill: 12,
    maxSkill: 20,
    melds: [],
    bodyAcMult: { base: -75 },
  },
  "medusa-form": {
    key: "medusa-form",
    minSkill: 8,
    maxSkill: 14,
    melds: ["helmet", "cloak"],
  },
  "pig-form": {
    key: "pig-form",
    minSkill: 0,
    maxSkill: 0,
    melds: ["physical", "ring"],
    size: Size.SMALL,
    changesAnatomy: true,
  },
  "quill-form": {
    key: "quill-form",
    minSkill: 0,
    maxSkill: 7,
    melds: ["aux"],
  },
  "scarab-form": {
    key: "scarab-form",
    minSkill: 8,
    maxSkill: 14,
    melds: ["physical"],
    size: Size.SMALL,
    ac: { base: 5, scaling: 4 },
    changesAnatomy: true,
  },
  "scroll-form": {
    key: "scroll-form",
    minSkill: 0,
    maxSkill: 7,
    melds: ["physical"],
    size: Size.TINY,
    changesAnatomy: true,
    changesSubstance: true,
  },
  "serpent-form": {
    key: "serpent-form",
    minSkill: 12,
    maxSkill: 20,
    melds: ["weapon", "offhand", "body", "boots", "barding", "gloves", "cloak"],
    size: Size.LARGE,
    strMod: 5,
    ac: { base: 10, scaling: 6 },
    changesAnatomy: true,
  },
  "amphisbaena-form": {
    key: "amphisbaena-form",
    minSkill: 12,
    maxSkill: 20,
    melds: ["weapon", "offhand", "body", "boots", "barding", "gloves", "cloak"],
    size: Size.LARGE,
    strMod: 5,
    ac: { base: 10, scaling: 6 },
    changesAnatomy: true,
  },
  "sphinx-form": {
    key: "sphinx-form",
    minSkill: 17,
    maxSkill: 25,
    melds: ["weapon", "offhand", "body", "boots", "helmet", "gloves"],
    ac: { base: 7 },
    changesAnatomy: true,
  },
  "spider-form": {
    key: "spider-form",
    minSkill: 12,
    maxSkill: 20,
    melds: ["physical"],
    size: Size.TINY,
    dexMod: 5,
    ac: { base: 3 },
    ev: { base: 5, scaling: 10 },
    changesAnatomy: true,
  },
  "spore-form": {
    key: "spore-form",
    minSkill: 8,
    maxSkill: 14,
    melds: ["offhand", "boots"],
  },
  "statue-form": {
    key: "statue-form",
    minSkill: 17,
    maxSkill: 25,
    melds: ["gloves", "boots", "barding", "body"],
    strMod: 7,
    ac: { base: 27, scaling: 11 },
    changesSubstance: true,
    special: {
      statueEvMultiplier: { numerator: 4, denominator: 5 },
    },
  },
  "storm-form": {
    key: "storm-form",
    minSkill: 23,
    maxSkill: 27,
    melds: ["physical"],
    ac: { base: 12, scaling: 3 },
    ev: { base: 20, scaling: 7 },
    changesAnatomy: true,
    changesSubstance: true,
  },
  "tree-form": {
    key: "tree-form",
    minSkill: 0,
    maxSkill: 0,
    melds: ["aux", "body"],
    ac: { base: 20, scaling: 14, xlBased: true },
    changesAnatomy: true,
    changesSubstance: true,
  },
  "vampire-form": {
    key: "vampire-form",
    minSkill: 17,
    maxSkill: 25,
    melds: [],
  },
  "werewolf-form": {
    key: "werewolf-form",
    minSkill: 12,
    maxSkill: 20,
    melds: ["gloves", "boots", "barding"],
    strMod: 3,
    dexMod: 3,
  },
  "wisp-form": {
    key: "wisp-form",
    minSkill: 0,
    maxSkill: 0,
    melds: ["all"],
    size: Size.TINY,
    ac: { base: 5, scaling: 14, xlBased: true },
    changesAnatomy: true,
    changesSubstance: true,
  },
  "yak-form": {
    key: "yak-form",
    minSkill: 8,
    maxSkill: 14,
    melds: ["physical"],
    size: Size.LARGE,
    ac: { base: 6, scaling: 6 },
    changesAnatomy: true,
  },
};

export const formDefinitions: Record<GameVersion, FormDefinitionMap> = {
  "0.32": {},
  "0.33": {},
  "0.34": {},
  trunk: trunkForms,
};

const toSkillScale = (skill: number) => Math.trunc(skill * 100);
const truncDiv = (numerator: number, denominator: number) =>
  Math.trunc(numerator / denominator);

export const getFormDefinition = (
  version: GameVersion,
  formKey: string | null | undefined
): FormDefinition => {
  if (!formKey || formKey === "none") {
    return noForm;
  }

  return formDefinitions[version][formKey as FormKey] ?? noForm;
};

export const isFormKey = (value: unknown): value is FormKey =>
  typeof value === "string" && formKeys.includes(value as FormKey);

export const getFormValue = (
  scaling: FormScaling | undefined,
  { shapeshiftingSkill, experienceLevel, form }: FormValueParams
) => {
  if (!scaling) {
    return 0;
  }

  const base = scaling.base ?? 0;
  const scalingValue = scaling.scaling ?? 0;
  const scale = 100;

  if (scaling.xlBased) {
    return base + truncDiv(scalingValue * experienceLevel, 27);
  }

  if (form.maxSkill === form.minSkill) {
    return base;
  }

  const level = Math.min(
    toSkillScale(shapeshiftingSkill),
    form.maxSkill * scale
  );
  const overMin = level - form.minSkill * scale;
  const raw =
    base * scale +
    truncDiv(overMin * scalingValue, form.maxSkill - form.minSkill);

  return truncDiv(raw, scale);
};

export const formMeldsSlot = (
  form: FormDefinition,
  slot: EquipmentSlotForMeld
) =>
  form.melds.some((meldGroup) => groupSlots[meldGroup].includes(slot));

export const getFormStatModifiers = (form: FormDefinition) => ({
  str: form.strMod ?? 0,
  dex: form.dexMod ?? 0,
  int: form.intMod ?? 0,
});
