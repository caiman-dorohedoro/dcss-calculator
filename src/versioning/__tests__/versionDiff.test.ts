import { describe, expect, test } from "@jest/globals";
import { diffNamedRecords, summarizeVersionDiff } from "../versionDiff";

describe("versionDiff", () => {
  test("reports added and removed names", () => {
    expect(
      diffNamedRecords(
        [{ name: "Airstrike" }, { name: "Sting" }],
        [{ name: "Airstrike" }, { name: "Forge Lightning Spire" }]
      )
    ).toEqual({
      added: ["Forge Lightning Spire"],
      removed: ["Sting"],
    });
  });

  test("summarizes spell and species diffs together", () => {
    const summary = summarizeVersionDiff(
      "0.32",
      "0.33",
      [{ name: "Airstrike" }, { name: "Sting" }],
      [{ name: "Airstrike" }, { name: "Forge Lightning Spire" }],
      {
        human: { name: "Human", size: "medium" },
        ghoul: { name: "Ghoul", size: "medium" },
      },
      {
        human: { name: "Human", size: "medium" },
        revenant: { name: "Revenant", size: "medium" },
      }
    );

    expect(summary).toContain("Added spells: Forge Lightning Spire");
    expect(summary).toContain("Removed spells: Sting");
    expect(summary).toContain("Added species: revenant");
    expect(summary).toContain("Removed species: ghoul");
  });
});
