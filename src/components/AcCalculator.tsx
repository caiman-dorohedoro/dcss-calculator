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
import AttrInput from "@/components/AttrInput";
import CustomTick from "@/components/chart/CustomTick";
import { useAcCalculatorState } from "@/hooks/useAcCalculatorState";

const AcCalculator = () => {
  const { state, setState, resetState } = useAcCalculatorState();
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
        const currentAC = calculateAC(state.baseAC, skill);
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
  }, [state.baseAC]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex flex-row gap-2">
            <AttrInput
              label="Base AC"
              type="number"
              value={state.baseAC}
              onChange={(value) =>
                setState((prev) => ({ ...prev, baseAC: value }))
              }
            />
          </div>
          <button
            onClick={resetState}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Reset to Default
          </button>
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
                offset: 16,
              }}
              tickFormatter={(value) => value.toFixed(1)}
              ticks={acTicks}
              interval={0}
              tick={(props) => <CustomTick {...props} ticks={acTicks} />}
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
                marginBottom: "-10px",
              }}
            />
            <Line type="stepAfter" dataKey="ac" name="AC" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AcCalculator;
