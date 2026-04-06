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

  test("preserves SDK method binding and uses direct TUI parameter shapes", async () => {
    const sessionCalls: Array<Record<string, unknown>> = [];
    const tuiCalls: Array<Record<string, unknown>> = [];

    const sessionClient = {
      marker: "session-client",
      async create(parameters?: Record<string, unknown>) {
        expect(this).toBe(sessionClient);
        sessionCalls.push({ method: "create", parameters: parameters ?? {} });

        return {
          data: {
            id: "session-bound-test",
          },
          error: undefined,
        };
      },
      async prompt(parameters?: Record<string, unknown>) {
        expect(this).toBe(sessionClient);
        sessionCalls.push({ method: "prompt", parameters: parameters ?? {} });

        return {
          data: {
            info: {
              id: "message-bound-1",
            },
            parts: [
              {
                type: "text",
                text: "Bound refined prompt.",
              },
            ],
          },
          error: undefined,
        };
      },
      async delete(parameters?: Record<string, unknown>) {
        expect(this).toBe(sessionClient);
        sessionCalls.push({ method: "delete", parameters: parameters ?? {} });

        return {
          data: true,
          error: undefined,
        };
      },
    };

    const tuiClient = {
      marker: "tui-client",
      async showToast(parameters?: Record<string, unknown>) {
        expect(this).toBe(tuiClient);
        expect(parameters).not.toHaveProperty("body");
        expect(parameters).not.toHaveProperty("query");
        tuiCalls.push({ method: "toast", parameters: parameters ?? {} });
        return undefined;
      },
      async clearPrompt(parameters?: Record<string, unknown>) {
        expect(this).toBe(tuiClient);
        expect(parameters).not.toHaveProperty("query");
        tuiCalls.push({ method: "clear", parameters: parameters ?? {} });
        return undefined;
      },
      async appendPrompt(parameters?: Record<string, unknown>) {
        expect(this).toBe(tuiClient);
        expect(parameters).not.toHaveProperty("body");
        expect(parameters).not.toHaveProperty("query");
        expect(parameters?.text).toBe("Bound refined prompt.");
        tuiCalls.push({ method: "append", parameters: parameters ?? {} });
        return undefined;
      },
    };

    const plugin = await createPlugin({
      session: sessionClient,
      tui: tuiClient,
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
    expect(result.enhanced).toBe("Bound refined prompt.");
    expect(result.injectedIntoTui).toBe(true);
    expect(result.fallbackReason).toBeUndefined();

    expect(sessionCalls.map((entry) => entry.method)).toContain("create");
    expect(sessionCalls.map((entry) => entry.method)).toContain("prompt");
    expect(tuiCalls.map((entry) => entry.method)).toContain("toast");
    expect(tuiCalls.map((entry) => entry.method)).toContain("clear");
    expect(tuiCalls.map((entry) => entry.method)).toContain("append");
  });

  test("injects the enhanced prompt into the TUI and shows completion feedback when TUI controls are available", async () => {
    const tuiCalls: string[] = [];
    const plugin = await createPlugin({
      tui: {
        showToast: async () => {
          tuiCalls.push("toast");
          return undefined;
        },
        clearPrompt: async (input: { directory?: string }) => {
          expect(input.directory).toBe(process.cwd());
          tuiCalls.push("clear");
          return undefined;
        },
        appendPrompt: async (input: { directory?: string; text?: string }) => {
          expect(input.directory).toBe(process.cwd());
          tuiCalls.push(`append:${input.text ?? ""}`);
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

  test("registers a TUI-native /augment slash command", async () => {
    const registrations: Array<() => Array<Record<string, unknown>>> = [];
    const dialogRenders: Array<(() => unknown)> = [];

    await CliKitTuiPlugin.tui({
      command: {
        register: (cb: () => Array<Record<string, unknown>>) => {
          registrations.push(cb);
          return () => undefined;
        },
        trigger: () => undefined,
      },
      ui: {
        DialogPrompt: (props: Record<string, unknown>) => props,
        toast: () => undefined,
        dialog: {
          replace: (render: () => unknown) => {
            dialogRenders.push(render as () => unknown);
          },
          clear: () => undefined,
        },
      },
      state: {
        path: {
          directory: process.cwd(),
        },
      },
      workspace: {
        current: () => undefined,
      },
      scopedClient: () => ({
        session: {
          create: async () => ({ data: { id: "unused" }, error: undefined }),
          prompt: async () => ({ data: { parts: [] }, error: undefined }),
          delete: async () => ({ data: true, error: undefined }),
        },
        tui: {
          clearPrompt: async () => undefined,
          appendPrompt: async () => undefined,
        },
      }),
      lifecycle: {
        onDispose: () => () => undefined,
      },
    } as never, undefined, {
      id: "clikit-tui",
      source: "npm",
      spec: "clikit-plugin@latest",
      target: "clikit-plugin",
      first_time: Date.now(),
      last_time: Date.now(),
      time_changed: Date.now(),
      load_count: 1,
      fingerprint: "test",
      state: "same",
    });

    expect(registrations.length).toBe(1);
    const commands = registrations[0]!();
    const augmentCommand = commands.find((entry) => entry.value === "clikit.augment") as {
      slash?: { name: string };
      description?: string;
      onSelect?: () => void;
    } | undefined;

    expect(augmentCommand).toBeDefined();
    expect(augmentCommand?.slash).toEqual({ name: "augment" });
    expect(augmentCommand?.description).toContain("send the enhanced prompt immediately");

    augmentCommand?.onSelect?.();
    expect(dialogRenders.length).toBe(1);
    const renderDialog = dialogRenders[0] as (() => unknown);
    const dialog = renderDialog() as { title?: string; placeholder?: string };
    expect(dialog.title).toBe("CliKit Augment");
    expect(dialog.placeholder).toContain("prompt draft");
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

  test("submits the enhanced prompt into the active session from the tui slash command", async () => {
    const registeredCommands: Array<Record<string, unknown>> = [];
    const promptCalls: Array<Record<string, unknown>> = [];
    const deleteCalls: Array<Record<string, unknown>> = [];
    const appendCalls: Array<Record<string, unknown>> = [];
    const clearCalls: Array<Record<string, unknown>> = [];
    const toasts: Array<Record<string, unknown>> = [];
    let dialogFactory: (() => unknown) | undefined;

    await CliKitTuiPlugin.tui({
      command: {
        register: (factory: () => Array<Record<string, unknown>>) => {
          registeredCommands.push(...factory());
          return () => undefined;
        },
      },
      lifecycle: {
        onDispose: () => undefined,
      },
      route: {
        current: {
          name: "session",
          params: {
            sessionID: "active-session",
          },
        },
      },
      scopedClient: () => ({
        session: {
          create: async () => ({
            data: {
              id: "refinement-session",
            },
          }),
          prompt: async (parameters?: Record<string, unknown>) => {
            promptCalls.push(parameters ?? {});

            if (parameters?.sessionID === "refinement-session") {
              return {
                data: {
                  parts: [
                    {
                      type: "text",
                      text: "Refined prompt for active send",
                    },
                  ],
                },
              };
            }

            return {
              data: {
                parts: [],
              },
            };
          },
          delete: async (parameters?: Record<string, unknown>) => {
            deleteCalls.push(parameters ?? {});
            return {};
          },
        },
        tui: {
          clearPrompt: async (parameters?: Record<string, unknown>) => {
            clearCalls.push(parameters ?? {});
            return {};
          },
          appendPrompt: async (parameters?: Record<string, unknown>) => {
            appendCalls.push(parameters ?? {});
            return {};
          },
        },
      }),
      state: {
        path: {
          directory: process.cwd(),
        },
      },
      workspace: {
        current: () => "workspace-1",
      },
      ui: {
        toast: (payload: Record<string, unknown>) => {
          toasts.push(payload);
        },
        dialog: {
          clear: () => undefined,
          replace: (factory: () => unknown) => {
            dialogFactory = factory;
          },
        },
        DialogPrompt: (props: Record<string, unknown>) => props,
      },
    } as never, undefined, {
      id: "clikit-tui",
      source: "npm",
      spec: "clikit-plugin@latest",
      target: "clikit-plugin",
      first_time: Date.now(),
      last_time: Date.now(),
      time_changed: Date.now(),
      load_count: 1,
      fingerprint: "test",
      state: "same",
    });

    const augmentCommand = registeredCommands.find((entry) => entry.value === "clikit.augment") as {
      onSelect?: () => void;
    };

    augmentCommand?.onSelect?.();

    const dialog = dialogFactory?.() as {
      onConfirm?: (value: string) => void | Promise<void>;
    } | undefined;

    await dialog?.onConfirm?.("please help me fix");

    expect(promptCalls).toHaveLength(2);
    expect(promptCalls[0]?.sessionID).toBe("refinement-session");
    expect(promptCalls[1]?.sessionID).toBe("active-session");
    expect(promptCalls[1]?.parts).toEqual([
      {
        type: "text",
        text: "Refined prompt for active send",
      },
    ]);
    expect(deleteCalls).toEqual([
      {
        sessionID: "refinement-session",
        directory: process.cwd(),
        workspace: "workspace-1",
      },
    ]);
    expect(clearCalls).toHaveLength(0);
    expect(appendCalls).toHaveLength(0);
    expect(toasts.some((toast) => toast.message === "Enhanced prompt sent (llm)."))
      .toBe(true);
  });

  test("falls back to composer injection when the active-session send throws", async () => {
    const registeredCommands: Array<Record<string, unknown>> = [];
    const promptCalls: Array<Record<string, unknown>> = [];
    const appendCalls: Array<Record<string, unknown>> = [];
    const clearCalls: Array<Record<string, unknown>> = [];
    const toasts: Array<Record<string, unknown>> = [];
    let dialogFactory: (() => unknown) | undefined;

    await CliKitTuiPlugin.tui({
      command: {
        register: (factory: () => Array<Record<string, unknown>>) => {
          registeredCommands.push(...factory());
          return () => undefined;
        },
      },
      lifecycle: {
        onDispose: () => undefined,
      },
      route: {
        current: {
          name: "session",
          params: {
            sessionID: "active-session",
          },
        },
      },
      scopedClient: () => ({
        session: {
          create: async () => ({
            data: {
              id: "refinement-session",
            },
          }),
          prompt: async (parameters?: Record<string, unknown>) => {
            promptCalls.push(parameters ?? {});

            if (parameters?.sessionID === "refinement-session") {
              return {
                data: {
                  parts: [
                    {
                      type: "text",
                      text: "Fallback injected prompt",
                    },
                  ],
                },
              };
            }

            throw new Error("session send failed");
          },
          delete: async () => ({}),
        },
        tui: {
          clearPrompt: async (parameters?: Record<string, unknown>) => {
            clearCalls.push(parameters ?? {});
            return {};
          },
          appendPrompt: async (parameters?: Record<string, unknown>) => {
            appendCalls.push(parameters ?? {});
            return {};
          },
        },
      }),
      state: {
        path: {
          directory: process.cwd(),
        },
      },
      workspace: {
        current: () => "workspace-1",
      },
      ui: {
        toast: (payload: Record<string, unknown>) => {
          toasts.push(payload);
        },
        dialog: {
          clear: () => undefined,
          replace: (factory: () => unknown) => {
            dialogFactory = factory;
          },
        },
        DialogPrompt: (props: Record<string, unknown>) => props,
      },
    } as never, undefined, {
      id: "clikit-tui",
      source: "npm",
      spec: "clikit-plugin@latest",
      target: "clikit-plugin",
      first_time: Date.now(),
      last_time: Date.now(),
      time_changed: Date.now(),
      load_count: 1,
      fingerprint: "test",
      state: "same",
    });

    const augmentCommand = registeredCommands.find((entry) => entry.value === "clikit.augment") as {
      onSelect?: () => void;
    };

    augmentCommand?.onSelect?.();

    const dialog = dialogFactory?.() as {
      onConfirm?: (value: string) => void | Promise<void>;
    } | undefined;

    await dialog?.onConfirm?.("please help me fix");

    expect(promptCalls).toHaveLength(2);
    expect(appendCalls).toEqual([
      {
        directory: process.cwd(),
        workspace: "workspace-1",
        text: "Fallback injected prompt",
      },
    ]);
    expect(clearCalls).toHaveLength(0);
    expect(toasts.some((toast) => toast.message === "Enhanced prompt inserted (llm)."))
      .toBe(true);
  });

  test("injects into the composer when no active session route exists", async () => {
    const registeredCommands: Array<Record<string, unknown>> = [];
    const promptCalls: Array<Record<string, unknown>> = [];
    const appendCalls: Array<Record<string, unknown>> = [];
    const toasts: Array<Record<string, unknown>> = [];
    let dialogFactory: (() => unknown) | undefined;

    await CliKitTuiPlugin.tui({
      command: {
        register: (factory: () => Array<Record<string, unknown>>) => {
          registeredCommands.push(...factory());
          return () => undefined;
        },
      },
      lifecycle: {
        onDispose: () => undefined,
      },
      route: {
        current: {
          name: "home",
        },
      },
      scopedClient: () => ({
        session: {
          create: async () => ({
            data: {
              id: "refinement-session",
            },
          }),
          prompt: async (parameters?: Record<string, unknown>) => {
            promptCalls.push(parameters ?? {});
            return {
              data: {
                parts: [
                  {
                    type: "text",
                    text: "Injected without active session",
                  },
                ],
              },
            };
          },
          delete: async () => ({}),
        },
        tui: {
          appendPrompt: async (parameters?: Record<string, unknown>) => {
            appendCalls.push(parameters ?? {});
            return {};
          },
        },
      }),
      state: {
        path: {
          directory: process.cwd(),
        },
      },
      workspace: {
        current: () => "workspace-1",
      },
      ui: {
        toast: (payload: Record<string, unknown>) => {
          toasts.push(payload);
        },
        dialog: {
          clear: () => undefined,
          replace: (factory: () => unknown) => {
            dialogFactory = factory;
          },
        },
        DialogPrompt: (props: Record<string, unknown>) => props,
      },
    } as never, undefined, {
      id: "clikit-tui",
      source: "npm",
      spec: "clikit-plugin@latest",
      target: "clikit-plugin",
      first_time: Date.now(),
      last_time: Date.now(),
      time_changed: Date.now(),
      load_count: 1,
      fingerprint: "test",
      state: "same",
    });

    const augmentCommand = registeredCommands.find((entry) => entry.value === "clikit.augment") as {
      onSelect?: () => void;
    };

    augmentCommand?.onSelect?.();

    const dialog = dialogFactory?.() as {
      onConfirm?: (value: string) => void | Promise<void>;
    } | undefined;

    await dialog?.onConfirm?.("please help me fix");

    expect(promptCalls).toHaveLength(1);
    expect(promptCalls[0]?.sessionID).toBe("refinement-session");
    expect(appendCalls).toEqual([
      {
        directory: process.cwd(),
        workspace: "workspace-1",
        text: "Injected without active session",
      },
    ]);
    expect(toasts.some((toast) => toast.message === "Enhanced prompt inserted (llm)."))
      .toBe(true);
  });

  test("sends deterministic fallback to the active session when refinement fails before delivery", async () => {
    const registeredCommands: Array<Record<string, unknown>> = [];
    const promptCalls: Array<Record<string, unknown>> = [];
    const appendCalls: Array<Record<string, unknown>> = [];
    const toasts: Array<Record<string, unknown>> = [];
    let dialogFactory: (() => unknown) | undefined;

    await CliKitTuiPlugin.tui({
      command: {
        register: (factory: () => Array<Record<string, unknown>>) => {
          registeredCommands.push(...factory());
          return () => undefined;
        },
      },
      lifecycle: {
        onDispose: () => undefined,
      },
      route: {
        current: {
          name: "session",
          params: {
            sessionID: "active-session",
          },
        },
      },
      scopedClient: () => ({
        session: {
          create: async () => ({
            error: true,
          }),
          prompt: async (parameters?: Record<string, unknown>) => {
            promptCalls.push(parameters ?? {});
            return { data: { parts: [] } };
          },
          delete: async () => ({}),
        },
        tui: {
          appendPrompt: async (parameters?: Record<string, unknown>) => {
            appendCalls.push(parameters ?? {});
            return {};
          },
        },
      }),
      state: {
        path: {
          directory: process.cwd(),
        },
      },
      workspace: {
        current: () => "workspace-1",
      },
      ui: {
        toast: (payload: Record<string, unknown>) => {
          toasts.push(payload);
        },
        dialog: {
          clear: () => undefined,
          replace: (factory: () => unknown) => {
            dialogFactory = factory;
          },
        },
        DialogPrompt: (props: Record<string, unknown>) => props,
      },
    } as never, undefined, {
      id: "clikit-tui",
      source: "npm",
      spec: "clikit-plugin@latest",
      target: "clikit-plugin",
      first_time: Date.now(),
      last_time: Date.now(),
      time_changed: Date.now(),
      load_count: 1,
      fingerprint: "test",
      state: "same",
    });

    const augmentCommand = registeredCommands.find((entry) => entry.value === "clikit.augment") as {
      onSelect?: () => void;
    };

    augmentCommand?.onSelect?.();

    const dialog = dialogFactory?.() as {
      onConfirm?: (value: string) => void | Promise<void>;
    } | undefined;

    await dialog?.onConfirm?.("please help me fix");

    expect(promptCalls).toHaveLength(1);
    expect(promptCalls[0]?.sessionID).toBe("active-session");
    expect(appendCalls).toHaveLength(0);
    expect(toasts.some((toast) => typeof toast.message === "string"
      && toast.message.includes("deterministic fallback")
      && toast.message.includes("Unable to create OpenCode session for prompt enhancement.")))
      .toBe(true);
  });

  test("does not expose /augment through markdown command loading", () => {
    const commands = getBuiltinCommands();
    const augment = commands.augment;
    const augmentChat = commands["augment-chat"];

    expect(augment).toBeUndefined();
    expect(augmentChat).toBeDefined();
    expect(augmentChat?.template).toContain("augment_prompt");
    expect(augmentChat?.template).toContain("Review, copy, and send it manually.");
  });
});
