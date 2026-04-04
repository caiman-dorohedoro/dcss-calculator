import type { CalculatorState } from "@/hooks/useCalculatorState";
import type { GameVersion } from "@/types/game";
import type { VersionedSchoolSkillLevels } from "@/types/spells";
import { getVersionConfig } from "./versionRegistry";

const baseDefaultState = {
  accordionValue: ["sf"],
  accordionOrder: ["sf", "ev", "ac", "sh"],
  dexterity: 10,
  strength: 10,
  intelligence: 10,
  shield: "none" as const,
  armour: "robe" as const,
  shieldSkill: 0,
  armourSkill: 0,
  dodgingSkill: 0,
  helmet: false,
  gloves: false,
  boots: false,
  cloak: false,
  barding: false,
  spellcasting: 0,
  wizardry: 0,
  channel: false,
  wildMagic: 0,
};

const buildSchoolDefaults = <V extends GameVersion>(version: V) => {
  const schools = new Set<string>();

  for (const spell of getVersionConfig(version).spells) {
    for (const school of spell.schools) {
      schools.add(school);
    }
  }

  return Object.fromEntries(
    Array.from(schools)
      .sort()
      .map((school) => [school, 0])
  ) as VersionedSchoolSkillLevels<V>;
};

export const buildDefaultCalculatorState = <V extends GameVersion>(
  version: V
): CalculatorState<V> => {
  const config = getVersionConfig(version);

  const state: CalculatorState<V> = {
    ...baseDefaultState,
    version,
    species: config.defaults.species,
    targetSpell: config.defaults.targetSpell,
    schoolSkills: buildSchoolDefaults(version),
  };

  if (config.features.secondGloves) {
    state.secondGloves = false;
  }

  return state;
};
