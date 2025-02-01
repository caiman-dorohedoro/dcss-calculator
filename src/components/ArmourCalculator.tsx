import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
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
    <Card className="p-6 my-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Armour AC Calculator</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="base-ac">Base AC</Label>
          <Input
            id="base-ac"
            type="number"
            value={baseAC}
            onChange={(e) => setBaseAC(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="armour-skill">Armour Skill</Label>
          <Input
            id="armour-skill"
            type="number"
            value={armourSkill}
            onChange={(e) => setArmourSkill(Number(e.target.value))}
          />
        </div>
      </div>

      <p className="mb-4">
        Current AC: {calculateAC(baseAC, armourSkill).toFixed(2)}
      </p>

      <LineChart
        width={800}
        height={400}
        data={generateData()}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="skill"
          label={{ value: "Armour Skill", position: "bottom" }}
        />
        <YAxis />
        <Tooltip />
        <Legend
          verticalAlign="bottom"
          align="center"
          layout="horizontal"
          wrapperStyle={{
            paddingTop: "30px",
          }}
        />
        <Line
          type="monotone"
          dataKey="ac"
          stroke="#8884d8"
          name="AC"
          dot={false}
        />
      </LineChart>
    </Card>
  );
};

export default ArmourCalculator;
