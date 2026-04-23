import AttrInput from "@/components/AttrInput";
import { cn } from "@/lib/utils";
import type { EquipmentModifierBag } from "@/types/equipmentItems";

const modifierFields = [
  ["Str", "str"],
  ["Dex", "dex"],
  ["Int", "int"],
  ["AC", "ac"],
  ["EV", "ev"],
  ["SH", "sh"],
  ["Wiz", "wizardry"],
] as const;

const updateModifierBag = (
  current: EquipmentModifierBag | undefined,
  key: keyof EquipmentModifierBag,
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
  <div className={cn("flex flex-wrap gap-4", className)}>
    {modifierFields.map(([label, key]) => (
      <AttrInput
        key={key}
        label={label}
        value={modifiers?.[key] ?? 0}
        type="number"
        onChange={(value) => onChange(updateModifierBag(modifiers, key, value))}
      />
    ))}
  </div>
);

export default EquipmentModifierInputs;
