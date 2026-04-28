import { useState, useEffect } from "react";
import {
  ArmourKey,
  armourOptions,
  BodyArmourEgoKey,
  EquipmentEgoKey,
  OrbKey,
  ShieldKey,
  orbOptions,
  shieldOptions,
} from "@/types/equipment.ts";
import {
  createDefaultAmuletSlot,
  createDefaultAuxArmourSlot,
  createDefaultRingSlot,
  type AmuletSlotState,
  type AuxArmourSlotState,
  type RingSlotState,
} from "@/types/equipmentSlots";
import type { SpeciesKey } from "@/types/species.ts";
import { isGameVersion, startupRestoreOrder } from "@/types/game";
import type { GameVersion } from "@/types/game";
import type { VersionedSchoolSkillLevels, VersionedSpellName } from "@/types/spells";
import {
  coerceSlotArrayLength,
  getDynamicSlotCounts,
  coerceEquipmentSlotCollections,
} from "@/versioning/dynamicSlotCounts";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { getVersionConfig } from "@/versioning/versionRegistry";
import type {
  BodyArmourItemState,
  EquipmentModifierBag,
  FixedAuxItemState,
  OrbItemState,
  ShieldItemState,
  UnattributedGearState,
} from "@/types/equipmentItems";

const STORAGE_KEY = "calculator";

const getStorageKey = (version: GameVersion) => {
  return `${STORAGE_KEY}_${version}`;
};

export interface CalculatorState<V extends GameVersion> {
  version: V;
  accordionValue: string[];
  accordionOrder: string[];
  //
  dexterity: number;
  strength: number;
  intelligence: number;
  species: SpeciesKey<V>;
  bodyArmour: BodyArmourItemState;
  shieldItem: ShieldItemState;
  orbItem: OrbItemState;
  cloakItem: FixedAuxItemState;
  bootsItem: FixedAuxItemState;
  bardingItem: FixedAuxItemState;
  unattributedGear?: UnattributedGearState;
  shield: ShieldKey;
  orb: OrbKey;
  armour: ArmourKey;
  bodyArmourEgo?: BodyArmourEgoKey;
  wizardry?: number;
  shieldSkill: number;
  armourSkill: number;
  dodgingSkill: number;
  helmet?: boolean;
  gloves?: boolean;
  boots?: boolean;
  cloak?: boolean;
  barding?: boolean;
  secondGloves?: boolean;
  ringSlots: RingSlotState[];
  amuletSlots: AmuletSlotState[];
  headgearSlots: AuxArmourSlotState[];
  gloveSlots: AuxArmourSlotState[];
  bodyArmourEnchant?: number;
  shieldEnchant?: number;
  bootsEnchant?: number;
  cloakEnchant?: number;
  bardingEnchant?: number;
  subduedMagic?: number;
  antiWizardry?: number;
  runicMagic?: number;
  bigBrainWizardry?: number;
  scalesAC?: number;
  distortionField?: number;
  tenguFlight?: number;
  largeBonePlates?: number;
  ephemeralShield?: number;
  icemail?: number;
  condensationShield?: number;
  deformedBody?: boolean;
  reckless?: boolean;
  sturdyFrame?: number;
  gelatinousBody?: number;
  slowReflexes?: number;
  activeStatusIds?: string[];
  // spell mode
  schoolSkills?: VersionedSchoolSkillLevels<V>;
  targetSpell?: VersionedSpellName<V>;
  spellcasting?: number;
  wildMagic?: number;
  god?: string | null;
  godPietyDisplay?: string | null;
  godPietyRank?: number | null;
  godUnderPenance?: boolean;
}

export const isSchoolSkillKey = <V extends GameVersion>(
  version: V,
  key: string
): key is keyof CalculatorState<V>["schoolSkills"] => {
  const defaultState = getDefaultState(version);
  return Object.keys(defaultState.schoolSkills!).includes(key);
};

const isObject = (obj: unknown): obj is Record<string, unknown> => {
  return typeof obj === "object" && obj !== null;
};

