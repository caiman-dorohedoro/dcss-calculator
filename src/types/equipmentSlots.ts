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

const clearSlotMetadata = <T extends {
  displayName?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
}>(
  slot: T
): T => ({
  ...slot,
  displayName: undefined,
  artifactKind: undefined,
  source: undefined,
});

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

export const clearRingSlotMetadata = (slot: RingSlotState): RingSlotState =>
  clearSlotMetadata(slot);

export const clearAmuletSlotMetadata = (
  slot: AmuletSlotState
): AmuletSlotState => clearSlotMetadata(slot);

export const clearAuxArmourSlotMetadata = (
  slot: AuxArmourSlotState,
  present: boolean
): AuxArmourSlotState => ({
  ...clearSlotMetadata(slot),
  present,
  enchant: present ? slot.enchant : 0,
});
