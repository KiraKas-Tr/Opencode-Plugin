/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  augmentPrompt,
  buildPromptLeverageBlocks,
  detectTaskIntent,
  inferIntensity,
  resolveRewriteMode,
} from "../src/tools/augment";
import { getBuiltinCommands } from "../src/commands";
import CliKitPlugin from "../src/index";
import { augmentPrompt as augmentFromBarrel } from "../src/tools";

async function createPlugin() {
  const previousConfigDir = process.env.OPENCODE_CONFIG_DIR;
  const configDir = mkdtempSync(join(tmpdir(), "clikit-opencode-"));

  try {
    process.env.OPENCODE_CONFIG_DIR = configDir;

    return await CliKitPlugin({
      directory: process.cwd(),
      client: {
        tui: {
          showToast: async () => undefined,
        },
        app: {
          log: async () => undefined,
        },
      },
    } as unknown as Parameters<typeof CliKitPlugin>[0]);
  } finally {
    if (previousConfigDir === undefined) {
      delete process.env.OPENCODE_CONFIG_DIR;
    } else {
      process.env.OPENCODE_CONFIG_DIR = previousConfigDir;
    }

    rmSync(configDir, { recursive: true, force: true });
  }
}

describe("augment prompt engine", () => {
  test("detects debug intent and returns an execution contract", () => {
    const result = augmentPrompt("fix the login bug where users get redirected to 404");

    expect(result.intent).toBe("debug");
    expect(result.mode).toBe("execution-contract");
    expect(result.intensity).toBe("Standard");
    expect(result.enhanced).toContain("<task>");
    expect(result.enhanced).toContain("<verification>");
    expect(result.enhanced).toContain("root cause");
  });

  test("detects careful refactor prompts as deep work", () => {
    const result = augmentPrompt(
      "careful refactor of the strategy builder to reduce branching and duplication",
    );

    expect(result.intent).toBe("refactor");
    expect(result.mode).toBe("execution-contract");
    expect(result.intensity).toBe("Deep");
    expect(result.enhanced).toContain("<constraints>");
    expect(result.enhanced).toContain("Preserve behavior");
    expect(result.enhanced).toContain("Review the result once with fresh eyes before finalizing");
  });

  test("detects review prompts and groups findings as deliverable guidance", () => {
    const result = augmentPrompt("review this PR for security issues");

    expect(result.intent).toBe("review");
    expect(result.mode).toBe("execution-contract");
    expect(result.enhanced).toContain("<deliverable>");
    expect(result.enhanced).toContain("findings grouped by severity or importance");
    expect(result.enhanced).toContain("confirmed issues");
  });

  test("keeps general prompts in plain rewrite mode", () => {
    const result = augmentPrompt("summarize what changed in the last 3 commits");

    expect(result.intent).toBe("general");
    expect(result.mode).toBe("plain");
    expect(result.intensity).toBe("Light");
    expect(result.enhanced).not.toContain("<task>");
    expect(result.enhanced).toContain("Summarize what changed in the last 3 commits.");
    expect(result.enhanced).toContain("Return a clear, well-structured response matched to the task");
  });

  test("exports the engine through the tools barrel", () => {
    const direct = augmentPrompt("explain how the model routing works");
    const fromBarrel = augmentFromBarrel("explain how the model routing works");

    expect(fromBarrel).toEqual(direct);
  });

  test("exposes lower-level helpers for later adapter work", () => {
    expect(detectTaskIntent("investigate the best approach for auth")).toBe("research");
    expect(resolveRewriteMode("auto", "research")).toBe("execution-contract");
    expect(inferIntensity("deep research into architecture tradeoffs", "research")).toBe("Deep");

    const blocks = buildPromptLeverageBlocks("explain model routing", "explain", "Light");
    expect(blocks.outputContract).toContain("well-structured explanation");
  });

  test("registers augment_prompt as a plugin tool", async () => {
    const plugin = await createPlugin();
    const augmentTool = (plugin.tool as unknown as Record<string, {
      execute: (args: Record<string, unknown>, context?: unknown) => Promise<string>;
    }>).augment_prompt;

    const raw = await augmentTool.execute({
      draft: "fix the websocket reconnect bug when auth expires",
    }, undefined);
    const result = JSON.parse(raw) as {
      success: boolean;
      intent: string;
      mode: string;
      intensity: string;
      enhanced: string;
    };

    expect(result.success).toBe(true);
    expect(result.intent).toBe("debug");
    expect(result.mode).toBe("execution-contract");
    expect(result.intensity).toBe("Standard");
    expect(result.enhanced).toContain("<task>");
  });

  test("returns a stable error payload when augment_prompt receives an empty draft", async () => {
    const plugin = await createPlugin();
    const augmentTool = (plugin.tool as unknown as Record<string, {
      execute: (args: Record<string, unknown>, context?: unknown) => Promise<string>;
    }>).augment_prompt;

    const raw = await augmentTool.execute({
      draft: "   \n\t  ",
    }, undefined);
    const result = JSON.parse(raw) as {
      success: boolean;
      error: string;
    };

    expect(result.success).toBe(false);
    expect(result.error).toBe("Draft prompt is required.");
  });

  test("normalizes multiline whitespace before rewriting the draft", () => {
    const result = augmentPrompt("  summarize\n\nwhat   changed\t in the last 3 commits  ");

    expect(result.original).toBe("summarize what changed in the last 3 commits");
    expect(result.enhanced).toContain("Summarize what changed in the last 3 commits.");
  });

  test("auto-loads the augment command from markdown", () => {
    const commands = getBuiltinCommands();
    const augment = commands.augment;

    expect(augment).toBeDefined();
    expect(augment?.description).toContain("Rewrite a draft prompt");
    expect(augment?.agent).toBe("build");
    expect(augment?.template).toContain("augment_prompt");
    expect(augment?.template).toContain("$ARGUMENTS");
  });
});
