import { describe, expect, test } from "@jest/globals";
import { Size } from "@/types/species";
import {
  formMeldsSlot,
  getFormDefinition,
  getFormStatModifiers,
  getFormValue,
} from "../formData";

describe("formData", () => {
  test("scales dragon AC from Crawl form data at max Shapeshifting", () => {
    const dragon = getFormDefinition("trunk", "dragon-form");

    expect(
      getFormValue(dragon.ac, {
        shapeshiftingSkill: 25,
        experienceLevel: 25,
        form: dragon,
      })
    ).toBe(18);
  });

  test("scales statue AC and records statue EV multiplier", () => {
    const statue = getFormDefinition("trunk", "statue-form");

    expect(
      getFormValue(statue.ac, {
        shapeshiftingSkill: 25,
        experienceLevel: 25,
        form: statue,
      })
    ).toBe(38);
    expect(statue.special?.statueEvMultiplier).toEqual({
      numerator: 4,
      denominator: 5,
    });
  });

  test("expands physical melds to body, cloak, gloves, boots, barding, helmet, and offhand", () => {
    const dragon = getFormDefinition("trunk", "dragon-form");

    expect(formMeldsSlot(dragon, "body")).toBe(true);
    expect(formMeldsSlot(dragon, "cloak")).toBe(true);
    expect(formMeldsSlot(dragon, "gloves")).toBe(true);
    expect(formMeldsSlot(dragon, "boots")).toBe(true);
    expect(formMeldsSlot(dragon, "barding")).toBe(true);
    expect(formMeldsSlot(dragon, "helmet")).toBe(true);
    expect(formMeldsSlot(dragon, "offhand")).toBe(true);
    expect(formMeldsSlot(dragon, "ring")).toBe(false);
  });

  test("uses form size and stat modifiers from Crawl YAML", () => {
    const dragon = getFormDefinition("trunk", "dragon-form");

    expect(dragon.size).toBe(Size.GIANT);
    expect(getFormStatModifiers(dragon)).toEqual({
      str: 10,
      dex: 0,
      int: 0,
    });
  });

  test("falls back to no form for unsupported versions or unknown form labels", () => {
    expect(getFormDefinition("0.34", "dragon-form").key).toBe("none");
    expect(getFormDefinition("trunk", "unknown-form").key).toBe("none");
  });
});
