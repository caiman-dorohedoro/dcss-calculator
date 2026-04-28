import { GameVersion } from "@/types/game";
import { VersionedSpellName } from "@/types/spells";
import { getVersionConfig } from "@/versioning/versionRegistry";
import { vehumetSupportsSpell } from "./spellCalculation";

const explicitFalseSpells = new Set<VersionedSpellName<GameVersion>>([
  "Iskenderun's Battlesphere",
  "Spellforged Servitor",
  "Spellspark Servitor",
  "Mephitic Cloud",
]);

const explicitTrueSpells = new Set<VersionedSpellName<GameVersion>>([
  "Grave Claw",
  "Vampiric Draining",
  "Borgnjor's Vile Clutch",
  "Cigotuvi's Putrefaction",
  "Dispel Undead",
]);

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
