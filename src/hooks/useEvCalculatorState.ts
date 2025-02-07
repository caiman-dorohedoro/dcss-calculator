import { useState, useEffect } from "react";
import { SpeciesKey } from "@/utils/evCalculations";
import { ShieldKey } from "@/utils/shCalculation";
import { ArmourKey } from "@/utils/acCalculations";
import { SpellName } from "@/utils/spellCalculation";

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
  targetSpell?: SpellName;
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
  targetSpell: "Apportation",
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

export const useCalculatorState = () => {
  const [state, setState] = useState<CalculatorState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultState;
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