const isArtifactKind = (
  value: unknown
): value is "normal" | "randart" | "unrand" =>
  value === "normal" || value === "randart" || value === "unrand";

const isSlotSource = (value: unknown): value is "manual" | "imported" =>
  value === "manual" || value === "imported";

const isRingSlot = (value: unknown): value is RingSlotState => {
  if (!isObject(value)) return false;

  return (
    (value.kind === "none" ||
      value.kind === "wizardry" ||
      value.kind === "protection" ||
      value.kind === "evasion") &&
    typeof value.plus === "number" &&
    (value.displayName === undefined || typeof value.displayName === "string") &&
    (value.artifactKind === undefined || isArtifactKind(value.artifactKind)) &&
    (value.source === undefined || isSlotSource(value.source))
  );
};

const isDefaultRingSlot = (value: unknown): boolean => {
  if (!isObject(value)) return false;

  return (
    value.kind === "none" &&
    value.plus === 0 &&
    value.displayName === undefined &&
    value.artifactKind === undefined &&
    value.source === undefined
  );
};

const isManualWizardryRingSlot = (value: unknown): value is RingSlotState => {
  return (
    isRingSlot(value) &&
    value.kind === "wizardry" &&
    value.displayName === undefined &&
    value.artifactKind === undefined &&
    value.source === undefined
  );
};

const isAmuletSlot = (value: unknown): value is AmuletSlotState => {
  if (!isObject(value)) return false;

  return (
    (value.kind === "none" || value.kind === "reflection") &&
    (value.displayName === undefined || typeof value.displayName === "string") &&
    (value.artifactKind === undefined || isArtifactKind(value.artifactKind)) &&
    (value.source === undefined || isSlotSource(value.source))
  );
};

const isDefaultAmuletSlot = (value: unknown): boolean => {
  if (!isObject(value)) return false;

  return (
    value.kind === "none" &&
    value.displayName === undefined &&
    value.artifactKind === undefined &&
    value.source === undefined
  );
};

const isAuxArmourSlot = (value: unknown): value is AuxArmourSlotState => {
  if (!isObject(value)) return false;

  return (
    typeof value.present === "boolean" &&
    typeof value.enchant === "number" &&
    (value.kind === undefined ||
      value.kind === "helmet" ||
      value.kind === "hat") &&
    (value.ego === undefined || typeof value.ego === "string") &&
    (value.displayName === undefined || typeof value.displayName === "string") &&
    (value.artifactKind === undefined || isArtifactKind(value.artifactKind)) &&
    (value.source === undefined || isSlotSource(value.source))
  );
};

const isDefaultAuxArmourSlot = (value: unknown): boolean => {
  if (!isObject(value)) return false;

  return (
    value.present === false &&
    value.enchant === 0 &&
    value.kind === undefined &&
    (value.ego === undefined || value.ego === "none") &&
    value.displayName === undefined &&
    value.artifactKind === undefined &&
    value.source === undefined
  );
};

const createLegacyHeadgearSlots = (present: boolean, slotCount: number) => {
  const slots = Array.from({ length: slotCount }, () =>
    createDefaultAuxArmourSlot()
  );

  if (slotCount > 0) {
    slots[0] = present
      ? { present: true, enchant: 0, kind: "helmet", ego: "none" }
      : createDefaultAuxArmourSlot();
  }

  return slots;
};

const coerceLegacyHeadgearSlots = (
  slots: unknown,
  slotCount: number
) => {
  const coerced = coerceSlotArrayLength(
    Array.isArray(slots) ? (slots as AuxArmourSlotState[]) : [],
    slotCount,
    createDefaultAuxArmourSlot
  );

  return coerced.map((slot) =>
    slot.present
      ? {
          ...slot,
          kind: slot.kind ?? "helmet",
          ego: coerceEquipmentEgo(slot.ego),
        }
      : {
          ...slot,
          kind: undefined,
          ego: "none",
        }
  );
};

