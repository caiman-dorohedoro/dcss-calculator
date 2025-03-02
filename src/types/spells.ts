import { GameVersion } from "@/types/game";
import {
  SpellName as SpellNameTrunk,
  SpellSchool as SpellSchoolTrunk,
  SpellFlag as SpellFlagTrunk,
} from "@/types/generated-spells.trunk.d";
import {
  SpellName as SpellName032,
  SpellSchool as SpellSchool032,
  SpellFlag as SpellFlag032,
} from "@/types/generated-spells.0.32.d";

export type VersionedSpellName<V extends GameVersion> = V extends "0.32"
  ? SpellName032
  : V extends "trunk"
  ? SpellNameTrunk
  : never;

export type VersionedSpellSchool<V extends GameVersion> = V extends "0.32"
  ? SpellSchool032
  : V extends "trunk"
  ? SpellSchoolTrunk
  : never;

export type VersionedSpellFlag<V extends GameVersion> = V extends "0.32"
  ? SpellFlag032
  : V extends "trunk"
  ? SpellFlagTrunk
  : never;

export type VersionedSpellDatum<V extends GameVersion> = {
  id: string;
  name: VersionedSpellName<V>;
  schools: VersionedSpellSchool<V>[];
  flags: VersionedSpellFlag<V>[];
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  power: number;
  range: {
    min: number;
    max: number;
  };
  noise: number;
  tile: string;
};

export type VersionedSchoolSkillLevels<V extends GameVersion> = Partial<
  Record<VersionedSpellSchool<V>, number>
>;
