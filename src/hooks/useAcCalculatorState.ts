import { useState, useEffect } from "react";

const STORAGE_KEY = "acCalculator";

interface AcCalculatorState {
  baseAC: number;
}

const defaultState: AcCalculatorState = {
  baseAC: 3,
};

export const useAcCalculatorState = () => {
  const [state, setState] = useState<AcCalculatorState>(() => {
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
