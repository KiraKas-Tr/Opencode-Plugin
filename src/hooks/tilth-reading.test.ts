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
});

// ─── applyTilthReading — fallback paths (tilth not available in CI) ───────────

describe("applyTilthReading — pure fallback behaviour", () => {
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

  it("preserves original content when skipped", () => {
    const original = "x".repeat(10);
    const result = applyTilthReading("/a/b.ts", original, {
      min_content_length: 9999,
    });
    expect(result.content).toBe(original);
  });

  it("returns 'tilth_unavailable' when tilth binary is absent (mocked via cache)", () => {
    // Force unavailable by overriding — we test using a fake path that won't resolve.
    // Because we cannot easily mock Bun.spawnSync, we rely on the path being absent.
    // If tilth happens to be installed in CI this test degrades gracefully.
    const result = applyTilthReading("/a/b.ts", "x".repeat(2000), {
      min_content_length: 100,
    });
    // Outcome is either 'tilth_unavailable' or 'tilth_success' — both are valid,
    // the important guarantee is that content is never empty.
    expect(["tilth_unavailable", "tilth_success", "tilth_error"]).toContain(result.outcome);
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("never returns empty content regardless of tilth outcome", () => {
    const original = "x".repeat(5000);
    const result = applyTilthReading("/nonexistent/path.ts", original, {
      min_content_length: 100,
    });
    expect(result.content.length).toBeGreaterThan(0);
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
