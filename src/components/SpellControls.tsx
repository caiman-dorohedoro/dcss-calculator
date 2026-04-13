import { useState } from "react";
import AttrInput from "@/components/AttrInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { GameVersion } from "@/types/game";
import { VersionedSpellSchool } from "@/types/spells";
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
  const allSpellSchools = Object.keys(
    state.schoolSkills ?? {}
  ) as VersionedSpellSchool<V>[];
  const hasSpellSkillControls =
    allSpellSchools.length > 0 || state.spellcasting !== undefined;
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
  const spellSkillControls = [
    {
      key: "spellcasting",
      label: "Spellcasting",
      value: state.spellcasting ?? 0,
      onChange: (value: number | undefined) =>
        setState((prev) => ({ ...prev, spellcasting: value })),
    },
    ...orderedSpellSchools.map((schoolName) => ({
      key: schoolName,
      label: schoolName,
      value: state.schoolSkills?.[schoolName] ?? 0,
      onChange: (value: number | undefined) =>
        setState((prev) => ({
          ...prev,
          schoolSkills: {
            ...prev.schoolSkills,
            [schoolName]: value === undefined ? 0 : value,
          },
        })),
    })),
  ];
  const splitIndex = Math.ceil(spellSkillControls.length / 2);
  const leftColumnSpellSkills = spellSkillControls.slice(0, splitIndex);
  const rightColumnSpellSkills = spellSkillControls.slice(splitIndex);

  return (
    <div data-testid={testId} className={cn("flex flex-col gap-4", className)}>
      {hasSpellSkillControls && (
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
      {hasSpellSkillControls && showSpellSkills && (
        <div
          data-testid="spell-school-grid"
          className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm items-start"
        >
          <div
            data-testid="spell-school-column-left"
            className="flex flex-col gap-4 items-start"
          >
            {leftColumnSpellSkills.map((skillControl) => (
              <div key={skillControl.key} className="justify-self-start">
                <AttrInput
                  label={skillControl.label}
                  value={skillControl.value}
                  type="skill"
                  onChange={skillControl.onChange}
                />
              </div>
            ))}
          </div>
          <div
            data-testid="spell-school-column-right"
            className="flex flex-col gap-4 items-start"
          >
            {rightColumnSpellSkills.map((skillControl) => (
              <div key={skillControl.key} className="justify-self-start">
                <AttrInput
                  label={skillControl.label}
                  value={skillControl.value}
                  type="skill"
                  onChange={skillControl.onChange}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
