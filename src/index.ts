import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const execFileAsync = promisify(execFile);
import { getBuiltinAgents } from "./agents";
import { getBuiltinCommands } from "./commands";
import { getBuiltinSkills, resolveSkillsDir } from "./skills";
import type { AgentConfig, CommandConfig } from "./types";
import {
  loadCliKitConfig,
  filterAgents,
  filterCommands,
  filterSkills,
  deepMerge,
  type LspServerConfig,
} from "./config";
import {
  upsertPluginEntry,
} from "./cli";
import {
  // Todo Enforcer
  checkTodoCompletion,
  formatIncompleteWarning,
  // Empty Message Sanitizer
  isEmptyContent,
  sanitizeContent,
  // Git Guard
  checkDangerousCommand,
  formatBlockedWarning,
  // Security Check
  scanContentForSecrets,
  isSensitiveFile,
  formatSecurityWarning,
  // Subagent Question Blocker
  containsQuestion,
  isSubagentTool,
  formatBlockerWarning,
  // Truncator
  shouldTruncate,
  truncateOutput,
  formatTruncationLog,
  // Memory Digest
  generateMemoryDigest,
  formatDigestLog,
  // Todo -> Beads Sync
  syncTodosToBeads,
  formatTodoBeadsSyncLog,
  // Beads Context
  getBeadsSnapshot,
  getBeadsCompactionContext,
  // Tilth Reading
  shouldAttemptTilthForTool,
  extractFilePath,
  applyTilthReading,
  formatTilthLog,
  isBlockedToolExecutionError,
  formatHookErrorLog,
  writeErrorLog,
  writeBufferedErrorLog,
  drainInitErrors,
  type OpenCodeTodo,
} from "./hooks";
import { cassMemoryContext, cassMemoryReflect } from "./tools/cass-memory";
import { contextSummary } from "./tools/context-summary";

const DCP_PLUGIN_ENTRY = "@tarquinen/opencode-dcp@beta";
const DCP_PLUGIN_BASE = "@tarquinen/opencode-dcp";

/**
 * Ensure @tarquinen/opencode-dcp@beta is present in the OpenCode config plugin list.
 * Called at plugin init so users who already have clikit@latest get DCP automatically
 * without needing to re-run `clikit install`.
 */
