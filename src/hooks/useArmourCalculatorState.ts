import { useState, useEffect } from "react";

const STORAGE_KEY = "armourCalculator";

interface ArmourCalculatorState {
  baseAC: number;
}

const defaultState: ArmourCalculatorState = {
  baseAC: 3,
};

export const useArmourCalculatorState = () => {
  const [state, setState] = useState<ArmourCalculatorState>(() => {
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
