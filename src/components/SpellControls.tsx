import { cn } from "@/lib/utils";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { GameVersion } from "@/types/game";
import { getBodyArmourEgoOptions } from "@/versioning/equipmentData";
import { getSpellSchools } from "@/utils/spellCalculation";
import AttrInput from "@/components/AttrInput";
import { BodyArmourEgoKey } from "@/types/equipment.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SpellControlsProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
  className?: string;
  testId?: string;
};

const SpellControls = <V extends GameVersion>({
  state,
  setState,
  className,
  testId,
}: SpellControlsProps<V>) => {
  const spellSchools = state.targetSpell
    ? getSpellSchools(state.version, state.targetSpell)
    : [];
  const bodyArmourEgos = getBodyArmourEgoOptions(state.version);
  const selectedBodyArmourEgo =
    state.bodyArmourEgo !== undefined && state.bodyArmourEgo in bodyArmourEgos
      ? state.bodyArmourEgo
      : "none";

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
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap border-t border-gray-700 pt-2">
        <AttrInput
          label="ring of wizardry"
          value={state.wizardry ?? 0}
          type="number"
          max={10}
          onChange={(value) =>
            setState((prev) => ({ ...prev, wizardry: value }))
          }
        />
        <AttrInput
          label="wild magic (mutation)"
          value={state.wildMagic ?? 0}
          type="number"
          max={3}
          onChange={(value) =>
            setState((prev) => ({ ...prev, wildMagic: value }))
          }
        />
        <div className="flex flex-row items-center gap-2">
          <span>body armour ego</span>
          <Select
            disabled={state.armour === "none"}
            value={selectedBodyArmourEgo}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                bodyArmourEgo: value as BodyArmourEgoKey,
              }))
            }
          >
            <SelectTrigger className="min-w-[120px] h-6 w-auto gap-2">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(bodyArmourEgos) as BodyArmourEgoKey[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {bodyArmourEgos[key]?.name ?? key}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SpellControls;
