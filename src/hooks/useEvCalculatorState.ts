import { useState, useEffect } from "react";
import { SpeciesKey } from "@/utils/evCalculations";
import { ShieldKey } from "@/utils/shCalculation";
import { ArmourKey } from "@/utils/acCalculations";
import { SpellName, SpellSchool } from "@/utils/spellCalculation";

const STORAGE_KEY = "calculator";

export interface CalculatorState {
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
  schoolSkills?: Record<SpellSchool, number>;
  targetSpell?: SpellName;
  spellcasting?: number;
  translocation?: number;
  fire?: number;
  ice?: number;
  earth?: number;
  air?: number;
  necromancy?: number;
  conjuration?: number;
  alchemy?: number;
  hexes?: number;
  summoning?: number;
}

const defaultState: CalculatorState = {
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
    Translocation: 0,
    Fire: 0,
    Ice: 0,
    Conjuration: 0,
    Necromancy: 0,
    Earth: 0,
    Air: 0,
    Hexes: 0,
    Alchemy: 0,
    Summoning: 0,
  },
  targetSpell: "Airstrike",
  spellcasting: 0,
  translocation: 0,
  fire: 0,
  ice: 0,
  earth: 0,
  air: 0,
  necromancy: 0,
  conjuration: 0,
  alchemy: 0,
  hexes: 0,
  summoning: 0,
};

export const isCalculatorStateKey = (
  key: string
): key is keyof CalculatorState => {
  return Object.keys(defaultState).includes(key);
};

const validateState = (state: unknown): state is CalculatorState => {
  if (typeof state !== "object" || state === null) return false;
  const defaultKeys = Object.keys(defaultState);
  const stateKeys = Object.keys(state);

  if (!defaultKeys.every((key) => stateKeys.includes(key))) {
    return false;
  }

  if ("schoolSkills" in state) {
    const schoolKeys = Object.keys(defaultState.schoolSkills!);
    return schoolKeys.every(
      (key) =>
        key in (state as { schoolSkills: Record<string, unknown> }).schoolSkills
    );
  }

  return true;
};

export const useCalculatorState = () => {
  const [state, setState] = useState<CalculatorState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (validateState(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Invalid saved state", e);
      }
    }

    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const resetState = () => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    state,
    setState,
    resetState,
  };
};
