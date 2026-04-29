import { describe, expect, test } from "@jest/globals";
import { getMutationStatModifiers } from "../statMutations";

describe("getMutationStatModifiers", () => {
  test("applies Crawl stat mutation deltas", () => {
    expect(
      getMutationStatModifiers({
        agileMutation: 1,
        strongMutation: 2,
        dopeyMutation: 1,
        thinSkeletalStructure: 3,
      })
    ).toEqual({
      str: 7,
      dex: 8,
      int: -6,
    });
  });
});
