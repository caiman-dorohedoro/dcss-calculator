import {
  parseMorgueText,
  type EquipmentBooleanPropertyKey,
  type EquipmentItemSnapshot,
  type EquipmentNumericPropertyKey,
  type ParsedMorgueTextRecord,
} from "dcss-morgue-parser";
import type { CalculatorState } from "@/hooks/useCalculatorState.ts";
import type { EquipmentModifierBag } from "@/types/equipmentItems";
import {
  createDefaultAmuletSlot,
  createDefaultAuxArmourSlot,
  createDefaultRingSlot,
  type AmuletSlotState,
  type AuxArmourSlotState,
  type RingSlotState,
} from "@/types/equipmentSlots";
import {
  armourOptions,
  orbOptions,
  shieldOptions,
  type ArmourKey,
  type BodyArmourEgoKey,
  type OrbKey,
  type ShieldKey,
} from "@/types/equipment.ts";
import type { GameVersion } from "@/types/game";
import { speciesOptions } from "@/types/species.ts";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { coerceSlotArrayLength, getDynamicSlotCounts } from "@/versioning/dynamicSlotCounts";
import { getSpellBoostBodyArmourEgo } from "@/utils/bodyArmourEgos";
import { getVersionConfig } from "@/versioning/versionRegistry";

export type MorgueImportSummaryEntry = {
  label: string;
  detail?: string;
};

export type MorgueImportSummary = {
  applied: MorgueImportSummaryEntry[];
  skipped: MorgueImportSummaryEntry[];
};

type MorgueImportFailureKind =
  | "empty_input"
  | "parse_failed"
  | "unsupported_version"
  | "unsupported_species";

export type MorgueImportFailure = {
  ok: false;
  kind: MorgueImportFailureKind;
  message: string;
  detail?: string | null;
};

export type MorgueImportSuccess = {
  ok: true;
  sourceVersion: string;
  detectedVersion: GameVersion;
  importedState: CalculatorState<GameVersion>;
  summary: MorgueImportSummary;
};

export type MorgueImportResult = MorgueImportFailure | MorgueImportSuccess;

const schoolSkillKeyMap = {
  conjurations: "conjuration",
  hexes: "hexes",
  summonings: "summoning",
  necromancy: "necromancy",
  forgecraft: "forgecraft",
  translocations: "translocation",
  alchemy: "alchemy",
  fireMagic: "fire",
  iceMagic: "ice",
  airMagic: "air",
  earthMagic: "earth",
} as const;

const makeNameMap = <T extends string>(options: Record<T, { name: string }>) => {
  return Object.fromEntries(
    (Object.entries(options) as [T, { name: string }][]).map(([key, value]) => [
      value.name,
      key,
    ])
  ) as Record<string, T>;
};

const armourNameMap = makeNameMap(armourOptions);
const shieldNameMap = makeNameMap(shieldOptions);
const orbNameMap = makeNameMap(orbOptions);

const hasBaseType = (
  items: EquipmentItemSnapshot[] | undefined,
  targetBaseType: string
) => {
  return (items ?? []).some((item) => item.baseType === targetBaseType);
};

const hasBooleanProperty = (
  item: EquipmentItemSnapshot,
  property: EquipmentBooleanPropertyKey
) => {
  return (
    item.properties.booleanProps[property] === true ||
    item.intrinsicProperties.booleanProps[property] === true ||
    item.egoProperties.booleanProps[property] === true ||
    item.artifactProperties.booleanProps[property] === true
  );
};

const mapArmour = (baseType: string | null | undefined): ArmourKey | null => {
  if (!baseType || baseType === "none") {
    return "none";
  }

  return armourNameMap[baseType] ?? null;
};

const mapShield = (baseType: string | null | undefined): ShieldKey | null => {
  if (!baseType || baseType === "none") {
    return "none";
  }

  return shieldNameMap[baseType] ?? null;
};

const mapOrb = (baseType: string | null | undefined): OrbKey | null => {
  if (!baseType || baseType === "none") {
    return "none";
  }

  return orbNameMap[baseType] ?? null;
};

const numericItemModifierMap = {
  rF: "rF",
  rC: "rC",
  rN: "rN",
  Will: "will",
  Str: "str",
  Dex: "dex",
  Int: "int",
  Slay: "slay",
  AC: "ac",
  EV: "ev",
  SH: "sh",
  HP: "hp",
  MP: "mp",
  Regen: "regen",
  RegenMP: "regenMP",
  Stlth: "stlth",
} as const;

