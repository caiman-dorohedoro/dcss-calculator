import { useState, useEffect } from "react";
import { SpeciesKey, ShieldKey } from "@/utils/evCalculations";
import { ArmourKey } from "@/utils/acCalculations";

const STORAGE_KEY = "calculator";

export interface CalculatorState {
  dexterity: number;
  strength: number;
  species: SpeciesKey;
  shield: ShieldKey;
  armour: ArmourKey;
  shieldSkill: number;
  armourSkill: number;
  helmet?: boolean;
  gloves?: boolean;
  boots?: boolean;
  cloak?: boolean;
  barding?: boolean;
  secondGloves?: boolean;
}

const defaultState: CalculatorState = {
  dexterity: 10,
  strength: 10,
  species: "armataur",
  shield: "none",
  armour: "robe",
  shieldSkill: 0,
  armourSkill: 0,
  helmet: false,
  gloves: false,
  boots: false,
  cloak: false,
  barding: false,
  secondGloves: false,
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
