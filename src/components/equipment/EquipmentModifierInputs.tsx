import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EquipmentModifierBag } from "@/types/equipmentItems";

type BooleanModifierKey = "sInv";
type NumericModifierKey = Exclude<
  keyof EquipmentModifierBag,
  "flags" | BooleanModifierKey
>;
type NumericModifierField = {
  label: string;
  key: NumericModifierKey;
};

const numericModifierColumns: Array<{
  id: string;
  fields: NumericModifierField[];
}> = [
  {
    id: "resists",
    fields: [
      { label: "rF", key: "rF" },
      { label: "rC", key: "rC" },
      { label: "rN", key: "rN" },
      { label: "rPois", key: "rPois" },
      { label: "rElec", key: "rElec" },
      { label: "rCorr", key: "rCorr" },
      { label: "Will", key: "will" },
    ],
  },
  {
    id: "defense-stats",
    fields: [
      { label: "AC", key: "ac" },
      { label: "EV", key: "ev" },
      { label: "SH", key: "sh" },
      { label: "Str", key: "str" },
      { label: "Int", key: "int" },
      { label: "Dex", key: "dex" },
    ],
  },
  {
    id: "regen-pools",
    fields: [
      { label: "RegenHP", key: "regen" },
      { label: "RegenMP", key: "regenMP" },
      { label: "HP", key: "hp" },
      { label: "MP", key: "mp" },
    ],
  },
  {
    id: "magic",
    fields: [
      { label: "Slay", key: "slay" },
      { label: "Stlth", key: "stlth" },
      { label: "Wiz", key: "wizardry" },
    ],
  },
];

const activeModifierInputClassName =
  "border-[#a7a7a7] bg-[#a7a7a7]/10 shadow-[0_0_0_1px_rgba(167,167,167,0.35)]";

const normalizeFlags = (value: string) => {
  const flags = value
    .split(/[,\s]+/)
    .map((flag) => flag.trim())
    .filter(Boolean);

  return [...new Set(flags)];
};

const updateNumericModifierBag = (
  current: EquipmentModifierBag | undefined,
  key: NumericModifierKey,
  value: number
) => {
  const next = { ...(current ?? {}) };

  if (value === 0) {
    delete next[key];
  } else {
    next[key] = value;
  }

  return Object.keys(next).length > 0 ? next : undefined;
};

const updateBooleanModifierBag = (
  current: EquipmentModifierBag | undefined,
  key: BooleanModifierKey,
  checked: boolean
) => {
  const next = { ...(current ?? {}) };

  if (checked) {
    next[key] = 1;
  } else {
    delete next[key];
  }

  return Object.keys(next).length > 0 ? next : undefined;
};

const updateFlags = (
  current: EquipmentModifierBag | undefined,
  value: string
) => {
  const next = { ...(current ?? {}) };
  const flags = normalizeFlags(value);

  if (flags.length === 0) {
    delete next.flags;
  } else {
    next.flags = flags;
  }

  return Object.keys(next).length > 0 ? next : undefined;
};

type EquipmentModifierInputsProps = {
  modifiers?: EquipmentModifierBag;
  onChange: (next: EquipmentModifierBag | undefined) => void;
  className?: string;
};

const ModifierNumberInput = ({
  field,
  value,
  onChange,
}: {
  field: NumericModifierField;
  value: number;
  onChange: (value: number) => void;
}) => (
  <label className="grid grid-cols-[4.5rem_4rem] items-center gap-2 text-sm">
    <span className="text-right text-muted-foreground">{field.label}:</span>
    <Input
      aria-label={`${field.label} modifier`}
      type="number"
      className={cn(
        "h-6 w-16 px-2",
        value ? activeModifierInputClassName : undefined
      )}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </label>
);

const ModifierCheckboxInput = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="mt-2 grid grid-cols-[4.5rem_4rem] items-center gap-2 border-t border-border/60 pt-2 text-sm">
    <span className="text-right text-muted-foreground">{label}:</span>
    <Checkbox
      aria-label={`${label} property`}
      checked={checked}
      className={cn(
        "ml-2",
        checked
          ? "border-[#a7a7a7] bg-[#a7a7a7]/20 shadow-[0_0_0_1px_rgba(167,167,167,0.35)]"
          : undefined
      )}
      onCheckedChange={(value) => onChange(value === true)}
    />
  </label>
);

const EquipmentModifierInputs = ({
  modifiers,
  onChange,
  className,
}: EquipmentModifierInputsProps) => (
  <div className={cn("space-y-3", className)}>
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
      {numericModifierColumns.map((column) => (
        <div
          key={column.id}
          data-testid={`equipment-modifier-column-${column.id}`}
          className="flex flex-col gap-2"
        >
          {column.fields.map((field) => (
            <ModifierNumberInput
              key={field.key}
              field={field}
              value={modifiers?.[field.key] ?? 0}
              onChange={(value) =>
                onChange(updateNumericModifierBag(modifiers, field.key, value))
              }
            />
          ))}
          {column.id === "resists" ? (
            <ModifierCheckboxInput
              label="SInv"
              checked={Boolean(modifiers?.sInv)}
              onChange={(checked) =>
                onChange(updateBooleanModifierBag(modifiers, "sInv", checked))
              }
            />
          ) : null}
        </div>
      ))}
    </div>
    <label className="flex flex-col gap-1 text-sm">
      Other properties
      <Input
        aria-label="Other properties"
        className="h-8"
        placeholder="Example: Ponderous Reflect Spirit +Inv Fly shock"
        value={modifiers?.flags?.join(" ") ?? ""}
        onChange={(event) => onChange(updateFlags(modifiers, event.target.value))}
      />
    </label>
  </div>
);

export default EquipmentModifierInputs;
