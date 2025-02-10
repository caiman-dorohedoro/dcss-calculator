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
import { CalculatorState } from "@/hooks/useEvCalculatorState";
import { calculateAcData, calculateAcTicks } from "@/utils/calculatorUtils";

type ACChartProps = {
  state: CalculatorState;
};

const ACChart = ({ state }: ACChartProps) => {
  const [acData, setAcData] = useState<ReturnType<typeof calculateAcData>>([]);
  const [acTicks, setAcTicks] = useState<number[]>([]);

  useEffect(() => {
    const acData = calculateAcData(state);
    setAcData(acData);
    setAcTicks(calculateAcTicks(state));
  }, [state]);

  const zeroBaseAC =
    state.armour === "none" &&
    !state.helmet &&
    !state.gloves &&
    !state.boots &&
    !state.cloak &&
    !state.barding &&
    !state.secondGloves;

  return (
    <ResponsiveContainer className="mt-4" width="100%" height={350}>
      <LineChart
        data={acData}
        margin={{ left: 0, right: 10, top: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="armour"
          label={{
            value: "Armour Skill",
            position: "bottom",
            offset: 16,
            style: { fill: "#eee" },
          }}
          tickFormatter={(value) => value.toFixed(1)}
          ticks={acTicks}
          interval={zeroBaseAC ? 270 : 0}
          tick={(props) => <CustomTick {...props} ticks={acTicks} />}
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
        <Line
          type="stepAfter"
          dataKey="ac"
          name="AC"
          dot={renderDot("armour", state.armourSkill)}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ACChart;
