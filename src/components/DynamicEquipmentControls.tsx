import AttrInput from "@/components/AttrInput";
import { Checkbox } from "@/components/ui/checkbox";
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
import { BodyArmourEgoKey } from "@/types/equipment.ts";
import { GameVersion } from "@/types/game";
import { coerceSlotArrayLength, getDynamicSlotCounts } from "@/versioning/dynamicSlotCounts";
import { getBodyArmourEgoOptions } from "@/versioning/equipmentData";

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

const isRingBonusKind = (kind: RingSlotState["kind"]) =>
  kind === "protection" || kind === "evasion";

const DynamicEquipmentControls = <V extends GameVersion>({
  state,
  setState,
  className,
  testId,
}: DynamicEquipmentControlsProps<V>) => {
  const slotCounts = getDynamicSlotCounts(state.version, state.species);
  const bodyArmourEgos = getBodyArmourEgoOptions(state.version);
  const selectedBodyArmourEgo =
    state.bodyArmourEgo !== undefined && state.bodyArmourEgo in bodyArmourEgos
      ? state.bodyArmourEgo
      : "none";

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
          ? { helmet: nextSlots[0]?.present ?? false }
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
        <SectionHeading>Jewellery</SectionHeading>
        <div className="flex flex-col gap-3">
          {ringSlots.map((slot, index) => (
            <div
              key={`ring-${index}`}
              data-testid={`ring-slot-${index}`}
              className="flex flex-col gap-2 rounded-md border border-border/60 px-3 py-2"
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
              className="flex flex-col gap-2 rounded-md border border-border/60 px-3 py-2"
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
              className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 px-3 py-2"
            >
              <span className="text-sm font-medium">Headgear {index + 1}</span>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={slot.present}
                  onCheckedChange={(checked) =>
                    updateAuxSlot(
                      "headgearSlots",
                      slotCounts.headgearSlots,
                      index,
                      (current) =>
                        clearAuxArmourSlotMetadata(current, !!checked)
                    )
                  }
                />
                present
              </label>
              {slot.present && (
                <AttrInput
                  label="Enchant"
                  value={slot.enchant}
                  type="number"
                  onChange={(value) =>
                    updateAuxSlot(
                      "headgearSlots",
                      slotCounts.headgearSlots,
                      index,
                      (current) => ({
                        ...current,
                        enchant: value,
                      })
                    )
                  }
                />
              )}
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
              className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 px-3 py-2"
            >
              <span className="text-sm font-medium">Glove {index + 1}</span>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={slot.present}
                  onCheckedChange={(checked) =>
                    updateAuxSlot(
                      "gloveSlots",
                      slotCounts.gloveSlots,
                      index,
                      (current) =>
                        clearAuxArmourSlotMetadata(current, !!checked)
                    )
                  }
                />
                present
              </label>
              {slot.present && (
                <AttrInput
                  label="Enchant"
                  value={slot.enchant}
                  type="number"
                  onChange={(value) =>
                    updateAuxSlot(
                      "gloveSlots",
                      slotCounts.gloveSlots,
                      index,
                      (current) => ({
                        ...current,
                        enchant: value,
                      })
                    )
                  }
                />
              )}
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
            },
            {
              key: "boots" as const,
              label: "Boots",
              value: state.boots ?? false,
            },
            {
              key: "barding" as const,
              label: "Barding",
              value: state.barding ?? false,
            },
          ].map(({ key, label, value }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={value}
                onCheckedChange={(checked) =>
                  setState((prev) => ({
                    ...prev,
                    [key]: !!checked,
                  }))
                }
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section data-testid="dynamic-equipment-modifiers" className="flex flex-col gap-3">
        <SectionHeading>Modifiers</SectionHeading>
        <div className="flex flex-wrap gap-4">
          <AttrInput
            label="body armour enchant"
            value={state.bodyArmourEnchant ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, bodyArmourEnchant: value }))
            }
          />
          <AttrInput
            label="shield enchant"
            value={state.shieldEnchant ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, shieldEnchant: value }))
            }
          />
          <AttrInput
            label="boots enchant"
            value={state.bootsEnchant ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, bootsEnchant: value }))
            }
          />
          <AttrInput
            label="cloak enchant"
            value={state.cloakEnchant ?? 0}
            type="number"
            onChange={(value) =>
              setState((prev) => ({ ...prev, cloakEnchant: value }))
            }
          />
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

      <section data-testid="dynamic-equipment-body-armour-ego" className="flex flex-col gap-3">
        <SectionHeading>Body Armour</SectionHeading>
        <div className="flex flex-row items-center gap-2 flex-wrap">
          <span>body armour ego</span>
          <Select
            disabled={state.armour === "none"}
            value={selectedBodyArmourEgo}
            onValueChange={(value) =>
              setState((prev) => ({
                ...prev,
                bodyArmourEgo: value as BodyArmourEgoKey,
              }))
            }
          >
            <SelectTrigger className="min-w-[120px] h-6 w-auto gap-2">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(bodyArmourEgos) as BodyArmourEgoKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {bodyArmourEgos[key]?.name ?? key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>
    </div>
  );
};

export default DynamicEquipmentControls;
