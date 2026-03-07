import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
import { getBuiltinAgents } from "./agents";
import { getBuiltinCommands } from "./commands";
import { getBuiltinSkills, resolveSkillsDir } from "./skills";
import {
  loadCliKitConfig,
  filterAgents,
  filterCommands,
  filterSkills,
  deepMerge,
  type LspServerConfig,
} from "./config";
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
  // Swarm Enforcer
  checkEditPermission,
  extractFileFromToolInput,
  formatEnforcementWarning,
  // Memory Digest
  generateMemoryDigest,
  formatDigestLog,
  // Todo -> Beads Sync
  syncTodosToBeads,
  formatTodoBeadsSyncLog,
  // Beads Context
  getBeadsSnapshot,
  getBeadsCompactionContext,
  isBlockedToolExecutionError,
  formatHookErrorLog,
  writeErrorLog,
  writeBufferedErrorLog,
  drainInitErrors,
  type OpenCodeTodo,
} from "./hooks";
import { cassMemoryContext, cassMemoryReflect } from "./tools/cass-memory";
import { swarm } from "./tools/swarm";
import { quickResearch } from "./tools/quick-research";
import { contextSummary } from "./tools/context-summary";
import { beadsMemorySync } from "./tools/beads-memory-sync";

const CliKitPlugin: Plugin = async (ctx) => {
  const todosBySession = new Map<string, OpenCodeTodo[]>();

  const defaultMcpEntries = {
    "beads-village": {
      type: "local",
      command: ["npx", "-y", "beads-village"],
      enabled: true,
    },
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

  const filteredAgents = filterAgents(builtinAgents, pluginConfig);
  const filteredCommands = filterCommands(builtinCommands, pluginConfig);
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
      // swarm — multi-agent task planning and coordination
      swarm: tool({
        description: "Plan, monitor, delegate, and abort tasks in a multi-agent swarm. Use operation=plan to decompose work into parallel tasks, operation=monitor to check progress, operation=delegate to assign a task to an agent role, operation=abort to cancel a task.",
        args: {
          operation: tool.schema.enum(["plan", "monitor", "delegate", "abort"]).describe("The swarm operation to perform"),
          tasks: tool.schema.array(tool.schema.object({
            id: tool.schema.string(),
            title: tool.schema.string(),
            description: tool.schema.string(),
            dependencies: tool.schema.array(tool.schema.string()).optional(),
            agentRole: tool.schema.enum(["fe", "be", "mobile", "devops", "qa"]).optional(),
            files: tool.schema.array(tool.schema.string()).optional(),
            status: tool.schema.enum(["pending", "in_progress", "completed", "failed", "blocked"]),
          })).optional().describe("Tasks for operation=plan"),
          parallelism: tool.schema.number().optional().describe("Max parallel tasks (default 3)"),
          taskId: tool.schema.string().optional().describe("Task ID for operation=monitor|delegate|abort"),
          agentRole: tool.schema.enum(["fe", "be", "mobile", "devops", "qa"]).optional().describe("Role to delegate to for operation=delegate"),
          reason: tool.schema.string().optional().describe("Abort reason for operation=abort"),
        },
        async execute(args) {
          const result = swarm(args);
          return JSON.stringify(result, null, 2);
        },
      }),

      // quick_research — search memory + hints for context7/github
      quick_research: tool({
        description: "Search local memory observations and get hints for context7 and GitHub code search. Use this before starting research to check what's already known.",
        args: {
          query: tool.schema.string().describe("Search query"),
          sources: tool.schema.array(tool.schema.enum(["memory", "context7", "github"])).optional().describe("Sources to search (default: all)"),
          language: tool.schema.string().optional().describe("Language filter for GitHub search"),
          limit: tool.schema.number().optional().describe("Max memory results (default 5)"),
        },
        async execute(args) {
          const result = quickResearch(args);
          return JSON.stringify(result, null, 2);
        },
      }),

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

      // beads_memory_sync — sync between Beads tasks and memory observations
      beads_memory_sync: tool({
        description: "Sync between Beads task database and memory observations. Use sync_to_memory to import completed tasks as progress observations, sync_from_memory to link observations back to tasks, link to associate an observation with a task, or status to check sync state.",
        args: {
          operation: tool.schema.enum(["sync_to_memory", "sync_from_memory", "link", "status"]).describe("Sync operation to perform"),
          beadId: tool.schema.string().optional().describe("Bead/task ID for operation=link"),
          observationId: tool.schema.number().optional().describe("Observation ID for operation=link"),
        },
        async execute(args) {
          const result = beadsMemorySync(args);
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

    event: async (input) => {
      const { event } = input;
      const props = event.properties as Record<string, unknown> | undefined;

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
            if (pluginConfig.hooks?.todo_beads_sync?.enabled !== false) {
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
                await cliLog("warn", formatIncompleteWarning(result, sessionID));
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
        }
      }
    },

    "tool.execute.before": async (input, output) => {
      const toolName = input.tool;
      const beforeOutput = output as unknown as { args?: unknown };
      const beforeInput = input as unknown as { args?: unknown };
      const toolInput = getToolInput(beforeOutput.args ?? beforeInput.args);

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

      // Swarm Enforcer: block edits outside task scope
      if (pluginConfig.hooks?.swarm_enforcer?.enabled !== false) {
        const editTools = ["edit", "write", "bash"];
        if (editTools.some((name) => isToolNamed(toolName, name))) {
          const targetFile = extractFileFromToolInput(toolName, toolInput);
          try {
            if (targetFile) {
              const taskScope = (toolInput.taskScope as
                | { taskId: string; agentId: string; reservedFiles: string[]; allowedPatterns?: string[] }
                | undefined)
                || ((input as Record<string, unknown>).__taskScope as
                  | { taskId: string; agentId: string; reservedFiles: string[]; allowedPatterns?: string[] }
                  | undefined);
              const enforcement = checkEditPermission(targetFile, taskScope, pluginConfig.hooks?.swarm_enforcer);
              if (!enforcement.allowed) {
                await cliLog("warn", formatEnforcementWarning(enforcement));
                if (pluginConfig.hooks?.swarm_enforcer?.block_unreserved_edits) {
                  await showToast(enforcement.reason || "Edit blocked outside task scope", "warning", "CliKit Swarm");
                  blockToolExecution(enforcement.reason || "Edit outside reserved task scope");
                }
              } else if (pluginConfig.hooks?.swarm_enforcer?.log === true) {
                await cliLog("debug", `[CliKit:swarm-enforcer] Allowed edit: ${targetFile}`);
              }
            }
          } catch (error) {
            if (isBlockedToolExecutionError(error)) {
              throw error;
            }
            await hookErr("swarm-enforcer", error, { tool: toolName, targetFile });
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

    // --- Enable Exa websearch built-in tool ---
    "shell.env": async (_input, output) => {
      output.env["OPENCODE_ENABLE_EXA"] = "1";
    },
  };
};

export default CliKitPlugin;
