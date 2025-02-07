export type SpellCalculationParams = {
  playerStrength: number;
  playerSpellcasting: number;
  intelligence: number;
  conjurationSkill: number;
  secondSkill: number;
  spellDifficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  equippedArmour: { encumbrance: number };
  equippedShield: { encumbrance: number };
  armourSkill: number;
  shieldSkill: number;
};

const spellDifficulties = {
  1: 3,
  2: 15,
  3: 35,
  4: 70,
  5: 100,
  6: 150,
  7: 200,
  8: 260,
  9: 340,
};

export type SpellDifficultyLevel = keyof typeof spellDifficulties;
