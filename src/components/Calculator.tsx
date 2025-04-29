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
  armourOptions,
  ShieldKey,
  shieldOptions,
} from "@/types/equipment.ts";
import { SpeciesKey, speciesOptions } from "@/types/species.ts";
import { GameVersion } from "@/types/game";
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
import githubIcon from "@/assets/github-pixel-white-16x16.png";

type CalculatorProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
};

const checkboxKeys032: Array<{
  label: string;
  key: keyof CalculatorState<"0.32">;
}> = [
  { label: "Helmet", key: "helmet" },
  { label: "Cloak", key: "cloak" },
  { label: "Gloves", key: "gloves" },
  { label: "Boots", key: "boots" },
  { label: "Barding", key: "barding" },
];

const checkboxKeys033: Array<{
  label: string;
  key: keyof CalculatorState<"0.33">;
}> = [...checkboxKeys032, { label: "2nd Gloves", key: "secondGloves" }];

const checkboxKeysTrunk: Array<{
  label: string;
  key: keyof CalculatorState<"trunk">;
}> = [...checkboxKeys032, { label: "2nd Gloves", key: "secondGloves" }];

const versionToCheckboxKyes = {
  trunk: checkboxKeysTrunk,
  "0.33": checkboxKeys033,
  "0.32": checkboxKeys032,
};

const Calculator = <V extends GameVersion>({
  state,
  setState,
}: CalculatorProps<V>) => {
  const checkboxKeys: Array<{ label: string; key: keyof CalculatorState<V> }> =
    versionToCheckboxKyes[state.version];

  const skillAttrKeys: Array<{ label: string; key: keyof CalculatorState<V> }> =
    [
      {
        label: "Armour Skill",
        key: "armourSkill",
      },
      {
        label: "Shield Skill",
        key: "shieldSkill",
      },
      {
        label: "Dodging Skill",
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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-row gap-4 items-center flex-wrap">
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
        <div className="flex flex-row gap-4 text-sm items-center flex-wrap">
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
            href="https://github.com/caiman-dorohedoro/dcss-tools"
            className="inline-flex items-center gap-1"
            target="_blank"
          >
            <img src={githubIcon} alt="GitHub" width={12} height={12} />
            github
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default Calculator;
