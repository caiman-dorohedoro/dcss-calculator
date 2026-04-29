export type StatMutationInputs = {
  strongMutation?: number;
  cleverMutation?: number;
  agileMutation?: number;
  weakMutation?: number;
  dopeyMutation?: number;
  clumsyMutation?: number;
  thinSkeletalStructure?: number;
};

const level = (value: number | undefined) => value ?? 0;

export const getMutationStatModifiers = (state: StatMutationInputs) => {
  const strong = level(state.strongMutation);
  const clever = level(state.cleverMutation);
  const agile = level(state.agileMutation);
  const weak = level(state.weakMutation);
  const dopey = level(state.dopeyMutation);
  const clumsy = level(state.clumsyMutation);
  const thinSkeletalStructure = level(state.thinSkeletalStructure);

  return {
    str: strong * 4 - clever - agile - weak * 3,
    dex:
      agile * 4 -
      strong -
      clever -
      clumsy * 3 +
      thinSkeletalStructure * 2,
    int: clever * 4 - strong - agile - dopey * 3,
  };
};
