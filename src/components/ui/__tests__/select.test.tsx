import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Select", () => {
  test("renders popup content above equipment modals", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/ui/select.tsx"),
      "utf8"
    );

    expect(source).toContain("z-[150]");
  });
});
