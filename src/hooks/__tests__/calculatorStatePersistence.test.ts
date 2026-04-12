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
    expect(parsed?.headgearSlots).toEqual([{ present: true, enchant: 0 }]);
  });

  test("prefers legacy equipment fields when a mixed-shape save still has default slot arrays", () => {
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
    expect(parsed?.headgearSlots).toEqual([{ present: true, enchant: 0 }]);
  });

  test("overrides stale populated arrays when the legacy fields were edited after migration", () => {
    const legacy = buildDefaultCalculatorState("0.34");

    legacy.species = "formicid";
    legacy.ringSlots = [
      { kind: "protection", plus: 5 },
      { kind: "evasion", plus: 1 },
    ];
    legacy.gloveSlots = [
      { present: false, enchant: 0 },
      { present: false, enchant: 0 },
    ];
    legacy.headgearSlots = [{ present: false, enchant: 0 }];
    legacy.wizardry = 1;
    legacy.gloves = true;
    legacy.secondGloves = true;
    legacy.helmet = true;

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toEqual([{ kind: "wizardry", plus: 0 }, { kind: "none", plus: 0 }]);
    expect(parsed?.gloveSlots).toEqual([
      { present: true, enchant: 0 },
      { present: true, enchant: 0 },
    ]);
    expect(parsed?.headgearSlots).toEqual([{ present: true, enchant: 0 }]);
  });

  test("clears slot arrays when legacy fields are reset back to defaults", () => {
    const legacy = buildDefaultCalculatorState("0.34");

    legacy.species = "formicid";
    legacy.ringSlots = [
      { kind: "wizardry", plus: 0 },
      { kind: "wizardry", plus: 0 },
    ];
    legacy.gloveSlots = [
      { present: true, enchant: 0 },
      { present: true, enchant: 0 },
    ];
    legacy.headgearSlots = [{ present: true, enchant: 0 }];
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
});