function ensureDcpInConfig(): void {
  try {
    const configDir = (() => {
      if (process.env.OPENCODE_CONFIG_DIR) return process.env.OPENCODE_CONFIG_DIR;
      const home = (() => {
        if (process.env.SNAP_REAL_HOME) return process.env.SNAP_REAL_HOME;
        const h = os.homedir();
        const m = h.match(/^(\/home\/[^/]+)\/snap\//);
        return m ? m[1] : h;
      })();
      if (process.platform === "win32") {
        return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "opencode");
      }
      return path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "opencode");
    })();

    const jsoncPath = path.join(configDir, "opencode.jsonc");
    const jsonPath = path.join(configDir, "opencode.json");
    const configPath = fs.existsSync(jsoncPath) ? jsoncPath : jsonPath;

    if (!fs.existsSync(configPath)) return;

    const raw = fs.readFileSync(configPath, "utf-8");
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // Strip block comments + trailing commas (JSONC)
      const cleaned = raw
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/,\s*([}\]])/g, "$1");
      config = JSON.parse(cleaned) as Record<string, unknown>;
    }

    const plugins = Array.isArray(config.plugin)
      ? (config.plugin as string[]).filter((p): p is string => typeof p === "string")
      : [];

    // Already present — nothing to do
    const hasDcp = plugins.some(
      (p) => p === DCP_PLUGIN_BASE || p.startsWith(`${DCP_PLUGIN_BASE}@`)
    );
    if (hasDcp) return;

    const updated = upsertPluginEntry(plugins, DCP_PLUGIN_ENTRY);
    const tmpPath = `${configPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify({ ...config, plugin: updated }, null, 2) + "\n");
    fs.renameSync(tmpPath, configPath);
  } catch {
    // Never crash plugin init due to config patching failures
  }
}

const CliKitPlugin: Plugin = async (ctx) => {
  const todosBySession = new Map<string, OpenCodeTodo[]>();
  const sessionAgents = new Map<string, string>();
  const defaultMcpEntries = {
    context7: {
      type: "remote",
      url: "https://mcp.context7.com/mcp",
      enabled: true,
      headers: {
        CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY || "{env:CONTEXT7_API_KEY}",
      },
    },
    grep: {
      type: "remote",
      url: "https://mcp.grep.app",
      enabled: true,
    },
    "human-mcp": {
      type: "local",
      command: ["npx", "-y", "@goonnguyen/human-mcp"],
      enabled: true,
      environment: {
        GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY || "{env:GOOGLE_GEMINI_API_KEY}",
        TRANSPORT_TYPE: "stdio",
      },
    },
  } as const;

  function getToolInput(args: unknown): Record<string, unknown> {
    return args && typeof args === "object" ? (args as Record<string, unknown>) : {};
  }

  function blockToolExecution(reason: string): never {
    throw new Error(`[CliKit] Blocked tool execution: ${reason}`);
  }

  async function showToast(message: string, variant: "info" | "success" | "warning" | "error", title = "CliKit"): Promise<boolean> {
    try {
      await ctx.client.tui.showToast({
        body: {
          title,
          message,
          variant,
          duration: 3500,
        },
      });
      return true;
    } catch {
      // Toasts are best-effort; never break hook flow.
      return false;
    }
  }

  function normalizeTodos(rawTodos: unknown): OpenCodeTodo[] {
    if (!Array.isArray(rawTodos)) {
      return [];
    }

    const normalized: OpenCodeTodo[] = [];
    for (const entry of rawTodos) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const record = entry as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const content = typeof record.content === "string" ? record.content : "";
      const status = typeof record.status === "string" ? record.status : "todo";
      const priority = typeof record.priority === "string" ? record.priority : undefined;

      if (!id || !content) {
        continue;
      }

      normalized.push({ id, content, status, priority });
    }

    return normalized;
  }

  async function getStagedFiles(): Promise<string[]> {
    try {
      const { stdout } = await execFileAsync("git", ["diff", "--cached", "--name-only"], {
        cwd: ctx.directory,
        encoding: "utf-8",
      });
      return stdout
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } catch {
      return [];
    }
  }

  async function getStagedDiff(): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", ["diff", "--cached", "--no-color"], {
        cwd: ctx.directory,
        encoding: "utf-8",
      });
      return stdout;
    } catch {
      return "";
    }
  }

  async function getStagedFileContent(file: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", ["show", `:${file}`], {
        cwd: ctx.directory,
        encoding: "utf-8",
      });
      return stdout;
    } catch {
      return "";
    }
  }

  function isToolNamed(name: string, expected: string): boolean {
    return name.toLowerCase() === expected.toLowerCase();
  }

  function rememberSessionAgent(sessionID: string | undefined, agent: unknown): void {
    if (typeof sessionID !== "string") {
      return;
    }

    if (typeof agent !== "string") {
      return;
    }

    const normalized = agent.trim();
    if (!normalized) {
      return;
    }

    sessionAgents.set(sessionID, normalized);
  }

  function toSingleLinePreview(text: string, maxLength = 72): string {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }
    return `${normalized.slice(0, maxLength - 1)}…`;
  }

  // Structured log via OpenCode SDK — preferred over console.* in plugins.
  // level: "debug" | "info" | "warn" | "error"
  async function cliLog(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    extra?: Record<string, unknown>
  ): Promise<void> {
    try {
      await ctx.client.app.log({
        body: {
          service: "clikit-plugin",
          level,
          message,
          ...(extra ? { extra } : {}),
        },
      });
    } catch {
      // Fallback: write to stderr so nothing is silently lost.
      console.error(`[CliKit log fallback] ${level.toUpperCase()}: ${message}`, extra ?? "");
    }
  }

  // Async wrapper that routes hook errors through client.app.log AND error-log.txt.
  async function hookErr(
    hookName: string,
    error: unknown,
    context?: Record<string, unknown>
  ): Promise<void> {
    // 1. Write to .opencode/error-log.txt (always, sync, silent)
    writeErrorLog(hookName, error, ctx.directory, context);
    // 2. Send to OpenCode SDK log (async, best-effort)
    await cliLog("error", formatHookErrorLog(hookName, error, context));
  }

  type EffectiveWorkflow = {
    mode: "classic" | "compressed";
    activeRoles: string[];
    usePackets: boolean;
    embedVerifyInStart: boolean;
    verifyIsAudit: boolean;
    subagentCallBudget: number;
  };

  function getEffectiveWorkflow(): EffectiveWorkflow {
    const raw = pluginConfig.workflow ?? {};
    const classicMode = raw.mode === "classic";
    return {
      mode: classicMode ? "classic" : "compressed",
      activeRoles: raw.active_roles || ["build", "plan", "review", "coordinator"],
      usePackets: classicMode ? raw.use_packets === true : raw.use_packets !== false,
      embedVerifyInStart: classicMode ? false : raw.embed_verify_in_start !== false,
      verifyIsAudit: classicMode ? false : raw.verify_is_audit !== false,
      subagentCallBudget: raw.subagent_call_budget ?? 2,
    };
  }

  function prependBlock(content: string | undefined, block: string): string {
    return `${block.trim()}\n\n${(content || "").trim()}`.trim();
  }

  function applyWorkflowOverridesToAgents(agents: Record<string, AgentConfig>): Record<string, AgentConfig> {
    const workflow = getEffectiveWorkflow();
    const result: Record<string, AgentConfig> = { ...agents };

    const runtimeBlock = workflow.mode === "classic"
      ? [
          "## Runtime Workflow Override",
          "- Mode: classic",
          `- Use packets: ${workflow.usePackets ? "yes" : "no"}`,
          `- Subagent budget per unit of work: ${workflow.subagentCallBudget}`,
           "- Do not assume `/start` embeds verification; `/verify` is the pre-ship gate — required before `/ship`.",
        ].join("\n")
      : [
          "## Runtime Workflow Override",
          "- Mode: compressed",
          `- Use packets: ${workflow.usePackets ? "yes" : "no"}`,
          `- Subagent budget per packet: ${workflow.subagentCallBudget}`,
          workflow.embedVerifyInStart
            ? "- `/start` performs execute + verify loop."
            : "- `/start` performs execute only.",
          workflow.verifyIsAudit
            ? "- `/verify` is optional deep audit."
            : "- `/verify` is the pre-ship gate — required before `/ship`.",
        ].join("\n");

    for (const agentName of ["build", "plan", "review"]) {
      const agent = result[agentName];
      if (!agent) continue;
      result[agentName] = {
        ...agent,
        prompt: prependBlock(typeof agent.prompt === "string" ? agent.prompt : "", runtimeBlock),
      };
    }

    return result;
  }

  function applyWorkflowOverridesToCommands(commands: Record<string, CommandConfig>): Record<string, CommandConfig> {
    const workflow = getEffectiveWorkflow();
    const result: Record<string, CommandConfig> = { ...commands };

    if (workflow.mode === "classic") {
      if (result.start?.template) {
        result.start = {
          ...result.start,
          template: prependBlock(
            result.start.template,
            [
              "## Runtime Workflow Override",
              "- Classic mode is active.",
              "- Implement using the approved plan/task boundaries.",
              "- Verification remains a standalone `/verify` gate before `/ship`.",
            ].join("\n"),
          ),
        };
      }

      if (result.verify?.template) {
        result.verify = {
          ...result.verify,
          template: prependBlock(
            result.verify.template,
            [
              "## Runtime Workflow Override",
              "- Classic mode is active.",
              "- This verification pass is mandatory before ship.",
            ].join("\n"),
          ),
        };
      }

      if (result.ship?.template) {
        result.ship = {
          ...result.ship,
          template: prependBlock(
            result.ship.template,
            [
              "## Runtime Workflow Override",
              "- Classic mode is active.",
              "- Require `/verify` PASS before `/ship`.",
            ].join("\n"),
          ),
        };
      }
    }

    if (!workflow.usePackets) {
      // /plan is absorbed into /create; only /start needs the packet-disabled note
      for (const commandName of ["start"]) {
        const command = result[commandName];
        if (!command?.template) continue;
        result[commandName] = {
          ...command,
          template: prependBlock(
            command.template,
            [
              "## Runtime Workflow Override",
              "- Packetized execution is disabled.",
              "- Fall back to approved task/file-impact boundaries from the plan.",
            ].join("\n"),
          ),
        };
      }
    }

    return result;
  }

  function getWorkflowSystemCapsule(): string | null {
    const workflow = getEffectiveWorkflow();
    const roles = workflow.activeRoles.join(", ");
    const budget = workflow.subagentCallBudget;
    return [
      "## CliKit Workflow Capsule",
      "",
      `Mode: ${workflow.mode}`,
      `Active roles: ${roles}`,
      workflow.usePackets
        ? "Execution unit: Task Packet (1 concern, 1-3 files, one verify bundle)"
        : "Execution unit: plan tasks with explicit file-impact boundaries",
      "Source of truth: Beads live task state; OpenCode todos are informational only",
      workflow.usePackets
        ? `Subagent budget per packet: ${budget}`
        : `Subagent budget per unit of work: ${budget}`,
      workflow.embedVerifyInStart
        ? "`/start` performs execute + verify loop"
        : "`/start` performs execute only",
      workflow.verifyIsAudit
        ? "`/verify` is an optional deep audit / pre-ship confidence pass"
        : "`/verify` is the mandatory pre-ship gate — ship only after SHIP_READY verdict",
    ].join("\n");
  }

  // Auto-inject DCP beta into OpenCode config if missing (no re-install needed)
  ensureDcpInConfig();

  const pluginConfig = loadCliKitConfig(ctx.directory) ?? {};
  const debugLogsEnabled = pluginConfig.hooks?.session_logging === true && process.env.CLIKIT_DEBUG === "1";
  const toolLogsEnabled = pluginConfig.hooks?.tool_logging === true && process.env.CLIKIT_DEBUG === "1";

  // Throttle: skip digest regeneration if called within this interval
  const DIGEST_THROTTLE_MS = 60_000;
  let lastDigestTime = 0;

  // Debounce: track last todo hash to skip redundant syncs
  let lastTodoHash = "";

  // Debounce: skip repeated cass reflection on frequent idle events
  let lastCassReflectTime = 0;
  const CASS_REFLECT_THROTTLE_MS = 5 * 60_000;

  const builtinAgents = getBuiltinAgents();
  const builtinCommands = getBuiltinCommands();
  const builtinSkills = getBuiltinSkills();

  const filteredAgents = applyWorkflowOverridesToAgents(filterAgents(builtinAgents, pluginConfig));
  const filteredCommands = applyWorkflowOverridesToCommands(filterCommands(builtinCommands, pluginConfig));
  const filteredSkills = filterSkills(builtinSkills, pluginConfig);

  if (debugLogsEnabled) {
    void cliLog("info", "[CliKit] Plugin initializing...");
    void cliLog("info", "[CliKit] Context", { directory: ctx?.directory, hasClient: !!ctx?.client });
    void cliLog("info", `[CliKit] Loaded ${Object.keys(filteredAgents).length}/${Object.keys(builtinAgents).length} agents`);
    void cliLog("info", `[CliKit] Loaded ${Object.keys(filteredCommands).length}/${Object.keys(builtinCommands).length} commands`);
    void cliLog("info", `[CliKit] Loaded ${Object.keys(filteredSkills).length}/${Object.keys(builtinSkills).length} skills`);

    if (pluginConfig.disabled_agents?.length) {
      void cliLog("info", `[CliKit] Disabled agents: ${pluginConfig.disabled_agents.join(", ")}`);
    }
    if (pluginConfig.disabled_commands?.length) {
      void cliLog("info", `[CliKit] Disabled commands: ${pluginConfig.disabled_commands.join(", ")}`);
    }
  }

  return {
    tool: {
      // context_summary — summarize memory observations into structured context
      context_summary: tool({
        description: "Summarize memory observations (decisions, learnings, blockers, progress) into a structured context digest. Useful for compaction or session handoff.",
        args: {
          scope: tool.schema.enum(["session", "bead", "all"]).optional().describe("Scope of observations (default: all)"),
          beadId: tool.schema.string().optional().describe("Filter by bead/task ID (requires scope=bead)"),
          maxTokens: tool.schema.number().optional().describe("Approximate token budget for summary (default 2000)"),
        },
        async execute(args) {
          const result = contextSummary(args);
          return JSON.stringify(result, null, 2);
        },
      }),
    },

    config: async (config) => {
      // Deep merge plugin agents with existing config agents
      // so per-agent fields (like model) from the plugin aren't
      // silently dropped when OpenCode's built-in agent entries
      // override them via shallow spread.
      const mergedAgents = { ...filteredAgents };
      if (config.agent) {
        for (const [name, existingAgent] of Object.entries(config.agent)) {
          if (existingAgent && mergedAgents[name]) {
            mergedAgents[name] = deepMerge(mergedAgents[name], existingAgent);
          } else if (existingAgent) {
            mergedAgents[name] = existingAgent;
          }
        }
      }
      config.agent = mergedAgents;

      config.command = {
        ...filteredCommands,
        ...config.command,
      };

      if (filteredCommands["status-beads"]) {
        delete config.command.status;
      }

      const runtimeConfig = config as unknown as {
        skill?: Record<string, unknown>;
        skills?: { paths?: string[]; urls?: string[] };
        mcp?: Record<string, unknown>;
      };
      runtimeConfig.skill = {
        ...filteredSkills,
        ...(runtimeConfig.skill || {}),
      };
      const existingSkillPaths = runtimeConfig.skills?.paths || [];
      const resolvedSkillsDir = resolveSkillsDir();
      runtimeConfig.skills = {
        ...(runtimeConfig.skills || {}),
        paths: existingSkillPaths.includes(resolvedSkillsDir)
          ? existingSkillPaths
          : [resolvedSkillsDir, ...existingSkillPaths],
      };
      runtimeConfig.mcp = {
        ...defaultMcpEntries,
        ...(runtimeConfig.mcp || {}),
      };

      if (pluginConfig.lsp && Object.keys(pluginConfig.lsp).length > 0) {
        const enabledLsp: Record<string, LspServerConfig> = {};
        for (const [name, lspConfig] of Object.entries(pluginConfig.lsp)) {
          if (!lspConfig.disabled) {
            enabledLsp[name] = lspConfig;
          }
        }

        if (Object.keys(enabledLsp).length > 0) {
          config.lsp = {
            ...enabledLsp,
            ...(config.lsp || {}),
          };
          if (debugLogsEnabled) {
            await cliLog("info", `[CliKit] Injected ${Object.keys(enabledLsp).length} LSP server(s)`);
          }
        }
      }
      },

      "chat.message": async (input) => {
        rememberSessionAgent(input.sessionID, input.agent);
      },

      "chat.params": async (input) => {
        rememberSessionAgent(input.sessionID, input.agent);
      },

      "chat.headers": async (input) => {
        rememberSessionAgent(input.sessionID, input.agent);
      },

      event: async (input) => {
        const { event } = input;
        const props = event.properties as Record<string, unknown> | undefined;

        if (event.type === "message.updated") {
          const sessionID = typeof props?.sessionID === "string" ? props.sessionID : undefined;
          const info = props?.info as { agent?: unknown } | undefined;
          rememberSessionAgent(sessionID, info?.agent);
        }

        // --- Session Created ---
        if (event.type === "session.created") {
          const info = props?.info as { id?: string; title?: string } | undefined;

          // Drain init-time errors (agents/commands/skills/config had no ctx yet).
          // Write each to error-log.txt + toast for errors.
          const initErrors = drainInitErrors();
          for (const entry of initErrors) {
            writeBufferedErrorLog(entry, ctx.directory);
            if (entry.level === "error") {
              await cliLog("error", `[CliKit:${entry.source}] ${entry.message}`);
              await showToast(`${entry.message}`, "error", `CliKit — ${entry.source}`);
            } else {
              await cliLog("warn", `[CliKit:${entry.source}] ${entry.message}`);
            }
          }

        if (debugLogsEnabled) {
          await cliLog("info", `[CliKit] Session created: ${info?.id || "unknown"}`);
        }

        // Memory Digest: generate _digest.md from SQLite observations
        if (pluginConfig.hooks?.memory_digest?.enabled !== false) {
          try {
            const digestResult = generateMemoryDigest(ctx.directory, pluginConfig.hooks?.memory_digest);
            lastDigestTime = Date.now();
            if (pluginConfig.hooks?.memory_digest?.log !== false) {
              await cliLog("info", formatDigestLog(digestResult));
            }
          } catch (error) {
            await hookErr("memory-digest", error, { event: event.type, phase: "session.created" });
          }
        }

        // Cass Memory: pre-task context snapshot on session start (real cm or embedded fallback)
        const cassHookConfig = pluginConfig.hooks?.cass_memory;
        if (cassHookConfig?.enabled !== false && cassHookConfig?.context_on_session_created !== false) {
          try {
            const sessionTitle = info?.title?.trim() || "session-start";
            const cassResult = await cassMemoryContext({
              task: sessionTitle,
              limit: cassHookConfig?.context_limit,
              cmPath: cassHookConfig?.cm_path,
            });
            if (cassHookConfig?.log === true || debugLogsEnabled) {
              const source = cassResult.source ?? "unknown";
              const data = cassResult.data as Record<string, unknown> | undefined;
              const bullets = (data?.relevantBullets ?? []) as Array<{ narrative?: string }>;
              const bulletCount = bullets.length;
              await cliLog("info", `[CliKit:cass-memory] Context loaded via ${source} (${bulletCount} bullets)`);
              if (bulletCount > 0) {
                const topBullets = bullets
                  .slice(0, 3)
                  .map((bullet: { narrative?: string }, index: number) => `${index + 1}. ${toSingleLinePreview(bullet.narrative ?? "")}`);
                await cliLog("info", `[CliKit:cass-memory] Top bullets: ${topBullets.join(" | ")}`);
                if (cassHookConfig?.log === true) {
                  await showToast(topBullets.join(" • "), "info", "Cass Memory");
                }
              }
            }
          } catch (error) {
            await hookErr("cass-memory", error, { event: event.type, phase: "session.created" });
          }
        }

      }

      // --- Session Error ---
      if (event.type === "session.error") {
        const error = props?.error;

        if (debugLogsEnabled) {
          await cliLog("error", "[CliKit] Session error", { error: String(error) });
        }

      }

      // --- Todo Updated ---
      if (event.type === "todo.updated") {
        const sessionID = props?.sessionID;
        if (typeof sessionID === "string") {
          const todos = normalizeTodos(props?.todos);
          todosBySession.set(sessionID, todos);

          // Debounce: skip sync if todos haven't changed
          const todoHash = JSON.stringify(
            [...todos]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((t) => `${t.id}:${t.status}`)
          );
            if (todoHash !== lastTodoHash) {
              lastTodoHash = todoHash;
            if (
              pluginConfig.hooks?.todo_beads_sync?.enabled !== false &&
              pluginConfig.hooks?.todo_beads_sync?.mode !== "disabled"
            ) {
              try {
                const result = syncTodosToBeads(ctx.directory, sessionID, todos, pluginConfig.hooks?.todo_beads_sync);
                if (pluginConfig.hooks?.todo_beads_sync?.log === true) {
                  await cliLog("info", formatTodoBeadsSyncLog(result));
                }
              } catch (error) {
                await hookErr("todo-beads-sync", error, { event: event.type, sessionID });
                await showToast("Todo-Beads sync failed — check logs for details", "error", "CliKit Sync");
              }
            }
          }
        }
      }

      // --- Session Idle ---
      if (event.type === "session.idle") {
        const sessionID = props?.sessionID as string | undefined;
        const sessionTodos = sessionID ? (todosBySession.get(sessionID) || []) : [];

        if (debugLogsEnabled) {
          await cliLog("info", `[CliKit] Session idle: ${sessionID || "unknown"}`);
        }

        // Todo Enforcer: check on session idle
        const todoConfig = pluginConfig.hooks?.todo_enforcer;
        if (todoConfig?.enabled !== false) {
          try {
            const todos = normalizeTodos(props?.todos);
            const effectiveTodos = todos.length > 0 ? todos : sessionTodos;

            if (effectiveTodos.length > 0) {
              const result = checkTodoCompletion(effectiveTodos as Array<{
                id: string;
                content: string;
                status: "todo" | "in-progress" | "completed";
              }>);

              if (!result.complete && todoConfig?.warn_on_incomplete !== false) {
                await cliLog(
                  "warn",
                  formatIncompleteWarning(result, sessionID, todoConfig?.beads_authoritative === true),
                );
              }
            }
          } catch (error) {
            await hookErr("todo-enforcer", error, { event: event.type, sessionID });
          }
        }

        // Memory Digest: refresh on idle (throttled to avoid repeated I/O)
        if (pluginConfig.hooks?.memory_digest?.enabled !== false) {
          try {
            const now = Date.now();
            if (now - lastDigestTime >= DIGEST_THROTTLE_MS) {
              generateMemoryDigest(ctx.directory, pluginConfig.hooks?.memory_digest);
              lastDigestTime = now;
            }
          } catch (error) {
            await hookErr("memory-digest", error, { event: event.type, phase: "session.idle" });
          }
        }

        // Cass Memory: reflect on idle (real cm or embedded fallback, throttled)
        const cassHookConfig = pluginConfig.hooks?.cass_memory;
        if (cassHookConfig?.enabled !== false && cassHookConfig?.reflect_on_session_idle !== false) {
          try {
            const now = Date.now();
            if (now - lastCassReflectTime >= CASS_REFLECT_THROTTLE_MS) {
              const reflectResult = await cassMemoryReflect({
                days: cassHookConfig?.reflect_days,
                cmPath: cassHookConfig?.cm_path,
              });
              lastCassReflectTime = now;
              if (cassHookConfig?.log === true || debugLogsEnabled) {
                const source = reflectResult.source ?? "unknown";
                await cliLog("info", `[CliKit:cass-memory] Reflection completed via ${source} on session idle`);
              }
            }
          } catch (error) {
            await hookErr("cass-memory", error, { event: event.type, phase: "session.idle" });
          }
        }

      }

        // --- Session Deleted ---
        if (event.type === "session.deleted") {
          const info = props?.info as { id?: string } | undefined;
          const sessionID = info?.id;
          if (sessionID) {
            todosBySession.delete(sessionID);
            sessionAgents.delete(sessionID);
          }
        }
      },

      "tool.execute.before": async (input, output) => {
        const toolName = input.tool;
        const sessionID = input.sessionID;
        const beforeOutput = output as unknown as { args?: unknown };
        const beforeInput = input as unknown as { args?: unknown };
        const toolInput = getToolInput(beforeOutput.args ?? beforeInput.args);
        const activeAgent = sessionAgents.get(sessionID);

        if (toolLogsEnabled) {
          await cliLog("debug", `[CliKit] Tool executing: ${toolName}`);
        }

        // Git Guard: block dangerous git commands
        if (pluginConfig.hooks?.git_guard?.enabled !== false) {
          if (isToolNamed(toolName, "bash")) {
            const command = (toolInput.command as string | undefined) ?? (toolInput.cmd as string | undefined);
            try {
              if (command) {
                const allowForceWithLease = pluginConfig.hooks?.git_guard?.allow_force_with_lease !== false;
                const result = checkDangerousCommand(command, allowForceWithLease);
                if (result.blocked) {
                  await cliLog("warn", formatBlockedWarning(result));
                  await showToast(result.reason || "Blocked dangerous git command", "warning", "CliKit Guard");
                  blockToolExecution(result.reason || "Dangerous git command");
                }
              }
            } catch (error) {
              if (isBlockedToolExecutionError(error)) {
                throw error;
              }
              await hookErr("git-guard", error, { tool: toolName, command });
            }
          }
        }

      // Security Check: scan for secrets before git commit
      if (pluginConfig.hooks?.security_check?.enabled !== false) {
        if (isToolNamed(toolName, "bash")) {
          const command = (toolInput.command as string | undefined) ?? (toolInput.cmd as string | undefined);
          try {
            if (command && /git\s+(commit|add)/.test(command)) {
              const secConfig = pluginConfig.hooks?.security_check;
              let shouldBlock = false;

              const [stagedFiles, stagedDiff] = await Promise.all([
                getStagedFiles(),
                getStagedDiff(),
              ]);

              for (const file of stagedFiles) {
                if (isSensitiveFile(file)) {
                  await cliLog("warn", `[CliKit:security] Sensitive file staged: ${file}`);
                  shouldBlock = true;
                }
              }

              if (stagedDiff) {
                const scanResult = scanContentForSecrets(stagedDiff);
                if (!scanResult.safe) {
                  await cliLog("warn", formatSecurityWarning(scanResult));
                  shouldBlock = true;
                }
              }

              const contentScans = await Promise.all(
                stagedFiles.map(async (file) => ({
                  file,
                  content: await getStagedFileContent(file),
                }))
              );

              for (const { file, content } of contentScans) {
                if (!content) {
                  continue;
                }
                const scanResult = scanContentForSecrets(content, file);
                if (!scanResult.safe) {
                  await cliLog("warn", formatSecurityWarning(scanResult));
                  shouldBlock = true;
                }
              }

              if (shouldBlock && secConfig?.block_commits) {
                await showToast("Blocked commit due to sensitive data", "error", "CliKit Security");
                blockToolExecution("Sensitive data detected in commit");
              } else if (shouldBlock) {
                await showToast("Potential sensitive data detected in staged changes", "warning", "CliKit Security");
              }
            }
          } catch (error) {
            if (isBlockedToolExecutionError(error)) {
              throw error;
            }
            await hookErr("security-check", error, { tool: toolName, command });
          }
        }
      }

        // Subagent Question Blocker: prevent subagents from asking questions
        if (pluginConfig.hooks?.subagent_question_blocker?.enabled !== false) {
          if (isSubagentTool(toolName)) {
            const prompt = toolInput.prompt as string | undefined;
            try {
              if (prompt && containsQuestion(prompt)) {
                await cliLog("warn", formatBlockerWarning());
                await showToast("Subagent prompt blocked: avoid direct questions", "warning", "CliKit Guard");
                blockToolExecution("Subagents should not ask questions");
              }
            } catch (error) {
              if (isBlockedToolExecutionError(error)) {
                throw error;
              }
              await hookErr("subagent-question-blocker", error, { tool: toolName });
            }
          }
        }

      },

    "tool.execute.after": async (input, output) => {
      const toolName = input.tool;
      const toolInput = getToolInput(input.args);
      let toolOutputContent: string = output.output;

      if (toolLogsEnabled) {
        await cliLog("debug", `[CliKit] Tool completed: ${toolName} -> ${output.title}`);
      }

      // Empty Message Sanitizer
      const sanitizerConfig = pluginConfig.hooks?.empty_message_sanitizer;
      if (sanitizerConfig?.enabled !== false) {
        try {
          if (isEmptyContent(toolOutputContent)) {
            const placeholder = sanitizerConfig?.placeholder || "(No output)";

            if (sanitizerConfig?.log_empty === true) {
              await cliLog("debug", `[CliKit] Empty output detected for tool: ${toolName}`);
            }

            const sanitized = sanitizeContent(toolOutputContent, placeholder);
            if (typeof sanitized === "string") {
              toolOutputContent = sanitized;
              output.output = sanitized;
            }
          }
        } catch (error) {
          await hookErr("empty-message-sanitizer", error, { tool: toolName });
        }
      }

      // Tilth Reading: enhance read output with tilth (smart outline-aware) before truncation
      if (pluginConfig.hooks?.tilth_reading?.enabled !== false) {
        try {
          const tilthConfig = pluginConfig.hooks?.tilth_reading;
          const toolInput = getToolInput(input.args);
          if (shouldAttemptTilthForTool(toolName, toolInput as Record<string, unknown>)) {
            const filePath = extractFilePath(toolInput as Record<string, unknown>);
            if (filePath) {
              const result = applyTilthReading(filePath, toolOutputContent, tilthConfig);
              if (result.usedTilth) {
                toolOutputContent = result.content;
                output.output = result.content;
              }
              if (tilthConfig?.log === true) {
                await cliLog("info", formatTilthLog(result, filePath));
              }
            }
          }
        } catch (error) {
          await hookErr("tilth-reading", error, { tool: toolName });
        }
      }

      // Truncator: trim large outputs
      if (pluginConfig.hooks?.truncator?.enabled !== false) {
        try {
          if (shouldTruncate(toolOutputContent, pluginConfig.hooks?.truncator)) {
            const result = truncateOutput(toolOutputContent, pluginConfig.hooks?.truncator);
            if (result.truncated) {
              toolOutputContent = result.content;
              output.output = result.content;
              if (pluginConfig.hooks?.truncator?.log === true) {
                await cliLog("info", formatTruncationLog(result));
              }
            }
          }
        } catch (error) {
          await hookErr("truncator", error, { tool: toolName });
        }
      }

    },

    // --- Beads as Source of Truth: inject issue snapshot into agent system prompt ---
    "experimental.chat.system.transform": async (_input, output) => {
      const beadsConfig = pluginConfig.hooks?.beads_context;
      const workflowCapsule = getWorkflowSystemCapsule();
      if (workflowCapsule) {
        output.system.push(workflowCapsule);
      }

      if (beadsConfig?.enabled === false) {
        return;
      }

      try {
        const snapshot = getBeadsSnapshot(ctx.directory, beadsConfig);
        if (snapshot) {
          output.system.push(snapshot);

          if (beadsConfig?.log === true || debugLogsEnabled) {
            await cliLog("info", "[CliKit:beads-context] Injected Beads snapshot into system prompt");
          }
        }
      } catch (error) {
        await hookErr("beads-context", error, { phase: "system.transform" });
      }
    },

    // --- Beads as Source of Truth: persist task state across compaction ---
    "experimental.session.compacting": async (_input, output) => {
      const beadsConfig = pluginConfig.hooks?.beads_context;
      const workflowCapsule = getWorkflowSystemCapsule();
      if (workflowCapsule) {
        output.context.push(workflowCapsule);
      }

      if (beadsConfig?.enabled === false) {
        return;
      }

      try {
        const compactionContext = getBeadsCompactionContext(ctx.directory, beadsConfig);
        if (compactionContext) {
          output.context.push(compactionContext);

          if (beadsConfig?.log === true || debugLogsEnabled) {
            await cliLog("info", "[CliKit:beads-context] Injected Beads state into compaction context");
          }
        }
      } catch (error) {
        await hookErr("beads-context", error, { phase: "session.compacting" });
      }
    },
  };
};

export default CliKitPlugin;
