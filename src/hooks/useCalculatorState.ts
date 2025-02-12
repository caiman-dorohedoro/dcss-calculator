import { useState, useEffect } from "react";
import { ArmourKey, ShieldKey } from "@/types/equipment.ts";
import { SpeciesKey } from "@/types/species.ts";
import { GameVersion } from "@/types/game";
import { VersionedSchoolSkillLevels, VersionedSpellName } from "@/types/spells";

const STORAGE_KEY = "calculator";

const getStorageKey = (version: GameVersion) => {
  return `${STORAGE_KEY}_${version}`;
};

export interface CalculatorState<V extends GameVersion> {
  version: GameVersion;
  accordionValue: string[];
  //
  dexterity: number;
  strength: number;
  intelligence: number;
  species: SpeciesKey;
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
  spellMode?: boolean;
  schoolSkills?: VersionedSchoolSkillLevels<V>;
  targetSpell?: VersionedSpellName<V>;
  spellcasting?: number;
  wizardry?: number;
  channel?: boolean;
  wildMagic?: number;
}

const defaultStateTrunk: CalculatorState<"trunk"> = {
  version: "trunk",
  accordionValue: ["ev"],
  dexterity: 10,
  strength: 10,
  intelligence: 10,
  species: "armataur",
  shield: "none",
  armour: "robe",
  shieldSkill: 0,
  armourSkill: 0,
  dodgingSkill: 0,
  helmet: false,
  gloves: false,
  boots: false,
  cloak: false,
  barding: false,
  secondGloves: false,
  //
  spellMode: false,
  schoolSkills: {
    translocation: 0,
    fire: 0,
    ice: 0,
    conjuration: 0,
    necromancy: 0,
    earth: 0,
    air: 0,
    hexes: 0,
    alchemy: 0,
    summoning: 0,
    forgecraft: 0,
  },
  targetSpell: "Airstrike",
  spellcasting: 0,
  wizardry: 0,
  channel: false,
  wildMagic: 0,
};

const defaultState032: CalculatorState<"0.32"> = {
  version: "0.32",
  accordionValue: ["ev"],
  dexterity: 10,
  strength: 10,
  intelligence: 10,
  species: "armataur",
  shield: "none",
  armour: "robe",
  shieldSkill: 0,
  armourSkill: 0,
  dodgingSkill: 0,
  helmet: false,
  gloves: false,
  boots: false,
  cloak: false,
  barding: false,
  //
  spellMode: false,
  schoolSkills: {
    translocation: 0,
    fire: 0,
    ice: 0,
    conjuration: 0,
    necromancy: 0,
    earth: 0,
    air: 0,
    hexes: 0,
    alchemy: 0,
    summoning: 0,
  },
  targetSpell: "Airstrike",
  spellcasting: 0,
  wizardry: 0,
  channel: false,
  wildMagic: 0,
};

export const isSchoolSkillKey = <V extends GameVersion>(
  version: GameVersion,
  key: string
): key is keyof CalculatorState<V>["schoolSkills"] => {
  const defaultState = getDefaultState<V>(version);
  return Object.keys(defaultState.schoolSkills!).includes(key);
};

const isGameVersion = (version: string): version is GameVersion => {
  return version === "trunk" || version === "0.32";
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

  const defaultState = getDefaultState<V>(state.version);
  const defaultKeys = Object.keys(defaultState);
  const stateKeys = Object.keys(state);

  if (!defaultKeys.every((key) => stateKeys.includes(key))) {
    return false;
  }

  return true;
};

const getDefaultState = <V extends GameVersion>(
  version: GameVersion
): V extends "trunk" ? CalculatorState<"trunk"> : CalculatorState<"0.32"> => {
  if (version === "trunk") {
    return defaultStateTrunk as V extends "trunk"
      ? CalculatorState<"trunk">
      : CalculatorState<"0.32">;
  }

  return defaultState032 as V extends "trunk"
    ? CalculatorState<"trunk">
    : CalculatorState<"0.32">;
};

export const useCalculatorState = <V extends GameVersion>() => {
  const [state, setState] = useState<CalculatorState<V>>(() => {
    let initialVersion: GameVersion = "trunk";

    const savedTrunk = localStorage.getItem(getStorageKey("trunk"));
    const saved032 = localStorage.getItem(getStorageKey("0.32"));

    const saved = savedTrunk || saved032;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (validateState(parsed)) {
          initialVersion = parsed.version;
          return parsed;
        }
      } catch (e) {
        console.error("Invalid saved state", e);
      }
    }

    return getDefaultState<"trunk">(initialVersion) as CalculatorState<V>;
  });

  useEffect(() => {
    localStorage.setItem(getStorageKey(state.version), JSON.stringify(state));
  }, [state]);

  const resetState = () => {
    setState(getDefaultState<V>(state.version) as CalculatorState<V>);
    localStorage.removeItem(getStorageKey(state.version));
  };

  const changeVersion = (version: GameVersion) => {
    const saved = localStorage.getItem(getStorageKey(version));

    if (saved) {
      setState((state) => ({
        spellMode: state.spellMode,
        ...(JSON.parse(saved) as CalculatorState<V>),
      }));
    } else {
      setState((state) => ({
        spellMode: state.spellMode,
        ...(getDefaultState<V>(version) as CalculatorState<V>),
      }));
    }
  };

  return {
    state,
    setState,
    resetState,
    changeVersion,
  };
};
