import { describe, expect, test } from "@jest/globals";
import { buildDefaultCalculatorState } from "@/versioning/defaultState";
import { getAggregatedEquipmentEffects } from "../equipmentModifiers";

describe("getAggregatedEquipmentEffects", () => {
  test("sums fixed items, slots, and legacy fallback gear", () => {
    const state = buildDefaultCalculatorState("trunk");
    state.bodyArmour = {
      kind: "ring_mail",
      enchant: 2,
      ego: "none",
      modifiers: { int: 3, ac: 1 },
    };
    state.shieldItem = {
      kind: "buckler",
      enchant: 1,
      modifiers: { sh: 2 },
    };
    state.orbItem = {
      kind: "energy",
      modifiers: { wizardry: 1 },
    };
    state.cloakItem = {
      kind: "cloak",
      present: true,
      enchant: 1,
      modifiers: { ev: 2 },
    };
    state.ringSlots = [
      { kind: "protection", plus: 4, modifiers: { int: 1 } },
      { kind: "wizardry", plus: 0, modifiers: { wizardry: 1 } },
    ];
    state.amuletSlots = [{ kind: "reflection", modifiers: { sh: 1 } }];
    state.unattributedGear = {
      label: "legacy gear",
      modifiers: { dex: 2 },
      source: "legacy",
    };

    expect(getAggregatedEquipmentEffects(state)).toEqual({
      str: 0,
      dex: 2,
      int: 4,
      ac: 5,
      ev: 2,
      sh: 3,
      wizardry: 3,
    });
  });
});
