import { describe, expect, test } from "@jest/globals";
import {
  coerceSlotArrayLength,
  coerceEquipmentSlotCollections,
  getDynamicSlotCounts,
} from "../dynamicSlotCounts";

describe("dynamic slot counts", () => {
  test("uses species-aware overrides for octopode rings and formicid gloves", () => {
    expect(getDynamicSlotCounts("trunk", "human")).toEqual({
      ringSlots: 2,
      amuletSlots: 1,
      headgearSlots: 1,
      gloveSlots: 1,
    });

    expect(getDynamicSlotCounts("trunk", "octopode")).toEqual({
      ringSlots: 8,
      amuletSlots: 1,
      headgearSlots: 1,
      gloveSlots: 1,
    });

    expect(getDynamicSlotCounts("0.34", "formicid")).toEqual({
      ringSlots: 2,
      amuletSlots: 1,
      headgearSlots: 1,
      gloveSlots: 2,
    });
  });

  test("truncates or pads slot arrays to the current legal size", () => {
    expect(
      coerceSlotArrayLength(
        [{ kind: "wizardry", plus: 0 }, { kind: "protection", plus: 5 }],
        1,
        () => ({ kind: "none", plus: 0 })
      )
    ).toEqual([{ kind: "wizardry", plus: 0 }]);

    expect(
      coerceSlotArrayLength([], 2, () => ({ kind: "none", plus: 0 }))
    ).toEqual([
      { kind: "none", plus: 0 },
      { kind: "none", plus: 0 },
    ]);
  });

  test("coerces all equipment slot arrays when species changes", () => {
    expect(
      coerceEquipmentSlotCollections("trunk", "human", {
        ringSlots: [
          { kind: "wizardry", plus: 0 },
          { kind: "protection", plus: 3 },
          { kind: "evasion", plus: 1 },
          { kind: "none", plus: 0 },
          { kind: "none", plus: 0 },
          { kind: "none", plus: 0 },
          { kind: "none", plus: 0 },
          { kind: "none", plus: 0 },
        ],
        amuletSlots: [],
        headgearSlots: [],
        gloveSlots: [
          { present: true, enchant: 2 },
          { present: true, enchant: -1 },
        ],
      })
    ).toEqual({
      ringSlots: [
        { kind: "wizardry", plus: 0 },
        { kind: "protection", plus: 3 },
      ],
      amuletSlots: [{ kind: "none" }],
      headgearSlots: [{ present: false, enchant: 0 }],
      gloveSlots: [{ present: true, enchant: 2 }],
    });
  });
});
