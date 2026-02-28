import type { Plugin } from "@opencode-ai/plugin";
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
  isBlockedToolExecutionError,
  logHookError,
  type OpenCodeTodo,
} from "./hooks";
import { cassMemoryContext, cassMemoryReflect } from "./tools/cass-memory";

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

  async function showToast(message: string, variant: "info" | "success" | "warning" | "error", title = "CliKit"): Promise<void> {
    try {
      await ctx.client.tui.showToast({
        body: {
          title,
          message,
          variant,
          duration: 3500,
        },
      });
    } catch {
      // Toasts are best-effort; never break hook flow.
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
    console.log("[CliKit] Plugin initializing...");
    console.log("[CliKit] Context:", JSON.stringify({ directory: ctx?.directory, hasClient: !!ctx?.client }));
    console.log(
      `[CliKit] Loaded ${Object.keys(filteredAgents).length}/${Object.keys(builtinAgents).length} agents`
    );
    console.log(
      `[CliKit] Loaded ${Object.keys(filteredCommands).length}/${Object.keys(builtinCommands).length} commands`
    );
    console.log(
      `[CliKit] Loaded ${Object.keys(filteredSkills).length}/${Object.keys(builtinSkills).length} skills`
    );

    if (pluginConfig.disabled_agents?.length) {
      console.log(`[CliKit] Disabled agents: ${pluginConfig.disabled_agents.join(", ")}`);
    }
    if (pluginConfig.disabled_commands?.length) {
      console.log(`[CliKit] Disabled commands: ${pluginConfig.disabled_commands.join(", ")}`);
    }
  }

  return {
    config: async (config) => {
      config.agent = {
        ...filteredAgents,
        ...config.agent,
      };

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
            console.log(`[CliKit] Injected ${Object.keys(enabledLsp).length} LSP server(s)`);
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

        if (debugLogsEnabled) {
          console.log(`[CliKit] Session created: ${info?.id || "unknown"}`);
        }

        // Memory Digest: generate _digest.md from SQLite observations
        if (pluginConfig.hooks?.memory_digest?.enabled !== false) {
          try {
            const digestResult = generateMemoryDigest(ctx.directory, pluginConfig.hooks?.memory_digest);
            lastDigestTime = Date.now();
            if (pluginConfig.hooks?.memory_digest?.log !== false) {
              console.log(formatDigestLog(digestResult));
            }
          } catch (error) {
            logHookError("memory-digest", error, { event: event.type, phase: "session.created" });
          }
        }

        // Cass Memory (embedded): pre-task context snapshot on session start
        const cassHookConfig = pluginConfig.hooks?.cass_memory;
        if (cassHookConfig?.enabled !== false && cassHookConfig?.context_on_session_created !== false) {
          try {
            const sessionTitle = info?.title?.trim() || "session-start";
            const cassResult = cassMemoryContext({
              task: sessionTitle,
              limit: cassHookConfig?.context_limit,
            });
            if (cassHookConfig?.log === true || debugLogsEnabled) {
              const bulletCount = cassResult.data?.relevantBullets?.length ?? 0;
              console.log(`[CliKit:cass-memory] Context loaded for session start (${bulletCount} bullets)`);
              if (bulletCount > 0) {
                const topBullets = (cassResult.data?.relevantBullets || [])
                  .slice(0, 3)
                  .map((bullet, index) => `${index + 1}. ${toSingleLinePreview(bullet.narrative)}`);
                console.log(`[CliKit:cass-memory] Top bullets: ${topBullets.join(" | ")}`);
                if (cassHookConfig?.log === true) {
                  await showToast(topBullets.join(" • "), "info", "Cass Memory");
                }
              }
            }
          } catch (error) {
            logHookError("cass-memory", error, { event: event.type, phase: "session.created" });
          }
        }

      }

      // --- Session Error ---
      if (event.type === "session.error") {
        const error = props?.error;

        if (debugLogsEnabled) {
          console.error(`[CliKit] Session error:`, error);
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
                  console.log(formatTodoBeadsSyncLog(result));
                }
              } catch (error) {
                logHookError("todo-beads-sync", error, { event: event.type, sessionID });
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
          console.log(`[CliKit] Session idle: ${sessionID || "unknown"}`);
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
                console.warn(formatIncompleteWarning(result, sessionID));
              }
            }
          } catch (error) {
            logHookError("todo-enforcer", error, { event: event.type, sessionID });
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
            logHookError("memory-digest", error, { event: event.type, phase: "session.idle" });
          }
        }

        // Cass Memory (embedded): reflect on idle (throttled)
        const cassHookConfig = pluginConfig.hooks?.cass_memory;
        if (cassHookConfig?.enabled !== false && cassHookConfig?.reflect_on_session_idle !== false) {
          try {
            const now = Date.now();
            if (now - lastCassReflectTime >= CASS_REFLECT_THROTTLE_MS) {
              cassMemoryReflect({
                days: cassHookConfig?.reflect_days,
              });
              lastCassReflectTime = now;
              if (cassHookConfig?.log === true || debugLogsEnabled) {
                console.log("[CliKit:cass-memory] Reflection completed on session idle");
              }
            }
          } catch (error) {
            logHookError("cass-memory", error, { event: event.type, phase: "session.idle" });
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
        console.log(`[CliKit] Tool executing: ${toolName}`);
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
                console.warn(formatBlockedWarning(result));
                await showToast(result.reason || "Blocked dangerous git command", "warning", "CliKit Guard");
                blockToolExecution(result.reason || "Dangerous git command");
              }
            }
          } catch (error) {
            if (isBlockedToolExecutionError(error)) {
              throw error;
            }
            logHookError("git-guard", error, { tool: toolName, command });
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
                  console.warn(`[CliKit:security] Sensitive file staged: ${file}`);
                  shouldBlock = true;
                }
              }

              if (stagedDiff) {
                const scanResult = scanContentForSecrets(stagedDiff);
                if (!scanResult.safe) {
                  console.warn(formatSecurityWarning(scanResult));
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
                  console.warn(formatSecurityWarning(scanResult));
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
            logHookError("security-check", error, { tool: toolName, command });
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
                console.warn(formatEnforcementWarning(enforcement));
                if (pluginConfig.hooks?.swarm_enforcer?.block_unreserved_edits) {
                  await showToast(enforcement.reason || "Edit blocked outside task scope", "warning", "CliKit Swarm");
                  blockToolExecution(enforcement.reason || "Edit outside reserved task scope");
                }
              } else if (pluginConfig.hooks?.swarm_enforcer?.log === true) {
                console.log(`[CliKit:swarm-enforcer] Allowed edit: ${targetFile}`);
              }
            }
          } catch (error) {
            if (isBlockedToolExecutionError(error)) {
              throw error;
            }
            logHookError("swarm-enforcer", error, { tool: toolName, targetFile });
          }
        }
      }

      // Subagent Question Blocker: prevent subagents from asking questions
      if (pluginConfig.hooks?.subagent_question_blocker?.enabled !== false) {
        if (isSubagentTool(toolName)) {
          const prompt = toolInput.prompt as string | undefined;
          try {
            if (prompt && containsQuestion(prompt)) {
              console.warn(formatBlockerWarning());
              await showToast("Subagent prompt blocked: avoid direct questions", "warning", "CliKit Guard");
              blockToolExecution("Subagents should not ask questions");
            }
          } catch (error) {
            if (isBlockedToolExecutionError(error)) {
              throw error;
            }
            logHookError("subagent-question-blocker", error, { tool: toolName });
          }
        }
      }
    },

    "tool.execute.after": async (input, output) => {
      const toolName = input.tool;
      const toolInput = getToolInput(input.args);
      let toolOutputContent: string = output.output;

      if (toolLogsEnabled) {
        console.log(`[CliKit] Tool completed: ${toolName} -> ${output.title}`);
      }

      // Empty Message Sanitizer
      const sanitizerConfig = pluginConfig.hooks?.empty_message_sanitizer;
      if (sanitizerConfig?.enabled !== false) {
        try {
          if (isEmptyContent(toolOutputContent)) {
            const placeholder = sanitizerConfig?.placeholder || "(No output)";

            if (sanitizerConfig?.log_empty === true) {
              console.log(`[CliKit] Empty output detected for tool: ${toolName}`);
            }

            const sanitized = sanitizeContent(toolOutputContent, placeholder);
            if (typeof sanitized === "string") {
              toolOutputContent = sanitized;
              output.output = sanitized;
            }
          }
        } catch (error) {
          logHookError("empty-message-sanitizer", error, { tool: toolName });
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
                console.log(formatTruncationLog(result));
              }
            }
          }
        } catch (error) {
          logHookError("truncator", error, { tool: toolName });
        }
      }

    },
  };
};

export default CliKitPlugin;
