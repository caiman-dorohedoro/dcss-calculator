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
import { calculateEvData, calculateEvTicks } from "@/utils/calculatorUtils";

type EVChartProps = {
  state: CalculatorState;
};

const EVChart = ({ state }: EVChartProps) => {
  const [data, setData] = useState<ReturnType<typeof calculateEvData>>([]);
  const [evTicks, setEvTicks] = useState<number[]>([]);

  useEffect(() => {
    const evData = calculateEvData(state);
    setData(evData);
    setEvTicks(calculateEvTicks(state));
  }, [state]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ left: 0, right: 10, top: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="dodgingSkill"
          label={{
            value: "Dodging Skill",
            position: "bottom",
            offset: 16,
            style: { fill: "#eee" },
          }}
          tickFormatter={(value) => value.toFixed(1)}
          ticks={evTicks}
          interval={0}
          tick={(props) => <CustomTick {...props} ticks={evTicks} />}
        />
        <YAxis allowDecimals={false} width={30} tick={{ fill: "#eee" }} />
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
            marginBottom: "-10px",
          }}
        />
        <Line
          type="stepAfter"
          dataKey="finalEV"
          name=" EV"
          dot={renderDot("dodgingSkill", state.dodgingSkill)}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EVChart;
