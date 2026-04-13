import type {
  AmuletSlotState,
  AuxArmourSlotState,
  RingSlotState,
} from "@/types/equipmentSlots";

export const getRingProtectionBonus = (ringSlots: RingSlotState[] = []) =>
  ringSlots
    .filter((slot) => slot.kind === "protection")
    .reduce((sum, slot) => sum + slot.plus, 0);

export const getRingEvasionBonus = (ringSlots: RingSlotState[] = []) =>
  ringSlots
    .filter((slot) => slot.kind === "evasion")
    .reduce((sum, slot) => sum + slot.plus, 0);

export const getRingWizardryCount = (ringSlots: RingSlotState[] = []) =>
  ringSlots.filter((slot) => slot.kind === "wizardry").length;

export const getAmuletReflectionCount = (amuletSlots: AmuletSlotState[] = []) =>
  amuletSlots.filter((slot) => slot.kind === "reflection").length;

export const getAuxArmourEnchantTotal = (slots: AuxArmourSlotState[] = []) =>
  slots
    .filter((slot) => slot.present)
    .reduce((sum, slot) => sum + slot.enchant, 0);

export const getAuxArmourBaseAc = (
  slots: AuxArmourSlotState[] = [],
  baseAcPerPiece: number
) => slots.filter((slot) => slot.present).length * baseAcPerPiece;

export const getHeadgearEnchantTotal = (slots: AuxArmourSlotState[] = []) =>
  slots
    .filter((slot) => slot.present)
    .reduce((sum, slot) => sum + slot.enchant, 0);

export const getHeadgearBaseAc = (slots: AuxArmourSlotState[] = []) =>
  slots.reduce((sum, slot) => {
    if (!slot.present) {
      return sum;
    }

    return sum + (slot.kind === "hat" ? 0 : 1);
  }, 0);
