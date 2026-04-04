import type { GameVersion } from "@/types/game";

type NamedRecord = {
  name: string;
};

const sortedDifference = (left: Set<string>, right: Set<string>) =>
  Array.from(left)
    .filter((value) => !right.has(value))
    .sort();

export const diffNamedRecords = (
  previous: ReadonlyArray<NamedRecord>,
  next: ReadonlyArray<NamedRecord>
) => {
  const previousNames = new Set(previous.map((item) => item.name));
  const nextNames = new Set(next.map((item) => item.name));

  return {
    added: sortedDifference(nextNames, previousNames),
    removed: sortedDifference(previousNames, nextNames),
  };
};

export const diffSpeciesKeys = (
  previous: Record<string, unknown>,
  next: Record<string, unknown>
) => {
  const previousKeys = new Set(Object.keys(previous));
  const nextKeys = new Set(Object.keys(next));

  return {
    added: sortedDifference(nextKeys, previousKeys),
    removed: sortedDifference(previousKeys, nextKeys),
  };
};

const formatDiffList = (label: string, values: string[]) =>
  `${label}: ${values.length > 0 ? values.join(", ") : "(none)"}`;

export const summarizeVersionDiff = (
  previousVersion: GameVersion,
  nextVersion: GameVersion,
  previousSpells: ReadonlyArray<NamedRecord>,
  nextSpells: ReadonlyArray<NamedRecord>,
  previousSpecies: Record<string, unknown>,
  nextSpecies: Record<string, unknown>
) => {
  const spellDiff = diffNamedRecords(previousSpells, nextSpells);
  const speciesDiff = diffSpeciesKeys(previousSpecies, nextSpecies);

  return [
    `Version diff: ${previousVersion} -> ${nextVersion}`,
    formatDiffList("Added spells", spellDiff.added),
    formatDiffList("Removed spells", spellDiff.removed),
    formatDiffList("Added species", speciesDiff.added),
    formatDiffList("Removed species", speciesDiff.removed),
  ].join("\n");
};