const booleanItemModifierLabels: Record<EquipmentBooleanPropertyKey, string> = {
  rPois: "rPois",
  rElec: "rElec",
  rCorr: "rCorr",
  rMut: "rMut",
  SInv: "SInv",
  Fly: "Fly",
  Reflect: "Reflect",
  Clar: "Clar",
  RMsl: "RMsl",
  Faith: "Faith",
  Spirit: "Spirit",
  Wiz: "Wiz",
  Acrobat: "Acrobat",
  Rampage: "Rampage",
  Harm: "Harm",
  Shadows: "Shadows",
  Repulsion: "Repulsion",
  Archmagi: "Archmagi",
  Light: "Light",
  Mayhem: "Mayhem",
  Guile: "Guile",
  Energy: "Energy",
  Air: "Air",
  Fire: "Fire",
  Ice: "Ice",
  Earth: "Earth",
  Wildshape: "Wildshape",
  Chemistry: "Chemistry",
  Dissipate: "Dissipate",
  Attunement: "Attunement",
  Mesmerism: "Mesmerism",
  Stardust: "Stardust",
  Hurl: "Hurl",
  Snipe: "Snipe",
  Bear: "Bear",
  Archery: "Archery",
  Command: "Command",
  Death: "Death",
  Resonance: "Resonance",
  Parrying: "Parrying",
  Glass: "Glass",
  Pyromania: "Pyromania",
  Ponderous: "Ponderous",
  Inv: "+Inv",
  "-Cast": "-Cast",
  Bane: "Bane",
  "*Rage": "*Rage",
  "^Drain": "^Drain",
  "*Corrode": "*Corrode",
  "^Contam": "^Contam",
};

const addFlagModifier = (modifiers: EquipmentModifierBag, flag: string) => {
  if (modifiers.flags?.includes(flag)) {
    return;
  }

  modifiers.flags = [...(modifiers.flags ?? []), flag];
};

const buildModifierBagFromItem = (
  item: EquipmentItemSnapshot,
  options?: {
    ignoreNumeric?: Array<keyof typeof numericItemModifierMap>;
    ignoreFlags?: EquipmentBooleanPropertyKey[];
    ignoreWiz?: boolean;
  }
): EquipmentModifierBag | undefined => {
  const modifiers: EquipmentModifierBag = {};

  for (const [property, key] of Object.entries(numericItemModifierMap) as [
    keyof typeof numericItemModifierMap,
    Exclude<keyof EquipmentModifierBag, "flags">,
  ][]) {
    if (options?.ignoreNumeric?.includes(property)) {
      continue;
    }

    const value =
      item.properties.numeric[property as EquipmentNumericPropertyKey];
    if (typeof value === "number" && value !== 0) {
      modifiers[key] = value;
    }
  }

  if (!options?.ignoreWiz && item.properties.booleanProps.Wiz === true) {
    modifiers.wizardry = 1;
  }

  for (const [property, label] of Object.entries(
    booleanItemModifierLabels
  ) as [EquipmentBooleanPropertyKey, string][]) {
    if (property === "Wiz" || options?.ignoreFlags?.includes(property)) {
      continue;
    }

    if (item.properties.booleanProps[property] === true) {
      addFlagModifier(modifiers, label);
    }
  }

  for (const token of [
    ...(item.namedEffects ?? []),
    ...item.properties.opaqueTokens,
  ]) {
    addFlagModifier(modifiers, token);
  }

  return Object.keys(modifiers).length > 0 ? modifiers : undefined;
};

