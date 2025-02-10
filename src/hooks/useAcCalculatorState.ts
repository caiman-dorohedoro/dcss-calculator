import { useState, useEffect } from "react";
import { ArmourKey } from "@/types/equipment.ts";

const STORAGE_KEY = "acCalculator";

interface AcCalculatorState {
  armour: ArmourKey;
  helmet: boolean;
  gloves: boolean;
  boots: boolean;
  cloak: boolean;
  barding: boolean;
  secondGloves: boolean;
}

const defaultState: AcCalculatorState = {
  armour: "robe",
  helmet: false,
  gloves: false,
  boots: false,
  cloak: false,
  barding: false,
  secondGloves: false,
};

export const useAcCalculatorState = () => {
  const [state, setState] = useState<AcCalculatorState>(() => {
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
