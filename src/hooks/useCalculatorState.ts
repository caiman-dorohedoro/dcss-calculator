import { useState, useEffect } from "react";
import {
  ArmourKey,
  BodyArmourEgoKey,
  OrbKey,
  ShieldKey,
  orbOptions,
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
} from "@/versioning/dynamicSlotCounts";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { getBodyArmourEgoOptions } from "@/versioning/equipmentData";
import { getVersionConfig } from "@/versioning/versionRegistry";

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
  shield: ShieldKey;
  orb: OrbKey;
  armour: ArmourKey;
  bodyArmourEgo?: BodyArmourEgoKey;
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
  // spell mode
  schoolSkills?: VersionedSchoolSkillLevels<V>;
  targetSpell?: VersionedSpellName<V>;
  spellcasting?: number;
  wizardry?: number;
  wildMagic?: number;
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

const isRingSlot = (value: unknown): value is RingSlotState => {
  if (!isObject(value)) return false;

  return (
    (value.kind === "none" ||
      value.kind === "wizardry" ||
      value.kind === "protection" ||
      value.kind === "evasion") &&
    typeof value.plus === "number"
  );
};

const isAmuletSlot = (value: unknown): value is AmuletSlotState => {
  if (!isObject(value)) return false;

  return (
    (value.kind === "none" || value.kind === "reflection") &&
    (value.displayName === undefined || typeof value.displayName === "string")
  );
};

const isAuxArmourSlot = (value: unknown): value is AuxArmourSlotState => {
  if (!isObject(value)) return false;

  return typeof value.present === "boolean" && typeof value.enchant === "number";
};

const isValidSlotArray = <T>(
  value: unknown,
  validator: (slot: unknown) => slot is T
) => Array.isArray(value) && value.every(validator);

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
    (typeof state.bodyArmourEgo !== "string" ||
      !(state.bodyArmourEgo in getBodyArmourEgoOptions(version)))
  ) {
    return false;
  }

  if (typeof state.orb !== "string" || !(state.orb in orbOptions)) {
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

    if (
      typeof parsed.species !== "string" ||
      !(parsed.species in config.species)
    ) {
      return null;
    }

    const species = parsed.species as SpeciesKey<typeof version>;
    const slotCounts = getDynamicSlotCounts(
      version,
      species
    );

    const normalized = {
      ...defaultState,
      ...parsed,
      orb: parsed.orb ?? (parsed.channel === true ? "energy" : "none"),
      species,
      ringSlots: coerceSlotArrayLength(
        (parsed as { ringSlots?: RingSlotState[] }).ringSlots ??
          defaultState.ringSlots,
        slotCounts.ringSlots,
        createDefaultRingSlot
      ),
      amuletSlots: coerceSlotArrayLength(
        (parsed as { amuletSlots?: AmuletSlotState[] }).amuletSlots ??
          defaultState.amuletSlots,
        slotCounts.amuletSlots,
        createDefaultAmuletSlot
      ),
      headgearSlots: coerceSlotArrayLength(
        (parsed as { headgearSlots?: AuxArmourSlotState[] }).headgearSlots ??
          defaultState.headgearSlots,
        slotCounts.headgearSlots,
        createDefaultAuxArmourSlot
      ),
      gloveSlots: coerceSlotArrayLength(
        (parsed as { gloveSlots?: AuxArmourSlotState[] }).gloveSlots ??
          defaultState.gloveSlots,
        slotCounts.gloveSlots,
        createDefaultAuxArmourSlot
      ),
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
