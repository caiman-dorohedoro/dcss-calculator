import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AttrInput from "@/components/AttrInput";
import {
  CalculatorState,
  isSchoolSkillKey,
} from "@/hooks/useEvCalculatorState";
import { spells } from "@/data/spells";
import { SpellName, SpellSchool } from "@/types/spell.ts";

type SpellModeHeaderProps = {
  state: CalculatorState;
  setState: React.Dispatch<React.SetStateAction<CalculatorState>>;
};

const SpellModeHeader = ({ state, setState }: SpellModeHeaderProps) => {
  return (
    <>
      <div className="h-px w-full bg-gray-200"></div>
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap flex-start">
        <div className="flex flex-row items-center gap-2">
          Spell:
          <Select
            value={state.targetSpell}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                targetSpell: value as SpellName,
              }))
            }
          >
            <SelectTrigger className="min-w-[160px] h-6 w-auto gap-2">
              <SelectValue placeholder="Apportation" />
            </SelectTrigger>
            <SelectContent>
              {spells
                .toSorted((a, b) => a.name.localeCompare(b.name))
                .map((spell) => (
                  <SelectItem key={spell.name} value={spell.name}>
                    {spell.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <AttrInput
          label="Spellcasting Skill"
          value={state.spellcasting ?? 0}
          type="skill"
          onChange={(value) =>
            setState((prev) => ({ ...prev, spellcasting: value }))
          }
        />
      </div>
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap flex-start">
        {spells
          .find((spell) => spell.name === state.targetSpell)
          ?.schools.map((schoolName) => {
            // const lowerCaseSchoolName = schoolName.toLowerCase();

            if (!isSchoolSkillKey(schoolName)) {
              return null;
            }

            if (typeof state.schoolSkills?.[schoolName] !== "number") {
              return null;
            }

            return (
              <AttrInput
                key={schoolName}
                label={`${schoolName}`}
                value={state.schoolSkills?.[schoolName] ?? 0}
                type="skill"
                onChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    schoolSkills: {
                      ...prev.schoolSkills,
                      [schoolName]: value === undefined ? 0 : value,
                    } as Record<SpellSchool, number>,
                  }))
                }
              />
            );
          })}
      </div>
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap flex-start border-t border-gray-700 pt-2">
        <AttrInput
          label="ring of wizardry"
          value={state.wizardry ?? 0}
          type="number"
          max={10}
          onChange={(value) =>
            setState((prev) => ({ ...prev, wizardry: value }))
          }
        />
        <div className="flex flex-row items-center gap-2">
          <Checkbox
            id="channel"
            checked={state.channel}
            onCheckedChange={(checked) =>
              setState((prev) => ({ ...prev, channel: !!checked }))
            }
          />
          <label htmlFor="channel">channel</label>
        </div>
        <AttrInput
          label="wild magic (mutation)"
          value={state.wildMagic ?? 0}
          type="number"
          max={3}
          onChange={(value) =>
            setState((prev) => ({ ...prev, wildMagic: value }))
          }
        />
      </div>
    </>
  );
};

export default SpellModeHeader;
