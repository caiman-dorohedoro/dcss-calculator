import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AttrInput from "@/components/AttrInput";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { GameVersion } from "@/types/game";
import { VersionedSpellName } from "@/types/spells";
import { getSpellData } from "@/utils/spellCalculation";
import { spellCanBeEnkindled } from "@/utils/spellCanbeEnkindled";

type SpellModeHeaderProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
};

const SpellModeHeader = <V extends GameVersion>({
  state,
  setState,
}: SpellModeHeaderProps<V>) => {
  const spells = getSpellData<V>(state.version);

  return (
    <div className="flex flex-col gap-2 pl-2 pr-4 pb-4">
      <div className="flex flex-row gap-4 text-sm items-center flex-wrap flex-start">
        <div className="flex flex-row items-center gap-2">
          Spell:
          <Select
            value={state.targetSpell}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                targetSpell: value as VersionedSpellName<V>,
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
                    <span className="inline-flex items-center gap-2">
                      <span>{spell.name}</span>
                      {state.species === "revenant" &&
                        spellCanBeEnkindled(spell.name) && (
                          <span className="text-[#60FDFF] transform translate-y-0.5">
                            *
                          </span>
                        )}
                    </span>
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
                    },
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
    </div>
  );
};

export default SpellModeHeader;
