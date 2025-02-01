export const calculateAC = (baseAC: number, skill: number): number => {
  return Math.floor(baseAC * (1 + skill / 22));
};