const fillRingSlots = (
  ringSlots: RingSlotState[],
  details: EquipmentItemSnapshot[] | undefined
) => {
  const matchNumericSubtype = (
    subtypeEffect: string | null,
    kind: "protection" | "evasion"
  ) => {
    if (!subtypeEffect) {
      return null;
    }

    return subtypeEffect.match(
      new RegExp(`^${kind}(?:\\s+([+-]?\\d+))?$`)
    );
  };

  let nextIndex = 0;
  let mapped = 0;
  const unsupported: string[] = [];

  for (const detail of details ?? []) {
    let nextSlot: RingSlotState | null = null;

    const protectionMatch = matchNumericSubtype(
      detail.subtypeEffect,
      "protection"
    );
    const evasionMatch = matchNumericSubtype(detail.subtypeEffect, "evasion");

    if (protectionMatch) {
      nextSlot = {
        kind: "protection",
        plus: detail.enchant ?? Number(protectionMatch[1] ?? 0),
        modifiers: buildModifierBagFromItem(detail, {
          ignoreNumeric: ["AC"],
        }),
        displayName: detail.displayName,
        propertiesText: detail.propertiesText ?? undefined,
        artifactKind: detail.artifactKind,
        source: "imported",
      };
    } else if (evasionMatch) {
      nextSlot = {
        kind: "evasion",
        plus: detail.enchant ?? Number(evasionMatch[1] ?? 0),
        modifiers: buildModifierBagFromItem(detail, {
          ignoreNumeric: ["EV"],
        }),
        displayName: detail.displayName,
        propertiesText: detail.propertiesText ?? undefined,
        artifactKind: detail.artifactKind,
        source: "imported",
      };
    } else if (hasBooleanProperty(detail, "Wiz")) {
      nextSlot = {
        kind: "wizardry",
        plus: 0,
        modifiers: buildModifierBagFromItem(detail, {
          ignoreWiz: true,
        }),
        displayName: detail.displayName,
        propertiesText: detail.propertiesText ?? undefined,
        artifactKind: detail.artifactKind,
        source: "imported",
      };
    } else {
      const modifiers = buildModifierBagFromItem(detail);
      if (modifiers) {
        nextSlot = {
          kind: "none",
          plus: 0,
          modifiers,
          displayName: detail.displayName,
          propertiesText: detail.propertiesText ?? undefined,
          artifactKind: detail.artifactKind,
          source: "imported",
        };
      }
    }

    if (!nextSlot) {
      unsupported.push(detail.displayName);
      continue;
    }

    if (nextIndex >= ringSlots.length) {
      unsupported.push(detail.displayName);
      continue;
    }

    ringSlots[nextIndex] = nextSlot;
    nextIndex += 1;
    mapped += 1;
  }

  return { mapped, unsupported };
};

const fillAmuletSlots = (
  amuletSlots: AmuletSlotState[],
  details: EquipmentItemSnapshot[] | undefined
) => {
  let nextIndex = 0;
  let mapped = 0;
  const unsupported: string[] = [];

  for (const detail of details ?? []) {
    const isReflection = hasBooleanProperty(detail, "Reflect");
    const modifiers = buildModifierBagFromItem(detail, {
      ignoreFlags: isReflection ? ["Reflect"] : undefined,
    });
    const nextSlot: AmuletSlotState | null = isReflection
      ? {
          kind: "reflection",
          modifiers,
          displayName: detail.displayName,
          propertiesText: detail.propertiesText ?? undefined,
          artifactKind: detail.artifactKind,
          source: "imported",
        }
      : modifiers
        ? {
            kind: "none",
            modifiers,
            displayName: detail.displayName,
            propertiesText: detail.propertiesText ?? undefined,
            artifactKind: detail.artifactKind,
            source: "imported",
          }
        : null;

    if (!nextSlot) {
      unsupported.push(detail.displayName);
      continue;
    }

    if (nextIndex >= amuletSlots.length) {
      unsupported.push(detail.displayName);
      continue;
    }

    amuletSlots[nextIndex] = nextSlot;
    nextIndex += 1;
    mapped += 1;
  }

  return { mapped, unsupported };
};

const fillAuxArmourSlots = (
  slots: AuxArmourSlotState[],
  details: EquipmentItemSnapshot[] | undefined
) => {
  let nextIndex = 0;
  let mapped = 0;

  for (const detail of details ?? []) {
    if (nextIndex >= slots.length) {
      break;
    }

    slots[nextIndex] = {
      present: true,
      enchant: detail.enchant ?? 0,
      modifiers: buildModifierBagFromItem(detail),
      displayName: detail.displayName,
      propertiesText: detail.propertiesText ?? undefined,
      artifactKind: detail.artifactKind,
      source: "imported",
    };
    nextIndex += 1;
    mapped += 1;
  }

  return mapped;
};

