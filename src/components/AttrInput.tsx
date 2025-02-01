import { Input } from "@/components/ui/input";

const parseFloatInput = (value: number | string) => {
  const parsedValue = typeof value === "string" ? parseFloat(value) : value;
  if (!isNaN(parsedValue)) {
    return Math.floor(parsedValue * 10) / 10;
  }
  return 0;
};

const AttrInput = ({
  label,
  value,
  type = "stat",
  onChange,
}: {
  label: string;
  value: number;
  type: "stat" | "skill" | "number";
  onChange: (value: number) => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =
      type === "skill"
        ? parseFloatInput(e.target.value)
        : Number(e.target.value);

    onChange(newValue);
  };

  return (
    <div className="flex flex-row gap-2 items-center justify-center">
      <label className="break-keep">{label}:</label>
      <Input
        type="number"
        className="w-16 h-7"
        min="0"
        max={type === "skill" ? "27" : undefined}
        step={type === "skill" ? "0.1" : undefined}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default AttrInput;
