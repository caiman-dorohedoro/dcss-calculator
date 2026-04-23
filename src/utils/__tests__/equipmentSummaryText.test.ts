import { describe, expect, test } from "@jest/globals";
import {
  formatAmuletSummary,
  formatBodyArmourSummary,
  formatFixedAuxSummary,
  formatGlovesSummary,
  formatHeadgearSummary,
  formatModifierSummary,
  formatOrbSummary,
  formatRingSummary,
  formatShieldSummary,
} from "../equipmentSummaryText";

describe("equipment summary text", () => {
  test("uses imported display names exactly", () => {
    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 4,
        ego: "none",
        displayName:
          "the +4 leather armour of the Plethaurus {Will+ Str+2 Dex+5}",
        modifiers: { str: 2, dex: 5 },
        source: "imported",
      })
    ).toBe("the +4 leather armour of the Plethaurus {Will+ Str+2 Dex+5}");

    expect(
      formatGlovesSummary({
        present: true,
        enchant: 5,
        displayName: "the +5 pair of gloves of Vipholopp {Str+7 Dex+3 SInv}",
        modifiers: { str: 7, dex: 3 },
        source: "imported",
      })
    ).toBe("the +5 pair of gloves of Vipholopp {Str+7 Dex+3 SInv}");
  });

  test("builds in-game-style fallback summaries", () => {
    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 4,
        ego: "resonance",
        modifiers: { int: 3 },
      })
    ).toBe("+4 leather armour (Resonance) {Int+3}");

    expect(formatShieldSummary({ kind: "kite_shield", enchant: 2 })).toBe(
      "+2 kite shield"
    );
    expect(formatOrbSummary({ kind: "energy", modifiers: { wizardry: 1 } })).toBe(
      "orb of energy {Wiz+1}"
    );
    expect(formatRingSummary({ kind: "protection", plus: 4 })).toBe(
      "ring of protection +4"
    );
    expect(formatAmuletSummary({ kind: "reflection" })).toBe(
      "amulet of reflection"
    );
    expect(formatHeadgearSummary({ present: true, kind: "helmet", enchant: 2 })).toBe(
      "+2 helmet"
    );
    expect(
      formatGlovesSummary({
        present: true,
        enchant: 5,
        modifiers: { str: 2 },
      })
    ).toBe("+5 pair of gloves {Str+2}");
    expect(
      formatFixedAuxSummary({
        kind: "boots",
        present: true,
        enchant: 0,
      })
    ).toBe("pair of boots");
  });

  test("uses none for empty equipment slots", () => {
    expect(formatBodyArmourSummary({ kind: "none", enchant: 0, ego: "none" })).toBe(
      "none"
    );
    expect(formatShieldSummary({ kind: "none", enchant: 0 })).toBe("none");
    expect(formatOrbSummary({ kind: "none" })).toBe("none");
    expect(formatRingSummary({ kind: "none", plus: 0 })).toBe("none");
    expect(formatAmuletSummary({ kind: "none" })).toBe("none");
    expect(formatHeadgearSummary({ present: false, enchant: 0 })).toBe("none");
    expect(formatGlovesSummary({ present: false, enchant: 0 })).toBe("none");
    expect(
      formatFixedAuxSummary({
        kind: "cloak",
        present: false,
        enchant: 0,
      })
    ).toBe("none");
  });

  test("orders item modifiers in Crawl-like display order", () => {
    expect(
      formatModifierSummary({
        dex: 5,
        str: 2,
        int: -1,
        ac: 3,
        ev: -2,
        sh: 4,
        wizardry: 1,
      })
    ).toBe("{Str+2 Dex+5 Int-1 AC+3 EV-2 SH+4 Wiz+1}");
  });
});
