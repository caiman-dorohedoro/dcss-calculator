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
import {
  SpellName as SpellName033,
  SpellSchool as SpellSchool033,
  SpellFlag as SpellFlag033,
} from "@/types/generated-spells.0.33.d";

// 버전별 타입 맵핑
type SpellNameMap = {
  "0.32": SpellName032;
  "0.33": SpellName033;
  "trunk": SpellNameTrunk;
};

type SpellSchoolMap = {
  "0.32": SpellSchool032;
  "0.33": SpellSchool033;
  "trunk": SpellSchoolTrunk;
};

type SpellFlagMap = {
  "0.32": SpellFlag032;
  "0.33": SpellFlag033;
  "trunk": SpellFlagTrunk;
};

export type VersionedSpellName<V extends GameVersion> = SpellNameMap[V];
export type VersionedSpellSchool<V extends GameVersion> = SpellSchoolMap[V];
export type VersionedSpellFlag<V extends GameVersion> = SpellFlagMap[V];

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
