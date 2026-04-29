import { useState } from "react";
import { X } from "lucide-react";
import EquipmentEditModal from "@/components/equipment/EquipmentEditModal";
import EquipmentSummaryRow from "@/components/equipment/EquipmentSummaryRow";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { getVersionSpecies } from "@/versioning/versionRegistry";

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

type NumericMutationKey =
  | "wildMagic"
  | "subduedMagic"
  | "antiWizardry"
  | "runicMagic"
  | "bigBrainWizardry"
  | "scalesAC"
  | "distortionField"
  | "tenguFlight"
  | "largeBonePlates"
  | "ephemeralShield"
  | "icemail"
  | "condensationShield"
  | "sturdyFrame"
  | "gelatinousBody"
  | "slowReflexes"
  | "strongMutation"
  | "cleverMutation"
  | "agileMutation"
  | "weakMutation"
  | "dopeyMutation"
  | "clumsyMutation"
  | "thinSkeletalStructure";

type BooleanMutationKey = "deformedBody" | "reckless";

type MutationOption =
  | {
      key: NumericMutationKey;
      label: string;
      kind: "number";
      min?: number;
      max?: number;
      defaultValue?: number;
    }
  | {
      key: BooleanMutationKey;
      label: string;
      kind: "boolean";
    };

const mutationOptions: MutationOption[] = [
  { key: "wildMagic", label: "wild magic", kind: "number", min: 0, max: 3 },
  { key: "subduedMagic", label: "subdued magic", kind: "number", min: 0, max: 3 },
  { key: "antiWizardry", label: "disrupted magic", kind: "number", min: 0, max: 3 },
  { key: "runicMagic", label: "runic magic", kind: "number", min: 0, max: 1 },
  {
    key: "bigBrainWizardry",
    label: "big brain wizardry",
    kind: "number",
    min: 0,
    max: 1,
  },
  { key: "scalesAC", label: "mutation AC", kind: "number", defaultValue: 1 },
  { key: "distortionField", label: "repulsion field", kind: "number", min: 0, max: 3 },
  { key: "tenguFlight", label: "evasive flight", kind: "number", min: 0, max: 1 },
  { key: "largeBonePlates", label: "large bone plates", kind: "number", min: 0, max: 3 },
  { key: "ephemeralShield", label: "ephemeral shield", kind: "number", min: 0, max: 1 },
  { key: "icemail", label: "icemail", kind: "number", min: 0, max: 2 },
  {
    key: "condensationShield",
    label: "condensation shield",
    kind: "number",
    min: 0,
    max: 1,
  },
  { key: "sturdyFrame", label: "sturdy frame", kind: "number", min: 0, max: 3 },
  { key: "gelatinousBody", label: "gelatinous body", kind: "number", min: 0, max: 3 },
  { key: "slowReflexes", label: "slow reflexes", kind: "number", min: 0, max: 3 },
  { key: "strongMutation", label: "strong", kind: "number", min: 0, max: 2 },
  { key: "cleverMutation", label: "clever", kind: "number", min: 0, max: 2 },
  { key: "agileMutation", label: "agile", kind: "number", min: 0, max: 2 },
  { key: "weakMutation", label: "weak", kind: "number", min: 0, max: 2 },
  { key: "dopeyMutation", label: "dopey", kind: "number", min: 0, max: 2 },
  { key: "clumsyMutation", label: "clumsy", kind: "number", min: 0, max: 2 },
  {
    key: "thinSkeletalStructure",
    label: "thin skeletal structure",
    kind: "number",
    min: 0,
    max: 3,
  },
  { key: "deformedBody", label: "deformed body", kind: "boolean" },
  { key: "reckless", label: "reckless", kind: "boolean" },
];

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

