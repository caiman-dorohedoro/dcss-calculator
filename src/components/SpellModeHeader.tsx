import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
                        spellCanBeEnkindled(state.version, spell.name) && (
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
      </div>
    </div>
  );
};

export default SpellModeHeader;