const isValidSlotArray = <T>(
  value: unknown,
  validator: (slot: unknown) => slot is T
) => Array.isArray(value) && value.every(validator);

const createLegacyRingSlots = (
  legacyWizardry: unknown,
  slotCount: number
) => {
  const wizardryCount =
    typeof legacyWizardry === "number" ? Math.max(0, Math.trunc(legacyWizardry)) : 0;
  const filledCount = Math.min(wizardryCount, slotCount);
  const slots: RingSlotState[] = Array.from({ length: filledCount }, () => ({
    kind: "wizardry",
    plus: 0,
  }));

  return coerceSlotArrayLength(
    slots,
    slotCount,
    createDefaultRingSlot
  );
};

const createLegacyAuxArmourSlots = (
  present: boolean,
  slotCount: number,
  secondSlotPresent = false
) => {
  const slots = Array.from({ length: slotCount }, () =>
    createDefaultAuxArmourSlot()
  );

  if (slotCount > 0) {
    slots[0] = present
      ? { present: true, enchant: 0, ego: "none" }
      : createDefaultAuxArmourSlot();
  }

  if (slotCount > 1) {
    slots[1] = secondSlotPresent
      ? { present: true, enchant: 0, ego: "none" }
      : createDefaultAuxArmourSlot();
  }

  return slots;
};

const coerceLegacySlots = <T>(
  slots: unknown,
  slotCount: number,
  makeDefault: () => T
) => {
  return coerceSlotArrayLength(Array.isArray(slots) ? (slots as T[]) : [], slotCount, makeDefault);
};

const isOptionalNumber = (value: unknown) =>
  value === undefined || typeof value === "number";

const isOptionalNullableString = (value: unknown) =>
  value === undefined || value === null || typeof value === "string";

const isOptionalNullableNumber = (value: unknown) =>
  value === undefined || value === null || typeof value === "number";

const isOptionalBoolean = (value: unknown) =>
  value === undefined || typeof value === "boolean";

const isOptionalStringArray = (value: unknown) =>
  value === undefined ||
  (Array.isArray(value) && value.every((item) => typeof item === "string"));

const isModifierBag = (value: unknown): value is EquipmentModifierBag => {
  if (!isObject(value)) return false;

  return (
    isOptionalNumber(value.rF) &&
    isOptionalNumber(value.rC) &&
    isOptionalNumber(value.rN) &&
    isOptionalNumber(value.rPois) &&
    isOptionalNumber(value.rElec) &&
    isOptionalNumber(value.rCorr) &&
    isOptionalNumber(value.sInv) &&
    isOptionalNumber(value.will) &&
    isOptionalNumber(value.str) &&
    isOptionalNumber(value.dex) &&
    isOptionalNumber(value.int) &&
    isOptionalNumber(value.slay) &&
    isOptionalNumber(value.ac) &&
    isOptionalNumber(value.ev) &&
    isOptionalNumber(value.sh) &&
    isOptionalNumber(value.hp) &&
    isOptionalNumber(value.mp) &&
    isOptionalNumber(value.regen) &&
    isOptionalNumber(value.regenMP) &&
    isOptionalNumber(value.stlth) &&
    isOptionalNumber(value.wizardry) &&
    isOptionalStringArray(value.flags)
  );
};

const isEquipmentItemSource = (
  value: unknown
): value is "manual" | "imported" | "legacy" =>
  value === "manual" || value === "imported" || value === "legacy";

const coerceEquipmentEgo = (value: unknown): EquipmentEgoKey =>
  typeof value === "string" ? (value as EquipmentEgoKey) : "none";

const isEquipmentMeta = (
  value: Record<string, unknown>
) =>
  (value.displayName === undefined || typeof value.displayName === "string") &&
  (value.propertiesText === undefined || typeof value.propertiesText === "string") &&
  (value.artifactKind === undefined || isArtifactKind(value.artifactKind)) &&
  (value.source === undefined || isEquipmentItemSource(value.source)) &&
  (value.modifiers === undefined || isModifierBag(value.modifiers));

