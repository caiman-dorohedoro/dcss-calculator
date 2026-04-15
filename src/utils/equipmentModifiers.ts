import type { CalculatorState } from "@/hooks/useCalculatorState";
import type { EquipmentModifierBag } from "@/types/equipmentItems";
import type { GameVersion } from "@/types/game";
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

type AggregatedEquipmentEffects = {
  str: number;
  dex: number;
  int: number;
  ac: number;
  ev: number;
  sh: number;
  wizardry: number;
};

type LegacyGearState = {
  equipmentStr?: number;
  equipmentDex?: number;
  equipmentInt?: number;
  equipmentAC?: number;
  equipmentEV?: number;
  equipmentSH?: number;
  wizardry?: number;
};

const createEmptyAggregatedEffects = (): AggregatedEquipmentEffects => ({
  str: 0,
  dex: 0,
  int: 0,
  ac: 0,
  ev: 0,
  sh: 0,
  wizardry: 0,
});

const applyModifierBag = (
  totals: AggregatedEquipmentEffects,
  modifiers?: EquipmentModifierBag
) => {
  if (!modifiers) {
    return;
  }

  totals.str += modifiers.str ?? 0;
  totals.dex += modifiers.dex ?? 0;
  totals.int += modifiers.int ?? 0;
  totals.ac += modifiers.ac ?? 0;
  totals.ev += modifiers.ev ?? 0;
  totals.sh += modifiers.sh ?? 0;
  totals.wizardry += modifiers.wizardry ?? 0;
};

export const getAggregatedEquipmentEffects = <V extends GameVersion>(
  state: CalculatorState<V>
): AggregatedEquipmentEffects => {
  const totals = createEmptyAggregatedEffects();
  const legacy = state as CalculatorState<V> & LegacyGearState;

  totals.str += legacy.equipmentStr ?? 0;
  totals.dex += legacy.equipmentDex ?? 0;
  totals.int += legacy.equipmentInt ?? 0;
  totals.ac += legacy.equipmentAC ?? 0;
  totals.ev += legacy.equipmentEV ?? 0;
  totals.sh += legacy.equipmentSH ?? 0;
  totals.wizardry += legacy.wizardry ?? 0;

  applyModifierBag(totals, state.bodyArmour.modifiers);
  applyModifierBag(totals, state.shieldItem.modifiers);
  applyModifierBag(totals, state.orbItem.modifiers);
  applyModifierBag(totals, state.cloakItem.modifiers);
  applyModifierBag(totals, state.bootsItem.modifiers);
  applyModifierBag(totals, state.bardingItem.modifiers);
  applyModifierBag(totals, state.unattributedGear?.modifiers);

  for (const ring of state.ringSlots) {
    if (ring.kind === "protection") {
      totals.ac += ring.plus;
    }

    if (ring.kind === "evasion") {
      totals.ev += ring.plus;
    }

    if (ring.kind === "wizardry") {
      totals.wizardry += 1;
    }

    applyModifierBag(totals, ring.modifiers);
  }

  for (const amulet of state.amuletSlots) {
    applyModifierBag(totals, amulet.modifiers);
  }

  for (const slot of state.headgearSlots) {
    applyModifierBag(totals, slot.modifiers);
  }

  for (const slot of state.gloveSlots) {
    applyModifierBag(totals, slot.modifiers);
  }

  return totals;
};
