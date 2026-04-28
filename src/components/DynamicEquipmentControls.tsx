import { useState } from "react";
import AttrInput from "@/components/AttrInput";
import EquipmentEditModal from "@/components/equipment/EquipmentEditModal";
import EquipmentSummaryRow from "@/components/equipment/EquipmentSummaryRow";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CalculatorState } from "@/hooks/useCalculatorState";
import type { FixedAuxItemState } from "@/types/equipmentItems";
import {
  createDefaultAmuletSlot,
  createDefaultAuxArmourSlot,
  createDefaultRingSlot,
  applyRingSlotUpdate,
  type AmuletSlotState,
  type AuxArmourSlotState,
  type RingSlotState,
} from "@/types/equipmentSlots";
import { GameVersion } from "@/types/game";
import {
  formatAmuletSummary,
  formatFixedAuxSummary,
  formatGlovesSummary,
  formatHeadgearSummary,
  formatRingSummary,
} from "@/utils/equipmentSummaryText";
import { coerceSlotArrayLength, getDynamicSlotCounts } from "@/versioning/dynamicSlotCounts";

type DynamicEquipmentControlsProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
  className?: string;
  testId?: string;
};

type FixedAuxEquipmentConfig = {
  key: "cloak" | "boots" | "barding";
  itemKey: "cloakItem" | "bootsItem" | "bardingItem";
  enchantKey: "cloakEnchant" | "bootsEnchant" | "bardingEnchant";
  label: "Cloak" | "Boots" | "Barding" | "Footwear";
};

type OpenEquipment =
  | { type: "ring"; index: number }
  | { type: "amulet"; index: number }
  | { type: "headgear"; index: number }
  | { type: "gloves"; index: number }
  | { type: "fixedAux"; config: FixedAuxEquipmentConfig };

const SectionHeading = ({ children }: { children: string }) => (
  <div className="flex items-center gap-3">
    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
    <div className="h-px flex-1 bg-border/60" />
  </div>
);

const indexedSlotLabel = (label: string, count: number, index: number) =>
  count === 1 ? label : `${label} ${index + 1}`;

const MutationCheckbox = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex h-6 items-center gap-2 text-sm">
    <Checkbox
      aria-label={label}
      checked={checked}
      onCheckedChange={(value) => onChange(value === true)}
    />
    <span className="break-keep">{label}</span>
  </label>
);

const bardingWearerSpecies = new Set(["armataur", "naga", "galeCentaur"]);

const clearImportedItemMetadata = <T extends {
  displayName?: string;
  propertiesText?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: string;
}>(
  item: T,
  changed: boolean
): T =>
  changed
    ? {
        ...item,
        displayName: undefined,
        propertiesText: undefined,
        artifactKind: undefined,
        source: undefined,
      }
    : item;

