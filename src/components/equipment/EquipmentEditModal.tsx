import { useState, type ReactNode } from "react";
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
import {
  armourOptions,
  orbOptions,
  shieldOptions,
  type BodyArmourEgoKey,
} from "@/types/equipment";
import type {
  BodyArmourItemState,
  FixedAuxItemState,
  OrbItemState,
  ShieldItemState,
} from "@/types/equipmentItems";
import type {
  AmuletSlotState,
  AuxArmourSlotState,
  RingSlotState,
} from "@/types/equipmentSlots";
import { formatBodyArmourSummary } from "@/utils/equipmentSummaryText";

type EquipmentModalConfig =
  | {
      type: "bodyArmour";
      title: string;
      value: BodyArmourItemState;
      bodyArmourEgos: Partial<Record<BodyArmourEgoKey, { name: string }>>;
      onSave: (next: BodyArmourItemState, changed: boolean) => void;
    }
  | {
      type: "shield";
      title: string;
      value: ShieldItemState;
      onSave: (next: ShieldItemState, changed: boolean) => void;
    }
  | {
      type: "orb";
      title: string;
      value: OrbItemState;
      onSave: (next: OrbItemState, changed: boolean) => void;
    }
  | {
      type: "ring";
      title: string;
      value: RingSlotState;
      onSave: (next: RingSlotState, changed: boolean) => void;
    }
  | {
      type: "amulet";
      title: string;
      value: AmuletSlotState;
      onSave: (next: AmuletSlotState, changed: boolean) => void;
    }
  | {
      type: "headgear";
      title: string;
      value: AuxArmourSlotState;
      onSave: (next: AuxArmourSlotState, changed: boolean) => void;
    }
  | {
      type: "gloves";
      title: string;
      value: AuxArmourSlotState;
      onSave: (next: AuxArmourSlotState, changed: boolean) => void;
    }
  | {
      type: "fixedAux";
      title: string;
      value: FixedAuxItemState;
      onSave: (next: FixedAuxItemState, changed: boolean) => void;
    };

type EquipmentEditModalProps = {
  config: EquipmentModalConfig;
  onCancel: () => void;
};

type ModalFrameProps = {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
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
const amuletKinds = ["none", "reflection"] as const;
const headgearKinds = ["none", "hat", "helmet"] as const;
const gloveKinds = ["none", "gloves"] as const;

const normalizeBodyArmourDraft = (
  draft: BodyArmourItemState
): BodyArmourItemState => ({
  ...draft,
  enchant: draft.kind === "none" ? 0 : draft.enchant,
  ego: draft.kind === "none" ? "none" : draft.ego,
});

const isRingBonusKind = (kind: RingSlotState["kind"]) =>
  kind === "protection" || kind === "evasion";

const normalizeRingDraft = (draft: RingSlotState): RingSlotState => ({
  ...draft,
  plus: isRingBonusKind(draft.kind) ? draft.plus : 0,
});

const normalizeHeadgearDraft = (
  draft: AuxArmourSlotState
): AuxArmourSlotState => ({
  ...draft,
  enchant: draft.present ? draft.enchant : 0,
  kind: draft.present ? draft.kind ?? "helmet" : undefined,
});

const normalizeGlovesDraft = (
  draft: AuxArmourSlotState
): AuxArmourSlotState => ({
  ...draft,
  present: draft.present,
  enchant: draft.present ? draft.enchant : 0,
  kind: undefined,
});

const normalizeFixedAuxDraft = (
  draft: FixedAuxItemState
): FixedAuxItemState => ({
  ...draft,
  enchant: draft.present ? draft.enchant : 0,
});

const sameValue = <T,>(a: T, b: T) =>
  JSON.stringify(a) === JSON.stringify(b);

const ModalFrame = ({ title, children, onCancel, onSave }: ModalFrameProps) =>
  createPortal(
    <div
      data-testid="equipment-edit-modal"
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName} style={panelStyle}>
        <h2 className="text-lg font-semibold">Equipment Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            data-testid="cancel-equipment-edit"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button data-testid="save-equipment-edit" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );

const ImportedMetadata = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex flex-col gap-1 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span>{value}</span>
  </div>
);

const BodyArmourEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "bodyArmour" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<BodyArmourItemState>(config.value);
  const normalizedDraft = normalizeBodyArmourDraft(draft);
  const importedBaseArmour =
    config.value.kind !== "none" ? armourOptions[config.value.kind].name : null;
  const importedItemSummary = config.value.displayName
    ? formatBodyArmourSummary(config.value)
    : null;

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() =>
        config.onSave(
          normalizedDraft,
          !sameValue(normalizeBodyArmourDraft(config.value), normalizedDraft)
        )
      }
    >
      {config.value.source === "imported" && importedItemSummary ? (
        <ImportedMetadata label="Imported item" value={importedItemSummary} />
      ) : null}
      {config.value.source === "imported" && importedBaseArmour ? (
        <ImportedMetadata label="Base armour" value={importedBaseArmour} />
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Armour type
        <Select
          value={draft.kind}
          onValueChange={(value) =>
            setDraft((current) =>
              normalizeBodyArmourDraft({
                ...current,
                kind: value as BodyArmourItemState["kind"],
              })
            )
          }
        >
          <SelectTrigger aria-label="Armour" className="h-8">
            <SelectValue placeholder="Armour" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(armourOptions).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {draft.kind !== "none" ? (
        <>
          <EquipmentEnchantInput
            ariaLabel="Body armour enchant"
            value={draft.enchant}
            onChange={(enchant) =>
              setDraft((current) => ({
                ...current,
                enchant,
              }))
            }
          />
          <label className="flex flex-col gap-1 text-sm">
            Body armour ego
            <Select
              value={draft.ego}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  ego: value as BodyArmourEgoKey,
                }))
              }
            >
              <SelectTrigger aria-label="Body armour ego" className="h-8">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(config.bodyArmourEgos) as BodyArmourEgoKey[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {config.bodyArmourEgos[key]?.name ?? key}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </label>
        </>
      ) : null}
      <EquipmentModifierInputs
        modifiers={draft.modifiers}
        onChange={(modifiers) =>
          setDraft((current) => ({
            ...current,
            modifiers,
          }))
        }
      />
    </ModalFrame>
  );
};

const ShieldEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "shield" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<ShieldItemState>(config.value);

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() => config.onSave(draft, !sameValue(config.value, draft))}
    >
      <label className="flex flex-col gap-1 text-sm">
        Shield type
        <Select
          value={draft.kind}
          onValueChange={(value) =>
            setDraft((current) => ({
              ...current,
              kind: value as ShieldItemState["kind"],
              enchant: value === "none" ? 0 : current.enchant,
            }))
          }
        >
          <SelectTrigger aria-label="Shield" className="h-8">
            <SelectValue placeholder="Shield" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(shieldOptions).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {draft.kind !== "none" ? (
        <EquipmentEnchantInput
          ariaLabel="Shield enchant"
          value={draft.enchant}
          onChange={(enchant) =>
            setDraft((current) => ({
              ...current,
              enchant,
            }))
          }
        />
      ) : null}
      <EquipmentModifierInputs
        modifiers={draft.modifiers}
        onChange={(modifiers) =>
          setDraft((current) => ({
            ...current,
            modifiers,
          }))
        }
      />
    </ModalFrame>
  );
};

const OrbEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "orb" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<OrbItemState>(config.value);

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() => config.onSave(draft, !sameValue(config.value, draft))}
    >
      <label className="flex flex-col gap-1 text-sm">
        Orb type
        <Select
          value={draft.kind}
          onValueChange={(value) =>
            setDraft((current) => ({
              ...current,
              kind: value as OrbItemState["kind"],
            }))
          }
        >
          <SelectTrigger aria-label="Orb" className="h-8">
            <SelectValue placeholder="Orb" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(orbOptions).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <EquipmentModifierInputs
        modifiers={draft.modifiers}
        onChange={(modifiers) =>
          setDraft((current) => ({
            ...current,
            modifiers,
          }))
        }
      />
    </ModalFrame>
  );
};

const RingEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "ring" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<RingSlotState>(config.value);
  const normalizedDraft = normalizeRingDraft(draft);
  const showRingType = draft.source !== "imported" || draft.kind !== "none";

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() =>
        config.onSave(
          normalizedDraft,
          !sameValue(normalizeRingDraft(config.value), normalizedDraft)
        )
      }
    >
      {showRingType ? (
        <label className="flex flex-col gap-1 text-sm">
          Ring type
          <Select
            value={draft.kind}
            onValueChange={(value) =>
              setDraft((current) =>
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
      ) : null}
      {isRingBonusKind(draft.kind) ? (
        <EquipmentEnchantInput
          ariaLabel="Ring plus"
          value={draft.plus}
          onChange={(plus) =>
            setDraft((current) => ({
              ...current,
              plus,
            }))
          }
        />
      ) : null}
      <EquipmentModifierInputs
        modifiers={draft.modifiers}
        onChange={(modifiers) =>
          setDraft((current) => ({
            ...current,
            modifiers,
          }))
        }
      />
    </ModalFrame>
  );
};

const AmuletEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "amulet" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<AmuletSlotState>(config.value);

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() => config.onSave(draft, !sameValue(config.value, draft))}
    >
      <label className="flex flex-col gap-1 text-sm">
        Amulet type
        <Select
          value={draft.kind}
          onValueChange={(value) =>
            setDraft((current) => ({
              ...current,
              kind: value as AmuletSlotState["kind"],
            }))
          }
        >
          <SelectTrigger aria-label="Amulet type" className="h-8">
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
      </label>
      <EquipmentModifierInputs
        modifiers={draft.modifiers}
        onChange={(modifiers) =>
          setDraft((current) => ({
            ...current,
            modifiers,
          }))
        }
      />
    </ModalFrame>
  );
};

const HeadgearEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "headgear" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<AuxArmourSlotState>(config.value);
  const normalizedDraft = normalizeHeadgearDraft(draft);

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() =>
        config.onSave(
          normalizedDraft,
          !sameValue(normalizeHeadgearDraft(config.value), normalizedDraft)
        )
      }
    >
      <label className="flex flex-col gap-1 text-sm">
        Headgear type
        <Select
          value={draft.present ? draft.kind ?? "helmet" : "none"}
          onValueChange={(value) =>
            setDraft((current) => {
              const nextKind = value as (typeof headgearKinds)[number];
              return normalizeHeadgearDraft({
                ...current,
                present: nextKind !== "none",
                kind: nextKind === "none" ? undefined : nextKind,
              });
            })
          }
        >
          <SelectTrigger aria-label="Headgear type" className="h-8">
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
      </label>
      {draft.present ? (
        <EquipmentEnchantInput
          ariaLabel="Headgear enchant"
          value={draft.enchant}
          onChange={(enchant) =>
            setDraft((current) => ({
              ...current,
              enchant,
            }))
          }
        />
      ) : null}
      <EquipmentModifierInputs
        modifiers={draft.modifiers}
        onChange={(modifiers) =>
          setDraft((current) => ({
            ...current,
            modifiers,
          }))
        }
      />
    </ModalFrame>
  );
};

const GlovesEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "gloves" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<AuxArmourSlotState>(config.value);
  const normalizedDraft = normalizeGlovesDraft(draft);

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() =>
        config.onSave(
          normalizedDraft,
          !sameValue(normalizeGlovesDraft(config.value), normalizedDraft)
        )
      }
    >
      <label className="flex flex-col gap-1 text-sm">
        Gloves
        <Select
          value={draft.present ? "gloves" : "none"}
          onValueChange={(value) =>
            setDraft((current) =>
              normalizeGlovesDraft({
                ...current,
                present: (value as (typeof gloveKinds)[number]) === "gloves",
              })
            )
          }
        >
          <SelectTrigger aria-label="Gloves type" className="h-8">
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
      </label>
      {draft.present ? (
        <EquipmentEnchantInput
          ariaLabel="Gloves enchant"
          value={draft.enchant}
          onChange={(enchant) =>
            setDraft((current) => ({
              ...current,
              enchant,
            }))
          }
        />
      ) : null}
      <EquipmentModifierInputs
        modifiers={draft.modifiers}
        onChange={(modifiers) =>
          setDraft((current) => ({
            ...current,
            modifiers,
          }))
        }
      />
    </ModalFrame>
  );
};

const FixedAuxEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "fixedAux" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<FixedAuxItemState>(config.value);
  const normalizedDraft = normalizeFixedAuxDraft(draft);

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() =>
        config.onSave(
          normalizedDraft,
          !sameValue(normalizeFixedAuxDraft(config.value), normalizedDraft)
        )
      }
    >
      <label className="flex flex-col gap-1 text-sm">
        {config.title}
        <Select
          value={draft.present ? "equipped" : "none"}
          onValueChange={(value) =>
            setDraft((current) =>
              normalizeFixedAuxDraft({
                ...current,
                present: value === "equipped",
              })
            )
          }
        >
          <SelectTrigger aria-label={`${config.title} equipped`} className="h-8">
            <SelectValue placeholder="none" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">none</SelectItem>
            <SelectItem value="equipped">equipped</SelectItem>
          </SelectContent>
        </Select>
      </label>
      {draft.present ? (
        <EquipmentEnchantInput
          ariaLabel={`${config.title} enchant`}
          value={draft.enchant}
          onChange={(enchant) =>
            setDraft((current) => ({
              ...current,
              enchant,
            }))
          }
        />
      ) : null}
      <EquipmentModifierInputs
        modifiers={draft.modifiers}
        onChange={(modifiers) =>
          setDraft((current) => ({
            ...current,
            modifiers,
          }))
        }
      />
    </ModalFrame>
  );
};

const EquipmentEditModal = ({ config, onCancel }: EquipmentEditModalProps) => {
  switch (config.type) {
    case "bodyArmour":
      return <BodyArmourEditor config={config} onCancel={onCancel} />;
    case "shield":
      return <ShieldEditor config={config} onCancel={onCancel} />;
    case "orb":
      return <OrbEditor config={config} onCancel={onCancel} />;
    case "ring":
      return <RingEditor config={config} onCancel={onCancel} />;
    case "amulet":
      return <AmuletEditor config={config} onCancel={onCancel} />;
    case "headgear":
      return <HeadgearEditor config={config} onCancel={onCancel} />;
    case "gloves":
      return <GlovesEditor config={config} onCancel={onCancel} />;
    case "fixedAux":
      return <FixedAuxEditor config={config} onCancel={onCancel} />;
  }
};

export default EquipmentEditModal;
