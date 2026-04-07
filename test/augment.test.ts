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

  test("intercepts inline /augment arguments and replaces the composer when TUI controls are available", async () => {
    const toastMessages: string[] = [];
    const tuiCalls: string[] = [];
    const sessionCalls: Array<Record<string, unknown>> = [];
    const plugin = await createPlugin({
      tui: {
        showToast: async (input: { message?: string }) => {
          toastMessages.push(input.message ?? "");
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
        create: async (input?: Record<string, unknown>) => {
          sessionCalls.push({ method: "create", input: input ?? {} });
          return {
            data: {
              id: "session-inline-augment",
            },
            error: undefined,
          };
        },
        prompt: async (input?: Record<string, unknown>) => {
          sessionCalls.push({ method: "prompt", input: input ?? {} });
          return {
            data: {
              parts: [
                {
                  type: "text",
                  text: "Inline refined prompt.",
                },
              ],
            },
            error: undefined,
          };
        },
        delete: async (input?: Record<string, unknown>) => {
          sessionCalls.push({ method: "delete", input: input ?? {} });
          return {
            data: true,
            error: undefined,
          };
        },
      },
    });

    const commandHook = (plugin as unknown as Record<string, (input: Record<string, unknown>, output: {
      parts: Array<Record<string, unknown>>;
    }) => Promise<void>>)["command.execute.before"];

    const output = {
      parts: [
        {
          id: "part-1",
          sessionID: "active-session",
          messageID: "message-1",
          type: "text",
          text: "Original command payload",
        },
      ],
    };

    await commandHook({
      command: "augment",
      sessionID: "active-session",
      arguments: "summarize what changed in the last 3 commits",
    }, output);

    expect(sessionCalls.map((entry) => entry.method)).toEqual(["create", "prompt", "delete"]);
    expect(tuiCalls).toEqual([
      "clear",
      "append:Enhancing prompt.",
      "clear",
      "append:Inline refined prompt.",
    ]);
    expect(toastMessages).toContain("Enhancing prompt.");
    expect(toastMessages).toContain("Enhanced prompt replaced in composer (llm).");
    expect(output.parts).toHaveLength(1);
    expect(output.parts[0]?.text).toContain("CliKit already handled the /augment command locally and updated the composer.");
    expect(output.parts[0]?.text).toContain("Reply with exactly: Composer updated.");
  });

  test("uses the enhanced prompt as inline payload when TUI prompt controls are unavailable", async () => {
    const toastMessages: string[] = [];
    const plugin = await createPlugin({
      tui: {
        showToast: async (input: { message?: string }) => {
          toastMessages.push(input.message ?? "");
          return undefined;
        },
      },
      session: {
        create: async () => ({
          data: {
            id: "session-inline-no-tui",
          },
          error: undefined,
        }),
        prompt: async () => ({
          data: {
            parts: [
              {
                type: "text",
                text: "Inline refined prompt without TUI.",
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

    const commandHook = (plugin as unknown as Record<string, (input: Record<string, unknown>, output: {
      parts: Array<Record<string, unknown>>;
    }) => Promise<void>>)["command.execute.before"];

    const output = {
      parts: [
        {
          id: "part-1",
          sessionID: "active-session",
          messageID: "message-1",
          type: "text",
          text: "Original command payload",
        },
      ],
    };

    await commandHook({
      command: "augment",
      sessionID: "active-session",
      arguments: "summarize what changed in the last 3 commits",
    }, output);

    expect(output.parts).toHaveLength(1);
    expect(output.parts[0]?.text).toBe("Inline refined prompt without TUI.");
    expect(toastMessages).toContain("Enhancing prompt.");
    expect(toastMessages).toContain("Enhanced prompt ready (llm).");
  });

  test("restores the original inline draft when composer replacement fails", async () => {
    const toastMessages: string[] = [];
    const tuiCalls: string[] = [];
    let appendCount = 0;
    const plugin = await createPlugin({
      tui: {
        showToast: async (input: { message?: string }) => {
          toastMessages.push(input.message ?? "");
          return undefined;
        },
        clearPrompt: async () => {
          tuiCalls.push("clear");
          return undefined;
        },
        appendPrompt: async (input: { text?: string }) => {
          appendCount += 1;
          tuiCalls.push(`append:${input.text ?? ""}`);

          if (appendCount === 2) {
            throw new Error("append failed");
          }

          return undefined;
        },
      },
      session: {
        create: async () => ({
          data: {
            id: "session-inline-restore",
          },
          error: undefined,
        }),
        prompt: async () => ({
          data: {
            parts: [
              {
                type: "text",
                text: "Inline refined prompt that fails to inject.",
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

    const commandHook = (plugin as unknown as Record<string, (input: Record<string, unknown>, output: {
      parts: Array<Record<string, unknown>>;
    }) => Promise<void>>)["command.execute.before"];

    const output = {
      parts: [
        {
          id: "part-1",
          sessionID: "active-session",
          messageID: "message-1",
          type: "text",
          text: "Original command payload",
        },
      ],
    };

    await commandHook({
      command: "augment",
      sessionID: "active-session",
      arguments: "summarize what changed in the last 3 commits",
    }, output);

    expect(tuiCalls).toEqual([
      "clear",
      "append:Enhancing prompt.",
      "clear",
      "append:Inline refined prompt that fails to inject.",
      "clear",
      "append:summarize what changed in the last 3 commits",
    ]);
    expect(toastMessages).toContain("append failed");
    expect(output.parts[0]?.text).toBe("Original command payload");
  });

  test("exports a separate TUI plugin module", () => {
    expect(CliKitTuiPlugin).toBeDefined();
    expect(typeof CliKitTuiPlugin.tui).toBe("function");
    expect("server" in CliKitTuiPlugin).toBe(false);
  });

  function createTuiMeta() {
    const now = Date.now();

    return {
      id: "clikit-tui",
      source: "npm",
      spec: "clikit-plugin@latest",
      target: "clikit-plugin",
      first_time: now,
      last_time: now,
      time_changed: now,
      load_count: 1,
      fingerprint: "test",
      state: "same",
    } as const;
  }

  function createMockPromptRef(input: string) {
    const setCalls: Array<{ input: string; mode?: string; parts: unknown[] }> = [];
    const blurCalls: string[] = [];
    const focusCalls: string[] = [];

    const promptRef = {
      focused: true,
      current: {
        input,
        mode: "normal" as const,
        parts: [],
      },
      set(prompt: { input: string; mode?: "normal" | "shell"; parts: unknown[] }) {
        this.current = {
          input: prompt.input,
          mode: prompt.mode,
          parts: [...prompt.parts],
        };
        setCalls.push({
          input: prompt.input,
          mode: prompt.mode,
          parts: [...prompt.parts],
        });
      },
      reset() {
        this.current = {
          input: "",
          mode: "normal",
          parts: [],
        };
      },
      blur() {
        this.focused = false;
        blurCalls.push("blur");
      },
      focus() {
        this.focused = true;
        focusCalls.push("focus");
      },
      submit() {
        return undefined;
      },
    };

    return { promptRef, setCalls, blurCalls, focusCalls };
  }

  async function flushAsyncWork(times = 6) {
    for (let index = 0; index < times; index += 1) {
      await Promise.resolve();
    }
  }

  async function setupTuiAugment(options?: {
    routeCurrent?: Record<string, unknown>;
    createResult?: { data?: { id?: string }; error?: unknown };
    promptText?: string;
    withSlots?: boolean;
  }) {
    const registeredCommands: Array<Record<string, unknown>> = [];
    const slotPlugins: Array<{ slots?: Record<string, (...args: unknown[]) => unknown> }> = [];
    const toasts: Array<Record<string, unknown>> = [];
    const promptCalls: Array<Record<string, unknown>> = [];
    const deleteCalls: Array<Record<string, unknown>> = [];
    const appendCalls: Array<Record<string, unknown>> = [];
    const clearCalls: Array<Record<string, unknown>> = [];
    let dialogFactory: (() => unknown) | undefined;
    let promptRefToAttach: ReturnType<typeof createMockPromptRef>["promptRef"] | undefined;

    await CliKitTuiPlugin.tui({
      command: {
        register: (factory: () => Array<Record<string, unknown>>) => {
          registeredCommands.push(...factory());
          return () => undefined;
        },
        trigger: () => undefined,
        show: () => undefined,
      },
      lifecycle: {
        onDispose: () => () => undefined,
        signal: new AbortController().signal,
      },
      route: {
        current: options?.routeCurrent ?? {
          name: "session",
          params: {
            sessionID: "active-session",
          },
        },
      },
      scopedClient: () => ({
        session: {
          create: async () => options?.createResult ?? {
            data: {
              id: "refinement-session",
            },
            error: undefined,
          },
          prompt: async (parameters?: Record<string, unknown>) => {
            promptCalls.push(parameters ?? {});
            return {
              data: {
                parts: [
                  {
                    type: "text",
                    text: options?.promptText ?? "Enhanced prompt from LLM",
                  },
                ],
              },
              error: undefined,
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
      slots: options?.withSlots === false
        ? undefined
        : {
          register: (plugin: { slots?: Record<string, (...args: unknown[]) => unknown> }) => {
            slotPlugins.push(plugin);
            return `slot-${slotPlugins.length}`;
          },
        },
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
          clear: () => {
            dialogFactory = undefined;
          },
          replace: (factory: () => unknown) => {
            dialogFactory = factory;
          },
        },
        DialogPrompt: (props: Record<string, unknown>) => props,
        Prompt: (props: Record<string, unknown>) => {
          const ref = props.ref as ((value: ReturnType<typeof createMockPromptRef>["promptRef"] | undefined) => void) | undefined;
          ref?.(promptRefToAttach);
          return props;
        },
      },
    } as never, undefined, createTuiMeta());

    function renderSessionPrompt(promptRef: ReturnType<typeof createMockPromptRef>["promptRef"], sessionID = "active-session") {
      const plugin = slotPlugins[0];
      const renderer = plugin?.slots?.session_prompt as ((ctx: unknown, props: Record<string, unknown>) => unknown) | undefined;

      promptRefToAttach = promptRef;
      renderer?.({}, { session_id: sessionID });
      promptRefToAttach = undefined;
    }

    function renderHomePrompt(promptRef: ReturnType<typeof createMockPromptRef>["promptRef"]) {
      const plugin = slotPlugins[0];
      const renderer = plugin?.slots?.home_prompt as ((ctx: unknown, props: Record<string, unknown>) => unknown) | undefined;

      promptRefToAttach = promptRef;
      renderer?.({}, { workspace_id: "workspace-1" });
      promptRefToAttach = undefined;
    }

    return {
      slotPlugins,
      toasts,
      promptCalls,
      deleteCalls,
      appendCalls,
      clearCalls,
      getDialog: () => dialogFactory?.() as {
        onConfirm?: (value: string) => void | Promise<void>;
      } | undefined,
      getAugmentCommand: () => registeredCommands.find((entry) => entry.value === "clikit.augment") as {
        slash?: { name: string };
        description?: string;
        onSelect?: () => void;
      } | undefined,
      renderSessionPrompt,
      renderHomePrompt,
    };
  }

  test("registers a TUI-native /augment slash command", async () => {
    const setup = await setupTuiAugment();
    const augmentCommand = setup.getAugmentCommand();

    expect(augmentCommand).toBeDefined();
    expect(augmentCommand?.slash).toEqual({ name: "augment" });
    expect(augmentCommand?.description).toContain("Rewrite the current composer prompt when available");
    expect(setup.slotPlugins).toHaveLength(1);
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

  test("replaces the active session composer directly from the tui slash command", async () => {
    const setup = await setupTuiAugment({
      promptText: "Refined prompt for active composer",
    });
    const tracked = createMockPromptRef("please help me fix");

    setup.renderSessionPrompt(tracked.promptRef);

    const augmentCommand = setup.getAugmentCommand();
    augmentCommand?.onSelect?.();

    await flushAsyncWork();

    expect(setup.getDialog()).toBeUndefined();
    expect(setup.promptCalls).toHaveLength(1);
    expect(setup.promptCalls[0]?.sessionID).toBe("refinement-session");
    expect(setup.deleteCalls).toEqual([
      {
        sessionID: "refinement-session",
        directory: process.cwd(),
        workspace: "workspace-1",
      },
    ]);
    expect(setup.clearCalls).toHaveLength(0);
    expect(setup.appendCalls).toHaveLength(0);
    expect(tracked.blurCalls).toEqual(["blur"]);
    expect(tracked.focusCalls).toEqual(["focus"]);
    expect(tracked.setCalls.map((call) => call.input)).toEqual([
      "⏳ Enhancing prompt…",
      "Refined prompt for active composer",
    ]);
    expect(setup.toasts.some((toast) => toast.message === "Enhanced prompt replaced in composer (llm)."))
      .toBe(true);
  });

  test("still replaces the current composer when an active session route exists", async () => {
    const setup = await setupTuiAugment({
      promptText: "Session route replacement",
    });
    const tracked = createMockPromptRef("please help me fix");

    setup.renderSessionPrompt(tracked.promptRef, "active-session");

    const augmentCommand = setup.getAugmentCommand();
    augmentCommand?.onSelect?.();

    await flushAsyncWork();

    expect(setup.promptCalls).toHaveLength(1);
    expect(setup.deleteCalls).toEqual([
      {
        sessionID: "refinement-session",
        directory: process.cwd(),
        workspace: "workspace-1",
      },
    ]);
    expect(setup.clearCalls).toHaveLength(0);
    expect(setup.appendCalls).toHaveLength(0);
    expect(tracked.setCalls.map((call) => call.input)).toEqual([
      "⏳ Enhancing prompt…",
      "Session route replacement",
    ]);
    expect(setup.toasts.some((toast) => toast.message === "Enhanced prompt replaced in composer (llm)."))
      .toBe(true);
  });

  test("replaces the home composer when no active session route exists", async () => {
    const setup = await setupTuiAugment({
      routeCurrent: {
        name: "home",
      },
      promptText: "Home prompt replacement",
    });
    const tracked = createMockPromptRef("please help me fix");

    setup.renderHomePrompt(tracked.promptRef);

    const augmentCommand = setup.getAugmentCommand();
    augmentCommand?.onSelect?.();

    await flushAsyncWork();

    expect(setup.promptCalls).toHaveLength(1);
    expect(setup.promptCalls[0]?.sessionID).toBe("refinement-session");
    expect(setup.deleteCalls).toEqual([
      {
        sessionID: "refinement-session",
        directory: process.cwd(),
        workspace: "workspace-1",
      },
    ]);
    expect(setup.appendCalls).toHaveLength(0);
    expect(tracked.setCalls.map((call) => call.input)).toEqual([
      "⏳ Enhancing prompt…",
      "Home prompt replacement",
    ]);
    expect(setup.toasts.some((toast) => toast.message === "Enhanced prompt replaced in composer (llm)."))
      .toBe(true);
  });

  test("falls back to the dialog flow when no prompt ref is available", async () => {
    const setup = await setupTuiAugment({
      withSlots: false,
      promptText: "Fallback injected prompt",
    });

    const augmentCommand = setup.getAugmentCommand();
    augmentCommand?.onSelect?.();

    const dialog = setup.getDialog();
    expect(dialog).toBeDefined();

    await dialog?.onConfirm?.("please help me fix");

    expect(setup.promptCalls).toHaveLength(1);
    expect(setup.clearCalls).toEqual([
      {
        directory: process.cwd(),
        workspace: "workspace-1",
      },
    ]);
    expect(setup.appendCalls).toEqual([
      {
        directory: process.cwd(),
        workspace: "workspace-1",
        text: "Fallback injected prompt",
      },
    ]);
    expect(setup.toasts.some((toast) => toast.message === "Enhanced prompt inserted (llm)."))
      .toBe(true);
  });

  test("replaces the composer with the deterministic fallback when refinement fails", async () => {
    const setup = await setupTuiAugment({
      createResult: {
        error: true,
      },
    });
    const tracked = createMockPromptRef("please help me fix");

    setup.renderSessionPrompt(tracked.promptRef);

    const augmentCommand = setup.getAugmentCommand();
    augmentCommand?.onSelect?.();

    await flushAsyncWork();

    expect(setup.promptCalls).toHaveLength(0);
    expect(setup.appendCalls).toHaveLength(0);
    expect(tracked.setCalls.map((call) => call.input)).toEqual([
      "⏳ Enhancing prompt…",
      augmentPrompt("please help me fix").enhanced,
    ]);
    expect(setup.toasts.some((toast) => typeof toast.message === "string"
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
