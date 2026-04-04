import { GameVersion } from "@/types/game";
import {
  VersionedSpellFlag,
  VersionedSpellName,
  VersionedSpellSchool,
} from "@/types/spells";
import { getVersionConfig } from "@/versioning/versionRegistry";
import { getSpellFlags, getSpellSchools } from "./spellCalculation";

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
  if (getSpellSchools(version, spellName).some(isConjuration)) {
    return true;
  }

  if (getSpellFlags(version, spellName).some(isDestructive)) {
    return true;
  }

  return false;
};

export function spellCanBeEnkindled<V extends GameVersion>(
  version: V,
  spellName?: VersionedSpellName<V>
) {
  if (!spellName) {
    return false;
  }

  if (!getVersionConfig(version).features.enkindle) {
    return false;
  }

  if (explicitFalseSpells.has(spellName as VersionedSpellName<GameVersion>)) {
    return false;
  }

  if (explicitTrueSpells.has(spellName as VersionedSpellName<GameVersion>)) {
    return true;
  }

  return vehumetSupportsSpell(
    version,
    spellName as VersionedSpellName<typeof version>
  );
}
