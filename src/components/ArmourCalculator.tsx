import { useEffect, useState } from "react";
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
import { calculateAC } from "@/utils/acCalculations";
import AttrInput from "./AttrInput";

interface CustomTickProps {
  x: number;
  y: number;
  payload: {
    value: number;
    coordinate: number;
  };
  visibleTicksCount?: number;
}

const CustomTick = ({ x, y, payload }: CustomTickProps) => {
  if (!payload || typeof payload.value !== "number") {
    return <g />;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="end"
        transform="rotate(-45)"
        fontSize={12}
        fill="#666"
      >
        {payload.value.toFixed(1)}
      </text>
    </g>
  );
};

const ArmourCalculator = () => {
  const [baseAC, setBaseAC] = useState(10);
  const [data, setData] = useState<{ skill: number; ac: number }[]>([]);
  const [acTicks, setAcTicks] = useState<number[]>([]);

  useEffect(() => {
    const _calcAC = () => {
      const newData: { skill: number; ac: number }[] = [];
      const acChangePoints = new Set<number>();
      let prevAC: number | null = null;

      // 0부터 27까지 0.1 단위로 계산하면서 변화 지점 기록
      for (let i = 0; i <= 270; i++) {
        const skill = i / 10;
        const currentAC = calculateAC(baseAC, skill);
        newData.push({ skill, ac: currentAC });

        // AC 값이 변경되는 지점에서만 틱 추가
        if (currentAC !== prevAC) {
          acChangePoints.add(skill);
          prevAC = currentAC;
        }
      }

      setData(newData);

      // 틱 배열 생성 및 정렬
      acChangePoints.add(0);
      const ticks = Array.from(acChangePoints).sort((a, b) => a - b);

      setAcTicks(ticks);
    };

    _calcAC();
  }, [baseAC]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <AttrInput
            label="Base AC"
            type="number"
            value={baseAC}
            onChange={setBaseAC}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={data}
            margin={{ left: 0, right: 20, top: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="skill"
              label={{
                value: "Armour Skill",
                position: "bottom",
              }}
              tickFormatter={(value) => value.toFixed(1)}
              ticks={acTicks}
              interval={0}
              tick={CustomTick}
            />
            <YAxis allowDecimals={false} width={30} />
            <Tooltip
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
              formatter={(value) => [`${value}`, "AC"]}
              labelFormatter={(value) => `Armour Skill ${value.toFixed(1)}`}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              wrapperStyle={{
                marginLeft: "-100px",
              }}
            />
            <Line type="stepAfter" dataKey="ac" name="AC" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ArmourCalculator;
