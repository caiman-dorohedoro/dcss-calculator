import { GameVersion } from "@/types/game";
import {
  VersionedSpellFlag,
  VersionedSpellName,
  VersionedSpellSchool,
} from "@/types/spells";
import { getSpellFlags, getSpellSchools } from "./spellCalculation";

// 버전별 스펠 학교가 conjuration인지 확인하는 함수
const isConjuration = <V extends GameVersion>(
  school: VersionedSpellSchool<V>
): boolean => {
  // 버전별로 "conjuration"을 나타내는 값과 비교
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

  // 현재는 trunk에만 enkindle이 존재함
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