const isBodyArmourItem = (value: unknown): value is BodyArmourItemState => {
  if (!isObject(value)) return false;

  return (
    typeof value.kind === "string" &&
    value.kind in armourOptions &&
    typeof value.enchant === "number" &&
    typeof value.ego === "string" &&
    isEquipmentMeta(value)
  );
};

const isShieldItem = (value: unknown): value is ShieldItemState => {
  if (!isObject(value)) return false;

  return (
    typeof value.kind === "string" &&
    value.kind in shieldOptions &&
    typeof value.enchant === "number" &&
    (value.ego === undefined || typeof value.ego === "string") &&
    isEquipmentMeta(value)
  );
};

const isOrbItem = (value: unknown): value is OrbItemState => {
  if (!isObject(value)) return false;

  return (
    typeof value.kind === "string" &&
    value.kind in orbOptions &&
    (value.ego === undefined || typeof value.ego === "string") &&
    isEquipmentMeta(value)
  );
};

const isFixedAuxItem = (value: unknown): value is FixedAuxItemState => {
  if (!isObject(value)) return false;

  return (
    (value.kind === "cloak" ||
      value.kind === "scarf" ||
      value.kind === "boots" ||
      value.kind === "barding") &&
    typeof value.present === "boolean" &&
    typeof value.enchant === "number" &&
    (value.ego === undefined || typeof value.ego === "string") &&
    isEquipmentMeta(value)
  );
};

const isUnattributedGear = (value: unknown): value is UnattributedGearState => {
  if (!isObject(value)) return false;

  return (
    value.label === "legacy gear" &&
    value.source === "legacy" &&
    isModifierBag(value.modifiers)
  );
};

const normalizeShieldItem = (
  value: unknown,
  fallback: ShieldItemState
): ShieldItemState => {
  const item = isShieldItem(value) ? value : fallback;
  return {
    ...item,
    ego: coerceEquipmentEgo(item.ego),
  };
};

const normalizeOrbItem = (
  value: unknown,
  fallback: OrbItemState
): OrbItemState => {
  const item = isOrbItem(value) ? value : fallback;
  return {
    ...item,
    ego: coerceEquipmentEgo(item.ego),
  };
};

const normalizeFixedAuxItem = (
  value: unknown,
  fallback: FixedAuxItemState
): FixedAuxItemState => {
  const item = isFixedAuxItem(value) ? value : fallback;
  return {
    ...item,
    ego: coerceEquipmentEgo(item.ego),
  };
};

const normalizeAuxArmourSlot = (
  value: AuxArmourSlotState
): AuxArmourSlotState => ({
  ...value,
  ego: coerceEquipmentEgo(value.ego),
});

const buildLegacyModifierBag = (parsed: Record<string, unknown>) => {
  const modifiers: EquipmentModifierBag = {};

  if (typeof parsed.equipmentStr === "number") modifiers.str = parsed.equipmentStr;
  if (typeof parsed.equipmentDex === "number") modifiers.dex = parsed.equipmentDex;
  if (typeof parsed.equipmentInt === "number") modifiers.int = parsed.equipmentInt;
  if (typeof parsed.equipmentAC === "number") modifiers.ac = parsed.equipmentAC;
  if (typeof parsed.equipmentEV === "number") modifiers.ev = parsed.equipmentEV;
  if (typeof parsed.equipmentSH === "number") modifiers.sh = parsed.equipmentSH;

  return Object.keys(modifiers).length > 0 ? modifiers : undefined;
};

const buildLegacyUnattributedGear = (
  parsed: Record<string, unknown>
): UnattributedGearState | undefined => {
  const modifiers = buildLegacyModifierBag(parsed);

  if (!modifiers) {
    return undefined;
  }

  return {
    label: "legacy gear",
    modifiers,
    source: "legacy",
  };
};

