export type SpeciesKey =
    | "armataur"
    | "barachi"
    | "coglin"
    | "deepElf"
    | "demigod"
    | "demonspawn"
    | "djinni"
    | "draconian"
    | "felid"
    | "formicid"
    | "gargoyle"
    | "ghoul"
    | "gnoll"
    | "human"
    | "kobold"
    | "mountainDwarf"
    | "merfolk"
    | "minotaur"
    | "mummy"
    | "naga"
    | "octopode"
    | "oni"
    | "spriggan"
    | "tengu"
    | "troll"
    | "vampire"
    | "vineStalker";

export type Size = "tiny" | "little" | "small" | "medium" | "large" | "giant";

export const speciesOptions: Record<SpeciesKey, { name: string; size: Size }> =
    {
        armataur: {name: "Armataur", size: "large"}, // Hybrid, special case
        barachi: {name: "Barachi", size: "medium"},
        coglin: {name: "Coglin", size: "medium"},
        deepElf: {name: "Deep Elf", size: "medium"},
        demigod: {name: "Demigod", size: "medium"},
        demonspawn: {name: "Demonspawn", size: "medium"},
        djinni: {name: "Djinni", size: "medium"},
        draconian: {name: "Draconian", size: "medium"},
        felid: {name: "Felid", size: "little"},
        formicid: {name: "Formicid", size: "medium"},
        gargoyle: {name: "Gargoyle", size: "medium"},
        ghoul: {name: "Ghoul", size: "medium"},
        gnoll: {name: "Gnoll", size: "medium"},
        human: {name: "Human", size: "medium"},
        kobold: {name: "Kobold", size: "small"},
        mountainDwarf: {name: "Mountain Dwarf", size: "medium"},
        merfolk: {name: "Merfolk", size: "medium"},
        minotaur: {name: "Minotaur", size: "medium"},
        mummy: {name: "Mummy", size: "medium"},
        naga: {name: "Naga", size: "large"}, // Hybrid, special case
        octopode: {name: "Octopode", size: "medium"},
        oni: {name: "Oni", size: "large"},
        spriggan: {name: "Spriggan", size: "little"},
        tengu: {name: "Tengu", size: "medium"},
        troll: {name: "Troll", size: "large"},
        vampire: {name: "Vampire", size: "medium"},
        vineStalker: {name: "Vine Stalker", size: "medium"},
    };