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
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  SpeciesKey,
  ShieldKey,
  speciesOptions,
  shieldOptions,
  calculateEVForSkillLevel,
} from "@/utils/evCalculations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AttrInput from "@/components/AttrInput";
import CustomTick from "@/components/chart/CustomTick";

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

const EVCalculator = () => {
  const [dexterity, setDexterity] = useState(10);
  const [strength, setStrength] = useState(10);
  const [species, setSpecies] = useState<SpeciesKey>("armataur");
  const [shield, setShield] = useState<ShieldKey>("none");
  const [armourER, setArmourER] = useState(0);
  const [shieldSkill, setShieldSkill] = useState(0);
  const [armourSkill, setArmourSkill] = useState(0);
  const [data, setData] = useState<DataPoint[]>([]);
  const [evTicks, setEvTicks] = useState<number[]>([]);

  useEffect(() => {
    const calculateEV = () => {
      const newData = [];
      const evChangePoints = new Set<number>();

      let lastEV = 0;
      // Calculate for dodging skill 0 to 27
      for (let dodge = 0; dodge <= 27; dodge += 0.1) {
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

        if (result.finalEV !== lastEV && dodge < 27) {
          evChangePoints.add(parseFloat(dodge.toFixed(1)));
          lastEV = result.finalEV;
        }

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
      setEvTicks(Array.from(evChangePoints));
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
                  {value.name} ({value.size})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <div className="flex flex-row gap-4">
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
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={data}
              margin={{ left: 0, right: 20, top: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dodgeSkill"
                label={{
                  value: "Dodging Skill Level",
                  position: "bottom",
                }}
                tickFormatter={(value) => value.toFixed(1)}
                ticks={evTicks}
                tick={(props) => (
                  <CustomTick {...props} ticks={evTicks} tickLimit={12} />
                )}
              />
              <YAxis allowDecimals={false} width={30} />
              <Tooltip
                formatter={(value) => {
                  return [`${value}`, "EV"];
                }}
                labelFormatter={(value) => `Dodging Skill: ${value}`}
                wrapperStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--popover-foreground))",
                  borderRadius: "calc(var(--radius) - 2px)",
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "none",
                }}
                itemStyle={{
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                layout="horizontal"
                wrapperStyle={{
                  marginLeft: "-100px",
                }}
              />
              <Line type="stepAfter" dataKey="finalEV" name=" EV" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EVCalculator;