const validateState = (state: unknown): state is CalculatorState<GameVersion> => {
  if (!isObject(state)) return false;

  if (
    !("version" in state) ||
    typeof state.version !== "string" ||
    !isGameVersion(state.version)
  )
    return false;

  const version = state.version;
  const defaultState = getDefaultState(version);
  const config = getVersionConfig(version);

  for (const key of Object.keys(defaultState)) {
    if (!(key in state)) {
      return false;
    }
  }

  if (typeof state.species !== "string" || !(state.species in config.species)) {
    return false;
  }

  if (
    state.targetSpell !== undefined &&
    (typeof state.targetSpell !== "string" ||
      !config.spells.some((spell) => spell.name === state.targetSpell))
  ) {
    return false;
  }

  if (
    state.bodyArmourEgo !== undefined &&
    typeof state.bodyArmourEgo !== "string"
  ) {
    return false;
  }

  if (typeof state.orb !== "string" || !(state.orb in orbOptions)) {
    return false;
  }

  if (!isBodyArmourItem(state.bodyArmour)) {
    return false;
  }

  if (!isShieldItem(state.shieldItem)) {
    return false;
  }

  if (!isOrbItem(state.orbItem)) {
    return false;
  }

  if (!isFixedAuxItem(state.cloakItem)) {
    return false;
  }

  if (!isFixedAuxItem(state.bootsItem)) {
    return false;
  }

  if (!isFixedAuxItem(state.bardingItem)) {
    return false;
  }

  if (
    state.unattributedGear !== undefined &&
    !isUnattributedGear(state.unattributedGear)
  ) {
    return false;
  }

  if (state.helmet !== undefined && typeof state.helmet !== "boolean") {
    return false;
  }

  if (state.gloves !== undefined && typeof state.gloves !== "boolean") {
    return false;
  }

  if (
    state.secondGloves !== undefined &&
    typeof state.secondGloves !== "boolean"
  ) {
    return false;
  }

  if (
    !isOptionalNumber(state.bodyArmourEnchant) ||
    !isOptionalNumber(state.shieldEnchant) ||
    !isOptionalNumber(state.bootsEnchant) ||
    !isOptionalNumber(state.cloakEnchant) ||
    !isOptionalNumber(state.bardingEnchant) ||
    !isOptionalNumber(state.equipmentStr) ||
    !isOptionalNumber(state.equipmentDex) ||
    !isOptionalNumber(state.equipmentInt) ||
    !isOptionalNumber(state.equipmentAC) ||
    !isOptionalNumber(state.equipmentEV) ||
    !isOptionalNumber(state.equipmentSH) ||
    !isOptionalNumber(state.wizardry) ||
    !isOptionalNumber(state.subduedMagic) ||
    !isOptionalNumber(state.antiWizardry) ||
    !isOptionalNumber(state.runicMagic) ||
    !isOptionalNumber(state.bigBrainWizardry) ||
    !isOptionalNumber(state.scalesAC) ||
    !isOptionalNumber(state.distortionField) ||
    !isOptionalNumber(state.tenguFlight) ||
    !isOptionalNumber(state.largeBonePlates) ||
    !isOptionalNumber(state.ephemeralShield) ||
    !isOptionalNumber(state.icemail) ||
    !isOptionalNumber(state.condensationShield) ||
    !isOptionalBoolean(state.deformedBody) ||
    !isOptionalBoolean(state.reckless) ||
    !isOptionalNumber(state.sturdyFrame) ||
    !isOptionalNumber(state.gelatinousBody) ||
    !isOptionalNumber(state.slowReflexes) ||
    !isOptionalStringArray(state.activeStatusIds) ||
    !isOptionalNumber(state.spellcasting) ||
    !isOptionalNumber(state.wildMagic) ||
    !isOptionalNullableString(state.god) ||
    !isOptionalNullableString(state.godPietyDisplay) ||
    !isOptionalNullableNumber(state.godPietyRank) ||
    (state.godUnderPenance !== undefined &&
      typeof state.godUnderPenance !== "boolean")
  ) {
    return false;
  }

  if (!isObject(state.schoolSkills)) {
    return false;
  }

  const slotCounts = getDynamicSlotCounts(
    version,
    state.species as SpeciesKey<typeof version>
  );

  if (
    !isValidSlotArray(state.ringSlots, isRingSlot) ||
    state.ringSlots.length !== slotCounts.ringSlots
  ) {
    return false;
  }

  if (
    !isValidSlotArray(state.amuletSlots, isAmuletSlot) ||
    state.amuletSlots.length !== slotCounts.amuletSlots
  ) {
    return false;
  }

  if (
    !isValidSlotArray(state.headgearSlots, isAuxArmourSlot) ||
    state.headgearSlots.length !== slotCounts.headgearSlots
  ) {
    return false;
  }

  if (
    !isValidSlotArray(state.gloveSlots, isAuxArmourSlot) ||
    state.gloveSlots.length !== slotCounts.gloveSlots
  ) {
    return false;
  }

  const validSchoolSkills = new Set(
    Object.keys(defaultState.schoolSkills ?? {})
  );
  for (const [key, value] of Object.entries(state.schoolSkills)) {
    if (!validSchoolSkills.has(key) || typeof value !== "number") {
      return false;
    }
  }

  return true;
};

