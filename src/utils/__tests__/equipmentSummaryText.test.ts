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
  test("preserves imported display names that already include enchantments", () => {
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

  test("appends parser item properties when imported display names omit braces", () => {
    expect(
      formatBodyArmourSummary({
        kind: "robe",
        enchant: 5,
        ego: "none",
        displayName: "justicar's regalia",
        propertiesText: "Inspire Amulet+ Str+4",
        modifiers: { flags: ["Inspire", "Amulet+"], str: 4 },
        source: "imported",
      })
    ).toBe("+5 justicar's regalia {Inspire Amulet+ Str+4}");

    expect(
      formatHeadgearSummary({
        present: true,
        kind: "hat",
        enchant: 3,
        displayName: "hat of Pondering",
        modifiers: { flags: ["Ponderous"], will: 1, mp: 10, int: 5 },
        source: "imported",
      })
    ).toBe("+3 hat of Pondering {Ponderous, Will+ MP+10 Int+5}");

    expect(
      formatShieldSummary({
        kind: "tower_shield",
        enchant: 10,
        displayName: 'tower shield "Ygacoyf"',
        modifiers: { flags: ["Reflect"], str: 2 },
        source: "imported",
      })
    ).toBe('+10 tower shield "Ygacoyf" {Reflect, Str+2}');

    expect(
      formatRingSummary({
        kind: "none",
        plus: 0,
        displayName: "ring of Ewkivat",
        modifiers: {
          rC: 1,
          rN: 2,
          will: -1,
          rCorr: 1,
          mp: 7,
          str: 4,
        },
        source: "imported",
      })
    ).toBe("ring of Ewkivat {rC+ rN++ Will- rCorr MP+7 Str+4}");
  });

  test("does not invent property braces for normal imported items", () => {
    expect(
      formatRingSummary({
        kind: "none",
        plus: 0,
        displayName: "ring of willpower",
        modifiers: { will: 1 },
        artifactKind: "normal",
        source: "imported",
      })
    ).toBe("ring of willpower");

    expect(
      formatBodyArmourSummary({
        kind: "robe",
        enchant: 2,
        ego: "none",
        displayName: "+2 robe of willpower",
        modifiers: { will: 1 },
        artifactKind: "normal",
        source: "imported",
      })
    ).toBe("+2 robe of willpower");
  });

  test("adds state enchantment to imported enchantable names when missing", () => {
    expect(
      formatFixedAuxSummary({
        kind: "boots",
        present: true,
        enchant: 0,
        displayName: "pair of boots",
        source: "imported",
      })
    ).toBe("+0 pair of boots");

    expect(
      formatBodyArmourSummary({
        kind: "robe",
        enchant: -2,
        ego: "none",
        displayName: "robe",
        source: "imported",
      })
    ).toBe("-2 robe");
  });

  test("builds in-game-style fallback summaries", () => {
    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 4,
        ego: "resonance",
        modifiers: { int: 3 },
      })
    ).toBe("+4 leather armour of resonance {Int+3}");

    expect(
      formatBodyArmourSummary({
        kind: "robe",
        enchant: 2,
        ego: "willpower",
        modifiers: { will: 1 },
      })
    ).toBe("+2 robe of willpower {Will+}");

    expect(
      formatBodyArmourSummary({
        kind: "leather_armour",
        enchant: 0,
        ego: "none",
      })
    ).toBe("+0 leather armour");

    expect(formatShieldSummary({ kind: "kite_shield", enchant: 0 })).toBe(
      "+0 kite shield"
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
    expect(formatHeadgearSummary({ present: true, kind: "helmet", enchant: 0 })).toBe(
      "+0 helmet"
    );
    expect(
      formatGlovesSummary({
        present: true,
        enchant: 0,
        modifiers: { str: 2 },
      })
    ).toBe("+0 pair of gloves {Str+2}");
    expect(
      formatFixedAuxSummary({
        kind: "boots",
        present: true,
        enchant: 0,
      })
    ).toBe("+0 pair of boots");
  });

  test("builds fallback summaries from generic equipment egos", () => {
    expect(
      formatShieldSummary({
        kind: "buckler",
        enchant: 2,
        ego: "reflection",
        modifiers: { flags: ["Reflect"] },
      })
    ).toBe("+2 buckler of reflection {Reflect}");

    expect(
      formatOrbSummary({
        kind: "energy",
        ego: "energy",
      })
    ).toBe("orb of energy");

    expect(
      formatHeadgearSummary({
        present: true,
        kind: "hat",
        enchant: 0,
        ego: "intelligence",
        modifiers: { int: 3 },
      })
    ).toBe("+0 hat of intelligence {Int+3}");

    expect(
      formatGlovesSummary({
        present: true,
        enchant: 0,
        ego: "strength",
        modifiers: { str: 3 },
      })
    ).toBe("+0 pair of gloves of strength {Str+3}");

    expect(
      formatFixedAuxSummary({
        kind: "scarf",
        present: true,
        enchant: 0,
        ego: "resistance",
        modifiers: { rF: 1, rC: 1 },
      })
    ).toBe("+0 scarf of resistance {rF+ rC+}");

    expect(
      formatFixedAuxSummary({
        kind: "boots",
        present: true,
        enchant: 1,
        ego: "flying",
        modifiers: { flags: ["Fly"] },
      })
    ).toBe("+1 pair of boots of flying {Fly}");
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

  test("formats unknown body armour ego strings without crashing", () => {
    expect(
      formatBodyArmourSummary({
        kind: "robe",
        enchant: 1,
        ego: "future mystery",
      })
    ).toBe("+1 robe of future mystery");
  });
});
