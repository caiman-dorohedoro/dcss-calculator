import { describe, expect, test } from "@jest/globals";
import type { EquipmentItemSnapshot, ParsedMorgueTextRecord } from "dcss-morgue-parser";
import { parseMorgueText } from "dcss-morgue-parser";
import { deepElfConjurer033Morgue } from "../__fixtures__/deepElfConjurer033";
import { oniMonkTrunkStatueFormMorgue } from "../__fixtures__/oniMonkTrunkStatueForm";
import {
  buildImportedCalculatorState,
  normalizeMorgueVersion,
  parseImportedMorgue,
} from "../importMorgue";

const makeItem = (
  displayName: string,
  baseType: string | null,
  options: {
    booleanProps?: Record<string, true>;
    numeric?: Record<string, number>;
  } | Record<string, true> = {}
): EquipmentItemSnapshot =>
  ({
    rawName: displayName,
    displayName,
    objectClass: "jewellery",
    equipState: "worn",
    isCursed: false,
    baseType,
    enchant: null,
    artifactKind: "normal",
    ego: null,
    subtypeEffect: null,
    propertiesText: null,
    properties: {
      numeric: ("numeric" in options ? options.numeric : undefined) ?? {},
      booleanProps:
        ("booleanProps" in options ? options.booleanProps : options) ?? {},
      opaqueTokens: [],
    },
    intrinsicProperties: {
      numeric: {},
      booleanProps: {},
      opaqueTokens: [],
    },
    egoProperties: {
      numeric: {},
      booleanProps: {},
      opaqueTokens: [],
    },
    artifactProperties: {
      numeric: {},
      booleanProps: {},
      opaqueTokens: [],
    },
  }) as EquipmentItemSnapshot;

const baseSkills = {
  fighting: 0,
  macesFlails: 0,
  axes: 0,
  polearms: 0,
  staves: 0,
  unarmedCombat: 0,
  throwing: 0,
  shortBlades: 0,
  longBlades: 0,
  rangedWeapons: 0,
  armour: 0,
  dodging: 0,
  shields: 0,
  stealth: 0,
  spellcasting: 0,
  conjurations: 0,
  hexes: 0,
  summonings: 0,
  necromancy: 0,
  forgecraft: 0,
  translocations: 0,
  transmutations: 0,
  alchemy: 0,
  fireMagic: 0,
  iceMagic: 0,
  airMagic: 0,
  earthMagic: 0,
  poisonMagic: 0,
  invocations: 0,
  evocations: 0,
  shapeshifting: 0,
};

const defaultGodState = {
  godPietyDisplay: null,
  godPietyRank: null,
  godOstracismPips: 0,
  godStatus: null,
  godUnderPenance: false,
  godHistory: [],
};