export const parseSavedState = (
  saved: string
): CalculatorState<GameVersion> | null => {
  try {
    const parsed = JSON.parse(saved);

    if (!isObject(parsed)) {
      return null;
    }

    if (
      !("version" in parsed) ||
      typeof parsed.version !== "string" ||
      !isGameVersion(parsed.version)
    ) {
      return null;
    }

    const version = parsed.version;
    const config = getVersionConfig(version);
    const defaultState = buildDefaultCalculatorState(version);
    const parsedBodyArmour = isBodyArmourItem(parsed.bodyArmour)
      ? parsed.bodyArmour
      : defaultState.bodyArmour;
    const legacyBodyArmourEgo =
      typeof parsed.bodyArmourEgo === "string"
        ? (parsed.bodyArmourEgo as BodyArmourEgoKey)
        : undefined;
    const bodyArmour =
      legacyBodyArmourEgo &&
      legacyBodyArmourEgo !== "none" &&
      parsedBodyArmour.ego === "none"
        ? {
            ...parsedBodyArmour,
            ego: legacyBodyArmourEgo,
          }
        : parsedBodyArmour;

    if (
      typeof parsed.species !== "string" ||
      !(parsed.species in config.species)
    ) {
      return null;
    }

    const species = parsed.species as SpeciesKey<typeof version>;
    const slotCounts = getDynamicSlotCounts(version, species);
    const useModernRingSlots =
      Array.isArray(parsed.ringSlots) &&
      parsed.ringSlots.some((slot) => !isDefaultRingSlot(slot));
    const useModernHeadgearSlots =
      Array.isArray(parsed.headgearSlots) &&
      parsed.headgearSlots.some((slot) => !isDefaultAuxArmourSlot(slot));
    const useModernGloveSlots =
      Array.isArray(parsed.gloveSlots) &&
      parsed.gloveSlots.some((slot) => !isDefaultAuxArmourSlot(slot));
    const useModernAmuletSlots =
      Array.isArray(parsed.amuletSlots) &&
      parsed.amuletSlots.some((slot) => !isDefaultAmuletSlot(slot));

    const ringSlots = useModernRingSlots
      ? coerceLegacySlots(
          parsed.ringSlots,
          slotCounts.ringSlots,
          createDefaultRingSlot
        )
      : createLegacyRingSlots(parsed.wizardry, slotCounts.ringSlots);
    const manualWizardryRingCount = ringSlots.filter(
      isManualWizardryRingSlot
    ).length;
    const shouldClearMirroredWizardry =
      useModernRingSlots &&
      manualWizardryRingCount > 0 &&
      typeof parsed.wizardry === "number" &&
      parsed.wizardry === manualWizardryRingCount;
    const wizardry = shouldClearMirroredWizardry
      ? 0
      : useModernRingSlots
        ? parsed.wizardry ?? 0
        : 0;

    const gloveSlots = (useModernGloveSlots
      ? coerceLegacySlots(
          parsed.gloveSlots,
          slotCounts.gloveSlots,
          createDefaultAuxArmourSlot
        )
      : createLegacyAuxArmourSlots(
          parsed.gloves === true,
          slotCounts.gloveSlots,
          parsed.secondGloves === true
        )
    ).map(normalizeAuxArmourSlot);

    const headgearSlots = (useModernHeadgearSlots
      ? coerceLegacyHeadgearSlots(
          parsed.headgearSlots,
          slotCounts.headgearSlots
        )
      : createLegacyHeadgearSlots(
          parsed.helmet === true,
          slotCounts.headgearSlots
        )
    ).map(normalizeAuxArmourSlot);

    const shieldItem = normalizeShieldItem(
      parsed.shieldItem,
      defaultState.shieldItem
    );
    const orbItem = normalizeOrbItem(parsed.orbItem, defaultState.orbItem);
    const cloakItem = normalizeFixedAuxItem(
      parsed.cloakItem,
      defaultState.cloakItem
    );
    const bootsItem = normalizeFixedAuxItem(
      parsed.bootsItem,
      defaultState.bootsItem
    );
    const bardingItem = normalizeFixedAuxItem(
      parsed.bardingItem,
      defaultState.bardingItem
    );

    const normalized = {
      ...defaultState,
      ...parsed,
      orb: parsed.orb ?? (parsed.channel === true ? "energy" : "none"),
      wizardry,
      species,
      bodyArmour,
      shieldItem,
      orbItem,
      cloakItem,
      bootsItem,
      bardingItem,
      ...coerceEquipmentSlotCollections(version, species, {
        ringSlots,
        amuletSlots: useModernAmuletSlots
          ? coerceLegacySlots(
              parsed.amuletSlots,
              slotCounts.amuletSlots,
              createDefaultAmuletSlot
            )
          : defaultState.amuletSlots,
        headgearSlots,
        gloveSlots,
      }),
      unattributedGear: isUnattributedGear(parsed.unattributedGear)
        ? parsed.unattributedGear
        : buildLegacyUnattributedGear(parsed),
    };

    return validateState(normalized) ? normalized : null;
  } catch {
    return null;
  }
};

