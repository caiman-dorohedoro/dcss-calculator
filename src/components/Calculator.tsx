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
import {
  speciesOptions,
  shieldOptions,
  ShieldKey,
  SpeciesKey,
} from "@/utils/evCalculations";
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
} from "@/utils/calculatorUtils";

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

const Calculator = ({ state, setState }: CalculatorProps) => {
  const [data, setData] = useState<ReturnType<typeof calculateEvData>>([]);
  const [acData, setAcData] = useState<ReturnType<typeof calculateAcData>>([]);
  const [acTicks, setAcTicks] = useState<number[]>([]);
  const [evTicks, setEvTicks] = useState<number[]>([]);

  useEffect(() => {
    const evData = calculateEvData(state);
    setData(evData);
    setEvTicks(calculateEvTicks(state));
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
        <div className="flex items-center flex-row gap-4">
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
          <AttrInput
            label="Shield Skill"
            value={state.shieldSkill}
            type="skill"
            onChange={(value) =>
              setState((prev) => ({ ...prev, shieldSkill: value }))
            }
          />
        </div>
        <div className="flex flex-row gap-4">
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
          <AttrInput
            label="Armour Skill"
            value={state.armourSkill}
            type="skill"
            onChange={(value) =>
              setState((prev) => ({ ...prev, armourSkill: value }))
            }
          />
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
                    dataKey="dodgeSkill"
                    label={{
                      value: "Dodging Skill",
                      position: "bottom",
                      offset: 16,
                    }}
                    tickFormatter={(value) => value.toFixed(1)}
                    ticks={evTicks}
                    interval={0}
                    tick={(props) => (
                      <CustomTick {...props} ticks={evTicks} tickLimit={12} />
                    )}
                  />
                  <YAxis allowDecimals={false} width={30} />
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
                    dot={false}
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
                    }}
                    tickFormatter={(value) => value.toFixed(1)}
                    ticks={acTicks}
                    interval={zeroBaseAC ? 270 : 0}
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
                  <Line type="stepAfter" dataKey="ac" name="AC" dot={false} />
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
