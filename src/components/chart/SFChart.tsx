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
  LabelProps,
} from "recharts";
import renderDot from "@/components/chart/SkillDotRenderer";
import CustomSpellTick from "@/components/chart/CustomSpellTick";
import { CalculatorState } from "@/hooks/useCalculatorState";
import { calculateAvgSFData, calculateSFTicks } from "@/utils/calculatorUtils";
import { getSpellSchools } from "@/utils/spellCalculation";
import { GameVersion } from "@/types/game";
import SpellModeHeader from "../SpellModeHeader";
import { CartesianViewBox } from "recharts/types/util/types";

type SFChartProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
};

const SFChart = <V extends GameVersion>({
  state,
  setState,
}: SFChartProps<V>) => {
  const [sfData, setSFData] = useState<ReturnType<typeof calculateAvgSFData>>(
    []
  );
  const [sfTicks, setSfTicks] = useState<number[]>([]);
  const spellSchools = getSpellSchools<V>(state.version, state.targetSpell);
  const [firstSchool] = spellSchools;

  useEffect(() => {
    const firstSFData = calculateAvgSFData(state);
    setSFData(firstSFData);
    setSfTicks(calculateSFTicks(state));
  }, [state]);

  return (
    <>
      <SpellModeHeader state={state} setState={setState} />
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={sfData}
          margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="spellSkill"
            label={(props: LabelProps) => {
              if (props.viewBox === undefined) {
                return null;
              }

              if ("cx" in props.viewBox && "cy" in props.viewBox) {
                return null;
              }

              const { x, y, width, height } = props.viewBox as CartesianViewBox;
              // x 좌표를 오른쪽으로, y 좌표는 원하는 위치로 조정
              return (
                <text
                  x={(x ?? 0) + (width ?? 0) - 20} // 오른쪽 끝으로 이동
                  y={(y ?? 0) + (height ?? 0) + 24} // 원하는 높이로 조정
                  textAnchor="end" // 텍스트 정렬 (end는 오른쪽 정렬)
                  fill="#eee"
                >
                  {spellSchools.length > 1
                    ? "Skill Average"
                    : `${firstSchool} Skill`}
                </text>
              );
            }}
            tickFormatter={(value) => value.toFixed(1)}
            ticks={sfTicks}
            interval={0}
            tick={CustomSpellTick}
          />
          <YAxis allowDecimals={false} width={30} tick={{ fill: "#eee" }} />
          <Tooltip
            formatter={(value, name) => {
              if (name === " Enkindle") {
                return [`${value}%`, "Spell Failure Rate (Enkindle)"];
              }

              return [`${value}%`, name];
            }}
            labelFormatter={(value) =>
              `${
                spellSchools.length > 1
                  ? "Skill Average"
                  : `${firstSchool} Skill`
              }: ${value}`
            }
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
              marginLeft: "-150px",
              marginBottom: "-10px",
            }}
          />
          <Line
            type="stepAfter"
            dataKey="spellFailureRate"
            name=" Spell Failure Rate"
            isAnimationActive={false}
            dot={renderDot(
              "spellSkill",
              Math.round(
                spellSchools.reduce(
                  (acc, school) =>
                    acc + (state.schoolSkills?.[school] ?? 0) * 200,
                  0
                ) /
                  spellSchools.length /
                  20
              ) / 10
            )}
          />
          {state.species === "revenant" &&
            sfData.some((data) => data.enKindledSpellFailureRate !== 0) && (
              <Line
                type="stepAfter"
                dataKey="enKindledSpellFailureRate"
                name=" Enkindle"
                isAnimationActive={false}
                stroke="#b6822f"
                dot={renderDot(
                  "spellSkill",
                  Math.round(
                    spellSchools.reduce(
                      (acc, school) =>
                        acc + (state.schoolSkills?.[school] ?? 0) * 200,
                      0
                    ) /
                      spellSchools.length /
                      20
                  ) / 10
                )}
              />
            )}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default SFChart;
