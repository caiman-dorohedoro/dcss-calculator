import {spells} from "@/data/spells.ts";

export type SpellName = (typeof spells)[number]["name"];
export type SpellSchool = (typeof spells)[number]["schools"][number];
export type SchoolSkills = {
    [key in SpellSchool]?: number;
};