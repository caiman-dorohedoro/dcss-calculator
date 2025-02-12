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
import CustomTick from "@/components/chart/CustomTick";
import renderDot from "@/components/chart/SkillDotRenderer";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { calculateSHData, calculateShTicks } from "@/utils/calculatorUtils";
import { GameVersion } from "@/types/game";

type SHChartProps<V extends GameVersion> = {
  state: CalculatorState<V>;
};

const SHChart = <V extends GameVersion>({ state }: SHChartProps<V>) => {
  const [shData, setShData] = useState<ReturnType<typeof calculateSHData>>([]);
  const [shTicks, setShTicks] = useState<number[]>([]);

  useEffect(() => {
    const shData = calculateSHData(state);
    setShData(shData);
    setShTicks(calculateShTicks(state));
  }, [state]);

  return (
    <ResponsiveContainer className="mt-4" width="100%" height={350}>
      <LineChart
        data={shData}
        margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="shield"
          label={{
            value: "Shield Skill",
            position: "bottom",
            offset: 16,
            style: { fill: "#eee" },
          }}
          tickFormatter={(value) => value.toFixed(1)}
          ticks={shTicks}
          interval={state.shield === "none" || state.dexterity === 0 ? 270 : 0}
          tick={(props) => <CustomTick {...props} ticks={shTicks} />}
        />
        <YAxis allowDecimals={false} width={30} tick={{ fill: "#eee" }} />
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
          formatter={(value) => [`${value}`, "SH"]}
          labelFormatter={(value) => `Shield Skill ${value.toFixed(1)}`}
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
        <Line
          type="stepAfter"
          dataKey="sh"
          name="SH"
          dot={renderDot("shield", state.shieldSkill)}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SHChart;
