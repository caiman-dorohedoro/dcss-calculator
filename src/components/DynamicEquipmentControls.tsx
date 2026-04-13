import AttrInput from "@/components/AttrInput";
import { Checkbox } from "@/components/ui/checkbox";
import EquipmentEnchantInput from "@/components/EquipmentEnchantInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalculatorState } from "@/hooks/useCalculatorState";
import {
  createDefaultAmuletSlot,
  createDefaultAuxArmourSlot,
  createDefaultRingSlot,
  applyRingSlotUpdate,
  clearAmuletSlotMetadata,
  clearAuxArmourSlotMetadata,
  clearRingSlotMetadata,
  type AmuletSlotState,
  type AuxArmourSlotState,
  type RingSlotState,
} from "@/types/equipmentSlots";
import { GameVersion } from "@/types/game";
import { coerceSlotArrayLength, getDynamicSlotCounts } from "@/versioning/dynamicSlotCounts";

type DynamicEquipmentControlsProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
  className?: string;
  testId?: string;
};

const SectionHeading = ({ children }: { children: string }) => (
  <div className="flex items-center gap-3">
    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
    <div className="h-px flex-1 bg-border/60" />
  </div>
);

const ringKinds = ["none", "wizardry", "protection", "evasion"] as const;
const amuletKinds = ["none", "reflection"] as const;
const headgearKinds = ["none", "hat", "helmet"] as const;
const gloveKinds = ["none", "gloves"] as const;

const isRingBonusKind = (kind: RingSlotState["kind"]) =>
  kind === "protection" || kind === "evasion";

