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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import {
  SpeciesKey,
  ShieldKey,
  speciesOptions,
  shieldOptions,
  calculateEVForSkillLevel,
} from "../utils/evCalculations";

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
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>EV 계산기</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              민첩성(Dexterity):
              <input
                type="number"
                min="1"
                max="40"
                value={dexterity}
                onChange={(e) => setDexterity(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-20 text-gray-900 bg-white"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              힘(Strength):
              <input
                type="number"
                min="1"
                max="40"
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-20 text-gray-900 bg-white"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              방패 스킬:
              <input
                type="number"
                min="0"
                max="27"
                step="0.1"
                value={shieldSkill}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setShieldSkill(Math.round(value * 10) / 10);
                  }
                }}
                className="ml-2 p-1 border rounded w-20 text-gray-900 bg-white"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              갑옷 스킬:
              <input
                type="number"
                min="0"
                max="27"
                step="0.1"
                value={armourSkill}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setArmourSkill(Math.round(value * 10) / 10);
                  }
                }}
                className="ml-2 p-1 border rounded w-20 text-gray-900 bg-white"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              종족 크기:
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as SpeciesKey)}
                className="ml-2 p-1 border rounded text-gray-900 bg-white"
              >
                {Object.entries(speciesOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              방패:
              <select
                value={shield}
                onChange={(e) => setShield(e.target.value as ShieldKey)}
                className="ml-2 p-1 border rounded text-gray-900 bg-white"
              >
                {Object.entries(shieldOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              갑옷 ER(Encumbrance Rating):
              <input
                type="number"
                min="0"
                max="300"
                value={armourER}
                onChange={(e) => setArmourER(Number(e.target.value))}
                className="ml-2 p-1 border rounded w-20 text-gray-900 bg-white"
              />
            </label>
          </div>
        </div>
        <div className="h-[500px] overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%">
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
                  offset: 5,
                }}
                tickFormatter={(value) => value.toFixed(1)} // 소수점 1자리 표시
              />
              <YAxis
                label={{
                  value: "EV",
                  angle: -90,
                  position: "left",
                  offset: -10,
                }}
                allowDecimals={false}
              />
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
                wrapperStyle={{
                  paddingTop: "30px",
                }}
              />
              <Line
                type="stepAfter"
                dataKey="baseEV"
                name="기본 EV"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone" // 곡선으로 변경
                dataKey="finalEV"
                name="최종 EV"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="rawDodgeBonus"
                name="기본 회피 보너스"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="actualDodgeBonus"
                name="실제 회피 보너스"
                stroke="#ff8c00"
                strokeWidth={2}
                dot={false}
              />
              {shield !== "none" && (
                <Line
                  type="stepAfter"
                  dataKey="shieldPenalty"
                  name="방패 페널티"
                  stroke="#ff7300"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {armourER > 0 && (
                <Line
                  type="stepAfter"
                  dataKey="armourPenalty"
                  name="갑옷 페널티"
                  stroke="#ff0000"
                  strokeWidth={2}
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
