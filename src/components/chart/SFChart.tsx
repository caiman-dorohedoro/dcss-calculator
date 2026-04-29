import { useState, useEffect } from "react";
import {
  Area,
  ComposedChart,
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
import { spellCanBeEnkindled } from "@/utils/spellCanbeEnkindled";
import {
  ENKINDLE_SPELL_FAILURE_COLOR,
  VEHUMET_SPELL_FAILURE_COLOR,
} from "@/components/chart/spellFailureColors";

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
  const hasEnkindleLine =
    state.species === "revenant" &&
    spellCanBeEnkindled(state.version, state.targetSpell) &&
    sfData.some((data) => data.enKindledSpellFailureRate !== 0);
  const hasVehumetPreviewLine = sfData.some(
    (data) => data.vehumetPreviewSpellFailureRate !== undefined
  );
  const optionalSpellFailureLineCount =
    Number(hasEnkindleLine) + Number(hasVehumetPreviewLine);
  const legendMarginLeft =
    optionalSpellFailureLineCount === 2
      ? "-55px"
      : optionalSpellFailureLineCount === 1
        ? "-100px"
        : "-150px";
  const skillAxisLabel =
    spellSchools.length > 1 ? "Skill Average" : firstSchool;

  useEffect(() => {
    const firstSFData = calculateAvgSFData(state);
    setSFData(firstSFData);
    setSfTicks(calculateSFTicks(state));
  }, [state]);

  return (
    <>
      <SpellModeHeader state={state} setState={setState} />
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
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
              // adjust x coordinate to the right, and y coordinate to the desired position
              return (
                <text
                  x={(x ?? 0) + (width ?? 0) - 20} // move to the right end
                  y={(y ?? 0) + (height ?? 0) + 24} // adjust to desired height
                  textAnchor="end" // text alignment (end means right-aligned)
                  fill="#eee"
                >
                  {skillAxisLabel}
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
              if (name === " Precision range" && Array.isArray(value)) {
                const [min, max] = value;
                return [
                  min === max ? `${min}%` : `${min}-${max}%`,
                  "Possible failure range",
                ];
              }
              if (name === " Enkindle") {
                return [`${value}%`, "Spell Failure Rate (Enkindle)"];
              }
              if (name === " Vehumet support preview") {
                return [`${value}%`, "Spell Failure Rate (Vehumet support)"];
              }
              if (name === " Current failure") {
                return [`${value}%`, "Current failure"];
              }

              return [`${value}%`, name];
            }}
            labelFormatter={(value) =>
              `${skillAxisLabel}: ${value}`
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
              marginLeft: legendMarginLeft,
              marginBottom: "-10px",
            }}
          />
          <Area
            type="stepAfter"
            dataKey="spellFailureRange"
            name=" Precision range"
            stroke="none"
            fill="#94a3b8"
            fillOpacity={0.22}
            legendType="none"
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            type="stepAfter"
            dataKey="spellFailureRate"
            name=" Current failure"
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
          {hasEnkindleLine && (
              <Line
                type="stepAfter"
                dataKey="enKindledSpellFailureRate"
                name=" Enkindle"
                isAnimationActive={false}
                stroke={ENKINDLE_SPELL_FAILURE_COLOR}
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
          {hasVehumetPreviewLine && (
            <Line
              type="stepAfter"
              dataKey="vehumetPreviewSpellFailureRate"
              name=" Vehumet support preview"
              isAnimationActive={false}
              stroke={VEHUMET_SPELL_FAILURE_COLOR}
              strokeDasharray="4 4"
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
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
};

export default SFChart;
