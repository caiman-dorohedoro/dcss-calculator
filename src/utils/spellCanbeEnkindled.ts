import { GameVersion } from "@/types/game";
import {
  VersionedSpellFlag,
  VersionedSpellName,
  VersionedSpellSchool,
} from "@/types/spells";
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

const vehumetSupportsSpell = <V extends GameVersion>(
  spellName: VersionedSpellName<V>,
  version: GameVersion
) => {
  if (getSpellSchools(version, spellName).some(isConjuration)) {
    return true;
  }

  if (getSpellFlags(version, spellName).some(isDestructive)) {
    return true;
  }

  return false;
};

export const spellCanBeEnkindled = <V extends GameVersion>(
  spellName?: VersionedSpellName<V>
) => {
  if (!spellName) {
    return false;
  }

  // Currently, enkindle only exists in trunk
  const version = "trunk" as GameVersion;

  switch (spellName) {
    case "Iskenderun's Battlesphere":
    case "Spellforged Servitor":
    case "Mephitic Cloud":
      return false;

    case "Grave Claw":
    case "Vampiric Draining":
    case "Borgnjor's Vile Clutch":
    case "Cigotuvi's Putrefaction":
      return true;

    default:
      return vehumetSupportsSpell(spellName, version);
  }
};
