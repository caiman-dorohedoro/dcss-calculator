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
  type EquipmentEgoKey,
} from "@/types/equipment";
import type {
  BodyArmourItemState,
  EquipmentModifierBag,
  FixedAuxItemState,
  OrbItemState,
  ShieldItemState,
} from "@/types/equipmentItems";
import type {
  AmuletSlotState,
  AuxArmourSlotState,
  RingSlotState,
} from "@/types/equipmentSlots";
import {
  getEquipmentEgoOptionsForBaseName,
  syncEquipmentEgoModifiers,
  type EquipmentEgoOptionEntry,
} from "@/utils/equipmentEgos";
import { formatBodyArmourSummary } from "@/utils/equipmentSummaryText";

type EquipmentModalConfig =
  | {
      type: "bodyArmour";
      title: string;
      value: BodyArmourItemState;
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

const coerceEquipmentEgoForBaseName = (
  ego: EquipmentEgoKey | undefined,
  baseName: string | null | undefined
): EquipmentEgoKey => {
  const currentEgo = ego ?? "none";
  return getEquipmentEgoOptionsForBaseName(baseName, currentEgo).some(
    ([key]) => key === currentEgo
  )
    ? currentEgo
    : "none";
};

const syncDraftEgoForBaseName = <T extends {
  ego?: EquipmentEgoKey;
  modifiers?: EquipmentModifierBag;
}>(
  draft: T,
  baseName: string | null | undefined
): T & { ego: EquipmentEgoKey } => {
  const previousEgo = draft.ego ?? "none";
  const nextEgo = coerceEquipmentEgoForBaseName(previousEgo, baseName);
  return {
    ...draft,
    ego: nextEgo,
    modifiers:
      nextEgo === previousEgo
        ? draft.modifiers
        : syncEquipmentEgoModifiers(draft.modifiers, previousEgo, nextEgo),
  };
};

const getBodyArmourBaseName = (kind: BodyArmourItemState["kind"]) =>
  kind === "none" ? null : armourOptions[kind].name;

const getShieldBaseName = (kind: ShieldItemState["kind"]) =>
  kind === "none" ? null : shieldOptions[kind].name;

const getOrbBaseName = (kind: OrbItemState["kind"]) =>
  kind === "energy" ? "orb" : null;

const getHeadgearBaseName = (draft: AuxArmourSlotState) =>
  draft.present ? draft.kind ?? "helmet" : null;

const getGlovesBaseName = (draft: AuxArmourSlotState) =>
  draft.present ? "gloves" : null;

const getFixedAuxBaseName = (draft: FixedAuxItemState) =>
  draft.present ? draft.kind : null;

const normalizeBodyArmourDraft = (
  draft: BodyArmourItemState
): BodyArmourItemState => ({
  ...draft,
  enchant: draft.kind === "none" ? 0 : draft.enchant,
  ego: draft.kind === "none" ? "none" : draft.ego,
});

const normalizeShieldDraft = (draft: ShieldItemState): ShieldItemState => ({
  ...draft,
  enchant: draft.kind === "none" ? 0 : draft.enchant,
  ego: draft.kind === "none" ? "none" : draft.ego ?? "none",
});

const normalizeOrbDraft = (draft: OrbItemState): OrbItemState => ({
  ...draft,
  ego: draft.kind === "none" ? "none" : draft.ego ?? "none",
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
  ego: draft.present ? draft.ego ?? "none" : "none",
});

const normalizeGlovesDraft = (
  draft: AuxArmourSlotState
): AuxArmourSlotState => ({
  ...draft,
  present: draft.present,
  enchant: draft.present ? draft.enchant : 0,
  kind: undefined,
  ego: draft.present ? draft.ego ?? "none" : "none",
});

const normalizeFixedAuxDraft = (
  draft: FixedAuxItemState
): FixedAuxItemState => ({
  ...draft,
  enchant: draft.present ? draft.enchant : 0,
  ego: draft.present ? draft.ego ?? "none" : "none",
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

const EquipmentEgoSelect = ({
  label,
  ariaLabel,
  baseName,
  value,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  baseName: string | null | undefined;
  value: EquipmentEgoKey | undefined;
  onChange: (ego: EquipmentEgoKey) => void;
}) => {
  const options = getEquipmentEgoOptionsForBaseName(baseName, value);

  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <Select
        value={value ?? "none"}
        onValueChange={(next) => onChange(next as EquipmentEgoKey)}
      >
        <SelectTrigger aria-label={ariaLabel} className="h-8">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          {options.map(([key, option]: EquipmentEgoOptionEntry) => (
            <SelectItem key={key} value={key}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
};

const BodyArmourEditor = ({
  config,
  onCancel,
}: {
  config: Extract<EquipmentModalConfig, { type: "bodyArmour" }>;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<BodyArmourItemState>(() =>
    normalizeBodyArmourDraft(
      syncDraftEgoForBaseName(
        config.value,
        getBodyArmourBaseName(config.value.kind)
      )
    )
  );
  const normalizedDraft = normalizeBodyArmourDraft(draft);
  const importedBaseArmour =
    config.value.kind !== "none" ? armourOptions[config.value.kind].name : null;
  const importedItemSummary = config.value.displayName
    ? formatBodyArmourSummary(config.value)
    : null;
  const bodyArmourBaseName = getBodyArmourBaseName(draft.kind);

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
            setDraft((current) => {
              const kind = value as BodyArmourItemState["kind"];
              return normalizeBodyArmourDraft(
                syncDraftEgoForBaseName(
                  {
                    ...current,
                    kind,
                  },
                  getBodyArmourBaseName(kind)
                )
              );
            })
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
          <EquipmentEgoSelect
            label="Body armour ego"
            ariaLabel="Body armour ego"
            baseName={bodyArmourBaseName}
            value={draft.ego}
            onChange={(ego) =>
              setDraft((current) => ({
                ...current,
                ego,
                modifiers: syncEquipmentEgoModifiers(
                  current.modifiers,
                  current.ego ?? "none",
                  ego
                ),
              }))
            }
          />
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
  const [draft, setDraft] = useState<ShieldItemState>(() =>
    normalizeShieldDraft(
      syncDraftEgoForBaseName(config.value, getShieldBaseName(config.value.kind))
    )
  );
  const normalizedDraft = normalizeShieldDraft(draft);

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() =>
        config.onSave(
          normalizedDraft,
          !sameValue(normalizeShieldDraft(config.value), normalizedDraft)
        )
      }
    >
      <label className="flex flex-col gap-1 text-sm">
        Shield type
        <Select
          value={draft.kind}
          onValueChange={(value) =>
            setDraft((current) => {
              const kind = value as ShieldItemState["kind"];
              return normalizeShieldDraft(
                syncDraftEgoForBaseName(
                  {
                    ...current,
                    kind,
                    enchant: kind === "none" ? 0 : current.enchant,
                  },
                  getShieldBaseName(kind)
                )
              );
            })
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
      {draft.kind !== "none" ? (
        <EquipmentEgoSelect
          label="Shield ego"
          ariaLabel="Shield ego"
          baseName={getShieldBaseName(draft.kind)}
          value={draft.ego}
          onChange={(ego) =>
            setDraft((current) => ({
              ...current,
              ego,
              modifiers: syncEquipmentEgoModifiers(
                current.modifiers,
                current.ego ?? "none",
                ego
              ),
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
  const [draft, setDraft] = useState<OrbItemState>(() =>
    normalizeOrbDraft(
      syncDraftEgoForBaseName(config.value, getOrbBaseName(config.value.kind))
    )
  );
  const normalizedDraft = normalizeOrbDraft(draft);
  const orbBaseName = getOrbBaseName(draft.kind);

  return (
    <ModalFrame
      title={config.title}
      onCancel={onCancel}
      onSave={() =>
        config.onSave(
          normalizedDraft,
          !sameValue(normalizeOrbDraft(config.value), normalizedDraft)
        )
      }
    >
      <label className="flex flex-col gap-1 text-sm">
        Orb type
        <Select
          value={draft.kind}
          onValueChange={(value) =>
            setDraft((current) => {
              const kind = value as OrbItemState["kind"];
              return normalizeOrbDraft(
                syncDraftEgoForBaseName(
                  {
                    ...current,
                    kind,
                  },
                  getOrbBaseName(kind)
                )
              );
            })
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
      {orbBaseName ? (
        <EquipmentEgoSelect
          label="Orb ego"
          ariaLabel="Orb ego"
          baseName={orbBaseName}
          value={draft.ego}
          onChange={(ego) =>
            setDraft((current) => ({
              ...current,
              ego,
              modifiers: syncEquipmentEgoModifiers(
                current.modifiers,
                current.ego ?? "none",
                ego
              ),
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
  const [draft, setDraft] = useState<AuxArmourSlotState>(() =>
    normalizeHeadgearDraft(
      syncDraftEgoForBaseName(config.value, getHeadgearBaseName(config.value))
    )
  );
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
              const nextDraft = normalizeHeadgearDraft({
                ...current,
                present: nextKind !== "none",
                kind: nextKind === "none" ? undefined : nextKind,
              });
              return syncDraftEgoForBaseName(
                nextDraft,
                getHeadgearBaseName(nextDraft)
              );
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
      {draft.present ? (
        <EquipmentEgoSelect
          label="Headgear ego"
          ariaLabel="Headgear ego"
          baseName={getHeadgearBaseName(draft)}
          value={draft.ego}
          onChange={(ego) =>
            setDraft((current) => ({
              ...current,
              ego,
              modifiers: syncEquipmentEgoModifiers(
                current.modifiers,
                current.ego ?? "none",
                ego
              ),
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
  const [draft, setDraft] = useState<AuxArmourSlotState>(() =>
    normalizeGlovesDraft(
      syncDraftEgoForBaseName(config.value, getGlovesBaseName(config.value))
    )
  );
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
            setDraft((current) => {
              const nextDraft = normalizeGlovesDraft({
                ...current,
                present: (value as (typeof gloveKinds)[number]) === "gloves",
              });
              return syncDraftEgoForBaseName(
                nextDraft,
                getGlovesBaseName(nextDraft)
              );
            })
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
      {draft.present ? (
        <EquipmentEgoSelect
          label="Gloves ego"
          ariaLabel="Gloves ego"
          baseName={getGlovesBaseName(draft)}
          value={draft.ego}
          onChange={(ego) =>
            setDraft((current) => ({
              ...current,
              ego,
              modifiers: syncEquipmentEgoModifiers(
                current.modifiers,
                current.ego ?? "none",
                ego
              ),
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
  const [draft, setDraft] = useState<FixedAuxItemState>(() =>
    normalizeFixedAuxDraft(
      syncDraftEgoForBaseName(config.value, getFixedAuxBaseName(config.value))
    )
  );
  const normalizedDraft = normalizeFixedAuxDraft(draft);
  const isCloakSlot =
    config.value.kind === "cloak" || config.value.kind === "scarf";
  const equippedValue = isCloakSlot
    ? draft.present
      ? draft.kind
      : "none"
    : draft.present
      ? "equipped"
      : "none";

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
          value={equippedValue}
          onValueChange={(value) =>
            setDraft((current) => {
              const nextDraft = normalizeFixedAuxDraft(
                isCloakSlot
                  ? {
                      ...current,
                      kind:
                        value === "none"
                          ? current.kind
                          : value === "scarf"
                            ? "scarf"
                            : "cloak",
                      present: value !== "none",
                    }
                  : {
                      ...current,
                      present: value === "equipped",
                    }
              );
              return syncDraftEgoForBaseName(
                nextDraft,
                getFixedAuxBaseName(nextDraft)
              );
            })
          }
        >
          <SelectTrigger
            aria-label={isCloakSlot ? "Cloak type" : `${config.title} equipped`}
            className="h-8"
          >
            <SelectValue placeholder="none" />
          </SelectTrigger>
          <SelectContent>
            {isCloakSlot ? (
              <>
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="cloak">cloak</SelectItem>
                <SelectItem value="scarf">scarf</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="equipped">equipped</SelectItem>
              </>
            )}
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
      {draft.present ? (
        <EquipmentEgoSelect
          label={`${config.title} ego`}
          ariaLabel={`${config.title} ego`}
          baseName={getFixedAuxBaseName(draft)}
          value={draft.ego}
          onChange={(ego) =>
            setDraft((current) => ({
              ...current,
              ego,
              modifiers: syncEquipmentEgoModifiers(
                current.modifiers,
                current.ego ?? "none",
                ego
              ),
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
