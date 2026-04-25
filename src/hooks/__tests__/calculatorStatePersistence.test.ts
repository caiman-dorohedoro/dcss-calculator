/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { parseSavedState } from "../useCalculatorState";

const omitKeys = (value: unknown, keys: string[]) => {
  const next = { ...(value as Record<string, unknown>) };

  for (const key of keys) {
    delete next[key];
  }

  return next;
};

describe("calculator saved-state migration", () => {
  test("restores modern itemized equipment saves", () => {
    const modern = {
      ...buildDefaultCalculatorState("trunk"),
      bodyArmour: {
        kind: "ring_mail",
        enchant: 2,
        ego: "none",
        displayName: "robe of Augmentation",
        propertiesText: "Str+4 Int+4 Dex+4",
        artifactKind: "unrand",
        source: "imported",
        modifiers: { flags: ["Ponderous"], will: 1, mp: 10, int: 3 },
      },
      shieldItem: {
        kind: "buckler",
        enchant: 1,
        modifiers: { sh: 2 },
      },
      orbItem: {
        kind: "energy",
        modifiers: { wizardry: 1 },
      },
    };

    const parsed = parseSavedState(JSON.stringify(modern));

    expect(parsed?.bodyArmour.modifiers).toEqual({
      flags: ["Ponderous"],
      will: 1,
      mp: 10,
      int: 3,
    });
    expect(parsed?.bodyArmour.displayName).toBe("robe of Augmentation");
    expect(parsed?.bodyArmour.propertiesText).toBe("Str+4 Int+4 Dex+4");
    expect(parsed?.shieldItem.modifiers).toEqual({ sh: 2 });
    expect(parsed?.orbItem.modifiers).toEqual({ wizardry: 1 });
  });

  test("restores parser-aligned body armour ego strings", () => {
    const modern = {
      ...buildDefaultCalculatorState("trunk"),
      bodyArmour: {
        kind: "robe",
        enchant: 2,
        ego: "willpower",
        modifiers: { will: 1 },
      },
    };

    const parsed = parseSavedState(JSON.stringify(modern));

    expect(parsed?.bodyArmour.ego).toBe("willpower");
    expect(parsed?.bodyArmour.modifiers).toEqual({ will: 1 });
  });

  test("keeps unknown imported body armour ego strings loadable", () => {
    const modern = {
      ...buildDefaultCalculatorState("trunk"),
      bodyArmour: {
        kind: "robe",
        enchant: 1,
        ego: "future mystery",
        displayName: "+1 robe of future mystery",
        artifactKind: "normal",
        source: "imported",
      },
    };

    const parsed = parseSavedState(JSON.stringify(modern));

    expect(parsed?.bodyArmour.ego).toBe("future mystery");
  });

  test("folds legacy top-level bodyArmourEgo into itemized body armour when needed", () => {
    const legacy = {
      ...buildDefaultCalculatorState("trunk"),
      bodyArmourEgo: "resonance",
      bodyArmour: {
        kind: "plate",
        enchant: 0,
        ego: "none",
      },
    };

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed?.bodyArmour.ego).toBe("resonance");
    expect(parsed?.bodyArmourEgo).toBe("resonance");
  });

  test("migrates legacy flat gear totals into rings and explicit fallback gear", () => {
    const legacy = {
      version: "trunk",
      species: "human",
      armour: "ring_mail",
      bodyArmourEnchant: 2,
      shield: "buckler",
      shieldEnchant: 1,
      orb: "energy",
      ringSlots: [],
      amuletSlots: [],
      headgearSlots: [],
      gloveSlots: [],
      equipmentInt: 3,
      equipmentSH: 2,
      equipmentDex: 1,
      wizardry: 2,
    };

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed?.ringSlots.slice(0, 2)).toEqual([
      expect.objectContaining({ kind: "wizardry" }),
      expect.objectContaining({ kind: "wizardry" }),
    ]);
    expect(parsed?.unattributedGear).toEqual({
      label: "legacy gear",
      modifiers: { int: 3, sh: 2, dex: 1 },
      source: "legacy",
    });
  });

  test("creates slot arrays when a legacy save does not include them", () => {
    const legacy = omitKeys(buildDefaultCalculatorState("0.34"), [
      "ringSlots",
      "amuletSlots",
      "headgearSlots",
      "gloveSlots",
    ]);

    legacy.species = "formicid";

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toHaveLength(2);
    expect(parsed?.amuletSlots).toHaveLength(1);
    expect(parsed?.headgearSlots).toHaveLength(1);
    expect(parsed?.gloveSlots).toHaveLength(2);
  });

  test("migrates legacy scalar and boolean equipment fields into the new slot arrays", () => {
    const legacy = omitKeys(buildDefaultCalculatorState("0.34"), [
      "ringSlots",
      "amuletSlots",
      "headgearSlots",
      "gloveSlots",
    ]);

    legacy.species = "formicid";
    legacy.wizardry = 2;
    legacy.gloves = true;
    legacy.secondGloves = true;
    legacy.helmet = true;

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ]);
    expect(parsed?.gloveSlots).toEqual([
      { present: true, enchant: 0 },
      { present: true, enchant: 0 },
    ]);
    expect(parsed?.headgearSlots).toEqual([
      { present: true, enchant: 0, kind: "helmet" },
    ]);
    expect(parsed?.wizardry).toBe(0);
  });

  test("prefers legacy fields when mixed-shape saves still contain default slot arrays", () => {
    const legacy = buildDefaultCalculatorState("0.34");

    legacy.species = "formicid";
    legacy.wizardry = 2;
    legacy.gloves = true;
    legacy.secondGloves = true;
    legacy.helmet = true;

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ]);
    expect(parsed?.gloveSlots).toEqual([
      { present: true, enchant: 0 },
      { present: true, enchant: 0 },
    ]);
    expect(parsed?.headgearSlots).toEqual([
      { present: true, enchant: 0, kind: "helmet" },
    ]);
    expect(parsed?.wizardry).toBe(0);
  });

  test("round-trips modern slot edits even when legacy keys are still present", () => {
    const modern = buildDefaultCalculatorState("0.34");

    modern.species = "formicid";
    modern.ringSlots = [
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ];
    modern.amuletSlots = [{ kind: "none" }];
    modern.headgearSlots = [{ present: true, enchant: 0 }];
    modern.gloveSlots = [
      { present: true, enchant: 0 },
      { present: true, enchant: 0 },
    ];
    modern.wizardry = 1;
    modern.gloves = true;
    modern.secondGloves = true;
    modern.helmet = true;

    const parsed = parseSavedState(JSON.stringify(modern));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ]);
    expect(parsed?.amuletSlots).toEqual([{ kind: "none" }]);
    expect(parsed?.headgearSlots).toEqual([
      { present: true, enchant: 0, kind: "helmet" },
    ]);
    expect(parsed?.gloveSlots).toEqual([
      { present: true, enchant: 0 },
      { present: true, enchant: 0 },
    ]);
    expect(parsed?.wizardry).toBe(1);
  });

  test("clears stale mirrored wizardry when restored ring slots are manual and metadata-free", () => {
    const legacy = buildDefaultCalculatorState("0.34");

    legacy.species = "formicid";
    legacy.wizardry = 2;
    legacy.ringSlots = [
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ];

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ]);
    expect(parsed?.wizardry).toBe(0);
  });

  test("clears stale mirrored wizardry when only some restored ring slots are manual wizardry", () => {
    const legacy = buildDefaultCalculatorState("0.34");

    legacy.species = "formicid";
    legacy.wizardry = 1;
    legacy.ringSlots = [
      { kind: "wizardry", plus: 0 },
      { kind: "none", plus: 0 },
    ];

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      { kind: "wizardry", plus: 0 },
      { kind: "none", plus: 0 },
    ]);
    expect(parsed?.wizardry).toBe(0);
  });

  test("clears stale mirrored wizardry when a manual wizardry ring is mixed with another manual ring kind", () => {
    const legacy = buildDefaultCalculatorState("0.34");

    legacy.species = "formicid";
    legacy.wizardry = 1;
    legacy.ringSlots = [
      { kind: "wizardry", plus: 0 },
      { kind: "protection", plus: 3 },
    ];

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      { kind: "wizardry", plus: 0 },
      { kind: "protection", plus: 3 },
    ]);
    expect(parsed?.wizardry).toBe(0);
  });

  test("preserves residual wizardry when restored wizardry rings carry imported metadata", () => {
    const modern = buildDefaultCalculatorState("0.34");

    modern.species = "formicid";
    modern.wizardry = 2;
    modern.ringSlots = [
      {
        kind: "wizardry",
        plus: 0,
        displayName: "ring of wizardry",
        artifactKind: "normal",
        source: "imported",
      },
      {
        kind: "wizardry",
        plus: 0,
        displayName: "ring of wizardry",
        artifactKind: "normal",
        source: "imported",
      },
    ];

    const parsed = parseSavedState(JSON.stringify(modern));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      {
        kind: "wizardry",
        plus: 0,
        displayName: "ring of wizardry",
        artifactKind: "normal",
        source: "imported",
      },
      {
        kind: "wizardry",
        plus: 0,
        displayName: "ring of wizardry",
        artifactKind: "normal",
        source: "imported",
      },
    ]);
    expect(parsed?.wizardry).toBe(2);
  });

  test("preserves modern slot data even when legacy keys are present", () => {
    const modern = buildDefaultCalculatorState("0.34");

    modern.species = "formicid";
    modern.wizardry = 2;
    modern.gloves = true;
    modern.secondGloves = true;
    modern.helmet = true;
    modern.ringSlots = [
      { kind: "protection", plus: 5 },
      { kind: "evasion", plus: 1 },
    ];
    modern.gloveSlots = [
      { present: true, enchant: 2 },
      { present: true, enchant: -1 },
    ];
    modern.headgearSlots = [{ present: true, enchant: 3 }];

    const parsed = parseSavedState(JSON.stringify(modern));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      { kind: "protection", plus: 5 },
      { kind: "evasion", plus: 1 },
    ]);
    expect(parsed?.gloveSlots).toEqual([
      { present: true, enchant: 2 },
      { present: true, enchant: -1 },
    ]);
    expect(parsed?.headgearSlots).toEqual([
      { present: true, enchant: 3, kind: "helmet" },
    ]);
    expect(parsed?.wizardry).toBe(2);
  });

  test("restores default slot arrays when legacy fields are reset and modern arrays are absent", () => {
    const legacy = omitKeys(buildDefaultCalculatorState("0.34"), [
      "ringSlots",
      "amuletSlots",
      "headgearSlots",
      "gloveSlots",
    ]);

    legacy.species = "formicid";
    legacy.wizardry = 0;
    legacy.gloves = false;
    legacy.secondGloves = false;
    legacy.helmet = false;

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([
      { kind: "none", plus: 0 },
      { kind: "none", plus: 0 },
    ]);
    expect(parsed?.gloveSlots).toEqual([
      { present: false, enchant: 0 },
      { present: false, enchant: 0 },
    ]);
    expect(parsed?.headgearSlots).toEqual([{ present: false, enchant: 0 }]);
  });

  test("coerces slot arrays when the legacy source keys are absent", () => {
    const legacy = omitKeys(buildDefaultCalculatorState("trunk"), [
      "ringSlots",
      "amuletSlots",
      "headgearSlots",
      "gloveSlots",
      "wizardry",
      "gloves",
      "secondGloves",
      "helmet",
    ]);

    legacy.species = "octopode";
    legacy.ringSlots = [
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ];
    legacy.gloveSlots = [{ present: true, enchant: 0 }];

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toHaveLength(8);
    expect(parsed?.ringSlots?.slice(0, 3)).toEqual([
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ]);
    expect(parsed?.gloveSlots).toHaveLength(1);
  });

  test("rejects saves with malformed legacy slot source types", () => {
    const malformed = {
      ...buildDefaultCalculatorState("0.34"),
      wizardry: "2",
      gloves: "yes",
      helmet: "no",
    };

    expect(parseSavedState(JSON.stringify(malformed))).toBeNull();
  });

  test("rejects malformed slot metadata when slot arrays are the source", () => {
    const malformed = omitKeys(buildDefaultCalculatorState("0.34"), [
      "wizardry",
      "gloves",
      "secondGloves",
      "helmet",
    ]);

    malformed.ringSlots = [
      {
        kind: "wizardry",
        plus: 0,
        source: 123,
      },
      { kind: "none", plus: 0 },
    ];

    expect(parseSavedState(JSON.stringify(malformed))).toBeNull();
  });

  test("rejects malformed residual numeric fields", () => {
    const malformed = {
      ...buildDefaultCalculatorState("0.34"),
      bodyArmourEnchant: "7",
      equipmentEV: "2",
    };

    expect(parseSavedState(JSON.stringify(malformed))).toBeNull();
  });

  test("rejects malformed spell numeric fields", () => {
    const malformed = {
      ...buildDefaultCalculatorState("0.34"),
      spellcasting: "8",
      wildMagic: "1",
    };

    expect(parseSavedState(JSON.stringify(malformed))).toBeNull();
  });
});
