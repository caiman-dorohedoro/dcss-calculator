import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  SpeciesKey,
  ShieldKey,
  speciesOptions,
  shieldOptions,
  calculateEVForSkillLevel,
} from "../utils/evCalculations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type DataPoint = {
  dodgeSkill: number;
  baseEV: number;
  rawDodgeBonus: number;
  actualDodgeBonus: number;
  dodgeModifier: number;
  shieldPenalty: number;
  armourPenalty: number;
  finalEV: number;
};

// Add this type
type ChartDataKey = keyof DataPoint;

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

const EVCalculator = () => {
  const [dexterity, setDexterity] = useState(10);
  const [strength, setStrength] = useState(10);
  const [species, setSpecies] = useState<SpeciesKey>("medium");
  const [shield, setShield] = useState<ShieldKey>("none");
  const [armourER, setArmourER] = useState(0);
  const [shieldSkill, setShieldSkill] = useState(0);
  const [armourSkill, setArmourSkill] = useState(0);
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const calculateEV = () => {
      const newData = [];

      // Calculate for dodging skill 0 to 27
      for (let dodge = 0; dodge <= 27; dodge += 0.1) {
        // Use the utility function for calculations
        const result = calculateEVForSkillLevel({
          dodgeSkill: dodge,
          dexterity,
          strength,
          species,
          shield,
          armourER,
          shieldSkill,
          armourSkill,
        });

        newData.push({
          dodgeSkill: parseFloat(dodge.toFixed(1)),
          baseEV: result.baseEV,
          rawDodgeBonus: result.rawDodgeBonus,
          actualDodgeBonus: result.actualDodgeBonus,
          dodgeModifier: parseFloat(result.dodgeModifier.toFixed(2)),
          shieldPenalty: result.shieldPenalty,
          armourPenalty: result.armourPenalty,
          finalEV: result.finalEV,
        });
      }
      setData(newData);
    };

    calculateEV();
  }, [
    dexterity,
    strength,
    species,
    shield,
    armourER,
    shieldSkill,
    armourSkill,
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <AttrInput
            label="Str"
            value={strength}
            type="stat"
            onChange={setStrength}
          />
          <AttrInput
            label="Dex"
            value={dexterity}
            type="stat"
            onChange={setDexterity}
          />
        </div>
        <div className="flex flex-row gap-2">
          <AttrInput
            label="Shield Skill"
            value={shieldSkill}
            type="skill"
            onChange={setShieldSkill}
          />
          <AttrInput
            label="Armour Skill"
            value={armourSkill}
            type="skill"
            onChange={setArmourSkill}
          />
        </div>
        <label className="flex flex-row items-center gap-2">
          Species:
          <Select
            value={species}
            onValueChange={(value) => setSpecies(value as SpeciesKey)}
          >
            <SelectTrigger className="w-[200px] h-8">
              <SelectValue placeholder="Species" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(speciesOptions).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-row items-center gap-2">
          Shield:
          <Select
            value={shield}
            onValueChange={(value) => setShield(value as ShieldKey)}
          >
            <SelectTrigger className="w-[200px] h-8">
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
        <div className="flex flex-row gap-2">
          <label>
            <AttrInput
              label="Armour Encumbrance"
              value={armourER}
              type="number"
              onChange={setArmourER}
            />
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dodgeSkill"
                label={{
                  value: "회피 스킬 레벨",
                  position: "bottom",
                }}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, name: ChartDataKey) => {
                  const labels: Record<ChartDataKey, string> = {
                    baseEV: "기본 EV",
                    rawDodgeBonus: "기본 회피 보너스",
                    actualDodgeBonus: "실제 회피 보너스",
                    dodgeModifier: "회피 수정자",
                    shieldPenalty: "방패 페널티",
                    armourPenalty: "갑옷 페널티",
                    finalEV: "최종 EV",
                    dodgeSkill: "회피 스킬",
                  };
                  return [`${value}`, labels[name]];
                }}
                labelFormatter={(value) => `회피 스킬 ${value}`}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                layout="horizontal"
              />
              <Line
                type="stepAfter"
                dataKey="baseEV"
                name="기본 EV"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="finalEV"
                name="최종 EV"
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="rawDodgeBonus"
                name="기본 회피 보너스"
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="actualDodgeBonus"
                name="실제 회피 보너스"
                dot={false}
              />
              {shield !== "none" && (
                <Line
                  type="stepAfter"
                  dataKey="shieldPenalty"
                  name="방패 페널티"
                  dot={false}
                />
              )}
              {armourER > 0 && (
                <Line
                  type="stepAfter"
                  dataKey="armourPenalty"
                  name="갑옷 페널티"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EVCalculator;
