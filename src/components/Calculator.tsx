import { useState, useEffect, Fragment } from "react";
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
import { speciesOptions, SpeciesKey } from "@/utils/evCalculations";
import { shieldOptions, ShieldKey } from "@/utils/shCalculation";
import { armourOptions, ArmourKey } from "@/utils/acCalculations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AttrInput from "@/components/AttrInput";
import CustomTick from "@/components/chart/CustomTick";
import { CalculatorState } from "@/hooks/useEvCalculatorState";
import { Checkbox } from "./ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  calculateAcData,
  calculateEvData,
  calculateAcTicks,
  calculateEvTicks,
  calculateSHData,
  calculateShTicks,
} from "@/utils/calculatorUtils";
import { LineDot } from "recharts/types/cartesian/Line";

type CalculatorProps = {
  state: CalculatorState;
  setState: React.Dispatch<React.SetStateAction<CalculatorState>>;
};

const checkboxKeys: Array<{ label: string; key: keyof CalculatorState }> = [
  { label: "Helmet", key: "helmet" },
  { label: "Cloak", key: "cloak" },
  { label: "Gloves", key: "gloves" },
  { label: "Boots", key: "boots" },
  { label: "Barding", key: "barding" },
  { label: "2nd Gloves", key: "secondGloves" },
];

const skillKeys: Array<keyof CalculatorState> = [
  "armourSkill",
  "shieldSkill",
  "dodgingSkill",
];

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

type ChartPayload = {
  [key: string]: number;
};

type RenderDotParams = {
  key: string;
  r: number;
  name: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
  width: number;
  height: number;
  value: number;
  dataKey: string;
  cx: number;
  cy: number;
  index: number;
  payload: ChartPayload;
};

const baseLeftOffset = 30;
const baseTopOffset = 310;
const minLeftOffset = 7;
const minBottomOffset = 15;
const widthPerDigit = 8.3;
const heightDigit = 14;

const renderDot = (skillKey: keyof CalculatorState, currentSkill: number) => {
  const dotRenderer: LineDot = (params: RenderDotParams) => {
    const { cx, cy, payload, value } = params;

    const r = 2;
    const fillColor = "#fff";

    if (payload[skillKey] === currentSkill) {
      const textWidth = value.toString().length * widthPerDigit;

      let textCx = cx;
      let textCy = cy;

      if (cx <= baseLeftOffset + minLeftOffset + textWidth / 2) {
        textCx += textWidth / 2 + minLeftOffset - (cx - baseLeftOffset);
      }

      if (cy >= baseTopOffset - minBottomOffset - heightDigit) {
        textCy += -heightDigit - minBottomOffset - (cy - baseTopOffset);
      } else {
        textCy += heightDigit;
      }

      return (
        <g key={params.key + params.name}>
          <circle cx={cx} cy={cy} r={r} fill={fillColor} stroke="white" />
          <text
            x={textCx}
            y={textCy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
          >
            {value}
          </text>
        </g>
      );
    }
    return <g key={params.key + params.name} />;
  };
  return dotRenderer;
};

const Calculator = ({ state, setState }: CalculatorProps) => {
  const [data, setData] = useState<ReturnType<typeof calculateEvData>>([]);
  const [acData, setAcData] = useState<ReturnType<typeof calculateAcData>>([]);
  const [shData, setShData] = useState<ReturnType<typeof calculateSHData>>([]);
  const [acTicks, setAcTicks] = useState<number[]>([]);
  const [evTicks, setEvTicks] = useState<number[]>([]);
  const [shTicks, setShTicks] = useState<number[]>([]);

  useEffect(() => {
    const evData = calculateEvData(state);
    setData(evData);
    setEvTicks(calculateEvTicks(state));
    const acData = calculateAcData(state);
    setAcData(acData);
    setAcTicks(calculateAcTicks(state));
    const shData = calculateSHData(state);
    setShData(shData);
    setShTicks(calculateShTicks(state));
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
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-row gap-4 items-center">
          <label className="flex flex-row items-center gap-2 text-sm">
            Species:
            <Select
              value={state.species}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, species: value as SpeciesKey }))
              }
            >
              <SelectTrigger className="w-[200px] h-6">
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
          <AttrInput
            label="Str"
            value={state.strength}
            type="stat"
            onChange={(value) =>
              setState((prev) => ({ ...prev, strength: value }))
            }
          />
          <AttrInput
            label="Dex"
            value={state.dexterity}
            type="stat"
            onChange={(value) =>
              setState((prev) => ({ ...prev, dexterity: value }))
            }
          />
        </div>
        <div className="flex flex-row items-center gap-2">
          {skillKeys.map((key) => (
            <AttrInput
              key={key}
              label={capitalizeFirstLetter(key.replace("Skill", " Skill"))}
              value={typeof state[key] === "number" ? state[key] : 0}
              type="skill"
              onChange={(value) =>
                setState((prev) => ({ ...prev, [key]: value }))
              }
            />
          ))}
        </div>
        <div className="flex items-center flex-row gap-4">
          <label className="flex flex-row items-center gap-2 text-sm">
            Armour:
            <Select
              value={state.armour}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, armour: value as ArmourKey }))
              }
            >
              <SelectTrigger className="min-w-[100px] gap-2 h-6">
                <SelectValue placeholder="Armour" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(armourOptions).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-row items-center gap-2 text-sm">
            Shield:
            <Select
              value={state.shield}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, shield: value as ShieldKey }))
              }
            >
              <SelectTrigger className="w-[160px] h-6">
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
        </div>
        <div className="flex flex-row gap-4 text-sm items-center">
          {checkboxKeys.map(({ label, key }) => (
            <Fragment key={key}>
              <label htmlFor={key} className="flex flex-row items-center gap-2">
                <Checkbox
                  checked={!!state[key]}
                  onCheckedChange={(checked) =>
                    setState((prev) => ({ ...prev, [key]: !!checked }))
                  }
                  id={key}
                />
                {label}
              </label>
              {key === "boots" && <div className="h-3 w-px bg-gray-200"></div>}
            </Fragment>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["ev"]}>
          <AccordionItem value="ev">
            <AccordionTrigger>EV Calculator</AccordionTrigger>
            <AccordionContent>
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
                    tick={(props) => (
                      <CustomTick {...props} ticks={evTicks} tickLimit={12} />
                    )}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={30}
                    tick={{ fill: "#eee" }}
                  />
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
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ac">
            <AccordionTrigger>AC Calculator</AccordionTrigger>
            <AccordionContent>
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
                  <YAxis
                    allowDecimals={false}
                    width={30}
                    tick={{ fill: "#eee" }}
                  />
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
                    labelFormatter={(value) =>
                      `Armour Skill ${value.toFixed(1)}`
                    }
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
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="sh">
            <AccordionTrigger>SH Calculator</AccordionTrigger>
            <AccordionContent>
              <ResponsiveContainer className="mt-4" width="100%" height={350}>
                <LineChart
                  data={shData}
                  margin={{ left: 0, right: 10, top: 10, bottom: 10 }}
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
                    interval={state.shield === "none" ? 270 : 0}
                    tick={(props) => <CustomTick {...props} ticks={shTicks} />}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={30}
                    tick={{ fill: "#eee" }}
                  />
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
                    labelFormatter={(value) =>
                      `Shield Skill ${value.toFixed(1)}`
                    }
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default Calculator;
