import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion } from "@/components/ui/accordion";
import AttrInput from "@/components/AttrInput";
import EquipmentEditModal from "@/components/equipment/EquipmentEditModal";
import EquipmentSummaryRow from "@/components/equipment/EquipmentSummaryRow";
import EVChart from "@/components/chart/EVChart";
import ACChart from "@/components/chart/ACChart";
import SHChart from "@/components/chart/SHChart";
import SFChart from "@/components/chart/SFChart";
import { CalculatorState } from "@/hooks/useCalculatorState";
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
import githubIcon from "@/assets/pixelated-github-white.png";
import { SpellSkillControls } from "@/components/SpellControls";
import DynamicEquipmentControls from "@/components/DynamicEquipmentControls";
import {
  formatBodyArmourSummary,
  formatOrbSummary,
  formatShieldSummary,
} from "@/utils/equipmentSummaryText";
import { getSpellBoostBodyArmourEgo } from "@/utils/bodyArmourEgos";
import { coerceEquipmentSlotCollections } from "@/versioning/dynamicSlotCounts";

type CalculatorProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
};

type OpenPrimaryEquipment = "bodyArmour" | "shield" | "orb";

const clearImportedItemMetadata = <T extends {
  displayName?: string;
  propertiesText?: string;
  artifactKind?: "normal" | "randart" | "unrand";
  source?: string;
}>(
  item: T,
  changed: boolean
): T =>
  changed
    ? {
        ...item,
        displayName: undefined,
        propertiesText: undefined,
        artifactKind: undefined,
        source: undefined,
      }
    : item;

const SectionHeading = ({ children }: { children: string }) => (
  <div className="flex items-center gap-3">
    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
    <div className="h-px flex-1 bg-border/60" />
  </div>
);

