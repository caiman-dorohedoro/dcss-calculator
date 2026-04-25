import AttrInput from "@/components/AttrInput";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EquipmentModifierBag } from "@/types/equipmentItems";

type NumericModifierKey = Exclude<keyof EquipmentModifierBag, "flags">;

const numericModifierFields: Array<[string, NumericModifierKey]> = [
  ["rF", "rF"],
  ["rC", "rC"],
  ["rN", "rN"],
  ["Will", "will"],
  ["RegenMP", "regenMP"],
  ["Regen", "regen"],
  ["MP", "mp"],
  ["Str", "str"],
  ["Dex", "dex"],
  ["Int", "int"],
  ["Slay", "slay"],
  ["AC", "ac"],
  ["EV", "ev"],
  ["SH", "sh"],
  ["HP", "hp"],
  ["Stlth", "stlth"],
  ["Wiz", "wizardry"],
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

const EquipmentModifierInputs = ({
  modifiers,
  onChange,
  className,
}: EquipmentModifierInputsProps) => (
  <div className={cn("space-y-3", className)}>
    <div className="flex flex-wrap gap-4">
      {numericModifierFields.map(([label, key]) => (
        <AttrInput
          key={key}
          label={label}
          ariaLabel={`${label} modifier`}
          value={modifiers?.[key] ?? 0}
          type="number"
          inputClassName={
            modifiers?.[key] ? activeModifierInputClassName : undefined
          }
          onChange={(value) =>
            onChange(updateNumericModifierBag(modifiers, key, value))
          }
        />
      ))}
    </div>
    <label className="flex flex-col gap-1 text-sm">
      Item flags
      <Input
        aria-label="Item flags"
        className="h-8"
        placeholder="Example: Ponderous Reflect Spirit +Inv rCorr SInv"
        value={modifiers?.flags?.join(" ") ?? ""}
        onChange={(event) => onChange(updateFlags(modifiers, event.target.value))}
      />
    </label>
  </div>
);

export default EquipmentModifierInputs;
