import { useState } from "react";
import { createPortal } from "react-dom";
import EquipmentEnchantInput from "@/components/EquipmentEnchantInput";
import EquipmentModifierInputs from "@/components/equipment/EquipmentModifierInputs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RingSlotState } from "@/types/equipmentSlots";

type RingModalConfig = {
  type: "ring";
  title: string;
  value: RingSlotState;
  onSave: (next: RingSlotState, changed: boolean) => void;
};

type EquipmentEditModalProps = {
  config: RingModalConfig;
  onCancel: () => void;
};

const overlayClassName =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6";
const panelClassName =
  "w-full max-w-2xl border border-white bg-card p-6 text-card-foreground shadow-2xl";
const panelStyle = {
  outline: "1px solid white",
  outlineOffset: "-4px",
} as const;

const ringKinds = ["none", "wizardry", "protection", "evasion"] as const;

const isRingBonusKind = (kind: RingSlotState["kind"]) =>
  kind === "protection" || kind === "evasion";

const normalizeRingDraft = (draft: RingSlotState): RingSlotState => ({
  ...draft,
  plus: isRingBonusKind(draft.kind) ? draft.plus : 0,
});

const sameRing = (a: RingSlotState, b: RingSlotState) =>
  JSON.stringify(normalizeRingDraft(a)) === JSON.stringify(normalizeRingDraft(b));

const EquipmentEditModal = ({ config, onCancel }: EquipmentEditModalProps) => {
  const [ringDraft, setRingDraft] = useState<RingSlotState>(config.value);
  const normalizedDraft = normalizeRingDraft(ringDraft);

  return createPortal(
    <div
      data-testid="equipment-edit-modal"
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName} style={panelStyle}>
        <h2 className="text-lg font-semibold">Equipment Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">{config.title}</p>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Ring type
            <Select
              value={ringDraft.kind}
              onValueChange={(value) =>
                setRingDraft((current) =>
                  normalizeRingDraft({
                    ...current,
                    kind: value as RingSlotState["kind"],
                  })
                )
              }
            >
              <SelectTrigger aria-label="Ring type" className="h-8">
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
          </label>
          {isRingBonusKind(ringDraft.kind) ? (
            <EquipmentEnchantInput
              ariaLabel="Ring plus"
              value={ringDraft.plus}
              onChange={(plus) =>
                setRingDraft((current) => ({
                  ...current,
                  plus,
                }))
              }
            />
          ) : null}
          <EquipmentModifierInputs
            modifiers={ringDraft.modifiers}
            onChange={(modifiers) =>
              setRingDraft((current) => ({
                ...current,
                modifiers,
              }))
            }
          />
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            data-testid="cancel-equipment-edit"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            data-testid="save-equipment-edit"
            onClick={() =>
              config.onSave(
                normalizedDraft,
                !sameRing(config.value, normalizedDraft)
              )
            }
          >
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EquipmentEditModal;
