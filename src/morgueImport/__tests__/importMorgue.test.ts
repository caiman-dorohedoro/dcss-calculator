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
      wizardry: 0,
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
      expect.arrayContaining([
        expect.objectContaining({ label: "Rings" }),
        expect.objectContaining({ label: "Mutations" }),
      ])
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
    expect(result.importedState.wizardry).toBe(1);
    expect(result.importedState.wildMagic).toBe(2);
  });

  test("maps slot-supported jewellery, signed enchants, residual numeric props, and mutation modifiers", () => {
    const record = {
      playerName: "tester",
      version: "0.35-a0-181-g84ebf06",
      species: "Octopode",
      speciesVariant: null,
      background: "Conjurer",
      god: null,
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
      footwear: [],
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
      expect.objectContaining({ present: false, enchant: 0 })
    );
    expect(result.importedState.cloakEnchant).toBe(2);
    expect(result.importedState.equipmentInt).toBe(3);
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
    expect(result.summary.skipped).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Headgear" })])
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
  });
});