const DynamicEquipmentControls = <V extends GameVersion>({
  state,
  setState,
  className,
  testId,
}: DynamicEquipmentControlsProps<V>) => {
  const slotCounts = getDynamicSlotCounts(state.version, state.species);
  const [openEquipment, setOpenEquipment] = useState<OpenEquipment | null>(null);

  const ringSlots = coerceSlotArrayLength(
    state.ringSlots,
    slotCounts.ringSlots,
    createDefaultRingSlot
  );
  const amuletSlots = coerceSlotArrayLength(
    state.amuletSlots,
    slotCounts.amuletSlots,
    createDefaultAmuletSlot
  );
  const headgearSlots = coerceSlotArrayLength(
    state.headgearSlots,
    slotCounts.headgearSlots,
    createDefaultAuxArmourSlot
  );
  const gloveSlots = coerceSlotArrayLength(
    state.gloveSlots,
    slotCounts.gloveSlots,
    createDefaultAuxArmourSlot
  );
  const fixedAuxEquipmentConfigs: Record<
    FixedAuxEquipmentConfig["key"],
    FixedAuxEquipmentConfig
  > = {
    cloak: {
      key: "cloak",
      itemKey: "cloakItem",
      label: "Cloak",
      enchantKey: "cloakEnchant",
    },
    boots: {
      key: "boots",
      itemKey: "bootsItem",
      label: "Boots",
      enchantKey: "bootsEnchant",
    },
    barding: {
      key: "barding",
      itemKey: "bardingItem",
      label: "Barding",
      enchantKey: "bardingEnchant",
    },
  };
  const footwearBaseConfig =
    state.bardingItem.present || state.barding
      ? fixedAuxEquipmentConfigs.barding
      : state.bootsItem.present || state.boots
        ? fixedAuxEquipmentConfigs.boots
        : bardingWearerSpecies.has(String(state.species))
          ? fixedAuxEquipmentConfigs.barding
          : fixedAuxEquipmentConfigs.boots;
  const footwearConfig: FixedAuxEquipmentConfig = {
    ...footwearBaseConfig,
    label: "Footwear",
  };

  const updateRingSlot = (
    index: number,
    update: (slot: RingSlotState) => RingSlotState
  ) => {
    setState((prev) => {
      return applyRingSlotUpdate(
        {
          ...prev,
          ringSlots: coerceSlotArrayLength(
            prev.ringSlots,
            slotCounts.ringSlots,
            createDefaultRingSlot
          ),
        },
        index,
        update
      );
    });
  };

  const updateAmuletSlot = (
    index: number,
    update: (slot: AmuletSlotState) => AmuletSlotState
  ) => {
    setState((prev) => {
      const nextAmuletSlots = coerceSlotArrayLength(
        prev.amuletSlots,
        slotCounts.amuletSlots,
        createDefaultAmuletSlot
      );
      nextAmuletSlots[index] = update(
        nextAmuletSlots[index] ?? createDefaultAmuletSlot()
      );

      return {
        ...prev,
        amuletSlots: nextAmuletSlots,
      };
    });
  };

  const updateAuxSlot = (
    key: "headgearSlots" | "gloveSlots",
    count: number,
    index: number,
    update: (slot: AuxArmourSlotState) => AuxArmourSlotState
  ) => {
    setState((prev) => {
      const nextSlots = coerceSlotArrayLength(
        prev[key],
        count,
        createDefaultAuxArmourSlot
      );
      nextSlots[index] = update(nextSlots[index] ?? createDefaultAuxArmourSlot());
      const isHeadgear = key === "headgearSlots";

      return {
        ...prev,
        [key]: nextSlots,
        ...(isHeadgear
          ? { helmet: nextSlots[0]?.kind === "helmet" }
          : {
              gloves: nextSlots[0]?.present ?? false,
              secondGloves: nextSlots[1]?.present ?? false,
            }),
      };
    });
  };

  const updateFixedAuxItem = (
    config: FixedAuxEquipmentConfig,
    next: FixedAuxItemState,
    changed: boolean
  ) => {
    const nextItem = clearImportedItemMetadata(next, changed);

    setState((prev) => ({
      ...prev,
      [config.key]: nextItem.present,
      [config.enchantKey]: nextItem.enchant,
      [config.itemKey]: nextItem,
    }));
  };

  const renderFixedAuxRow = (
    config: FixedAuxEquipmentConfig,
    options?: { key: string; testId: string }
  ) => (
    <EquipmentSummaryRow
      key={options?.key ?? config.key}
      testId={options?.testId ?? `equipment-row-${config.key}`}
      label={config.label}
      summary={formatFixedAuxSummary(state[config.itemKey])}
      onOpen={() => setOpenEquipment({ type: "fixedAux", config })}
    />
  );

  const renderOpenEquipmentModal = () => {
    if (!openEquipment) {
      return null;
    }

    switch (openEquipment.type) {
      case "ring":
        return (
          <EquipmentEditModal
            config={{
              type: "ring",
              title: indexedSlotLabel(
                "Ring",
                slotCounts.ringSlots,
                openEquipment.index
              ),
              value: ringSlots[openEquipment.index] ?? createDefaultRingSlot(),
              onSave: (next, changed) => {
                updateRingSlot(openEquipment.index, () =>
                  clearImportedItemMetadata(next, changed)
                );
                setOpenEquipment(null);
              },
            }}
            onCancel={() => setOpenEquipment(null)}
          />
        );
      case "amulet":
        return (
          <EquipmentEditModal
            config={{
              type: "amulet",
              title: indexedSlotLabel(
                "Amulet",
                slotCounts.amuletSlots,
                openEquipment.index
              ),
              value:
                amuletSlots[openEquipment.index] ?? createDefaultAmuletSlot(),
              onSave: (next, changed) => {
                updateAmuletSlot(openEquipment.index, () =>
                  clearImportedItemMetadata(next, changed)
                );
                setOpenEquipment(null);
              },
            }}
            onCancel={() => setOpenEquipment(null)}
          />
        );
      case "headgear":
        return (
          <EquipmentEditModal
            config={{
              type: "headgear",
              title: indexedSlotLabel(
                "Headgear",
                slotCounts.headgearSlots,
                openEquipment.index
              ),
              value:
                headgearSlots[openEquipment.index] ??
                createDefaultAuxArmourSlot(),
              onSave: (next, changed) => {
                updateAuxSlot(
                  "headgearSlots",
                  slotCounts.headgearSlots,
                  openEquipment.index,
                  () => clearImportedItemMetadata(next, changed)
                );
                setOpenEquipment(null);
              },
            }}
            onCancel={() => setOpenEquipment(null)}
          />
        );
      case "gloves":
        return (
          <EquipmentEditModal
            config={{
              type: "gloves",
              title: indexedSlotLabel(
                "Glove",
                slotCounts.gloveSlots,
                openEquipment.index
              ),
              value:
                gloveSlots[openEquipment.index] ??
                createDefaultAuxArmourSlot(),
              onSave: (next, changed) => {
                updateAuxSlot(
                  "gloveSlots",
                  slotCounts.gloveSlots,
                  openEquipment.index,
                  () => clearImportedItemMetadata(next, changed)
                );
                setOpenEquipment(null);
              },
            }}
            onCancel={() => setOpenEquipment(null)}
          />
        );
      case "fixedAux":
        return (
          <EquipmentEditModal
            config={{
              type: "fixedAux",
              title: openEquipment.config.label,
              value: state[openEquipment.config.itemKey],
              onSave: (next, changed) => {
                updateFixedAuxItem(openEquipment.config, next, changed);
                setOpenEquipment(null);
              },
            }}
            onCancel={() => setOpenEquipment(null)}
          />
        );
    }
  };

  const renderMutationNumber = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    options?: { min?: number; max?: number }
  ) => (
    <AttrInput
      label={label}
      ariaLabel={label}
      value={value}
      type="number"
      min={options?.min}
      max={options?.max}
      onChange={onChange}
    />
  );

  return (
    <div data-testid={testId} className={cn("flex flex-col gap-4", className)}>
      <div data-testid="dynamic-equipment-list" className="flex flex-col gap-1">
        {headgearSlots.map((slot, index) => (
          <EquipmentSummaryRow
            key={`headgear-${index}`}
            testId={`equipment-row-headgear-${index}`}
            label={
              indexedSlotLabel("Headgear", slotCounts.headgearSlots, index)
            }
            summary={formatHeadgearSummary(slot)}
            onOpen={() => setOpenEquipment({ type: "headgear", index })}
          />
        ))}
        {renderFixedAuxRow(fixedAuxEquipmentConfigs.cloak)}
        {gloveSlots.map((slot, index) => (
          <EquipmentSummaryRow
            key={`glove-${index}`}
            testId={`equipment-row-glove-${index}`}
            label={indexedSlotLabel("Glove", slotCounts.gloveSlots, index)}
            summary={formatGlovesSummary(slot)}
            onOpen={() => setOpenEquipment({ type: "gloves", index })}
          />
        ))}
        {renderFixedAuxRow(footwearConfig, {
          key: "footwear",
          testId: "equipment-row-footwear",
        })}
        {amuletSlots.map((slot, index) => (
          <EquipmentSummaryRow
            key={`amulet-${index}`}
            testId={`equipment-row-amulet-${index}`}
            label={indexedSlotLabel("Amulet", slotCounts.amuletSlots, index)}
            summary={formatAmuletSummary(slot)}
            onOpen={() => setOpenEquipment({ type: "amulet", index })}
          />
        ))}
        {ringSlots.map((slot, index) => (
          <EquipmentSummaryRow
            key={`ring-${index}`}
            testId={`equipment-row-ring-${index}`}
            label={indexedSlotLabel("Ring", slotCounts.ringSlots, index)}
            summary={formatRingSummary(slot)}
            onOpen={() => setOpenEquipment({ type: "ring", index })}
          />
        ))}
      </div>

      {renderOpenEquipmentModal()}

      <section
        data-testid="dynamic-equipment-mutations"
        className="flex flex-col gap-3"
      >
        <SectionHeading>Mutations & Traits</SectionHeading>
        <div className="flex flex-wrap gap-4">
          {renderMutationNumber(
            "wild magic",
            state.wildMagic ?? 0,
            (value) => setState((prev) => ({ ...prev, wildMagic: value })),
            { min: 0, max: 3 }
          )}
          {renderMutationNumber(
            "subdued magic",
            state.subduedMagic ?? 0,
            (value) => setState((prev) => ({ ...prev, subduedMagic: value })),
            { min: 0, max: 3 }
          )}
          {renderMutationNumber(
            "disrupted magic",
            state.antiWizardry ?? 0,
            (value) => setState((prev) => ({ ...prev, antiWizardry: value })),
            { min: 0, max: 3 }
          )}
          {renderMutationNumber(
            "runic magic",
            state.runicMagic ?? 0,
            (value) => setState((prev) => ({ ...prev, runicMagic: value })),
            { min: 0, max: 1 }
          )}
          {renderMutationNumber(
            "big brain wizardry",
            state.bigBrainWizardry ?? 0,
            (value) =>
              setState((prev) => ({ ...prev, bigBrainWizardry: value })),
            { min: 0, max: 1 }
          )}
          {renderMutationNumber(
            "mutation AC",
            state.scalesAC ?? 0,
            (value) => setState((prev) => ({ ...prev, scalesAC: value }))
          )}
          {renderMutationNumber(
            "repulsion field",
            state.distortionField ?? 0,
            (value) => setState((prev) => ({ ...prev, distortionField: value })),
            { min: 0, max: 3 }
          )}
          {renderMutationNumber(
            "evasive flight",
            state.tenguFlight ?? 0,
            (value) => setState((prev) => ({ ...prev, tenguFlight: value })),
            { min: 0, max: 1 }
          )}
          {renderMutationNumber(
            "large bone plates",
            state.largeBonePlates ?? 0,
            (value) => setState((prev) => ({ ...prev, largeBonePlates: value })),
            { min: 0, max: 3 }
          )}
          {renderMutationNumber(
            "icemail",
            state.icemail ?? 0,
            (value) => setState((prev) => ({ ...prev, icemail: value })),
            { min: 0, max: 2 }
          )}
          {renderMutationNumber(
            "condensation shield",
            state.condensationShield ?? 0,
            (value) =>
              setState((prev) => ({ ...prev, condensationShield: value })),
            { min: 0, max: 1 }
          )}
          {renderMutationNumber(
            "sturdy frame",
            state.sturdyFrame ?? 0,
            (value) => setState((prev) => ({ ...prev, sturdyFrame: value })),
            { min: 0, max: 3 }
          )}
          {renderMutationNumber(
            "gelatinous body",
            state.gelatinousBody ?? 0,
            (value) =>
              setState((prev) => {
                const previousLevel = prev.gelatinousBody ?? 0;

                return {
                  ...prev,
                  gelatinousBody: value,
                  scalesAC: (prev.scalesAC ?? 0) + value - previousLevel,
                };
              }),
            { min: 0, max: 3 }
          )}
          {renderMutationNumber(
            "slow reflexes",
            state.slowReflexes ?? 0,
            (value) => setState((prev) => ({ ...prev, slowReflexes: value })),
            { min: 0, max: 3 }
          )}
          <MutationCheckbox
            label="deformed body"
            checked={state.deformedBody === true}
            onChange={(value) =>
              setState((prev) => ({ ...prev, deformedBody: value }))
            }
          />
          <MutationCheckbox
            label="reckless"
            checked={state.reckless === true}
            onChange={(value) =>
              setState((prev) => ({ ...prev, reckless: value }))
            }
          />
        </div>
      </section>

    </div>
  );
};

export default DynamicEquipmentControls;
