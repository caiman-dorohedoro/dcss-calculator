import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateAC } from "@/utils/acCalculations";

const ArmourCalculator = () => {
  const [armourSkill, setArmourSkill] = useState(0);
  const [baseAC, setBaseAC] = useState(10);

  const generateData = () => {
    return Array.from({ length: 271 }, (_, i) => {
      const skill = i / 10; // Convert index to 0.1 increments
      return {
        skill,
        ac: calculateAC(baseAC, skill),
      };
    });
  };

  return (
    <Card>
      <div>
        <CardHeader>
          <div>
            <div>
              <Label htmlFor="base-ac">Base AC</Label>
              <Input
                id="base-ac"
                type="number"
                value={baseAC}
                onChange={(e) => setBaseAC(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="armour-skill">Armour Skill</Label>
              <Input
                id="armour-skill"
                type="number"
                value={armourSkill}
                onChange={(e) => setArmourSkill(Number(e.target.value))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={generateData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="skill"
                  label={{
                    value: "Armour Skill",
                    position: "bottom",
                  }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <YAxis
                  label={{
                    value: "AC",
                    angle: -90,
                    position: "left",
                  }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [`${value}`, "AC"]}
                  labelFormatter={(value) => `Armour Skill ${value.toFixed(1)}`}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                />
                <Line type="stepAfter" dataKey="ac" name="AC" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default ArmourCalculator;