const Calculator = <V extends GameVersion>({
  state,
  setState,
}: CalculatorProps<V>) => {
  const [openPrimaryEquipment, setOpenPrimaryEquipment] =
    useState<OpenPrimaryEquipment | null>(null);
  const selectedBodyArmourEgo =
    state.bodyArmour.ego ??
    (state.bodyArmourEgo !== undefined ? state.bodyArmourEgo : "none");

  const skillAttrKeys: Array<{
    label: string;
    key: "armourSkill" | "shieldSkill" | "dodgingSkill";
  }> = [
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
    }),
  );

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
      (item) => item.id === String(active.id),
    );
    const newIndex = accordionItems.findIndex(
      (item) => item.id === String(over.id),
    );

    const newItems = arrayMove(accordionItems, oldIndex, newIndex);

    setState((prev) => ({
      ...prev,
      accordionOrder: newItems.map((item) => item.id),
    }));
  };

  const primaryBodyArmour = {
    ...state.bodyArmour,
    kind: state.armour,
    enchant:
      state.bodyArmour.enchant !== 0
        ? state.bodyArmour.enchant
        : state.bodyArmourEnchant ?? 0,
    ego: selectedBodyArmourEgo,
  };
  const primaryShieldItem = {
    ...state.shieldItem,
    kind: state.shield,
    enchant:
      state.shieldItem.enchant !== 0
        ? state.shieldItem.enchant
        : state.shieldEnchant ?? 0,
  };
  const primaryOrbItem = {
    ...state.orbItem,
    kind: state.orb,
  };
  const offhandSummary =
    primaryShieldItem.kind !== "none"
      ? formatShieldSummary(primaryShieldItem)
      : formatOrbSummary(primaryOrbItem);
  const openOffhandModal = () =>
    setOpenPrimaryEquipment(
      primaryShieldItem.kind !== "none"
        ? "shield"
        : primaryOrbItem.kind !== "none"
        ? "orb"
        : "shield"
    );

  const renderPrimaryEquipmentModal = () => {
    switch (openPrimaryEquipment) {
      case "bodyArmour":
        return (
          <EquipmentEditModal
            config={{
              type: "bodyArmour",
              title: "Armour",
              value: primaryBodyArmour,
              onSave: (next, changed) => {
                const nextItem = clearImportedItemMetadata(next, changed);
                setState((prev) => ({
                  ...prev,
                  armour: nextItem.kind,
                  bodyArmourEnchant: nextItem.enchant,
                  bodyArmourEgo: getSpellBoostBodyArmourEgo(nextItem.ego),
                  bodyArmour: nextItem,
                }));
                setOpenPrimaryEquipment(null);
              },
            }}
            onCancel={() => setOpenPrimaryEquipment(null)}
          />
        );
      case "shield":
        return (
          <EquipmentEditModal
            config={{
              type: "shield",
              title: "Shield",
              value: primaryShieldItem,
              onSave: (next, changed) => {
                const nextItem = clearImportedItemMetadata(next, changed);
                setState((prev) => ({
                  ...prev,
                  shield: nextItem.kind,
                  shieldEnchant: nextItem.enchant,
                  shieldItem: nextItem,
                  orb: nextItem.kind === "none" ? prev.orb : "none",
                  orbItem:
                    nextItem.kind === "none"
                      ? prev.orbItem
                      : {
                          ...prev.orbItem,
                          kind: "none",
                          ego: "none",
                          modifiers: undefined,
                          displayName: undefined,
                          propertiesText: undefined,
                          artifactKind: undefined,
                          source: undefined,
                        },
                }));
                setOpenPrimaryEquipment(null);
              },
            }}
            onCancel={() => setOpenPrimaryEquipment(null)}
          />
        );
      case "orb":
        return (
          <EquipmentEditModal
            config={{
              type: "orb",
              title: "Orb",
              value: primaryOrbItem,
              onSave: (next, changed) => {
                const nextItem = clearImportedItemMetadata(next, changed);
                setState((prev) => ({
                  ...prev,
                  orb: nextItem.kind,
                  orbItem: nextItem,
                  shield: nextItem.kind === "none" ? prev.shield : "none",
                  shieldItem:
                    nextItem.kind === "none"
                      ? prev.shieldItem
                      : {
                          ...prev.shieldItem,
                          kind: "none",
                          enchant: 0,
                          ego: "none",
                          modifiers: undefined,
                          displayName: undefined,
                          propertiesText: undefined,
                          artifactKind: undefined,
                          source: undefined,
                        },
                }));
                setOpenPrimaryEquipment(null);
              },
            }}
            onCancel={() => setOpenPrimaryEquipment(null)}
          />
        );
      case null:
        return null;
    }
  };

  const controlsContent = (
    <CardHeader className="flex flex-col gap-4">
      <section
        data-testid="sidebar-section-base-stats"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-row flex-wrap items-center gap-4 text-sm">
          <label className="flex flex-row items-center gap-2 text-sm lg:basis-full">
            Species:
            <Select
              value={state.species}
              onValueChange={(value) =>
                setState((prev) => {
                  const species = value as SpeciesKey<V>;

                  return {
                    ...prev,
                    species,
                    ...coerceEquipmentSlotCollections(prev.version, species, {
                      ringSlots: prev.ringSlots,
                      amuletSlots: prev.amuletSlots,
                      headgearSlots: prev.headgearSlots,
                      gloveSlots: prev.gloveSlots,
                    }),
                  };
                })
              }
            >
              <SelectTrigger className="h-6">
                <SelectValue placeholder="Species" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(speciesOptions(state.version)).map(
                  ([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name} ({value.size})
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </label>
          <div
            data-testid="base-stats-row"
            className="grid w-full grid-cols-3 items-center gap-2"
          >
            <AttrInput
              label="Str"
              value={state.strength}
              type="stat"
              inputClassName="w-14 sm:w-16"
              onChange={(value) =>
                setState((prev) => ({ ...prev, strength: value }))
              }
            />
            <AttrInput
              label="Dex"
              value={state.dexterity}
              type="stat"
              inputClassName="w-14 sm:w-16"
              onChange={(value) =>
                setState((prev) => ({ ...prev, dexterity: value }))
              }
            />
            <AttrInput
              label="Int"
              value={state.intelligence}
              type="stat"
              inputClassName="w-14 sm:w-16"
              onChange={(value) =>
                setState((prev) => ({ ...prev, intelligence: value }))
              }
            />
          </div>
        </div>
      </section>
      <section
        data-testid="sidebar-section-skill"
        className="flex flex-col gap-3"
      >
        <SectionHeading>Skill</SectionHeading>
        <div
          data-testid="skill-stats-row"
          className="flex flex-row items-center gap-2 flex-wrap lg:flex-nowrap"
        >
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
        <SpellSkillControls
          state={state}
          setState={setState}
          testId="sidebar-spell-skill-controls"
        />
      </section>
      <section
        data-testid="sidebar-section-equipment"
        className="flex flex-col"
      >
        <div className="pb-3">
          <SectionHeading>Equipment</SectionHeading>
        </div>
        <EquipmentSummaryRow
          testId="equipment-row-offhand"
          label="Offhand"
          summary={offhandSummary}
          onOpen={openOffhandModal}
        />
        <EquipmentSummaryRow
          testId="equipment-row-body-armour"
          label="Armour"
          summary={formatBodyArmourSummary(primaryBodyArmour)}
          onOpen={() => setOpenPrimaryEquipment("bodyArmour")}
        />
        <DynamicEquipmentControls
          state={state}
          setState={setState}
          testId="sidebar-dynamic-equipment-controls"
        />
        {renderPrimaryEquipmentModal()}
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
      className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-start lg:gap-2"
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
