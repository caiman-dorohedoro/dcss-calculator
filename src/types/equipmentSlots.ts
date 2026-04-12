export type RingSlotKind = "none" | "wizardry" | "protection" | "evasion";

export type RingSlotState = {
  kind: RingSlotKind;
  plus: number;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export type AmuletSlotKind = "none" | "reflection";

export type AmuletSlotState = {
  kind: AmuletSlotKind;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export type AuxArmourSlotState = {
  present: boolean;
  enchant: number;
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export const createDefaultRingSlot = (): RingSlotState => ({
  kind: "none",
  plus: 0,
});

export const createDefaultAmuletSlot = (): AmuletSlotState => ({
  kind: "none",
});

export const createDefaultAuxArmourSlot = (): AuxArmourSlotState => ({
  present: false,
  enchant: 0,
});