const DynamicEquipmentControls = <V extends GameVersion>({
  state,
  setState,
  className,
  testId,
}: DynamicEquipmentControlsProps<V>) => {
  const slotCounts = getDynamicSlotCounts(state.version, state.species);

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

  return (
    <div data-testid={testId} className={cn("flex flex-col gap-4", className)}>
      <section data-testid="dynamic-equipment-rings" className="flex flex-col gap-3">
        <SectionHeading>Rings</SectionHeading>
        <div className="flex flex-col gap-3">
          {ringSlots.map((slot, index) => (
            <div
              key={`ring-${index}`}
              data-testid={`ring-slot-${index}`}
              className="flex flex-col gap-2"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Ring {index + 1}</span>
                <Select
                  value={slot.kind}
                  onValueChange={(value) =>
                    updateRingSlot(index, (current) => {
                      const nextKind = value as RingSlotState["kind"];
                      return {
                        ...clearRingSlotMetadata(current),
                        kind: nextKind,
                        plus: isRingBonusKind(nextKind) ? current.plus : 0,
                      };
                    })
                  }
                >
                  <SelectTrigger className="h-6 w-[160px] gap-2">
                    <SelectValue placeholder="none" />
                  </SelectTrigger>
                  <SelectContent>
                    {ringKinds.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {kind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isRingBonusKind(slot.kind) && (
                  <AttrInput
                    label="Plus"
                    value={slot.plus}
                    type="number"
                    onChange={(value) =>
                      updateRingSlot(index, (current) => ({
                        ...current,
                        plus: value,
                      }))
                    }
                  />
                )}
              </div>
              {slot.displayName && (
                <span className="text-xs text-muted-foreground">
                  {slot.displayName}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section data-testid="dynamic-equipment-amulets" className="flex flex-col gap-3">
        <SectionHeading>Amulets</SectionHeading>
        <div className="flex flex-col gap-3">
          {amuletSlots.map((slot, index) => (
            <div
              key={`amulet-${index}`}
              data-testid={`amulet-slot-${index}`}
              className="flex flex-col gap-2"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Amulet {index + 1}</span>
                <Select
                  value={slot.kind}
                  onValueChange={(value) =>
                    updateAmuletSlot(index, (current) => ({
                      ...clearAmuletSlotMetadata(current),
                      kind: value as AmuletSlotState["kind"],
                    }))
                  }
                >
                  <SelectTrigger className="h-6 w-[160px] gap-2">
                    <SelectValue placeholder="none" />
                  </SelectTrigger>
                  <SelectContent>
                    {amuletKinds.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {kind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {slot.displayName && (
                <span className="text-xs text-muted-foreground">
                  {slot.displayName}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section data-testid="dynamic-equipment-headgear" className="flex flex-col gap-3">
        <SectionHeading>Headgear</SectionHeading>
        <div className="flex flex-col gap-3">
          {headgearSlots.map((slot, index) => (
            <div
              key={`headgear-${index}`}
              data-testid={`headgear-slot-${index}`}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="text-sm font-medium">
                {slotCounts.headgearSlots === 1
                  ? "Headgear:"
                  : `Headgear ${index + 1}`}
              </span>
              {slot.present && (
                <EquipmentEnchantInput
                  ariaLabel={`Headgear ${index + 1} enchant`}
                  value={slot.enchant}
                  onChange={(nextEnchant) =>
                    updateAuxSlot(
                      "headgearSlots",
                      slotCounts.headgearSlots,
                      index,
                      (current) => ({
                        ...current,
                        enchant: nextEnchant,
                      })
                    )
                  }
                />
              )}
              <Select
                value={slot.present ? slot.kind ?? "helmet" : "none"}
                onValueChange={(value) =>
                  updateAuxSlot(
                    "headgearSlots",
                    slotCounts.headgearSlots,
                    index,
                    (current) => {
                      const nextKind = value as (typeof headgearKinds)[number];
                      if (nextKind === "none") {
                        return clearAuxArmourSlotMetadata(current, false);
                      }

                      return {
                        ...clearAuxArmourSlotMetadata(current, true),
                        present: true,
                        kind: nextKind,
                      };
                    }
                  )
                }
              >
                <SelectTrigger className="h-6 w-[160px] gap-2">
                  <SelectValue placeholder="none" />
                </SelectTrigger>
                <SelectContent>
                  {headgearKinds.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {slot.displayName && (
                <span className="text-xs text-muted-foreground">
                  {slot.displayName}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section data-testid="dynamic-equipment-gloves" className="flex flex-col gap-3">
        <SectionHeading>Gloves</SectionHeading>
        <div className="flex flex-col gap-3">
          {gloveSlots.map((slot, index) => (
            <div
              key={`glove-${index}`}
              data-testid={`glove-slot-${index}`}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="text-sm font-medium">Glove {index + 1}</span>
              {slot.present && (
                <EquipmentEnchantInput
                  ariaLabel={`Glove ${index + 1} enchant`}
                  value={slot.enchant}
                  onChange={(nextEnchant) =>
                    updateAuxSlot(
                      "gloveSlots",
                      slotCounts.gloveSlots,
                      index,
                      (current) => ({
                        ...current,
                        enchant: nextEnchant,
                      })
                    )
                  }
                />
              )}
              <Select
                value={slot.present ? "gloves" : "none"}
                onValueChange={(value) =>
                  updateAuxSlot(
                    "gloveSlots",
                    slotCounts.gloveSlots,
                    index,
                    (current) =>
                      clearAuxArmourSlotMetadata(
                        current,
                        (value as (typeof gloveKinds)[number]) === "gloves"
                      )
                  )
                }
              >
                <SelectTrigger className="h-6 w-[160px] gap-2">
                  <SelectValue placeholder="none" />
                </SelectTrigger>
                <SelectContent>
                  {gloveKinds.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {slot.displayName && (
                <span className="text-xs text-muted-foreground">
                  {slot.displayName}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section data-testid="fixed-equipment-controls" className="flex flex-col gap-3">
        <SectionHeading>Fixed Equipment</SectionHeading>
        <div className="flex flex-wrap gap-4">
          {[
            {
              key: "cloak" as const,
              label: "Cloak",
              value: state.cloak ?? false,
              enchant: state.cloakEnchant ?? 0,
              enchantKey: "cloakEnchant" as const,
            },
            {
              key: "boots" as const,
              label: "Boots",
              value: state.boots ?? false,
              enchant: state.bootsEnchant ?? 0,
              enchantKey: "bootsEnchant" as const,
            },
            {
              key: "barding" as const,
              label: "Barding",
              value: state.barding ?? false,
              enchant: state.bardingEnchant ?? 0,
              enchantKey: "bardingEnchant" as const,
            },
          ].map(({ key, label, value, enchant, enchantKey }) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span>{label}</span>
              {value && (
                <EquipmentEnchantInput
                  ariaLabel={`${label} enchant`}
                  value={enchant}
                  onChange={(nextEnchant) =>
                    setState((prev) => ({
                      ...prev,
                      [enchantKey]: nextEnchant,
                    }))
                  }
                />
              )}
              <Checkbox
                aria-label={`${label} equipped`}
                checked={value}
                onCheckedChange={(checked) =>
                  setState((prev) => ({
                    ...prev,
                    [key]: !!checked,
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section data-testid="dynamic-equipment-modifiers" className="flex flex-col gap-3">
        <SectionHeading>Modifiers</SectionHeading>
        <div className="flex flex-wrap gap-4">
          <AttrInput
            label="Str"
            value={state.equipmentStr ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, equipmentStr: value }))
            }
          />
          <AttrInput
            label="Dex"
            value={state.equipmentDex ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, equipmentDex: value }))
            }
          />
          <AttrInput
            label="Int"
            value={state.equipmentInt ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, equipmentInt: value }))
            }
          />
          <AttrInput
            label="AC"
            value={state.equipmentAC ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, equipmentAC: value }))
            }
          />
          <AttrInput
            label="EV"
            value={state.equipmentEV ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, equipmentEV: value }))
            }
          />
          <AttrInput
            label="SH"
            value={state.equipmentSH ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, equipmentSH: value }))
            }
          />
        </div>
      </section>

      <section data-testid="dynamic-equipment-mutations" className="flex flex-col gap-3">
        <SectionHeading>Mutations</SectionHeading>
        <div className="flex flex-wrap gap-4">
          <AttrInput
            label="wild magic"
            value={state.wildMagic ?? 0}
            type="number"
            max={3}
            onChange={(value) =>
              setState((prev) => ({ ...prev, wildMagic: value }))
            }
          />
          <AttrInput
            label="subdued magic"
            value={state.subduedMagic ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, subduedMagic: value }))
            }
          />
          <AttrInput
            label="anti-wizardry"
            value={state.antiWizardry ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, antiWizardry: value }))
            }
          />
          <AttrInput
            label="runic magic"
            value={state.runicMagic ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, runicMagic: value }))
            }
          />
          <AttrInput
            label="big brain wizardry"
            value={state.bigBrainWizardry ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, bigBrainWizardry: value }))
            }
          />
          <AttrInput
            label="scales AC"
            value={state.scalesAC ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, scalesAC: value }))
            }
          />
          <AttrInput
            label="distortion field"
            value={state.distortionField ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, distortionField: value }))
            }
          />
          <AttrInput
            label="tengu flight"
            value={state.tenguFlight ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, tenguFlight: value }))
            }
          />
          <AttrInput
            label="large bone plates"
            value={state.largeBonePlates ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, largeBonePlates: value }))
            }
          />
        </div>
      </section>

    </div>
  );
};

export default DynamicEquipmentControls;
