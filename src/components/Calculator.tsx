import { Fragment } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion } from "@/components/ui/accordion";
import AttrInput from "@/components/AttrInput";
import EVChart from "@/components/chart/EVChart";
import ACChart from "@/components/chart/ACChart";
import SHChart from "@/components/chart/SHChart";
import SFChart from "@/components/chart/SFChart";
import { CalculatorState } from "@/hooks/useCalculatorState";
import {
  ArmourKey,
  BodyArmourEgoKey,
  armourOptions,
  OrbKey,
  orbOptions,
  ShieldKey,
  shieldOptions,
} from "@/types/equipment.ts";
import { SpeciesKey, speciesOptions } from "@/types/species.ts";
import { GameVersion } from "@/types/game";
import { EquipmentToggleKey, getEquipmentToggleKeys } from "@/versioning/uiOptions";
import { getBodyArmourEgoOptions } from "@/versioning/equipmentData";
import { getSpellSchools } from "@/utils/spellCalculation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableAccordionItem } from "@/components/SortableAccordionItem";
import githubIcon from "@/assets/pixelated-github-white.png";

type CalculatorProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
};

const equipmentToggleLabels: Record<EquipmentToggleKey, string> = {
  helmet: "Helmet",
  cloak: "Cloak",
  gloves: "Gloves",
  boots: "Boots",
  barding: "Barding",
  secondGloves: "2nd Gloves",
};

