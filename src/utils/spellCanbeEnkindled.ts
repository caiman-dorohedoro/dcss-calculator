import { GameVersion } from "@/types/game";
import {
  VersionedSpellFlag,
  VersionedSpellName,
  VersionedSpellSchool,
} from "@/types/spells";
import { getVersionConfig } from "@/versioning/versionRegistry";
import { getSpellFlags, getSpellSchools } from "./spellCalculation";
import { isGameVersion } from "@/types/game";

// check if the spell school is conjuration by version
const isConjuration = <V extends GameVersion>(
  school: VersionedSpellSchool<V>
): boolean => {
  // compare with "conjuration" based on version
  return school === ("conjuration" as VersionedSpellSchool<V>);
};

const isDestructive = <V extends GameVersion>(
  flag: VersionedSpellFlag<V>
): boolean => {
  return flag === ("destructive" as VersionedSpellFlag<V>);
};

const explicitFalseSpells = new Set<VersionedSpellName<GameVersion>>([
  "Iskenderun's Battlesphere",
  "Spellforged Servitor",
  "Mephitic Cloud",
]);

const explicitTrueSpells = new Set<VersionedSpellName<GameVersion>>([
  "Grave Claw",
  "Vampiric Draining",
  "Borgnjor's Vile Clutch",
  "Cigotuvi's Putrefaction",
]);

const vehumetSupportsSpell = <V extends GameVersion>(
  version: V,
  spellName: VersionedSpellName<V>
) => {
  try {
    if (getSpellSchools(version, spellName).some(isConjuration)) {
      return true;
    }

    if (getSpellFlags(version, spellName).some(isDestructive)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

export function spellCanBeEnkindled<V extends GameVersion>(
  version: V,
  spellName?: VersionedSpellName<V>
): boolean;

export function spellCanBeEnkindled<V extends GameVersion>(
  spellName?: VersionedSpellName<V>
): boolean;

export function spellCanBeEnkindled<V extends GameVersion>(
  versionOrSpellName?: GameVersion | VersionedSpellName<V>,
  spellName?: VersionedSpellName<V>
) {
  const version = isGameVersion(versionOrSpellName ?? "")
    ? versionOrSpellName
    : "trunk";
  const resolvedSpellName = isGameVersion(versionOrSpellName ?? "")
    ? spellName
    : versionOrSpellName;

  if (!resolvedSpellName) {
    return false;
  }

  if (!getVersionConfig(version).features.enkindle) {
    return false;
  }

  if (explicitFalseSpells.has(resolvedSpellName as VersionedSpellName<GameVersion>)) {
    return false;
  }

  if (explicitTrueSpells.has(resolvedSpellName as VersionedSpellName<GameVersion>)) {
    return true;
  }

  return vehumetSupportsSpell(
    version,
    resolvedSpellName as VersionedSpellName<typeof version>
  );
}
