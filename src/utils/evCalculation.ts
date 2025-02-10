import { ShieldKey, shieldOptions } from "./shCalculation";
import { ArmourKey, armourOptions } from "@/types/equipment.ts";

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
    armataur: { name: "Armataur", size: "large" }, // Hybrid, special case
    barachi: { name: "Barachi", size: "medium" },
    coglin: { name: "Coglin", size: "medium" },
    deepElf: { name: "Deep Elf", size: "medium" },
    demigod: { name: "Demigod", size: "medium" },
    demonspawn: { name: "Demonspawn", size: "medium" },
    djinni: { name: "Djinni", size: "medium" },
    draconian: { name: "Draconian", size: "medium" },
    felid: { name: "Felid", size: "little" },
    formicid: { name: "Formicid", size: "medium" },
    gargoyle: { name: "Gargoyle", size: "medium" },
    ghoul: { name: "Ghoul", size: "medium" },
    gnoll: { name: "Gnoll", size: "medium" },
    human: { name: "Human", size: "medium" },
    kobold: { name: "Kobold", size: "small" },
    mountainDwarf: { name: "Mountain Dwarf", size: "medium" },
    merfolk: { name: "Merfolk", size: "medium" },
    minotaur: { name: "Minotaur", size: "medium" },
    mummy: { name: "Mummy", size: "medium" },
    naga: { name: "Naga", size: "large" }, // Hybrid, special case
    octopode: { name: "Octopode", size: "medium" },
    oni: { name: "Oni", size: "large" },
    spriggan: { name: "Spriggan", size: "little" },
    tengu: { name: "Tengu", size: "medium" },
    troll: { name: "Troll", size: "large" },
    vampire: { name: "Vampire", size: "medium" },
    vineStalker: { name: "Vine Stalker", size: "medium" },
  };

const sizeToNumber: Record<Size, number> = {
  tiny: 2,
  little: 4,
  small: 2,
  medium: 0,
  large: -2,
  giant: 12,
};

export function calculateEV(params: {
  dodgingSkill: number;
  dexterity: number;
  strength: number;
  species: SpeciesKey;
  shield: ShieldKey;
  armour: ArmourKey;
  shieldSkill: number;
  armourSkill: number;
}) {
  const {
    dodgingSkill,
    dexterity,
    strength,
    species,
    shield,
    shieldSkill,
    armourSkill,
    armour,
  } = params;

  const sizeFactor = sizeToNumber[speciesOptions[species].size];
  const baseEV = 10 + sizeFactor;
  const shieldEncumbrance = shieldOptions[shield].encumbrance;

  // Calculate dodge bonus with armor penalty modifier
  const armorPenaltyForDodge = armourOptions[armour].encumbrance - 3;
  let dodgeModifier = 1;

  if (armorPenaltyForDodge > 0) {
    if (armorPenaltyForDodge >= strength) {
      dodgeModifier = strength / (armorPenaltyForDodge * 2);
    } else {
      dodgeModifier = 1 - armorPenaltyForDodge / (strength * 2);
    }
  }

  const rawDodgeBonus = Math.floor(
    (8 + dodgingSkill * dexterity * 0.8) / (20 - sizeFactor)
  );
  const modifiedDodgeBonus = rawDodgeBonus * dodgeModifier;
  const actualDodgeBonus = Math.floor(modifiedDodgeBonus);

  // Calculate initial EV with dodge bonus
  let currentEV = baseEV + actualDodgeBonus;

  // Shield penalty
  const shieldPenalty =
    (((2 / 5) * Math.pow(shieldEncumbrance, 2)) / (strength + 5)) *
    ((27 - shieldSkill) / 27);

  // Armour penalty
  const armourPenalty = Math.floor(
    ((1 / 225) *
      Math.pow(armourOptions[armour].encumbrance, 2) *
      (90 - 2 * armourSkill)) /
      (strength + 3)
  );

  // Apply penalties
  currentEV = baseEV + actualDodgeBonus - shieldPenalty - armourPenalty;
  currentEV = Math.max(1, Math.floor(currentEV));

  return {
    baseEV,
    rawDodgeBonus,
    actualDodgeBonus,
    dodgeModifier,
    shieldPenalty,
    armourPenalty,
    finalEV: currentEV,
  };
}
