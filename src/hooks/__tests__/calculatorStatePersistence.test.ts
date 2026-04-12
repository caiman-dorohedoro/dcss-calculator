/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { parseSavedState } from "../useCalculatorState";

describe("calculator saved-state migration", () => {
  test("creates slot arrays when a legacy save does not include them", () => {
    const {
      ringSlots: _ringSlots,
      amuletSlots: _amuletSlots,
      headgearSlots: _headgearSlots,
      gloveSlots: _gloveSlots,
      ...legacy
    } = buildDefaultCalculatorState("0.34");

    legacy.species = "formicid";

    const parsed = parseSavedState(JSON.stringify(legacy));

    expect(parsed).not.toBeNull();
    expect(parsed?.ringSlots).toHaveLength(2);
    expect(parsed?.amuletSlots).toHaveLength(1);
    expect(parsed?.headgearSlots).toHaveLength(1);
    expect(parsed?.gloveSlots).toHaveLength(2);
  });

  test("migrates legacy scalar and boolean equipment fields into the new slot arrays", () => {
    const {
      ringSlots: _ringSlots,
      amuletSlots: _amuletSlots,
      headgearSlots: _headgearSlots,
      gloveSlots: _gloveSlots,
      ...legacy
    } = buildDefaultCalculatorState("0.34");

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
    const {
      ringSlots: _ringSlots,
      amuletSlots: _amuletSlots,
      headgearSlots: _headgearSlots,
      gloveSlots: _gloveSlots,
      wizardry: _wizardry,
      gloves: _gloves,
      secondGloves: _secondGloves,
      helmet: _helmet,
      ...legacy
    } = buildDefaultCalculatorState("trunk") as unknown as Record<
      string,
      unknown
    >;

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
});