const Calculator = <V extends GameVersion>({
  state,
  setState,
}: CalculatorProps<V>) => {
  const checkboxKeys = getEquipmentToggleKeys(state.version);
  const spellSchools = state.targetSpell
    ? getSpellSchools(state.version, state.targetSpell)
    : [];
  const bodyArmourEgos = getBodyArmourEgoOptions(state.version);
  const selectedBodyArmourEgo =
    state.bodyArmourEgo !== undefined && state.bodyArmourEgo in bodyArmourEgos
      ? state.bodyArmourEgo
      : "none";

  const skillAttrKeys: Array<{ label: string; key: "armourSkill" | "shieldSkill" | "dodgingSkill" }> =
    [
      {
        label: "Armour",
        key: "armourSkill",
      },
      {
        label: "Shield",
        key: "shieldSkill",
      },
      {
        label: "Dodging",
        key: "dodgingSkill",
      },
    ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // define default item order
  const defaultAccordionItems = [
    {
      id: "sf",
      title: "Spell Failure Rate Calculator",
      content: <SFChart state={state} setState={setState} />,
    },
    {
      id: "ev",
      title: "EV Calculator",
      content: <EVChart state={state} />,
    },
    {
      id: "ac",
      title: "AC Calculator",
      content: <ACChart state={state} />,
    },
    {
      id: "sh",
      title: "SH Calculator",
      content: <SHChart state={state} />,
    },
  ];

  // sort items according to the state's accordionOrder
  const accordionItems = [...defaultAccordionItems].sort((a, b) => {
    const aIndex = state.accordionOrder.indexOf(a.id);
    const bIndex = state.accordionOrder.indexOf(b.id);

    // place new items (not in state) at the end
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = accordionItems.findIndex(
      (item) => item.id === String(active.id)
    );
    const newIndex = accordionItems.findIndex(
      (item) => item.id === String(over.id)
    );

    const newItems = arrayMove(accordionItems, oldIndex, newIndex);

    setState((prev) => ({
      ...prev,
      accordionOrder: newItems.map((item) => item.id),
    }));
  };

  const controlsContent = (
    <CardHeader className="flex flex-col gap-4">
      <section
        data-testid="sidebar-section-base-stats"
        className="flex flex-col gap-2"
      >
        <h2 className="text-sm font-medium">Base Stats</h2>
        <div className="flex flex-row items-center gap-2 text-sm">
          <label className="flex flex-row items-center gap-2 text-sm">
            Species:
            <Select
              value={state.species}
              onValueChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  species: value as SpeciesKey<V>,
                }))
              }
            >
              <SelectTrigger className="w-[180px] h-6">
                <SelectValue placeholder="Species" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(speciesOptions(state.version)).map(
                  ([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name} ({value.size})
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div
          data-testid="base-stats-row"
          className="flex flex-row gap-4 items-center flex-wrap lg:flex-nowrap"
        >
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
      </section>
      <section
        data-testid="sidebar-section-skill"
        className="flex flex-col gap-2"
      >
        <h2 className="text-sm font-medium">Skill</h2>
        <div className="flex flex-row items-center gap-2 flex-wrap">
          {skillAttrKeys.map(({ label, key }) => (
            <AttrInput
              key={key}
              label={label}
              value={typeof state[key] === "number" ? state[key] : 0}
              type="skill"
              onChange={(value) =>
                setState((prev) => ({ ...prev, [key]: value }))
              }
            />
          ))}
          <AttrInput
            label="Spellcasting"
            value={state.spellcasting ?? 0}
            type="skill"
            onChange={(value) =>
              setState((prev) => ({ ...prev, spellcasting: value }))
            }
          />
        </div>
        {spellSchools.length > 0 && (
          <div className="flex flex-row gap-4 text-sm items-center flex-wrap">
            {spellSchools.map((schoolName) => (
              <AttrInput
                key={schoolName}
                label={schoolName}
                value={state.schoolSkills?.[schoolName] ?? 0}
                type="skill"
                onChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    schoolSkills: {
                      ...prev.schoolSkills,
                      [schoolName]: value === undefined ? 0 : value,
                    },
                  }))
                }
              />
            ))}
          </div>
        )}
      </section>
      <section
        data-testid="sidebar-section-equipment"
        className="flex flex-col gap-2"
      >
        <h2 className="text-sm font-medium">Equipment</h2>
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
              disabled={state.orb !== "none"}
              value={state.shield}
              onValueChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  shield: value as ShieldKey,
                  orb: value === "none" ? prev.orb : "none",
                }))
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
          <label className="flex flex-row items-center gap-2 text-sm">
            Orb:
            <Select
              disabled={state.shield !== "none"}
              value={state.orb}
              onValueChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  orb: value as OrbKey,
                  shield: value === "none" ? prev.shield : "none",
                }))
              }
            >
              <SelectTrigger className="w-[160px] h-6">
                <SelectValue placeholder="Orb" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(orbOptions).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="flex flex-row gap-4 text-sm items-center flex-wrap">
          {checkboxKeys.map((key) => (
            <Fragment key={key}>
              <label htmlFor={key} className="flex flex-row items-center gap-2">
                <Checkbox
                  checked={!!state[key]}
                  onCheckedChange={(checked) =>
                    setState((prev) => ({ ...prev, [key]: !!checked }))
                  }
                  id={key}
                />
                {equipmentToggleLabels[key]}
              </label>
              {key === "boots" && <div className="h-3 w-px bg-gray-200"></div>}
            </Fragment>
          ))}
        </div>
        <div className="flex flex-row gap-4 text-sm items-center flex-wrap border-t border-gray-700 pt-2">
          <AttrInput
            label="ring of wizardry"
            value={state.wizardry ?? 0}
            type="number"
            max={10}
            onChange={(value) =>
              setState((prev) => ({ ...prev, wizardry: value }))
            }
          />
          <AttrInput
            label="wild magic (mutation)"
            value={state.wildMagic ?? 0}
            type="number"
            max={3}
            onChange={(value) =>
              setState((prev) => ({ ...prev, wildMagic: value }))
            }
          />
          <div className="flex flex-row items-center gap-2">
            <span>body armour ego</span>
            <Select
              disabled={state.armour === "none"}
              value={selectedBodyArmourEgo}
              onValueChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  bodyArmourEgo: value as BodyArmourEgoKey,
                }))
              }
            >
              <SelectTrigger className="min-w-[120px] h-6 w-auto gap-2">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(bodyArmourEgos) as BodyArmourEgoKey[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {bodyArmourEgos[key]?.name ?? key}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </CardHeader>
  );

  const graphsContent = (
    <CardContent className="p-1 pb-0">
      <Accordion
        type="multiple"
        value={state.accordionValue}
        onValueChange={(value) =>
          setState((prev) => ({ ...prev, accordionValue: value }))
        }
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={accordionItems}
            strategy={verticalListSortingStrategy}
          >
            {accordionItems.map((item, index) => (
              <SortableAccordionItem
                key={item.id}
                id={item.id}
                title={item.title}
                content={item.content}
                isLast={index === accordionItems.length - 1}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Accordion>
      <div className="text-right text-xs mb-1 mr-1 hover:cursor-pointer hover:underline">
        <a
          href="https://github.com/caiman-dorohedoro/dcss-calculator"
          className="inline-flex items-center gap-1"
          target="_blank"
        >
          <img src={githubIcon} alt="GitHub" width={12} height={12} />
          github
        </a>
      </div>
    </CardContent>
  );

  return (
    <div
      data-testid="calculator-layout"
      className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-2"
    >
      <Card className="lg:contents">
        <div
          data-testid="calculator-controls-card"
          className="lg:order-2 lg:sticky lg:top-4 lg:border lg:border-white lg:bg-card lg:text-card-foreground lg:[outline:1px_solid_white] lg:[outline-offset:-4px]"
        >
          {controlsContent}
        </div>
        <div
          data-testid="calculator-graphs-card"
          className="min-w-0 lg:order-1 lg:border lg:border-white lg:bg-card lg:text-card-foreground lg:[outline:1px_solid_white] lg:[outline-offset:-4px]"
        >
          {graphsContent}
        </div>
      </Card>
    </div>
  );
};

export default Calculator;
