import { useState, useEffect } from "react";
import {
  ArmourKey,
  BodyArmourEgoKey,
  OrbKey,
  ShieldKey,
  orbOptions,
} from "@/types/equipment.ts";
import type { SpeciesKey } from "@/types/species.ts";
import { isGameVersion, startupRestoreOrder } from "@/types/game";
import type { GameVersion } from "@/types/game";
import type { VersionedSchoolSkillLevels, VersionedSpellName } from "@/types/spells";
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

const parseSavedState = (saved: string): CalculatorState<GameVersion> | null => {
  try {
    const parsed = JSON.parse(saved);

    if (!isObject(parsed)) {
      return null;
    }

    const migrated = {
      ...parsed,
      orb:
        parsed.orb ??
        (parsed.channel === true ? "energy" : "none"),
    };

    return validateState(migrated) ? migrated : null;
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
