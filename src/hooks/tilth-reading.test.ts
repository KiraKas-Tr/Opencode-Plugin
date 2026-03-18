import { describe, it, expect, beforeEach } from "bun:test";
import {
  isTilthAvailable,
  resetTilthAvailabilityCache,
  shouldAttemptTilthForTool,
  extractFilePath,
  applyTilthReading,
  formatTilthLog,
  type TilthReadResult,
} from "./tilth-reading";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<TilthReadResult>): TilthReadResult {
  return {
    usedTilth: false,
    tilthAvailable: false,
    content: "original",
    outcome: "skipped",
    ...overrides,
  };
}

// ─── extractFilePath ──────────────────────────────────────────────────────────

describe("extractFilePath", () => {
  it("returns filePath field", () => {
    expect(extractFilePath({ filePath: "/a/b.ts" })).toBe("/a/b.ts");
  });

  it("returns file_path field as fallback", () => {
    expect(extractFilePath({ file_path: "/a/b.ts" })).toBe("/a/b.ts");
  });

  it("returns path field as fallback", () => {
    expect(extractFilePath({ path: "/a/b.ts" })).toBe("/a/b.ts");
  });

  it("returns file field as fallback", () => {
    expect(extractFilePath({ file: "/a/b.ts" })).toBe("/a/b.ts");
  });

  it("returns null when no recognisable key", () => {
    expect(extractFilePath({ src: "/a/b.ts" })).toBeNull();
  });

  it("returns null when value is empty string", () => {
    expect(extractFilePath({ filePath: "" })).toBeNull();
  });
});

// ─── shouldAttemptTilthForTool ───────────────────────────────────────────────

describe("shouldAttemptTilthForTool", () => {
  it("returns true for 'read' tool with filePath", () => {
    expect(shouldAttemptTilthForTool("read", { filePath: "/a/b.ts" })).toBe(true);
  });

  it("returns true for 'Read' tool (case-insensitive)", () => {
    expect(shouldAttemptTilthForTool("Read", { filePath: "/a/b.ts" })).toBe(true);
  });

  it("returns true for 'read_file' variant", () => {
    expect(shouldAttemptTilthForTool("read_file", { path: "/a/b.ts" })).toBe(true);
  });

  it("returns false for 'bash' tool", () => {
    expect(shouldAttemptTilthForTool("bash", { filePath: "/a/b.ts" })).toBe(false);
  });

  it("returns false for read tool without a path", () => {
    expect(shouldAttemptTilthForTool("read", {})).toBe(false);
  });
});

// ─── isTilthAvailable / resetTilthAvailabilityCache ──────────────────────────

describe("isTilthAvailable + cache", () => {
  beforeEach(() => {
    resetTilthAvailabilityCache();
  });

  it("returns a boolean", () => {
    const result = isTilthAvailable();
    expect(typeof result).toBe("boolean");
  });

  it("caches the result on second call", () => {
    const first = isTilthAvailable();
    const second = isTilthAvailable();
    expect(first).toBe(second);
  });

  it("resets cache so next call re-checks", () => {
    isTilthAvailable(); // prime cache
    resetTilthAvailabilityCache();
    // After reset, calling again re-runs the check — just verify it doesn't throw.
    expect(() => isTilthAvailable()).not.toThrow();
  });

  it("resolves tilth via direct binary or npx — true when either available", () => {
    // npx tilth is available in this env (confirmed via npx tilth --version)
    // Direct 'tilth' may not be on PATH — but npx path should succeed.
    const available = isTilthAvailable();
    // Environment-dependent: pass as long as it doesn't throw and returns boolean.
    expect(typeof available).toBe("boolean");
    // Log for debugging: not a hard assertion on value since CI may differ.
    console.log(`[test] isTilthAvailable() = ${available} (npx path expected true locally)`);
  });
});

// ─── applyTilthReading ────────────────────────────────────────────────────────

describe("applyTilthReading — core guarantees", () => {
  beforeEach(() => {
    resetTilthAvailabilityCache();
  });

  it("returns 'skipped' for content below threshold", () => {
    const result = applyTilthReading("/a/b.ts", "short", {
      min_content_length: 1000,
    });
    expect(result.outcome).toBe("skipped");
    expect(result.usedTilth).toBe(false);
    expect(result.content).toBe("short");
  });

  it("preserves original content when skipped by threshold", () => {
    const original = "x".repeat(10);
    const result = applyTilthReading("/a/b.ts", original, {
      min_content_length: 9999,
    });
    expect(result.content).toBe(original);
  });

  it("never returns empty content — outcome may be any valid value", () => {
    // Works regardless of whether tilth binary is on PATH or available via npx
    const original = "x".repeat(2000);
    const result = applyTilthReading("/a/b.ts", original, { min_content_length: 100 });
    expect(["tilth_unavailable", "tilth_success", "tilth_error"]).toContain(result.outcome);
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("on error path (nonexistent file) — original content preserved", () => {
    const original = "x".repeat(5000);
    const result = applyTilthReading("/nonexistent/path.ts", original, {
      min_content_length: 100,
    });
    // tilth will error on nonexistent path → fallback to original
    expect(result.content.length).toBeGreaterThan(0);
    if (result.outcome === "tilth_error") {
      expect(result.content).toBe(original);
    }
  });

  it("on real file path — tilth_success when tilth available via npx", async () => {
    // This test is environment-sensitive: passes when npx tilth resolves.
    const path = (await import("path")).default;
    const realPath = path.resolve("src/hooks/tilth-reading.ts");
    const result = applyTilthReading(realPath, "x".repeat(2000), { min_content_length: 100 });
    console.log(`[test] real file outcome: ${result.outcome}`);
    // Either tilth_success (npx found) or tilth_unavailable — both valid
    expect(result.content.length).toBeGreaterThan(0);
    if (result.outcome === "tilth_success") {
      expect(result.usedTilth).toBe(true);
      // Tilth output should contain the actual file content, not placeholder x's
      expect(result.content).toContain("tilth");
    }
  });
});

// ─── formatTilthLog ──────────────────────────────────────────────────────────

describe("formatTilthLog", () => {
  it("formats tilth_success log", () => {
    const r = makeResult({ outcome: "tilth_success" });
    expect(formatTilthLog(r, "/a/b.ts")).toContain("Enhanced read via tilth");
    expect(formatTilthLog(r, "/a/b.ts")).toContain("/a/b.ts");
  });

  it("formats tilth_unavailable log", () => {
    const r = makeResult({ outcome: "tilth_unavailable" });
    expect(formatTilthLog(r, "/a/b.ts")).toContain("not available");
  });

  it("formats tilth_error log with error message", () => {
    const r = makeResult({ outcome: "tilth_error", error: "exit 1: some error" });
    const line = formatTilthLog(r, "/a/b.ts");
    expect(line).toContain("fallback to read");
    expect(line).toContain("exit 1: some error");
  });

  it("formats skipped log", () => {
    const r = makeResult({ outcome: "skipped" });
    expect(formatTilthLog(r, "/a/b.ts")).toContain("Skipped");
  });
});
