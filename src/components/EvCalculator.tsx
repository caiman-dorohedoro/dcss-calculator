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
    <Card>
      <div>
        <CardHeader>
          <div>
            <div>
              <label>
                민첩성(Dexterity):
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={dexterity}
                  onChange={(e) => setDexterity(Number(e.target.value))}
                />
              </label>
            </div>
            <div>
              <label>
                힘(Strength):
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={strength}
                  onChange={(e) => setStrength(Number(e.target.value))}
                />
              </label>
            </div>
            <div>
              <label>
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
                />
              </label>
            </div>
            <div>
              <label>
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
                />
              </label>
            </div>
            <div>
              <label>
                종족 크기:
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value as SpeciesKey)}
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
              <label>
                방패:
                <select
                  value={shield}
                  onChange={(e) => setShield(e.target.value as ShieldKey)}
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
              <label>
                갑옷 ER(Encumbrance Rating):
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={armourER}
                  onChange={(e) => setArmourER(Number(e.target.value))}
                />
              </label>
            </div>
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
                <YAxis
                  label={{
                    value: "EV",
                    angle: -90,
                    position: "left",
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
      </div>
    </Card>
  );
};

export default EVCalculator;
