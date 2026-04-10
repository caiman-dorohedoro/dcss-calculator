import {
  parseMorgueText,
  type EquipmentItemSnapshot,
  type ParsedMorgueTextRecord,
} from "dcss-morgue-parser";
import type { CalculatorState } from "@/hooks/useCalculatorState.ts";
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
import { getBodyArmourEgoOptions } from "@/versioning/equipmentData";
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

const collectEquippedItems = (record: ParsedMorgueTextRecord) => {
  return [
    record.bodyArmourDetails,
    record.shieldDetails,
    ...(record.helmetDetails ?? []),
    ...(record.glovesDetails ?? []),
    ...(record.footwearDetails ?? []),
    ...(record.cloakDetails ?? []),
    record.orbDetails,
    ...(record.amuletDetails ?? []),
    ...(record.ringDetails ?? []),
    record.gizmoDetails,
    record.talismanDetails,
  ].filter((item): item is EquipmentItemSnapshot => item !== undefined);
};

const hasBaseType = (
  items: EquipmentItemSnapshot[] | undefined,
  targetBaseType: string
) => {
  return (items ?? []).some((item) => item.baseType === targetBaseType);
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

const countBooleanProperty = (
  record: ParsedMorgueTextRecord,
  property: "Wiz"
) => {
  return collectEquippedItems(record).filter(
    (item) => item.properties.booleanProps[property] === true
  ).length;
};

const deriveBodyArmourEgo = (
  record: ParsedMorgueTextRecord,
  version: GameVersion
): BodyArmourEgoKey | null => {
  const detail = record.bodyArmourDetails;
  if (!detail) {
    return null;
  }

  const supportedEgos = new Set(Object.keys(getBodyArmourEgoOptions(version)));
  if (detail.properties.booleanProps.Command && supportedEgos.has("command")) {
    return "command";
  }
  if (detail.properties.booleanProps.Death && supportedEgos.has("death")) {
    return "death";
  }
  if (
    detail.properties.booleanProps.Resonance &&
    supportedEgos.has("resonance")
  ) {
    return "resonance";
  }

  return null;
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

  const armour = mapArmour(record.bodyArmourDetails?.baseType ?? record.bodyArmour);
  if (armour) {
    importedState.armour = armour;
    summary.applied.push({ label: "Body armour", detail: record.bodyArmour });
  }

  const shield = mapShield(record.shieldDetails?.baseType ?? record.shield);
  if (shield) {
    importedState.shield = shield;
  }

  const orb = mapOrb(record.orbDetails?.baseType ?? record.orb);
  if (orb) {
    importedState.orb = orb;
  }

  if (importedState.shield !== "none") {
    importedState.orb = "none";
  }
  if (importedState.orb !== "none") {
    importedState.shield = "none";
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

  summary.applied.push({ label: "Auxiliary armour" });

  if (record.helmets.some((name) => name.includes("hat"))) {
    summary.skipped.push({
      label: "Headgear",
      detail: "Hat is not modeled separately from helmet.",
    });
  }
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

  const wizardry = countBooleanProperty(record, "Wiz");
  importedState.wizardry = wizardry;
  if (wizardry > 0) {
    summary.applied.push({ label: "Wizardry", detail: `${wizardry}` });
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

  const bodyArmourEgo = deriveBodyArmourEgo(record, detectedVersion);
  if (bodyArmourEgo) {
    importedState.bodyArmourEgo = bodyArmourEgo;
    summary.applied.push({
      label: "Body armour ego",
      detail: bodyArmourEgo,
    });
  }

  if (record.rings.length > 0) {
    summary.skipped.push({
      label: "Rings",
      detail: "Jewellery is not modeled directly by this calculator.",
    });
  }
  if (record.amulets.length > 0) {
    summary.skipped.push({
      label: "Amulets",
      detail: "Amulets are not modeled directly by this calculator.",
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
  if (record.mutations.some((mutation) => mutation.name !== "wild magic")) {
    summary.skipped.push({
      label: "Mutations",
      detail: "Only wild magic is mapped into calculator state today.",
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
