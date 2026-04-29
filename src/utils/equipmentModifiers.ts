import type { CalculatorState } from "@/hooks/useCalculatorState";
import type { EquipmentModifierBag } from "@/types/equipmentItems";
import type { GameVersion } from "@/types/game";
import type {
  AmuletSlotState,
  AuxArmourSlotState,
  RingSlotState,
} from "@/types/equipmentSlots";
import {
  formMeldsSlot,
  getFormDefinition,
  type EquipmentSlotForMeld,
} from "@/versioning/formData";

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
  amuletSlots.filter(
    (slot) => slot.kind === "reflection" && slot.modifiers?.sh === undefined
  ).length;

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

const itemIsMelded = (equipState?: string) => equipState === "melded";

export const slotIsEffectivelyMelded = <V extends GameVersion>(
  state: CalculatorState<V>,
  slot: EquipmentSlotForMeld
) => {
  const form = getFormDefinition(state.version, state.form);

  return formMeldsSlot(form, slot);
};

export const getEffectiveEquipmentState = <V extends GameVersion>(
  state: CalculatorState<V>
): CalculatorState<V> => {
  const effective = {
    ...state,
    bodyArmour: { ...state.bodyArmour },
    shieldItem: { ...state.shieldItem },
    orbItem: { ...state.orbItem },
    cloakItem: { ...state.cloakItem },
    bootsItem: { ...state.bootsItem },
    bardingItem: { ...state.bardingItem },
    headgearSlots: [...state.headgearSlots],
    gloveSlots: [...state.gloveSlots],
    ringSlots: [...state.ringSlots],
    amuletSlots: [...state.amuletSlots],
  } as CalculatorState<V>;

  if (
    slotIsEffectivelyMelded(state, "body") ||
    itemIsMelded(state.bodyArmour.equipState)
  ) {
    effective.armour = "none";
    effective.bodyArmour = {
      ...effective.bodyArmour,
      kind: "none",
      enchant: 0,
      ego: "none",
      modifiers: undefined,
    };
    effective.bodyArmourEnchant = 0;
    effective.bodyArmourEgo = "none";
  }

  if (
    slotIsEffectivelyMelded(state, "offhand") ||
    itemIsMelded(state.shieldItem.equipState) ||
    itemIsMelded(state.orbItem.equipState)
  ) {
    effective.shield = "none";
    effective.orb = "none";
    effective.shieldItem = {
      ...effective.shieldItem,
      kind: "none",
      enchant: 0,
      ego: "none",
      modifiers: undefined,
    };
    effective.orbItem = {
      ...effective.orbItem,
      kind: "none",
      ego: "none",
      modifiers: undefined,
    };
    effective.shieldEnchant = 0;
  }

  if (
    slotIsEffectivelyMelded(state, "cloak") ||
    itemIsMelded(state.cloakItem.equipState)
  ) {
    effective.cloak = false;
    effective.cloakItem = {
      ...effective.cloakItem,
      present: false,
      enchant: 0,
      modifiers: undefined,
    };
    effective.cloakEnchant = 0;
  }

  if (
    slotIsEffectivelyMelded(state, "boots") ||
    itemIsMelded(state.bootsItem.equipState)
  ) {
    effective.boots = false;
    effective.bootsItem = {
      ...effective.bootsItem,
      present: false,
      enchant: 0,
      modifiers: undefined,
    };
    effective.bootsEnchant = 0;
  }

  if (
    slotIsEffectivelyMelded(state, "barding") ||
    itemIsMelded(state.bardingItem.equipState)
  ) {
    effective.barding = false;
    effective.bardingItem = {
      ...effective.bardingItem,
      present: false,
      enchant: 0,
      modifiers: undefined,
    };
    effective.bardingEnchant = 0;
  }

  effective.headgearSlots = effective.headgearSlots.map((slot) =>
    slotIsEffectivelyMelded(state, "helmet") || itemIsMelded(slot.equipState)
      ? { ...slot, present: false, enchant: 0, modifiers: undefined }
      : slot
  );

  effective.gloveSlots = effective.gloveSlots.map((slot) =>
    slotIsEffectivelyMelded(state, "gloves") || itemIsMelded(slot.equipState)
      ? { ...slot, present: false, enchant: 0, modifiers: undefined }
      : slot
  );

  effective.ringSlots = effective.ringSlots.map((slot) =>
    slotIsEffectivelyMelded(state, "ring") || itemIsMelded(slot.equipState)
      ? { ...slot, kind: "none", plus: 0, modifiers: undefined }
      : slot
  );

  effective.amuletSlots = effective.amuletSlots.map((slot) =>
    slotIsEffectivelyMelded(state, "amulet") || itemIsMelded(slot.equipState)
      ? { ...slot, kind: "none", modifiers: undefined }
      : slot
  );

  return effective;
};

export const getAggregatedEquipmentEffects = <V extends GameVersion>(
  state: CalculatorState<V>
): AggregatedEquipmentEffects => {
  const totals = createEmptyAggregatedEffects();
  const effective = getEffectiveEquipmentState(state);
  const legacy = effective as CalculatorState<V> & LegacyGearState;

  totals.str += legacy.equipmentStr ?? 0;
  totals.dex += legacy.equipmentDex ?? 0;
  totals.int += legacy.equipmentInt ?? 0;
  totals.ac += legacy.equipmentAC ?? 0;
  totals.ev += legacy.equipmentEV ?? 0;
  totals.sh += legacy.equipmentSH ?? 0;
  totals.wizardry += legacy.wizardry ?? 0;

  applyModifierBag(totals, effective.bodyArmour.modifiers);
  applyModifierBag(totals, effective.shieldItem.modifiers);
  applyModifierBag(totals, effective.orbItem.modifiers);
  applyModifierBag(totals, effective.cloakItem.modifiers);
  applyModifierBag(totals, effective.bootsItem.modifiers);
  applyModifierBag(totals, effective.bardingItem.modifiers);
  applyModifierBag(totals, effective.unattributedGear?.modifiers);

  for (const ring of effective.ringSlots) {
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

  for (const amulet of effective.amuletSlots) {
    applyModifierBag(totals, amulet.modifiers);
  }

  for (const slot of effective.headgearSlots) {
    applyModifierBag(totals, slot.modifiers);
  }

  for (const slot of effective.gloveSlots) {
    applyModifierBag(totals, slot.modifiers);
  }

  return totals;
};