const fillHeadgearSlots = (
  slots: AuxArmourSlotState[],
  details: EquipmentItemSnapshot[] | undefined
) => {
  let nextIndex = 0;
  let mapped = 0;

  for (const detail of details ?? []) {
    if (nextIndex >= slots.length) {
      break;
    }

    slots[nextIndex] = {
      present: true,
      enchant: detail.enchant ?? 0,
      kind: detail.baseType === "hat" ? "hat" : "helmet",
      modifiers: buildModifierBagFromItem(detail),
      displayName: detail.displayName,
      propertiesText: detail.propertiesText ?? undefined,
      artifactKind: detail.artifactKind,
      source: "imported",
    };
    nextIndex += 1;
    mapped += 1;
  }

  return mapped;
};

const isActiveMutation = (mutation: ParsedMorgueTextRecord["mutations"][number]) =>
  mutation.suppressed !== true && mutation.transient !== true;

const applyMutationModifiers = (
  record: ParsedMorgueTextRecord,
  state: CalculatorState<GameVersion>
) => {
  const applied: string[] = [];
  const unsupported: string[] = [];

  for (const mutation of record.mutations) {
    if (!isActiveMutation(mutation)) {
      continue;
    }

    if (mutation.name === "subdued magic") {
      state.subduedMagic = mutation.level ?? 0;
      applied.push("subdued magic");
      continue;
    }

    if (mutation.name === "anti-wizardry") {
      state.antiWizardry = mutation.level ?? 0;
      applied.push("anti-wizardry");
      continue;
    }

    if (mutation.name === "runic magic") {
      state.runicMagic = mutation.level ?? 0;
      applied.push("runic magic");
      continue;
    }

    if (mutation.name === "big brain" && mutation.level === 3) {
      state.bigBrainWizardry = 1;
      applied.push("big brain");
      continue;
    }

    if (mutation.name === "distortion field") {
      state.distortionField = mutation.level ?? 0;
      applied.push("distortion field");
      continue;
    }

    if (mutation.name === "large bone plates") {
      state.largeBonePlates = mutation.level ?? 0;
      applied.push("large bone plates");
      continue;
    }

    if (mutation.name === "tengu flight") {
      state.tenguFlight = mutation.level ?? 1;
      applied.push("tengu flight");
      continue;
    }

    if (mutation.name.endsWith(" scales")) {
      state.scalesAC = (state.scalesAC ?? 0) + (mutation.level ?? 0);
      applied.push(mutation.name);
      continue;
    }

    if (mutation.name !== "wild magic") {
      unsupported.push(mutation.name);
    }
  }

  return { applied, unsupported };
};

const deriveBodyArmourEgo = (
  detail: EquipmentItemSnapshot | null | undefined
): BodyArmourEgoKey => {
  if (!detail) {
    return "none";
  }

  if (detail.ego) {
    return detail.ego as BodyArmourEgoKey;
  }

  if (detail.properties.booleanProps.Command) {
    return "command";
  }
  if (detail.properties.booleanProps.Death) {
    return "death";
  }
  if (detail.properties.booleanProps.Resonance) {
    return "resonance";
  }

  return "none";
};

const deriveWildMagic = (record: ParsedMorgueTextRecord) => {
  const activeWildMagic = record.mutations.find(
    (mutation) =>
      mutation.name === "wild magic" &&
      mutation.suppressed !== true &&
      mutation.transient !== true &&
      typeof mutation.level === "number"
  );

  return activeWildMagic?.level ?? null;
};

const chooseTargetSpell = (
  version: GameVersion,
  record: ParsedMorgueTextRecord
) => {
  const supportedSpellNames = new Set<string>(
    getVersionConfig(version).spells.map((spell) => spell.name)
  );

  const preferredSpell =
    record.spells.find(
      (spell) =>
        spell.memorized === true &&
        spell.castable === true &&
        supportedSpellNames.has(spell.name)
    ) ??
    record.spells.find(
      (spell) =>
        spell.castable === true && supportedSpellNames.has(spell.name)
    );

  return preferredSpell?.name ?? null;
};

export const normalizeMorgueVersion = (
  rawVersion: string
): GameVersion | null => {
  if (rawVersion.startsWith("0.32")) return "0.32";
  if (rawVersion.startsWith("0.33")) return "0.33";
  if (rawVersion.startsWith("0.34")) return "0.34";
  if (/^0\.(35|36|37)/.test(rawVersion)) return "trunk";
  return null;
};

