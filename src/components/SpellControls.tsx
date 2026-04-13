import { useState } from "react";
import AttrInput from "@/components/AttrInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { GameVersion } from "@/types/game";
import { VersionedSpellSchool } from "@/types/spells";
import { getSpellSchools } from "@/utils/spellCalculation";
import { ChevronsDown } from "lucide-react";

type SpellControlsProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
  className?: string;
  testId?: string;
};

const crawlSpellSchoolOrder = [
  "conjuration",
  "hexes",
  "summoning",
  "necromancy",
  "forgecraft",
  "translocation",
  "alchemy",
  "fire",
  "ice",
  "air",
  "earth",
] as const;

export const SpellSkillControls = <V extends GameVersion>({
  state,
  setState,
  className,
  testId,
}: SpellControlsProps<V>) => {
  const [showSpellSkills, setShowSpellSkills] = useState(false);
  const spellSchools = state.targetSpell
    ? getSpellSchools(state.version, state.targetSpell)
    : [];
  const allSpellSchools = Object.keys(
    state.schoolSkills ?? {}
  ) as VersionedSpellSchool<V>[];
  const orderedSpellSchools = [...allSpellSchools].sort((a, b) => {
    const aIndex = crawlSpellSchoolOrder.indexOf(
      a as (typeof crawlSpellSchoolOrder)[number]
    );
    const bIndex = crawlSpellSchoolOrder.indexOf(
      b as (typeof crawlSpellSchoolOrder)[number]
    );

    if (aIndex === -1 && bIndex === -1) {
      return a.localeCompare(b);
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto w-full gap-3 px-0 py-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
          aria-expanded={showSpellSkills}
          onClick={() => setShowSpellSkills((prev) => !prev)}
        >
          <span
            data-testid="spell-skill-toggle-line-left"
            className="h-px flex-1 bg-[repeating-linear-gradient(90deg,hsl(var(--border))_0_10px,transparent_10px_16px)] opacity-70"
          />
          <span className="inline-flex items-center gap-2">
            {showSpellSkills ? "Hide spell skills" : "Show spell skills"}
            <ChevronsDown className={cn(showSpellSkills && "rotate-180")} />
          </span>
          <span
            data-testid="spell-skill-toggle-line-right"
            className="h-px flex-1 bg-[repeating-linear-gradient(90deg,hsl(var(--border))_0_10px,transparent_10px_16px)] opacity-70"
          />
        </Button>
      )}
      {spellSchools.length > 0 && showSpellSkills && (
        <div
          data-testid="spell-school-grid"
          className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm items-start"
        >
          {orderedSpellSchools.map((schoolName) => (
            <div key={schoolName} className="justify-self-start">
              <AttrInput
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