describe("morgue import mapper", () => {
  test("normalizes raw morgue versions into supported app versions", () => {
    expect(normalizeMorgueVersion("0.32.1-5-gba85492")).toBe("0.32");
    expect(normalizeMorgueVersion("0.33-b1")).toBe("0.33");
    expect(normalizeMorgueVersion("0.34.1")).toBe("0.34");
    expect(normalizeMorgueVersion("0.35-a0-181-g84ebf06")).toBe("trunk");
  });

  test("maps a parsed 0.33 morgue into overwriteable calculator state and summary", () => {
    const parsed = parseMorgueText(deepElfConjurer033Morgue);
    if (!parsed.ok) {
      throw new Error(`fixture should parse: ${parsed.failure.reason}`);
    }

    const result = buildImportedCalculatorState(parsed.record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.detectedVersion).toBe("0.33");
    expect(result.importedState).toMatchObject({
      version: "0.33",
      species: "deepElf",
      strength: 4,
      dexterity: 13,
      intelligence: 25,
      armour: "robe",
      shield: "none",
      orb: "none",
      helmet: true,
      gloves: false,
      boots: false,
      cloak: false,
      barding: false,
      armourSkill: 0,
      shieldSkill: 0,
      dodgingSkill: 2.4,
      spellcasting: 8.1,
      wildMagic: 0,
      targetSpell: "Magic Dart",
    });
    expect(result.importedState.schoolSkills).toMatchObject({
      conjuration: 6.1,
      translocation: 2.3,
      alchemy: 3,
    });
    expect(result.summary.applied).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Version" }),
        expect.objectContaining({ label: "Species" }),
        expect.objectContaining({ label: "Stats" }),
        expect.objectContaining({ label: "Skills" }),
        expect.objectContaining({ label: "Target spell" }),
      ])
    );
    expect(result.summary.skipped).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Mutations" })])
    );
    expect(result.summary.skipped).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Rings" })])
    );
  });

  test("derives wizardry, wild magic, and body-armour ego when the parser semantics are explicit", () => {
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Revenant",
      speciesVariant: null,
      background: "Fighter",
      god: null,
      ...defaultGodState,
      xl: 10,
      ac: 20,
      ev: 11,
      sh: 0,
      strength: 19,
      intelligence: 14,
      dexterity: 9,
      bodyArmour: "plate armour",
      shield: "none",
      helmets: [],
      gloves: [],
      footwear: [],
      cloaks: [],
      orb: "none",
      amulets: ["amulet of wizardry"],
      rings: [],
      talisman: "none",
      form: null,
      bodyArmourDetails: makeItem("plate armour of resonance", "plate armour", {
        Resonance: true,
      }),
      amuletDetails: [makeItem("amulet of wizardry", "amulet", { Wiz: true })],
      skills: {
        fighting: 0,
        macesFlails: 0,
        axes: 0,
        polearms: 0,
        staves: 0,
        unarmedCombat: 0,
        throwing: 0,
        shortBlades: 0,
        longBlades: 0,
        rangedWeapons: 0,
        armour: 20,
        dodging: 3,
        shields: 0,
        stealth: 0,
        spellcasting: 8,
        conjurations: 0,
        hexes: 0,
        summonings: 0,
        necromancy: 0,
        forgecraft: 9,
        translocations: 0,
        transmutations: 0,
        alchemy: 0,
        fireMagic: 7,
        iceMagic: 0,
        airMagic: 0,
        earthMagic: 8,
        poisonMagic: 0,
        invocations: 0,
        evocations: 0,
        shapeshifting: 0,
      },
      effectiveSkills: {
        fighting: 0,
        macesFlails: 0,
        axes: 0,
        polearms: 0,
        staves: 0,
        unarmedCombat: 0,
        throwing: 0,
        shortBlades: 0,
        longBlades: 0,
        rangedWeapons: 0,
        armour: 20,
        dodging: 3,
        shields: 0,
        stealth: 0,
        spellcasting: 8,
        conjurations: 0,
        hexes: 0,
        summonings: 0,
        necromancy: 0,
        forgecraft: 9,
        translocations: 0,
        transmutations: 0,
        alchemy: 0,
        fireMagic: 7,
        iceMagic: 0,
        airMagic: 0,
        earthMagic: 8,
        poisonMagic: 0,
        invocations: 0,
        evocations: 0,
        shapeshifting: 0,
      },
      spells: [
        {
          name: "Hellfire Mortar",
          failurePercent: 73,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [{ name: "wild magic", level: 2 }],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.detectedVersion).toBe("trunk");
    expect(result.importedState.bodyArmourEgo).toBe("resonance");
    expect(result.importedState.amuletSlots[0]).toEqual(
      expect.objectContaining({
        kind: "none",
        modifiers: { wizardry: 1 },
      })
    );
    expect(result.importedState.wildMagic).toBe(2);
  });

  test("imports parser-reported normal body armour ego without translating it to none", () => {
    const robeOfWillpower = {
      ...makeItem("+2 robe of willpower", "robe", {
        numeric: { Will: 1 },
      }),
      objectClass: "armour",
      enchant: 2,
      ego: "willpower",
      egoProperties: {
        numeric: { Will: 1 },
        booleanProps: {},
        opaqueTokens: [],
      },
    } as EquipmentItemSnapshot;

    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Human",
      speciesVariant: null,
      background: "Wizard",
      god: null,
      ...defaultGodState,
      xl: 10,
      ac: 5,
      ev: 10,
      sh: 0,
      strength: 10,
      intelligence: 20,
      dexterity: 10,
      bodyArmour: "+2 robe of willpower",
      shield: "none",
      helmets: [],
      gloves: [],
      footwear: [],
      cloaks: [],
      orb: "none",
      amulets: [],
      rings: [],
      talisman: "none",
      form: null,
      bodyArmourDetails: robeOfWillpower,
      skills: baseSkills,
      effectiveSkills: baseSkills,
      spells: [
        {
          name: "Magic Dart",
          failurePercent: 2,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.importedState.bodyArmour).toMatchObject({
      kind: "robe",
      enchant: 2,
      ego: "willpower",
      displayName: "+2 robe of willpower",
      artifactKind: "normal",
      source: "imported",
      modifiers: { will: 1 },
    });
    expect(result.importedState.bodyArmourEgo).toBe("none");
    expect(result.summary.applied).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Body armour ego",
          detail: "willpower",
        }),
      ])
    );
  });

  test("imports parser-reported armour egos for shield, orb, scarf, headgear, gloves, and footwear", () => {
    const orbOfEnergy = {
      ...makeItem("orb of energy", "orb", {
        booleanProps: { Energy: true },
      }),
      objectClass: "armour",
      enchant: null,
      ego: "energy",
    } as EquipmentItemSnapshot;
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Human",
      speciesVariant: null,
      background: "Wizard",
      god: null,
      ...defaultGodState,
      xl: 10,
      ac: 5,
      ev: 10,
      sh: 0,
      strength: 10,
      intelligence: 20,
      dexterity: 10,
      bodyArmour: "robe",
      shield: "+2 buckler of reflection",
      helmets: ["+0 hat of intelligence"],
      gloves: ["+0 pair of gloves of strength"],
      footwear: ["+1 pair of boots of flying"],
      cloaks: ["scarf of resistance"],
      orb: "none",
      amulets: [],
      rings: [],
      talisman: "none",
      form: null,
      bodyArmourDetails: makeItem("robe", "robe"),
      shieldDetails: {
        ...makeItem("+2 buckler of reflection", "buckler", {
          booleanProps: { Reflect: true },
        }),
        objectClass: "armour",
        enchant: 2,
        ego: "reflection",
        egoProperties: {
          numeric: {},
          booleanProps: { Reflect: true },
          opaqueTokens: [],
        },
      } as EquipmentItemSnapshot,
      helmetDetails: [
        {
          ...makeItem("+0 hat of intelligence", "hat", {
            numeric: { Int: 3 },
          }),
          objectClass: "armour",
          enchant: 0,
          ego: "intelligence",
        } as EquipmentItemSnapshot,
      ],
      glovesDetails: [
        {
          ...makeItem("+0 pair of gloves of strength", "gloves", {
            numeric: { Str: 3 },
          }),
          objectClass: "armour",
          enchant: 0,
          ego: "strength",
        } as EquipmentItemSnapshot,
      ],
      footwearDetails: [
        {
          ...makeItem("+1 pair of boots of flying", "boots", {
            booleanProps: { Fly: true },
          }),
          objectClass: "armour",
          enchant: 1,
          ego: "flying",
        } as EquipmentItemSnapshot,
      ],
      cloakDetails: [
        {
          ...makeItem("scarf of resistance", "scarf", {
            numeric: { rF: 1, rC: 1 },
          }),
          objectClass: "armour",
          enchant: null,
          ego: "resistance",
        } as EquipmentItemSnapshot,
      ],
      orbDetails: undefined,
      skills: baseSkills,
      effectiveSkills: baseSkills,
      spells: [
        {
          name: "Magic Dart",
          failurePercent: 2,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.importedState.shieldItem).toEqual(
      expect.objectContaining({
        kind: "buckler",
        enchant: 2,
        ego: "reflection",
      })
    );
    expect(result.importedState.cloakItem).toEqual(
      expect.objectContaining({
        kind: "scarf",
        present: true,
        ego: "resistance",
      })
    );
    expect(result.importedState.headgearSlots[0]).toEqual(
      expect.objectContaining({
        present: true,
        kind: "hat",
        ego: "intelligence",
      })
    );
    expect(result.importedState.gloveSlots[0]).toEqual(
      expect.objectContaining({ present: true, ego: "strength" })
    );
    expect(result.importedState.bootsItem).toEqual(
      expect.objectContaining({
        kind: "boots",
        present: true,
        ego: "flying",
      })
    );

    const orbResult = buildImportedCalculatorState({
      ...record,
      shield: "none",
      shieldDetails: undefined,
      orb: "orb of energy",
      orbDetails: orbOfEnergy,
    } as ParsedMorgueTextRecord);
    expect(orbResult.ok).toBe(true);
    if (!orbResult.ok) {
      throw new Error("expected successful import");
    }
    expect(orbResult.importedState.orb).toBe("energy");
    expect(orbResult.importedState.orbItem).toEqual(
      expect.objectContaining({ kind: "energy", ego: "energy" })
    );
  });

  test("does not turn jewellery subtype effects into equipment ego", () => {
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Human",
      speciesVariant: null,
      background: "Wizard",
      god: null,
      ...defaultGodState,
      xl: 10,
      ac: 5,
      ev: 10,
      sh: 0,
      strength: 10,
      intelligence: 20,
      dexterity: 10,
      bodyArmour: "robe",
      shield: "none",
      helmets: [],
      gloves: [],
      footwear: [],
      cloaks: [],
      orb: "none",
      amulets: [],
      rings: ["ring of willpower"],
      talisman: "none",
      form: null,
      bodyArmourDetails: makeItem("robe", "robe"),
      ringDetails: [
        {
          ...makeItem("ring of willpower", "ring", {
            numeric: { Will: 1 },
          }),
          objectClass: "jewellery",
          ego: null,
          subtypeEffect: "willpower",
        } as EquipmentItemSnapshot,
      ],
      skills: baseSkills,
      effectiveSkills: baseSkills,
      spells: [
        {
          name: "Magic Dart",
          failurePercent: 2,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.importedState.ringSlots[0]).toEqual(
      expect.objectContaining({
        kind: "none",
        modifiers: { will: 1 },
      })
    );
    expect("ego" in result.importedState.ringSlots[0]).toBe(false);
  });

  test("maps slot-supported jewellery, signed enchants, residual numeric props, and mutation modifiers", () => {
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Octopode",
      speciesVariant: null,
      background: "Conjurer",
      god: null,
      ...defaultGodState,
      xl: 12,
      ac: 17,
      ev: 20,
      sh: 11,
      strength: 8,
      intelligence: 23,
      dexterity: 14,
      bodyArmour: "robe",
      shield: "kite shield",
      helmets: ["-1 hat of intelligence"],
      gloves: [],
      footwear: ["+5 barding"],
      cloaks: ["+2 cloak"],
      orb: "none",
      amulets: ["amulet of reflection"],
      rings: ["ring of protection +4", "ring of wizardry", "ring of evasion +5"],
      talisman: "none",
      form: null,
      bodyArmourDetails: { ...makeItem("robe", "robe"), enchant: -2 },
      shieldDetails: { ...makeItem("+3 kite shield", "kite shield"), enchant: 3 },
      helmetDetails: [
        {
          ...makeItem("-1 hat of intelligence", "hat", {
            numeric: { Int: 3 },
          }),
          egoProperties: {
            numeric: { Int: 3 },
            booleanProps: {},
            opaqueTokens: [],
          },
          enchant: -1,
        },
      ],
      footwearDetails: [{ ...makeItem("+5 barding", "barding"), enchant: 5 }],
      cloakDetails: [{ ...makeItem("+2 cloak", "cloak"), enchant: 2 }],
      amuletDetails: [
        makeItem("amulet of reflection", "amulet", {
          booleanProps: { Reflect: true },
        }),
      ],
      ringDetails: [
        {
          ...makeItem("ring of protection +4", "ring"),
          subtypeEffect: "protection +4",
          enchant: null,
        },
        makeItem("ring of wizardry", "ring", {
          booleanProps: { Wiz: true },
        }),
        {
          ...makeItem("ring of evasion +5", "ring"),
          subtypeEffect: "evasion +5",
          enchant: null,
        },
      ],
      skills: baseSkills,
      effectiveSkills: baseSkills,
      spells: [
        {
          name: "Magic Dart",
          failurePercent: 2,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [
        { name: "subdued magic", level: 1 },
        { name: "anti-wizardry", level: 2 },
        { name: "distortion field", level: 3 },
        { name: "large bone plates", level: 2 },
        { name: "big brain", level: 3 },
        { name: "runic magic", level: 1 },
      ],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.importedState.ringSlots.slice(0, 3)).toEqual([
      expect.objectContaining({ kind: "protection", plus: 4 }),
      expect.objectContaining({ kind: "wizardry", plus: 0 }),
      expect.objectContaining({ kind: "evasion", plus: 5 }),
    ]);
    expect(result.importedState.amuletSlots[0]).toEqual(
      expect.objectContaining({ kind: "reflection" })
    );
    expect(result.importedState.bodyArmourEnchant).toBe(-2);
    expect(result.importedState.shieldEnchant).toBe(3);
    expect(result.importedState.headgearSlots[0]).toEqual(
      expect.objectContaining({
        present: true,
        enchant: -1,
        kind: "hat",
        modifiers: { int: 3 },
      })
    );
    expect(result.importedState.barding).toBe(true);
    expect(result.importedState.bardingEnchant).toBe(5);
    expect(result.importedState.cloakEnchant).toBe(2);
    expect(result.importedState.bardingItem).toEqual(
      expect.objectContaining({
        present: true,
        enchant: 5,
      })
    );
    expect(result.importedState.cloakItem).toEqual(
      expect.objectContaining({
        present: true,
        enchant: 2,
      })
    );
    expect(result.importedState.subduedMagic).toBe(1);
    expect(result.importedState.antiWizardry).toBe(2);
    expect(result.importedState.runicMagic).toBe(1);
    expect(result.importedState.distortionField).toBe(3);
    expect(result.importedState.largeBonePlates).toBe(2);
    expect(result.importedState.bigBrainWizardry).toBe(1);
    expect(result.summary.skipped).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Rings" })])
    );
    expect(result.summary.skipped).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Amulets" })])
    );
    expect(result.summary.skipped).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Headgear" })])
    );
  });

  test("maps parser detail modifiers onto the owning equipment item", () => {
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Octopode",
      speciesVariant: null,
      background: "Conjurer",
      god: null,
      ...defaultGodState,
      xl: 12,
      ac: 17,
      ev: 20,
      sh: 11,
      strength: 8,
      intelligence: 23,
      dexterity: 14,
      bodyArmour: "robe",
      shield: "none",
      helmets: ["-1 hat of intelligence"],
      gloves: [],
      footwear: ["+5 barding"],
      cloaks: ["+2 cloak"],
      orb: "orb of energy",
      amulets: ["amulet of reflection"],
      rings: ["ring of protection +4", "ring of wizardry"],
      talisman: "none",
      form: null,
      bodyArmourDetails: {
        ...makeItem("+2 robe of intelligence", "robe", {
          numeric: { Int: 3 },
        }),
        objectClass: "armour",
        enchant: 2,
      },
      helmetDetails: [
        {
          ...makeItem("-1 hat of intelligence", "hat", {
            numeric: { Int: 3 },
          }),
          objectClass: "armour",
          enchant: -1,
        },
      ],
      footwearDetails: [{ ...makeItem("+5 barding", "barding"), objectClass: "armour", enchant: 5 }],
      cloakDetails: [{ ...makeItem("+2 cloak", "cloak"), objectClass: "armour", enchant: 2 }],
      orbDetails: makeItem("orb of energy", "orb of energy", {
        booleanProps: { Energy: true, Wiz: true },
      }),
      amuletDetails: [
        makeItem("amulet of reflection", "amulet", {
          booleanProps: { Reflect: true },
        }),
      ],
      ringDetails: [
        {
          ...makeItem("ring of protection +4", "ring", {
            numeric: { Int: 1 },
          }),
          subtypeEffect: "protection +4",
          enchant: null,
        },
        makeItem("ring of wizardry", "ring", {
          booleanProps: { Wiz: true },
        }),
      ],
      skills: baseSkills,
      effectiveSkills: baseSkills,
      spells: [
        {
          name: "Magic Dart",
          failurePercent: 2,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.importedState.bodyArmour).toEqual(
      expect.objectContaining({
        kind: "robe",
        enchant: 2,
        ego: "none",
        modifiers: { int: 3 },
      })
    );
    expect(result.importedState.orbItem).toEqual(
      expect.objectContaining({
        kind: "energy",
        modifiers: { wizardry: 1 },
      })
    );
    expect(result.importedState.headgearSlots[0]).toEqual(
      expect.objectContaining({
        present: true,
        enchant: -1,
        kind: "hat",
        modifiers: { int: 3 },
      })
    );
    expect(result.importedState.ringSlots.slice(0, 2)).toEqual([
      expect.objectContaining({ kind: "protection", plus: 4, modifiers: { int: 1 } }),
      expect.objectContaining({ kind: "wizardry", plus: 0 }),
    ]);
    expect(result.importedState.unattributedGear).toBeUndefined();
  });

  test("keeps parser item properties that are display-only for calculations", () => {
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Naga",
      speciesVariant: null,
      background: "Conjurer",
      god: null,
      ...defaultGodState,
      xl: 12,
      ac: 17,
      ev: 20,
      sh: 11,
      strength: 8,
      intelligence: 23,
      dexterity: 14,
      bodyArmour: "robe",
      shield: "tower shield",
      helmets: ['+3 hat of Pondering'],
      gloves: [],
      footwear: [],
      cloaks: ["+2 cloak"],
      orb: "none",
      amulets: ['amulet of Impatience'],
      rings: ['ring of Ewkivat'],
      talisman: "none",
      form: null,
      bodyArmourDetails: { ...makeItem("robe", "robe"), objectClass: "armour" },
      shieldDetails: {
        ...makeItem('+10 tower shield "Ygacoyf"', "tower shield", {
          booleanProps: { Reflect: true },
          numeric: { Str: 2 },
        }),
        objectClass: "armour",
        enchant: 10,
      },
      helmetDetails: [
        {
          ...makeItem("+3 hat of Pondering", "hat", {
            booleanProps: { Ponderous: true },
            numeric: { Will: 1, MP: 10, Int: 5 },
          }),
          objectClass: "armour",
          enchant: 3,
        },
      ],
      footwearDetails: [],
      cloakDetails: [
        {
          ...makeItem("+2 cloak", "cloak", {
            numeric: { Will: 1 },
          }),
          objectClass: "armour",
          enchant: 2,
        },
      ],
      orbDetails: undefined,
      amuletDetails: [
        makeItem("amulet of Impatience", "amulet", {
          booleanProps: { Inv: true },
          numeric: { RegenMP: 1, Str: 3 },
        }),
      ],
      ringDetails: [
        makeItem("ring of Ewkivat", "ring", {
          booleanProps: { rCorr: true },
          numeric: { rC: 1, rN: 2, Will: -1, MP: 7, Str: 4 },
        }),
      ],
      skills: baseSkills,
      effectiveSkills: baseSkills,
      spells: [
        {
          name: "Magic Dart",
          failurePercent: 2,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.importedState.shieldItem.modifiers).toEqual({
      flags: ["Reflect"],
      str: 2,
    });
    expect(result.importedState.headgearSlots[0].modifiers).toEqual({
      flags: ["Ponderous"],
      will: 1,
      mp: 10,
      int: 5,
    });
    expect(result.importedState.cloakItem.modifiers).toEqual({ will: 1 });
    expect(result.importedState.amuletSlots[0].modifiers).toEqual({
      flags: ["+Inv"],
      regenMP: 1,
      str: 3,
    });
    expect(result.importedState.ringSlots[0].modifiers).toEqual({
      flags: ["rCorr"],
      rC: 1,
      rN: 2,
      will: -1,
      mp: 7,
      str: 4,
    });
  });

  test("preserves imported body armour name and raw property text separately from base armour", () => {
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Naga",
      speciesVariant: null,
      background: "Conjurer",
      god: null,
      ...defaultGodState,
      xl: 12,
      ac: 17,
      ev: 20,
      sh: 11,
      strength: 8,
      intelligence: 23,
      dexterity: 14,
      bodyArmour: "robe",
      shield: "none",
      helmets: [],
      gloves: [],
      footwear: [],
      cloaks: [],
      orb: "none",
      amulets: [],
      rings: [],
      talisman: "none",
      form: null,
      bodyArmourDetails: {
        ...makeItem("justicar's regalia", "robe", {
          numeric: { Str: 4 },
        }),
        objectClass: "armour",
        enchant: 5,
        artifactKind: "unrand",
        propertiesText: "Inspire Amulet+ Str+4",
        properties: {
          numeric: { Str: 4 },
          booleanProps: {},
          opaqueTokens: ["Inspire", "Amulet+"],
        },
      },
      shieldDetails: undefined,
      helmetDetails: [],
      glovesDetails: [],
      footwearDetails: [],
      cloakDetails: [],
      orbDetails: undefined,
      amuletDetails: [],
      ringDetails: [],
      skills: baseSkills,
      effectiveSkills: baseSkills,
      spells: [
        {
          name: "Magic Dart",
          failurePercent: 2,
          castable: true,
          memorized: true,
        },
      ],
      mutations: [],
    } as ParsedMorgueTextRecord;

    const result = buildImportedCalculatorState(record);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.importedState.armour).toBe("robe");
    expect(result.importedState.bodyArmour).toEqual(
      expect.objectContaining({
        kind: "robe",
        enchant: 5,
        displayName: "justicar's regalia",
        propertiesText: "Inspire Amulet+ Str+4",
        artifactKind: "unrand",
        source: "imported",
        modifiers: { flags: ["Inspire", "Amulet+"], str: 4 },
      })
    );
  });

  test("returns a parser failure record for invalid text", () => {
    expect(parseImportedMorgue("not a morgue")).toMatchObject({
      ok: false,
      kind: "parse_failed",
    });
  });

  test("parses a trunk oni morgue even when form text adds a direct self-description", () => {
    const parsed = parseMorgueText(oniMonkTrunkStatueFormMorgue);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(`fixture should parse: ${parsed.failure.reason}`);
    }

    const imported = parseImportedMorgue(oniMonkTrunkStatueFormMorgue);
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      throw new Error(`import should succeed: ${imported.kind}`);
    }

    expect(imported.importedState.version).toBe("trunk");
    expect(imported.importedState.species).toBe("oni");
    expect(imported.importedState.ringSlots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "none",
          displayName: "ring of protection from fire",
          modifiers: { rF: 1 },
        }),
      ])
    );
    expect(imported.summary.skipped).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Rings" })])
    );
  });

  test("parses compact title-line dumps using the notes descriptor fallback", () => {
    const abbreviatedMorgue = oniMonkTrunkStatueFormMorgue.replace(
      "(Oni Monk)",
      "(GCAE)"
    ).concat(`
Notes
Turn   | Place    | Note
-------+----------+----------------------------------------
     0 | D:1      | caiman the Gale Centaur Air Elementalist began the quest for the Orb.
`);

    const parsed = parseMorgueText(abbreviatedMorgue);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(`fixture should parse: ${parsed.failure.reason}`);
    }

    expect(parsed.record.species).toBe("Gale Centaur");
    expect(parsed.record.background).toBe("Air Elementalist");
  });
});
