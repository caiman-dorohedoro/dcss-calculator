import { useState, useEffect } from "react";

const STORAGE_KEY = "evCalculator";

interface EvCalculatorState {
  dexterity: number;
  strength: number;
  species: string;
  shield: string;
  armourER: number;
  shieldSkill: number;
  armourSkill: number;
}

const defaultState: EvCalculatorState = {
  dexterity: 10,
  strength: 10,
  species: "armataur",
  shield: "none",
  armourER: 0,
  shieldSkill: 0,
  armourSkill: 0,
};

export const useEvCalculatorState = () => {
  const [state, setState] = useState<EvCalculatorState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return {
    state,
    setState,
  };
};
