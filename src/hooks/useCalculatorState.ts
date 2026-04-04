import { useState, useEffect } from "react";
import { ArmourKey, ShieldKey } from "@/types/equipment.ts";
import type { SpeciesKey } from "@/types/species.ts";
import { isGameVersion } from "@/types/game";
import type { GameVersion } from "@/types/game";
import type { VersionedSchoolSkillLevels, VersionedSpellName } from "@/types/spells";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";

const STORAGE_KEY = "calculator";
const startupRestoreOrder: GameVersion[] = ["trunk", "0.32", "0.33"];

const getStorageKey = (version: GameVersion) => {
  return `${STORAGE_KEY}_${version}`;
};

export interface CalculatorState<V extends GameVersion> {
  version: GameVersion;
  accordionValue: string[];
  accordionOrder: string[];
  //
  dexterity: number;
  strength: number;
  intelligence: number;
  species: SpeciesKey<V>;
  shield: ShieldKey;
  armour: ArmourKey;
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
  channel?: boolean;
  wildMagic?: number;
}

export const getStartupSavedState = () => {
  for (const version of startupRestoreOrder) {
    const saved = localStorage.getItem(getStorageKey(version));
    if (saved) {
      return saved;
    }
  }

  return null;
};

export const isSchoolSkillKey = <V extends GameVersion>(
  version: GameVersion,
  key: string
): key is keyof CalculatorState<V>["schoolSkills"] => {
  const defaultState = getDefaultState(version);
  return Object.keys(defaultState.schoolSkills!).includes(key);
};

const isObject = (obj: unknown): obj is Record<string, unknown> => {
  return typeof obj === "object" && obj !== null;
};

const validateState = <V extends GameVersion>(
  state: unknown
): state is CalculatorState<V> => {
  if (!isObject(state)) return false;

  if (
    !("version" in state) ||
    typeof state.version !== "string" ||
    !isGameVersion(state.version)
  )
    return false;

  const defaultState = getDefaultState(state.version);
  for (const key of Object.keys(defaultState)) {
    if (!(key in state)) {
      return false;
    }
  }

  return true;
};

const getDefaultState = (version: GameVersion) => {
  return buildDefaultCalculatorState(version);
};

export const useCalculatorState = <V extends GameVersion>() => {
  const [state, setState] = useState<CalculatorState<V>>(() => {
    let initialVersion: GameVersion = "trunk";

    const saved = getStartupSavedState();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (validateState<V>(parsed)) {
          initialVersion = parsed.version;
          return parsed;
        }
      } catch (e) {
        console.error("Invalid saved state", e);
      }
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

    try {
      if (validateState<V>(JSON.parse(saved))) {
        setState(JSON.parse(saved) as CalculatorState<V>);
      } else {
        setState(getDefaultState(version) as unknown as CalculatorState<V>);
      }
    } catch {
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
