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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { speciesOptions, SpeciesKey } from "@/utils/evCalculations";
import { shieldOptions, ShieldKey } from "@/utils/shCalculation";
import { armourOptions, ArmourKey } from "@/utils/acCalculations";
import AttrInput from "@/components/AttrInput";
import CustomTick from "@/components/chart/CustomTick";
import {
  CalculatorState,
  isSchoolSkillKey,
} from "@/hooks/useEvCalculatorState";
import {
  calculateAcData,
  calculateEvData,
  calculateAcTicks,
  calculateEvTicks,
  calculateSHData,
  calculateShTicks,
  calculateAvgSFData,
  calculateSFTicks,
} from "@/utils/calculatorUtils";
import renderDot from "@/components/chart/SkillDotRenderer";
import capitalizeFirstLetter from "@/utils/capitalizeFirstLetter";
import { spells } from "@/data/spells";
import {
  getSpellSchools,
  SpellName,
  SpellSchool,
} from "@/utils/spellCalculation";
import CustomSpellTick from "./chart/CustomSpellTick";

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

const Calculator = ({ state, setState }: CalculatorProps) => {
  const [data, setData] = useState<ReturnType<typeof calculateEvData>>([]);
  const [acData, setAcData] = useState<ReturnType<typeof calculateAcData>>([]);
  const [shData, setShData] = useState<ReturnType<typeof calculateSHData>>([]);
  const [sfData, setSFData] = useState<ReturnType<typeof calculateAvgSFData>>(
    []
  );
  const [acTicks, setAcTicks] = useState<number[]>([]);
  const [evTicks, setEvTicks] = useState<number[]>([]);
  const [shTicks, setShTicks] = useState<number[]>([]);
  const [sfTicks, setSfTicks] = useState<number[]>([]);

  const firstSchool = spells.find((spell) => spell.name === state.targetSpell)
    ?.schools[0];
  const spellSchools = getSpellSchools(state.targetSpell as SpellName);

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

    const firstSFData = calculateAvgSFData(state);
    setSFData(firstSFData);
    setSfTicks(calculateSFTicks(state));
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
        <div className="flex flex-row gap-4 items-center flex-wrap">
          <label className="flex flex-row items-center gap-2 text-sm">
            Species:
            <Select
              value={state.species}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, species: value as SpeciesKey }))
              }
            >
              <SelectTrigger className="w-[180px] h-6">
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
          <AttrInput
            label="Int"
            value={state.intelligence}
            type="stat"
            onChange={(value) =>
              setState((prev) => ({ ...prev, intelligence: value }))
            }
          />
        </div>
        <div className="flex flex-row items-center gap-2 flex-wrap">
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
        <div className="flex items-center flex-row gap-4 flex-wrap">
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
        {!state.spellMode && (
          <div className="flex flex-row gap-4 text-sm items-center flex-wrap">
            {checkboxKeys.map(({ label, key }) => (
              <Fragment key={key}>
                <label
                  htmlFor={key}
                  className="flex flex-row items-center gap-2"
                >
                  <Checkbox
                    checked={!!state[key]}
                    onCheckedChange={(checked) =>
                      setState((prev) => ({ ...prev, [key]: !!checked }))
                    }
                    id={key}
                  />
                  {label}
                </label>
                {key === "boots" && (
                  <div className="h-3 w-px bg-gray-200"></div>
                )}
              </Fragment>
            ))}
          </div>
        )}
        {state.spellMode && <div className="h-px w-full bg-gray-200"></div>}
        {state.spellMode && (
          <div className="flex flex-row gap-4 text-sm items-center flex-wrap flex-start">
            <div className="flex flex-row items-center gap-2">
              Spell:
              <Select
                value={state.targetSpell}
                onValueChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    targetSpell: value as SpellName,
                  }))
                }
              >
                <SelectTrigger className="min-w-[160px] h-6 w-auto gap-2">
                  <SelectValue placeholder="Apportation" />
                </SelectTrigger>
                <SelectContent>
                  {spells
                    .toSorted((a, b) => a.name.localeCompare(b.name))
                    .map((spell) => (
                      <SelectItem key={spell.name} value={spell.name}>
                        {spell.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <AttrInput
              label="Spellcasting Skill"
              value={state.spellcasting ?? 0}
              type="skill"
              onChange={(value) =>
                setState((prev) => ({ ...prev, spellcasting: value }))
              }
            />
          </div>
        )}
        {state.spellMode && (
          <div className="flex flex-row gap-4 text-sm items-center flex-wrap flex-start">
            {spells
              .find((spell) => spell.name === state.targetSpell)
              ?.schools.map((schoolName) => {
                // const lowerCaseSchoolName = schoolName.toLowerCase();

                if (!isSchoolSkillKey(schoolName)) {
                  return null;
                }

                if (typeof state.schoolSkills?.[schoolName] !== "number") {
                  return null;
                }

                return (
                  <AttrInput
                    key={schoolName}
                    label={`${schoolName}`}
                    value={state.schoolSkills?.[schoolName] ?? 0}
                    type="skill"
                    onChange={(value) =>
                      setState((prev) => ({
                        ...prev,
                        schoolSkills: {
                          ...prev.schoolSkills,
                          [schoolName]: value === undefined ? 0 : value,
                        } as Record<SpellSchool, number>,
                      }))
                    }
                  />
                );
              })}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Accordion
          type="multiple"
          value={state.accordionValue}
          onValueChange={(value) =>
            setState((prev) => ({ ...prev, accordionValue: value }))
          }
        >
          {state.spellMode && (
            <AccordionItem value="sf">
              <AccordionTrigger>Spell Failure Rate Calculator</AccordionTrigger>
              <AccordionContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={sfData}
                    margin={{ left: 0, right: 10, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="spellSkill"
                      label={{
                        value:
                          spellSchools.length > 1
                            ? "Skill Average"
                            : `${firstSchool} Skill`,
                        position: "bottom",
                        offset: 16,
                        style: { fill: "#eee" },
                      }}
                      tickFormatter={(value) => value.toFixed(1)}
                      ticks={sfTicks}
                      interval={0}
                      tick={CustomSpellTick}
                    />
                    <YAxis
                      allowDecimals={false}
                      width={30}
                      tick={{ fill: "#eee" }}
                    />
                    <Tooltip
                      formatter={(value) => {
                        return [`${value}%`, "Spell Failure Rate"];
                      }}
                      labelFormatter={(value) =>
                        `${firstSchool} Skill: ${value}`
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
                        Number(
                          (
                            spellSchools.reduce(
                              (acc, school) =>
                                acc + (state.schoolSkills?.[school] ?? 0),
                              0
                            ) / spellSchools.length
                          ).toFixed(1)
                        )
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </AccordionContent>
            </AccordionItem>
          )}
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
                    tick={(props) => <CustomTick {...props} ticks={evTicks} />}
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
                    interval={
                      state.shield === "none" || state.dexterity === 0 ? 270 : 0
                    }
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