export const buildImportedCalculatorState = (
  record: ParsedMorgueTextRecord
): MorgueImportResult => {
  const detectedVersion = normalizeMorgueVersion(record.version);
  if (!detectedVersion) {
    return {
      ok: false,
      kind: "unsupported_version",
      message: "This morgue version is not supported by the calculator.",
      detail: record.version,
    };
  }

  const speciesNameMap = Object.fromEntries(
    Object.entries(speciesOptions(detectedVersion)).map(([key, value]) => [
      value.name,
      key,
    ])
  ) as Record<string, string>;
  const speciesKey = speciesNameMap[record.species];

  if (!speciesKey) {
    return {
      ok: false,
      kind: "unsupported_species",
      message:
        "This morgue species is not available in the selected calculator version.",
      detail: record.species,
    };
  }

  const importedState =
    buildDefaultCalculatorState(detectedVersion) as CalculatorState<GameVersion>;
  const summary: MorgueImportSummary = {
    applied: [],
    skipped: [],
  };

  importedState.version = detectedVersion;
  importedState.species =
    speciesKey as CalculatorState<GameVersion>["species"];
  const slotCounts = getDynamicSlotCounts(detectedVersion, importedState.species);
  importedState.ringSlots = coerceSlotArrayLength(
    importedState.ringSlots,
    slotCounts.ringSlots,
    createDefaultRingSlot
  );
  importedState.amuletSlots = coerceSlotArrayLength(
    importedState.amuletSlots,
    slotCounts.amuletSlots,
    createDefaultAmuletSlot
  );
  importedState.headgearSlots = coerceSlotArrayLength(
    importedState.headgearSlots,
    slotCounts.headgearSlots,
    createDefaultAuxArmourSlot
  );
  importedState.gloveSlots = coerceSlotArrayLength(
    importedState.gloveSlots,
    slotCounts.gloveSlots,
    createDefaultAuxArmourSlot
  );
  importedState.strength = record.strength;
  importedState.dexterity = record.dexterity;
  importedState.intelligence = record.intelligence;
  importedState.armourSkill = record.effectiveSkills.armour;
  importedState.shieldSkill = record.effectiveSkills.shields;
  importedState.dodgingSkill = record.effectiveSkills.dodging;
  importedState.spellcasting = record.effectiveSkills.spellcasting;

  summary.applied.push(
    { label: "Version", detail: `${record.version} -> ${detectedVersion}` },
    { label: "Species", detail: record.species },
    {
      label: "Stats",
      detail: `Str ${record.strength}, Dex ${record.dexterity}, Int ${record.intelligence}`,
    },
    {
      label: "Skills",
      detail: `Armour ${record.effectiveSkills.armour}, Shields ${record.effectiveSkills.shields}, Dodging ${record.effectiveSkills.dodging}, Spellcasting ${record.effectiveSkills.spellcasting}`,
    }
  );

  const importedBodyArmourEgo = deriveBodyArmourEgo(record.bodyArmourDetails);
  const armour = mapArmour(record.bodyArmourDetails?.baseType ?? record.bodyArmour);
  if (armour) {
    importedState.armour = armour;
    importedState.bodyArmour = {
      kind: armour,
      enchant: record.bodyArmourDetails?.enchant ?? 0,
      ego: importedBodyArmourEgo,
      modifiers: record.bodyArmourDetails
        ? buildModifierBagFromItem(record.bodyArmourDetails)
        : undefined,
      displayName: record.bodyArmourDetails?.displayName,
      propertiesText: record.bodyArmourDetails?.propertiesText ?? undefined,
      artifactKind: record.bodyArmourDetails?.artifactKind,
      source: record.bodyArmourDetails ? "imported" : undefined,
    };
    summary.applied.push({ label: "Body armour", detail: record.bodyArmour });
  }

  const shield = mapShield(record.shieldDetails?.baseType ?? record.shield);
  if (shield) {
    importedState.shield = shield;
    importedState.shieldItem = {
      kind: shield,
      enchant: record.shieldDetails?.enchant ?? 0,
      modifiers: record.shieldDetails
        ? buildModifierBagFromItem(record.shieldDetails)
        : undefined,
      displayName: record.shieldDetails?.displayName,
      propertiesText: record.shieldDetails?.propertiesText ?? undefined,
      artifactKind: record.shieldDetails?.artifactKind,
      source: record.shieldDetails ? "imported" : undefined,
    };
  }

  const orb = mapOrb(record.orbDetails?.baseType ?? record.orb);
  if (orb) {
    importedState.orb = orb;
    importedState.orbItem = {
      kind: orb,
      modifiers: record.orbDetails
        ? buildModifierBagFromItem(record.orbDetails, {
            ignoreFlags: orb === "energy" ? ["Energy"] : undefined,
          })
        : undefined,
      displayName: record.orbDetails?.displayName,
      propertiesText: record.orbDetails?.propertiesText ?? undefined,
      artifactKind: record.orbDetails?.artifactKind,
      source: record.orbDetails ? "imported" : undefined,
    };
  }

  if (importedState.shield !== "none") {
    importedState.orb = "none";
    importedState.orbItem = {
      ...importedState.orbItem,
      kind: "none",
    };
  }
  if (importedState.orb !== "none") {
    importedState.shield = "none";
    importedState.shieldItem = {
      ...importedState.shieldItem,
      kind: "none",
      enchant: 0,
      modifiers: undefined,
      displayName: undefined,
      artifactKind: undefined,
      source: undefined,
    };
  }

  summary.applied.push({
    label: "Shield / orb",
    detail: importedState.shield !== "none" ? record.shield : record.orb,
  });

  importedState.helmet = hasBaseType(record.helmetDetails, "helmet");
  importedState.gloves = record.gloves.length > 0;
  importedState.secondGloves =
    getVersionConfig(detectedVersion).features.secondGloves &&
    record.gloves.length > 1;
  importedState.boots = hasBaseType(record.footwearDetails, "boots");
  importedState.barding = hasBaseType(record.footwearDetails, "barding");
  importedState.cloak = hasBaseType(record.cloakDetails, "cloak");
  importedState.bodyArmourEnchant = record.bodyArmourDetails?.enchant ?? 0;
  importedState.shieldEnchant = record.shieldDetails?.enchant ?? 0;
  importedState.bootsEnchant =
    record.footwearDetails?.find((item) => item.baseType === "boots")?.enchant ?? 0;
  importedState.bardingEnchant =
    record.footwearDetails?.find((item) => item.baseType === "barding")?.enchant ?? 0;
  importedState.cloakEnchant = record.cloakDetails?.[0]?.enchant ?? 0;
  const bootsDetail = record.footwearDetails?.find((item) => item.baseType === "boots");
  const bardingDetail = record.footwearDetails?.find(
    (item) => item.baseType === "barding"
  );
  const cloakDetail = record.cloakDetails?.[0];
  importedState.bootsItem = {
    kind: "boots",
    present: importedState.boots,
    enchant: bootsDetail?.enchant ?? 0,
      modifiers: bootsDetail ? buildModifierBagFromItem(bootsDetail) : undefined,
      displayName: bootsDetail?.displayName,
      propertiesText: bootsDetail?.propertiesText ?? undefined,
      artifactKind: bootsDetail?.artifactKind,
      source: bootsDetail ? "imported" : undefined,
    };
  importedState.bardingItem = {
    kind: "barding",
    present: importedState.barding,
    enchant: bardingDetail?.enchant ?? 0,
      modifiers: bardingDetail ? buildModifierBagFromItem(bardingDetail) : undefined,
      displayName: bardingDetail?.displayName,
      propertiesText: bardingDetail?.propertiesText ?? undefined,
      artifactKind: bardingDetail?.artifactKind,
      source: bardingDetail ? "imported" : undefined,
    };
  importedState.cloakItem = {
    kind: "cloak",
    present: importedState.cloak,
    enchant: cloakDetail?.enchant ?? 0,
      modifiers: cloakDetail ? buildModifierBagFromItem(cloakDetail) : undefined,
      displayName: cloakDetail?.displayName,
      propertiesText: cloakDetail?.propertiesText ?? undefined,
      artifactKind: cloakDetail?.artifactKind,
      source: cloakDetail ? "imported" : undefined,
    };
  fillHeadgearSlots(
    importedState.headgearSlots,
    record.helmetDetails?.filter(
      (item) => item.baseType === "helmet" || item.baseType === "hat"
    )
  );
  fillAuxArmourSlots(importedState.gloveSlots, record.glovesDetails);

  summary.applied.push({ label: "Auxiliary armour" });

  if (record.cloaks.some((name) => name.includes("scarf"))) {
    summary.skipped.push({
      label: "Cloaks",
      detail: "Scarf is not modeled separately from cloak.",
    });
  }

  for (const [parserKey, stateKey] of Object.entries(schoolSkillKeyMap)) {
    if (!importedState.schoolSkills || !(stateKey in importedState.schoolSkills)) {
      continue;
    }

    importedState.schoolSkills[
      stateKey as keyof typeof importedState.schoolSkills
    ] = record.effectiveSkills[parserKey as keyof typeof record.effectiveSkills];
  }

  const targetSpell = chooseTargetSpell(detectedVersion, record);
  if (targetSpell) {
    importedState.targetSpell =
      targetSpell as CalculatorState<GameVersion>["targetSpell"];
    summary.applied.push({ label: "Target spell", detail: targetSpell });
  }

  const ringMapping = fillRingSlots(importedState.ringSlots, record.ringDetails);
  if (ringMapping.mapped > 0) {
    summary.applied.push({
      label: "Rings",
      detail: `${ringMapping.mapped} supported ring effect${ringMapping.mapped === 1 ? "" : "s"} mapped`,
    });
  }
  if (ringMapping.unsupported.length > 0) {
    summary.skipped.push({
      label: "Rings",
      detail: `Unsupported ring effects skipped: ${ringMapping.unsupported.join(", ")}`,
    });
  }

  const amuletMapping = fillAmuletSlots(importedState.amuletSlots, record.amuletDetails);
  if (amuletMapping.mapped > 0) {
    summary.applied.push({
      label: "Amulets",
      detail: `${amuletMapping.mapped} supported amulet effect${amuletMapping.mapped === 1 ? "" : "s"} mapped`,
    });
  }
  if (amuletMapping.unsupported.length > 0) {
    summary.skipped.push({
      label: "Amulets",
      detail: `Unsupported amulet effects skipped: ${amuletMapping.unsupported.join(", ")}`,
    });
  }

  const wildMagic = deriveWildMagic(record);
  if (wildMagic !== null) {
    importedState.wildMagic = wildMagic;
    summary.applied.push({ label: "Wild magic", detail: `${wildMagic}` });
  } else if (record.mutations.some((mutation) => mutation.name === "wild magic")) {
    summary.skipped.push({
      label: "Wild magic",
      detail:
        "Wild magic was present but could not be read as an active numeric level.",
    });
  }

  if (importedBodyArmourEgo !== "none") {
    importedState.bodyArmourEgo =
      getSpellBoostBodyArmourEgo(importedBodyArmourEgo);
    importedState.bodyArmour.ego = importedBodyArmourEgo;
    summary.applied.push({
      label: "Body armour ego",
      detail: importedBodyArmourEgo,
    });
  }
  if (record.gizmo) {
    summary.skipped.push({
      label: "Gizmo",
      detail: "Gizmos are not modeled by this calculator.",
    });
  }
  if (record.talisman !== "none") {
    summary.skipped.push({
      label: "Talisman",
      detail: "Talismans are not modeled by this calculator.",
    });
  }
  if (record.form) {
    summary.skipped.push({
      label: "Form",
      detail: "Form state is not modeled by this calculator.",
    });
  }
  const mutationMapping = applyMutationModifiers(record, importedState);
  if (mutationMapping.applied.length > 0) {
    summary.applied.push({
      label: "Mutations",
      detail: mutationMapping.applied.join(", "),
    });
  }
  if (mutationMapping.unsupported.length > 0) {
    summary.skipped.push({
      label: "Mutations",
      detail: `Unsupported mutations skipped: ${mutationMapping.unsupported.join(", ")}`,
    });
  }

  return {
    ok: true,
    sourceVersion: record.version,
    detectedVersion,
    importedState,
    summary,
  };
};

export const parseImportedMorgue = (text: string): MorgueImportResult => {
  if (text.trim() === "") {
    return {
      ok: false,
      kind: "empty_input",
      message: "Paste a morgue dump before applying the import.",
    };
  }

  const parsed = parseMorgueText(text);
  if (!parsed.ok) {
    return {
      ok: false,
      kind: "parse_failed",
      message: "This morgue could not be parsed. It may use an unsupported layout.",
      detail: parsed.failure.detail
        ? `${parsed.failure.reason}: ${parsed.failure.detail}`
        : parsed.failure.reason,
    };
  }

  return buildImportedCalculatorState(parsed.record);
};