export const getStartupSavedState = () => {
  for (const version of startupRestoreOrder) {
    const saved = localStorage.getItem(getStorageKey(version));
    if (!saved) {
      continue;
    }

    const parsed = parseSavedState(saved);
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

const getDefaultState = <V extends GameVersion>(version: V) => {
  return buildDefaultCalculatorState(version);
};

export const useCalculatorState = <V extends GameVersion>() => {
  const [state, setState] = useState<CalculatorState<V>>(() => {
    let initialVersion: GameVersion = "trunk";

    const saved = getStartupSavedState();

    if (saved) {
      initialVersion = saved.version;
      return saved as unknown as CalculatorState<V>;
    }

    return getDefaultState(initialVersion) as unknown as CalculatorState<V>;
  });
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    localStorage.setItem(getStorageKey(state.version), JSON.stringify(state));
  }, [state]);

  const resetState = () => {
    setState(getDefaultState(state.version) as unknown as CalculatorState<V>);
    localStorage.removeItem(getStorageKey(state.version));
  };

  const changeVersion = (version: GameVersion) => {
    setFlash(false);
    setTimeout(() => setFlash(true), 0);
    const saved = localStorage.getItem(getStorageKey(version));

    if (!saved) {
      setState(getDefaultState(version) as unknown as CalculatorState<V>);
      return;
    }

    const parsed = parseSavedState(saved);
    if (parsed && parsed.version === version) {
      setState(parsed as unknown as CalculatorState<V>);
    } else {
      setState(getDefaultState(version) as unknown as CalculatorState<V>);
    }
  };

  return {
    state,
    setState,
    resetState,
    changeVersion,
    flash,
  };
};
