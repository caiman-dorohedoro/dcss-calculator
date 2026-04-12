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

  test("coerces slot arrays to the current species capacity", () => {
    const legacy = {
      ...buildDefaultCalculatorState("trunk"),
      species: "octopode",
      ringSlots: [
        { kind: "wizardry", plus: 0 },
        { kind: "wizardry", plus: 0 },
        { kind: "wizardry", plus: 0 },
      ],
      gloveSlots: [{ present: true, enchant: 0 }],
    };

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
