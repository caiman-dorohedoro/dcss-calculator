export enum Size {
  TINY = "tiny",
  LITTLE = "little",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  GIANT = "giant",
}

export type SpeciesSlotOverrides = Partial<{
  ringSlots: number;
  amuletSlots: number;
  headgearSlots: number;
  gloveSlots: number;
}>;

export type SpeciesOption = {
  name: string;
  size: Size;
  deformedBody?: boolean;
  slotOverrides?: SpeciesSlotOverrides;
};
