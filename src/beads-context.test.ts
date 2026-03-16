import { describe, expect, it } from "bun:test";
import { getBeadsCompactionContext } from "./hooks/beads-context";

describe("beads-context", () => {
  it("returns null when no beads db exists", () => {
    const result = getBeadsCompactionContext("C:/definitely-missing-path-clikit-test");
    expect(result).toBeNull();
  });
});
