import { Input } from "@/components/ui/input";

type EquipmentEnchantInputProps = {
  ariaLabel: string;
  value: number;
  onChange: (value: number) => void;
};

const EquipmentEnchantInput = ({
  ariaLabel,
  value,
  onChange,
}: EquipmentEnchantInputProps) => {
  return (
    <Input
      aria-label={ariaLabel}
      type="number"
      className="h-6 w-14"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
};

export default EquipmentEnchantInput;
