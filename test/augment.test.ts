/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  augmentPrompt,
  augmentPromptWithRefinement,
  buildPromptLeverageBlocks,
  detectTaskIntent,
  inferIntensity,
  resolveRewriteMode,
} from "../src/tools/augment";
import { getBuiltinCommands } from "../src/commands";
import CliKitPlugin from "../src/index";
import CliKitTuiPlugin from "../src/tui";
import { augmentPrompt as augmentFromBarrel } from "../src/tools";

async function createPlugin(clientOverrides?: Record<string, unknown>) {
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
        ...clientOverrides,
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

  test("applies LLM refinement when a refiner returns polished prompt text", async () => {
    const result = await augmentPromptWithRefinement(
      "fix the websocket reconnect bug when auth expires",
      {
        refine: async ({ enhanced }) => `${enhanced}\n\nKeep the final response tightly scoped to the auth expiry path.`,
      },
    );

    expect(result.enhancementSource).toBe("llm");
    expect(result.enhanced).toContain("Keep the final response tightly scoped to the auth expiry path.");
    expect(result.fallbackReason).toBeUndefined();
  });

  test("falls back to deterministic output when LLM refinement throws", async () => {
    const deterministic = augmentPrompt("explain how the model routing works");
    const result = await augmentPromptWithRefinement("explain how the model routing works", {
      refine: async () => {
        throw new Error("provider unavailable");
      },
    });

    expect(result.enhancementSource).toBe("deterministic");
    expect(result.enhanced).toBe(deterministic.enhanced);
    expect(result.fallbackReason).toBe("provider unavailable");
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

  test("uses session-backed refinement when the OpenCode client session API is available", async () => {
    const plugin = await createPlugin({
      session: {
        create: async () => ({
          data: {
            id: "session-augment-test",
          },
          error: undefined,
        }),
        prompt: async () => ({
          data: {
            info: {
              id: "message-1",
            },
            parts: [
              {
                type: "text",
                text: "<task>Refined task.</task>",
              },
            ],
          },
          error: undefined,
        }),
        delete: async () => ({
          data: true,
          error: undefined,
        }),
      },
    });
    const augmentTool = (plugin.tool as unknown as Record<string, {
      execute: (args: Record<string, unknown>, context?: unknown) => Promise<string>;
    }>).augment_prompt;

    const raw = await augmentTool.execute({
      draft: "fix the websocket reconnect bug when auth expires",
    }, undefined);
    const result = JSON.parse(raw) as {
      success: boolean;
      enhancementSource: string;
      enhanced: string;
      injectedIntoTui: boolean;
      fallbackReason?: string;
    };

    expect(result.success).toBe(true);
    expect(result.enhancementSource).toBe("llm");
    expect(result.enhanced).toBe("<task>Refined task.</task>");
    expect(result.injectedIntoTui).toBe(false);
    expect(result.fallbackReason).toBeUndefined();
  });

  test("injects the enhanced prompt into the TUI and shows completion feedback when TUI controls are available", async () => {
    const tuiCalls: string[] = [];
    const plugin = await createPlugin({
      tui: {
        showToast: async () => {
          tuiCalls.push("toast");
          return undefined;
        },
        clearPrompt: async () => {
          tuiCalls.push("clear");
          return undefined;
        },
        appendPrompt: async (input: { body?: { text?: string } }) => {
          tuiCalls.push(`append:${input.body?.text ?? ""}`);
          return undefined;
        },
      },
      session: {
        create: async () => ({
          data: {
            id: "session-augment-ui-test",
          },
          error: undefined,
        }),
        prompt: async () => ({
          data: {
            info: {
              id: "message-ui-1",
            },
            parts: [
              {
                type: "text",
                text: "Refined prompt from TUI flow.",
              },
            ],
          },
          error: undefined,
        }),
        delete: async () => ({
          data: true,
          error: undefined,
        }),
      },
    });
    const augmentTool = (plugin.tool as unknown as Record<string, {
      execute: (args: Record<string, unknown>, context?: unknown) => Promise<string>;
    }>).augment_prompt;

    const raw = await augmentTool.execute({
      draft: "fix the websocket reconnect bug when auth expires",
    }, undefined);
    const result = JSON.parse(raw) as {
      success: boolean;
      enhanced: string;
      injectedIntoTui: boolean;
    };

    expect(result.success).toBe(true);
    expect(result.enhanced).toBe("Refined prompt from TUI flow.");
    expect(result.injectedIntoTui).toBe(true);
    expect(tuiCalls).toContain("clear");
    expect(tuiCalls).toContain("toast");
    expect(tuiCalls).toContain("append:Refined prompt from TUI flow.");
  });

  test("reports non-injection when TUI prompt controls are unavailable", async () => {
    const tuiCalls: string[] = [];
    const plugin = await createPlugin({
      tui: {
        showToast: async () => {
          tuiCalls.push("toast");
          return undefined;
        },
      },
      session: {
        create: async () => ({
          data: {
            id: "session-augment-no-inject-test",
          },
          error: undefined,
        }),
        prompt: async () => ({
          data: {
            info: {
              id: "message-ui-2",
            },
            parts: [
              {
                type: "text",
                text: "Refined prompt without injection support.",
              },
            ],
          },
          error: undefined,
        }),
      },
    });
    const augmentTool = (plugin.tool as unknown as Record<string, {
      execute: (args: Record<string, unknown>, context?: unknown) => Promise<string>;
    }>).augment_prompt;

    const raw = await augmentTool.execute({
      draft: "fix the websocket reconnect bug when auth expires",
    }, undefined);
    const result = JSON.parse(raw) as {
      success: boolean;
      enhanced: string;
      injectedIntoTui: boolean;
    };

    expect(result.success).toBe(true);
    expect(result.enhanced).toBe("Refined prompt without injection support.");
    expect(result.injectedIntoTui).toBe(false);
    expect(tuiCalls).toContain("toast");
  });

  test("exports a separate TUI plugin module", () => {
    expect(CliKitTuiPlugin).toBeDefined();
    expect(typeof CliKitTuiPlugin.tui).toBe("function");
    expect("server" in CliKitTuiPlugin).toBe(false);
  });

  test("ships a package export for the separate TUI plugin module", async () => {
    const pkg = await import("../package.json");
    const exportsField = pkg.default.exports as Record<string, unknown>;
    const tuiExport = exportsField["./tui"] as Record<string, unknown>;

    expect(tuiExport).toBeDefined();
    expect(tuiExport.import).toBe("./dist/tui.js");
    expect(tuiExport.types).toBe("./dist/tui.d.ts");
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
    expect(augment?.description).toContain("auto-insert");
    expect(augment?.agent).toBe("build");
    expect(augment?.template).toContain("augment_prompt");
    expect(augment?.template).toContain("$ARGUMENTS");
    expect(augment?.template).toContain("If the editor draft was not updated automatically");
    expect(augment?.template).toContain("Fallback:");
  });
});
