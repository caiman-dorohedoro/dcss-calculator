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
import EquipmentEnchantInput from "@/components/EquipmentEnchantInput";
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
import { getBodyArmourEgoOptions } from "@/versioning/equipmentData";
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
import DynamicEquipmentControls, {
  EquipmentModifierInputs,
} from "@/components/DynamicEquipmentControls";
import { coerceEquipmentSlotCollections } from "@/versioning/dynamicSlotCounts";

type CalculatorProps<V extends GameVersion> = {
  state: CalculatorState<V>;
  setState: React.Dispatch<React.SetStateAction<CalculatorState<V>>>;
};

const SectionHeading = ({ children }: { children: string }) => (
  <div className="flex items-center gap-3">
    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
    <div className="h-px flex-1 bg-border/60" />
  </div>
);

const hasModifierValues = (
  modifiers?: CalculatorState<GameVersion>["bodyArmour"]["modifiers"]
) => modifiers !== undefined && Object.keys(modifiers).length > 0;

const shouldShowModifierInputs = (
  equipped: boolean,
  modifiers?: CalculatorState<GameVersion>["bodyArmour"]["modifiers"],
  displayName?: string
) => equipped || hasModifierValues(modifiers) || displayName !== undefined;

const Calculator = <V extends GameVersion>({
  state,
  setState,
}: CalculatorProps<V>) => {
  const bodyArmourEgos = getBodyArmourEgoOptions(state.version);
  const selectedBodyArmourEgo =
    state.bodyArmour.ego in bodyArmourEgos
      ? state.bodyArmour.ego
      : state.bodyArmourEgo !== undefined && state.bodyArmourEgo in bodyArmourEgos
      ? state.bodyArmourEgo
      : "none";

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
              <SelectTrigger className="w-[180px] h-6">
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
          className="hidden lg:flex"
          testId="desktop-spell-skill-controls"
        />
      </section>
      <section
        data-testid="sidebar-section-equipment"
        className="flex flex-col gap-3"
      >
        <SectionHeading>Equipment</SectionHeading>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div
              data-testid="body-armour-controls"
              className="flex min-w-0 max-w-full flex-row items-center gap-2 flex-nowrap"
            >
              <span data-testid="body-armour-label" className="shrink-0 text-sm">
                Armour:
              </span>
              {state.armour !== "none" && (
                <div
                  data-testid="body-armour-enchant-control"
                  className="shrink-0"
                >
                  <EquipmentEnchantInput
                    ariaLabel="Body armour enchant"
                    value={
                      state.bodyArmour.enchant !== 0
                        ? state.bodyArmour.enchant
                        : state.bodyArmourEnchant ?? 0
                    }
                    onChange={(value) =>
                      setState((prev) => ({
                        ...prev,
                        bodyArmourEnchant: value,
                        bodyArmour: {
                          ...prev.bodyArmour,
                          enchant: value,
                        },
                      }))
                    }
                  />
                </div>
              )}
              <div
                data-testid="body-armour-selector-control"
                className="min-w-0 flex-1"
              >
                <Select
                  value={state.armour}
                  onValueChange={(value) =>
                    setState((prev) => {
                      const nextArmour = value as ArmourKey;

                      return {
                        ...prev,
                        armour: nextArmour,
                        bodyArmourEgo:
                          nextArmour === "none" ? "none" : prev.bodyArmourEgo,
                        bodyArmour: {
                          ...prev.bodyArmour,
                          kind: nextArmour,
                          ego:
                            nextArmour === "none" ? "none" : prev.bodyArmour.ego,
                        },
                      };
                    })
                  }
                >
                  <SelectTrigger
                    aria-label="Armour"
                    className="h-6 min-w-0 max-w-full gap-2"
                  >
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
              </div>
              {state.armour !== "none" && (
                <div data-testid="body-armour-ego-control" className="shrink-0">
                  <Select
                    value={selectedBodyArmourEgo}
                    onValueChange={(value) =>
                      setState((prev) => ({
                        ...prev,
                        bodyArmourEgo: value as BodyArmourEgoKey,
                        bodyArmour: {
                          ...prev.bodyArmour,
                          ego: value as BodyArmourEgoKey,
                        },
                      }))
                    }
                  >
                    <SelectTrigger
                      aria-label="Body armour ego"
                      className="min-w-[120px] h-6 w-auto gap-2"
                    >
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(bodyArmourEgos) as BodyArmourEgoKey[]).map(
                        (key) => (
                          <SelectItem key={key} value={key}>
                            {bodyArmourEgos[key]?.name ?? key}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {state.bodyArmour.displayName && (
              <span className="text-xs text-muted-foreground">
                {state.bodyArmour.displayName}
              </span>
            )}
            {shouldShowModifierInputs(
              state.armour !== "none",
              state.bodyArmour.modifiers,
              state.bodyArmour.displayName
            ) && (
              <EquipmentModifierInputs
                modifiers={state.bodyArmour.modifiers}
                onChange={(modifiers) =>
                  setState((prev) => ({
                    ...prev,
                    bodyArmour: {
                      ...prev.bodyArmour,
                      modifiers,
                    },
                  }))
                }
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2 flex-nowrap">
              <span data-testid="shield-label" className="shrink-0 text-sm">
                Shield:
              </span>
              {state.shield !== "none" && (
                <div data-testid="shield-enchant-control" className="shrink-0">
                  <EquipmentEnchantInput
                    ariaLabel="Shield enchant"
                    value={
                      state.shieldItem.enchant !== 0
                        ? state.shieldItem.enchant
                        : state.shieldEnchant ?? 0
                    }
                    onChange={(value) =>
                      setState((prev) => ({
                        ...prev,
                        shieldEnchant: value,
                        shieldItem: {
                          ...prev.shieldItem,
                          enchant: value,
                        },
                      }))
                    }
                  />
                </div>
              )}
              <div data-testid="shield-selector-control">
                <Select
                  disabled={state.orb !== "none"}
                  value={state.shield}
                  onValueChange={(value) =>
                    setState((prev) => {
                      const nextShield = value as ShieldKey;

                      return {
                        ...prev,
                        shield: nextShield,
                        shieldItem: {
                          ...prev.shieldItem,
                          kind: nextShield,
                        },
                        orb: nextShield === "none" ? prev.orb : "none",
                        orbItem:
                          nextShield === "none"
                            ? prev.orbItem
                            : {
                                ...prev.orbItem,
                                kind: "none",
                              },
                      };
                    })
                  }
                >
                  <SelectTrigger aria-label="Shield" className="w-[160px] h-6">
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
              </div>
          </div>
            {state.shieldItem.displayName && (
              <span className="text-xs text-muted-foreground">
                {state.shieldItem.displayName}
              </span>
            )}
            {shouldShowModifierInputs(
              state.shield !== "none",
              state.shieldItem.modifiers,
              state.shieldItem.displayName
            ) && (
              <EquipmentModifierInputs
                modifiers={state.shieldItem.modifiers}
                onChange={(modifiers) =>
                  setState((prev) => ({
                    ...prev,
                    shieldItem: {
                      ...prev.shieldItem,
                      modifiers,
                    },
                  }))
                }
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex flex-row items-center gap-2 text-sm">
              Orb:
              <Select
                disabled={state.shield !== "none"}
                value={state.orb}
                onValueChange={(value) =>
                  setState((prev) => {
                    const nextOrb = value as OrbKey;

                    return {
                      ...prev,
                      orb: nextOrb,
                      orbItem: {
                        ...prev.orbItem,
                        kind: nextOrb,
                      },
                      shield: nextOrb === "none" ? prev.shield : "none",
                      shieldItem:
                        nextOrb === "none"
                          ? prev.shieldItem
                          : {
                              ...prev.shieldItem,
                              kind: "none",
                            },
                    };
                  })
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
            {state.orbItem.displayName && (
              <span className="text-xs text-muted-foreground">
                {state.orbItem.displayName}
              </span>
            )}
            {shouldShowModifierInputs(
              state.orb !== "none",
              state.orbItem.modifiers,
              state.orbItem.displayName
            ) && (
              <EquipmentModifierInputs
                modifiers={state.orbItem.modifiers}
                onChange={(modifiers) =>
                  setState((prev) => ({
                    ...prev,
                    orbItem: {
                      ...prev.orbItem,
                      modifiers,
                    },
                  }))
                }
              />
            )}
          </div>
        </div>
        <DynamicEquipmentControls
          state={state}
          setState={setState}
          className="hidden lg:flex"
          testId="desktop-dynamic-equipment-controls"
        />
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
