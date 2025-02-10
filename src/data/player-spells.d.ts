
  export type SpellName = "Cause Fear" | "Magic Dart" | "Fireball" | "Apportation" | "Volatile Blastmotes" | "Arcjolt" | "Plasma Beam" | "Permafrost Eruption" | "Vhi's Electric Charge" | "Slow" | "Petrify" | "Disjunction" | "Freezing Cloud" | "Mephitic Cloud" | "Olgreb's Toxic Radiance" | "Teleport Other" | "Death's Door" | "Summon Small Mammal" | "Lehudib's Crystal Spear" | "Polar Vortex" | "Fire Storm" | "Blink" | "Iskenderun's Mystic Blast" | "Summon Horrible Things" | "Malign Gateway" | "Animate Dead" | "Soul Splinter" | "Vampiric Draining" | "Haunt" | "Martyr's Knell" | "Borgnjor's Revivification" | "Freeze" | "Ozocubu's Refrigeration" | "Sticky Flame" | "Summon Ice Beast" | "Ozocubu's Armour" | "Call Imp" | "Dispel Undead" | "Sublimation of Blood" | "Tukima's Dance" | "Cigotuvi's Putrefaction" | "Bombard" | "Stone Arrow" | "Shock" | "Swiftness" | "Curse of Agony" | "Death Channel" | "Airstrike" | "Momentum Strike" | "Confusing Touch" | "Passwall" | "Ignite Poison" | "Call Canine Familiar" | "Ensorcelled Hibernation" | "Metabolic Englaciation" | "Silence" | "Shatter" | "Dispersal" | "Static Discharge" | "Alistair's Intoxication" | "Lee's Rapid Deconstruction" | "Sandblast" | "Sculpt Simulacrum" | "Conjure Ball Lightning" | "Chain Lightning" | "Monstrous Menagerie" | "Passage of Golubria" | "Fulminant Prism" | "Orb of Destruction" | "Leda's Liquefaction" | "Summon Hydra" | "Inner Flame" | "Iskenderun's Battlesphere" | "Dazzling Flash" | "Fugue of the Fallen" | "Searing Ray" | "Discord" | "Summon Forest" | "Forge Lightning Spire" | "Forge Blazeheart Golem" | "Dragon's Call" | "Spellspark Servitor" | "Summon Mana Viper" | "Irradiate" | "Yara's Violent Unravelling" | "Infestation" | "Lesser Beckoning" | "Mercury Arrow" | "Poisonous Vapours" | "Ignition" | "Borgnjor's Vile Clutch" | "Starburst" | "Foxfire" | "Hailstorm" | "Eringya's Noxious Bog" | "Frozen Ramparts" | "Maxwell's Capacitive Coupling" | "Awaken Armour" | "Manifold Assault" | "Summon Cactus Giant" | "Scorch" | "Flame Wave" | "Enfeeble" | "Anguish" | "Kiss of Death" | "Jinxbite" | "Sigil of Binding" | "Dimensional Bullseye" | "Brom's Barrelling Boulder" | "Maxwell's Portable Piledriver" | "Gell's Gavotte" | "Magnavolt" | "Fulsome Fusillade" | "Rimeblight" | "Hoarfrost Cannonade" | "Hellfire Mortar" | "Grave Claw" | "Launch Clockwork Bee" | "Construct Spike Launcher" | "Kinetic Grapnel" | "Diamond Sawblades" | "Eringya's Surprising Crocodile" | "Platinum Paragon" | "Alistair's Walking Alembic" | "Forge Monarch Bomb" | "Splinterfrost Shell" | "Nazja's Percussive Tempering" | "Fortress Blast" | "Summon Seismosaurus Egg" | "Forge Phalanx Beetle" | "Rending Blade";
  export type School = "hexes" | "conjuration" | "fire" | "translocation" | "air" | "ice" | "earth" | "alchemy" | "necromancy" | "summoning" | "forgecraft";
  export type Flag = "area" | "WL_check" | "dir_or_target" | "needs_tracer" | "target" | "obj" | "not_self" | "destructive" | "noisy" | "escape" | "utility" | "cloud" | "no_ghost" | "selfench" | "unholy" | "chaotic" | "mons_abjure" | "helpful" | "unclean" | "hasty" | "silent" | "aim_at_space" | "prefer_farthest";

  export type SpellData = {
    id: string;
    name: SpellName;
    schools: School[];
    flags: Flag[];
    level: number;
    power: number;
    range: {
      min: number;
      max: number;
    };
    noise: number;
    tile: string;
  };
