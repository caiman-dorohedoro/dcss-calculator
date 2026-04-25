import type { EquipmentModifierBag } from "@/types/equipmentItems";
import type { EquipmentEgoKey } from "@/types/equipment";

export type RingSlotKind = "none" | "wizardry" | "protection" | "evasion";

export type RingSlotState = {
  kind: RingSlotKind;
  plus: number;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  propertiesText?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export type AmuletSlotKind = "none" | "reflection";

export type AmuletSlotState = {
  kind: AmuletSlotKind;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  propertiesText?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

export type HeadgearKind = "helmet" | "hat";

export type AuxArmourSlotState = {
  present: boolean;
  enchant: number;
  kind?: HeadgearKind;
  ego: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
  displayName?: string;
  propertiesText?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
};

const clearSlotMetadata = <T extends {
  displayName?: string;
  propertiesText?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: "manual" | "imported";
}>(
  slot: T
): T => ({
  ...slot,
  displayName: undefined,
  propertiesText: undefined,
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
  kind: undefined,
  ego: "none",
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
  kind: present ? slot.kind : undefined,
  ego: present ? slot.ego : "none",
});

export const applyRingSlotUpdate = <T extends { ringSlots: RingSlotState[] }>(
  state: T,
  index: number,
  update: (slot: RingSlotState) => RingSlotState
): T => {
  const nextRingSlots = [...state.ringSlots];
  nextRingSlots[index] = update(nextRingSlots[index] ?? createDefaultRingSlot());

  return {
    ...state,
    ringSlots: nextRingSlots,
  };
};
