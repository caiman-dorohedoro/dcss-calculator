import AttrInput from "@/components/AttrInput";
import { cn } from "@/lib/utils";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { GameVersion } from "@/types/game";
import { getSpellSchools } from "@/utils/spellCalculation";

type SpellControlsProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
  className?: string;
  testId?: string;
};

export const SpellSkillControls = <V extends GameVersion>({
  state,
  setState,
  className,
  testId,
}: SpellControlsProps<V>) => {
  const spellSchools = state.targetSpell
    ? getSpellSchools(state.version, state.targetSpell)
    : [];

  return (
    <div data-testid={testId} className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap">
        <AttrInput
          label="Spellcasting"
          value={state.spellcasting ?? 0}
          type="skill"
          onChange={(value) =>
            setState((prev) => ({ ...prev, spellcasting: value }))
          }
        />
      </div>
      {spellSchools.length > 0 && (
        <div className="flex flex-row gap-4 text-sm items-center flex-wrap">
          {spellSchools.map((schoolName) => (
            <AttrInput
              key={schoolName}
              label={schoolName}
              value={state.schoolSkills?.[schoolName] ?? 0}
              type="skill"
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  schoolSkills: {
                    ...prev.schoolSkills,
                    [schoolName]: value === undefined ? 0 : value,
                  },
                }))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