const formatSignedPart = (label: string, value: number) =>
  value === 0 ? null : `${label}${value > 0 ? "+" : ""}${value}`;

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
  equipState?: string;
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
        equipState: undefined,
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

  const setMutationNumber = (key: NumericMutationKey, value: number) => {
    setState((prev) => {
      if (key === "gelatinousBody") {
        const previousLevel = prev.gelatinousBody ?? 0;

        return {
          ...prev,
          gelatinousBody: value,
          scalesAC: (prev.scalesAC ?? 0) + value - previousLevel,
        };
      }

      return { ...prev, [key]: value };
    });
  };

  const addMutationOption = (key: string) => {
    const option = mutationOptions.find((candidate) => candidate.key === key);
    if (!option) {
      return;
    }

    if (option.kind === "boolean") {
      setState((prev) => ({ ...prev, [option.key]: true }));
      return;
    }

    setMutationNumber(option.key, option.defaultValue ?? 1);
  };

  const removeMutationOption = (option: MutationOption) => {
    if (option.kind === "boolean") {
      setState((prev) => ({ ...prev, [option.key]: false }));
      return;
    }

    setMutationNumber(option.key, 0);
  };

  const activeMutationOptions = mutationOptions.filter((option) =>
    option.kind === "boolean"
      ? state[option.key] === true
      : (state[option.key] ?? 0) !== 0
  );
  const getMutationEffectText = (key: NumericMutationKey) => {
    const value = state[key] ?? 0;
    let parts: Array<string | null> = [];

    switch (key) {
      case "strongMutation":
        parts = [
          formatSignedPart("Str", value * 4),
          formatSignedPart("Dex", -value),
          formatSignedPart("Int", -value),
        ];
        break;
      case "cleverMutation":
        parts = [
          formatSignedPart("Int", value * 4),
          formatSignedPart("Str", -value),
          formatSignedPart("Dex", -value),
        ];
        break;
      case "agileMutation":
        parts = [
          formatSignedPart("Dex", value * 4),
          formatSignedPart("Str", -value),
          formatSignedPart("Int", -value),
        ];
        break;
      case "weakMutation":
        parts = [formatSignedPart("Str", -value * 3)];
        break;
      case "dopeyMutation":
        parts = [formatSignedPart("Int", -value * 3)];
        break;
      case "clumsyMutation":
        parts = [formatSignedPart("Dex", -value * 3)];
        break;
      case "thinSkeletalStructure":
        parts = [formatSignedPart("Dex", value * 2)];
        break;
      case "scalesAC":
        parts = [formatSignedPart("AC", value)];
        break;
    }

    return parts.filter(Boolean).join(" ");
  };
  const speciesData = getVersionSpecies(state.version)[state.species];
  const speciesTraits = [
    ...(speciesData.deformedBody ? ["deformed body"] : []),
    ...(slotCounts.ringSlots > 2 ? [`${slotCounts.ringSlots} rings`] : []),
    ...(slotCounts.gloveSlots > 1 ? [`${slotCounts.gloveSlots} glove slots`] : []),
  ];
  const importedMutationNotes = state.importedMutationNotes ?? [];

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
        {speciesTraits.length > 0 && (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="font-semibold uppercase tracking-[0.18em]">
              Species traits
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {speciesTraits.map((trait) => (
                <span key={trait} className="inline-flex gap-1">
                  <span className="font-medium text-foreground">{trait}</span>
                  <span>already included</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {importedMutationNotes.length > 0 && (
          <div
            data-testid="imported-mutation-traits"
            className="flex flex-col gap-1 text-xs text-muted-foreground"
          >
            <div className="font-semibold uppercase tracking-[0.18em]">
              Imported traits
            </div>
            <div className="flex flex-wrap gap-1.5">
              {importedMutationNotes.map((note, index) => (
                <span
                  key={`${note.label}-${index}`}
                  className="inline-flex items-baseline gap-1 rounded-md border border-border/60 px-2 py-1"
                >
                  <span className="font-medium text-foreground">{note.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <label className="flex max-w-xs flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Add mutation or trait</span>
          <select
            aria-label="Add mutation or trait"
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            value=""
            onChange={(event) => addMutationOption(event.currentTarget.value)}
          >
            <option value="">Choose...</option>
            {mutationOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {activeMutationOptions.length > 0 && (
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
            {activeMutationOptions.map((option) => {
              const effectText =
                option.kind === "number" ? getMutationEffectText(option.key) : "";

              if (option.kind === "boolean") {
                return (
                  <div
                    key={option.key}
                    data-testid={`mutation-control-${option.key}`}
                    className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border/60 px-3 py-2"
                  >
                    <MutationCheckbox
                      label={option.label}
                      checked={state[option.key] === true}
                      onChange={(value) =>
                        setState((prev) => ({ ...prev, [option.key]: value }))
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${option.label}`}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => removeMutationOption(option)}
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={option.key}
                  data-testid={`mutation-control-${option.key}`}
                  className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-1 rounded-md border border-border/60 px-3 py-2"
                >
                  <span className="min-w-0 text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  <Input
                    aria-label={option.label}
                    type="number"
                    className="h-7 w-14"
                    min={option.min}
                    max={option.max}
                    value={state[option.key] ?? 0}
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      setMutationNumber(
                        option.key,
                        option.max !== undefined
                          ? Math.min(value, option.max)
                          : value
                      );
                    }}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${option.label}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => removeMutationOption(option)}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                  {effectText && (
                    <div
                      data-testid={`mutation-effect-${option.key}`}
                      className="col-span-3 text-left text-xs font-semibold leading-none text-foreground whitespace-nowrap"
                    >
                      {effectText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default DynamicEquipmentControls;
