import type { Plugin } from "@opencode-ai/plugin";
import { getBuiltinAgents } from "./agents";
import { getBuiltinCommands } from "./commands";
import { getBuiltinSkills, findSkill } from "./skills";
import {
  loadCliKitConfig,
  filterAgents,
  filterCommands,
  type CliKitConfig,
  type LspServerConfig,
  type HooksConfig,
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
  // Comment Checker
  checkCommentDensity,
  hasExcessiveAIComments,
  formatCommentWarning,
  // Environment Context
  collectEnvInfo,
  buildEnvBlock,
  formatEnvSummary,
  // Auto-Format
  shouldFormat,
  runFormatter,
  formatAutoFormatLog,
  // TypeCheck Gate
  isTypeScriptFile,
  runTypeCheck,
  formatTypeCheckWarning,
  // Session Notification
  sendNotification,
  buildIdleNotification,
  buildErrorNotification,
  formatNotificationLog,
  // Truncator
  shouldTruncate,
  truncateOutput,
  formatTruncationLog,
  // Compaction
  collectCompactionPayload,
  buildCompactionBlock,
  formatCompactionLog,
  // Swarm Enforcer
  checkEditPermission,
  extractFileFromToolInput,
  formatEnforcementWarning,
  // Ritual Enforcer
  checkRitualProgress,
  formatRitualStatus,
  // Memory Digest
  generateMemoryDigest,
  formatDigestLog,
  // Todo -> Beads Sync
  syncTodosToBeads,
  formatTodoBeadsSyncLog,
  type OpenCodeTodo,
} from "./hooks";

const CliKitPlugin: Plugin = async (ctx) => {
  const envBlockBySession = new Map<string, string>();
  const compactionBlockBySession = new Map<string, string>();
  const todosBySession = new Map<string, OpenCodeTodo[]>();

  function getToolInput(args: unknown): Record<string, unknown> {
    return args && typeof args === "object" ? (args as Record<string, unknown>) : {};
  }

  function getEditTargetPath(input: Record<string, unknown>): string | undefined {
    const candidates = [input.filePath, input.file, input.path];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.length > 0) {
        return candidate;
      }
    }
    return undefined;
  }

  function blockToolExecution(reason: string): never {
    throw new Error(`[CliKit] Blocked tool execution: ${reason}`);
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

  // Debug logging
  console.log("[CliKit] Plugin initializing...");
  console.log("[CliKit] Context:", JSON.stringify({ directory: ctx?.directory, hasClient: !!ctx?.client }));
  
  const pluginConfig = loadCliKitConfig(ctx.directory) ?? {};

  const builtinAgents = getBuiltinAgents();
  const builtinCommands = getBuiltinCommands();

  const filteredAgents = filterAgents(builtinAgents, pluginConfig);
  const filteredCommands = filterCommands(builtinCommands, pluginConfig);

  console.log(
    `[CliKit] Loaded ${Object.keys(filteredAgents).length}/${Object.keys(builtinAgents).length} agents`
  );
  console.log(
    `[CliKit] Loaded ${Object.keys(filteredCommands).length}/${Object.keys(builtinCommands).length} commands`
  );

  if (pluginConfig.disabled_agents?.length) {
    console.log(`[CliKit] Disabled agents: ${pluginConfig.disabled_agents.join(", ")}`);
  }
  if (pluginConfig.disabled_commands?.length) {
    console.log(`[CliKit] Disabled commands: ${pluginConfig.disabled_commands.join(", ")}`);
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
          console.log(`[CliKit] Injected ${Object.keys(enabledLsp).length} LSP server(s)`);
        }
      }
    },

    event: async (input) => {
      const { event } = input;
      const props = event.properties as Record<string, unknown> | undefined;

      // --- Session Created ---
      if (event.type === "session.created") {
        const info = props?.info as { id?: string; title?: string } | undefined;
        const sessionID = info?.id;

        if (pluginConfig.hooks?.session_logging) {
          console.log(`[CliKit] Session created: ${info?.id || "unknown"}`);
        }

        // Environment Context: inject env info
        if (pluginConfig.hooks?.env_context?.enabled !== false) {
          const envConfig = pluginConfig.hooks?.env_context;
          const envInfo = collectEnvInfo(ctx.directory, envConfig);
          const envBlock = buildEnvBlock(envInfo);
          if (pluginConfig.hooks?.session_logging) {
            console.log(formatEnvSummary(envInfo));
          }
          if (sessionID) {
            envBlockBySession.set(sessionID, envBlock);
          }
        }

        // Memory Digest: generate _digest.md from SQLite observations
        if (pluginConfig.hooks?.memory_digest?.enabled !== false) {
          const digestResult = generateMemoryDigest(ctx.directory, pluginConfig.hooks?.memory_digest);
          if (pluginConfig.hooks?.memory_digest?.log !== false) {
            console.log(formatDigestLog(digestResult));
          }
        }

        // Ritual Enforcer: log current ritual phase on session start
        if (pluginConfig.hooks?.ritual_enforcer?.enabled !== false) {
          const ritualProgress = checkRitualProgress();
          if (pluginConfig.hooks?.ritual_enforcer?.log !== false) {
            console.log(formatRitualStatus());
          }
          if (!ritualProgress.canProceed) {
            console.warn(`[CliKit:ritual] ${ritualProgress.progress}`);
          }
        }
      }

      // --- Session Error ---
      if (event.type === "session.error") {
        const error = props?.error;

        if (pluginConfig.hooks?.session_logging) {
          console.error(`[CliKit] Session error:`, error);
        }

        // Session Notification: notify on error
        if (pluginConfig.hooks?.session_notification?.enabled === true &&
            pluginConfig.hooks?.session_notification?.on_error !== false) {
          const notifConfig = pluginConfig.hooks?.session_notification;
          const sessionId = props?.sessionID as string | undefined;
          const payload = buildErrorNotification(error, sessionId, notifConfig?.title_prefix);
          const sent = sendNotification(payload);
          console.log(formatNotificationLog(payload, sent));
        }
      }

      // --- Todo Updated ---
      if (event.type === "todo.updated") {
        const sessionID = props?.sessionID;
        if (typeof sessionID === "string") {
          const todos = normalizeTodos(props?.todos);
          todosBySession.set(sessionID, todos);

          if (pluginConfig.hooks?.todo_beads_sync?.enabled !== false) {
            const result = syncTodosToBeads(ctx.directory, sessionID, todos, pluginConfig.hooks?.todo_beads_sync);
            if (pluginConfig.hooks?.todo_beads_sync?.log !== false) {
              console.log(formatTodoBeadsSyncLog(result));
            }
          }
        }
      }

      // --- Session Idle ---
      if (event.type === "session.idle") {
        const sessionID = props?.sessionID as string | undefined;
        const sessionTodos = sessionID ? (todosBySession.get(sessionID) || []) : [];

        if (pluginConfig.hooks?.session_logging) {
          console.log(`[CliKit] Session idle: ${sessionID || "unknown"}`);
        }

        // Todo Enforcer: check on session idle
        const todoConfig = pluginConfig.hooks?.todo_enforcer;
        if (todoConfig?.enabled !== false) {
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
        }

        // Session Notification: notify on idle
        if (pluginConfig.hooks?.session_notification?.enabled === true &&
            pluginConfig.hooks?.session_notification?.on_idle !== false) {
          const notifConfig = pluginConfig.hooks?.session_notification;
          const payload = buildIdleNotification(sessionID, notifConfig?.title_prefix);
          const sent = sendNotification(payload);
          console.log(formatNotificationLog(payload, sent));
        }

        // Memory Digest: refresh on idle (keeps _digest.md current)
        if (pluginConfig.hooks?.memory_digest?.enabled !== false) {
          generateMemoryDigest(ctx.directory, pluginConfig.hooks?.memory_digest);
        }

        // Compaction: inject state when nearing compaction
        if (pluginConfig.hooks?.compaction?.enabled !== false) {
          const compConfig = pluginConfig.hooks?.compaction;
          const compPayload = collectCompactionPayload(ctx.directory, compConfig);
          const todos = normalizeTodos(props?.todos);
          const effectiveTodos = todos.length > 0 ? todos : sessionTodos;

          // Add todo state if available
          if (compConfig?.include_todo_state !== false && effectiveTodos.length > 0) {
            compPayload.todos = effectiveTodos;
          }

          const block = buildCompactionBlock(compPayload, compConfig?.max_state_chars);
          console.log(formatCompactionLog(compPayload));
          if (sessionID) {
            compactionBlockBySession.set(sessionID, block);
          }
        }
      }

      // --- Session Deleted ---
      if (event.type === "session.deleted") {
        const info = props?.info as { id?: string } | undefined;
        const sessionID = info?.id;
        if (sessionID) {
          envBlockBySession.delete(sessionID);
          compactionBlockBySession.delete(sessionID);
          todosBySession.delete(sessionID);
        }
      }
    },

    "experimental.chat.system.transform": async (input, output) => {
      if (!input.sessionID) {
        return;
      }
      const envBlock = envBlockBySession.get(input.sessionID);
      if (envBlock) {
        output.system.push(envBlock);
      }
    },

    "experimental.session.compacting": async (input, output) => {
      const block = compactionBlockBySession.get(input.sessionID);
      if (block) {
        output.context.push(block);
      }
    },

    "tool.execute.before": async (input, output) => {
      const toolName = input.tool;
      const toolInput = getToolInput(output.args);

      if (pluginConfig.hooks?.tool_logging) {
        console.log(`[CliKit] Tool executing: ${toolName}`);
      }

      // Git Guard: block dangerous git commands
      if (pluginConfig.hooks?.git_guard?.enabled !== false) {
        if (toolName === "bash" || toolName === "Bash") {
          const command = toolInput.command as string | undefined;
          if (command) {
            const allowForceWithLease = pluginConfig.hooks?.git_guard?.allow_force_with_lease !== false;
            const result = checkDangerousCommand(command, allowForceWithLease);
            if (result.blocked) {
              console.warn(formatBlockedWarning(result));
              blockToolExecution(result.reason || "Dangerous git command");
            }
          }
        }
      }

      // Security Check: scan for secrets before git commit
      if (pluginConfig.hooks?.security_check?.enabled !== false) {
        if (toolName === "bash" || toolName === "Bash") {
          const command = toolInput.command as string | undefined;
          if (command && /git\s+(commit|add)/.test(command)) {
            const secConfig = pluginConfig.hooks?.security_check;
            let shouldBlock = false;
            
            const files = toolInput.files as string[] | undefined;
            if (files) {
              for (const file of files) {
                if (isSensitiveFile(file)) {
                  console.warn(`[CliKit:security] Sensitive file staged: ${file}`);
                  shouldBlock = true;
                }
              }
            }
            
            const content = toolInput.content as string | undefined;
            if (content) {
              const scanResult = scanContentForSecrets(content);
              if (!scanResult.safe) {
                console.warn(formatSecurityWarning(scanResult));
                shouldBlock = true;
              }
            }
            
            if (shouldBlock && secConfig?.block_commits) {
              blockToolExecution("Sensitive data detected in commit");
            }
            }
          }
      }

      // Swarm Enforcer: block edits outside task scope
      if (pluginConfig.hooks?.swarm_enforcer?.enabled !== false) {
        const editTools = ["edit", "Edit", "write", "Write", "bash", "Bash"];
        if (editTools.includes(toolName)) {
          const targetFile = extractFileFromToolInput(toolName, toolInput);
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
                blockToolExecution(enforcement.reason || "Edit outside reserved task scope");
              }
            } else if (pluginConfig.hooks?.swarm_enforcer?.log) {
              console.log(`[CliKit:swarm-enforcer] Allowed edit: ${targetFile}`);
            }
          }
        }
      }

      // Ritual Enforcer: check phase before tool execution
      if (pluginConfig.hooks?.ritual_enforcer?.enabled !== false) {
        const ritualProgress = checkRitualProgress();
        if (!ritualProgress.canProceed && pluginConfig.hooks?.ritual_enforcer?.enforceOrder) {
          console.warn(`[CliKit:ritual] Phase violation: ${ritualProgress.progress}`);
        }
      }

      // Subagent Question Blocker: prevent subagents from asking questions
      if (pluginConfig.hooks?.subagent_question_blocker?.enabled !== false) {
        if (isSubagentTool(toolName)) {
          const prompt = toolInput.prompt as string | undefined;
          if (prompt && containsQuestion(prompt)) {
            console.warn(formatBlockerWarning());
            blockToolExecution("Subagents should not ask questions");
          }
        }
      }
    },

    "tool.execute.after": async (input, output) => {
      const toolName = input.tool;
      const toolInput = getToolInput(input.args);
      let toolOutputContent: string = output.output;

      if (pluginConfig.hooks?.tool_logging) {
        console.log(`[CliKit] Tool completed: ${toolName} -> ${output.title}`);
      }

      // Empty Message Sanitizer
      const sanitizerConfig = pluginConfig.hooks?.empty_message_sanitizer;
      if (sanitizerConfig?.enabled !== false) {
        if (isEmptyContent(toolOutputContent)) {
          const placeholder = sanitizerConfig?.placeholder || "(No output)";

          if (sanitizerConfig?.log_empty !== false) {
            console.log(`[CliKit] Empty output detected for tool: ${toolName}`);
          }

          const sanitized = sanitizeContent(toolOutputContent, placeholder);
          if (typeof sanitized === "string") {
            toolOutputContent = sanitized;
            output.output = sanitized;
          }
        }
      }

      // Comment Checker: detect excessive AI comments in written/edited files
      if (pluginConfig.hooks?.comment_checker?.enabled !== false) {
        if (toolName === "edit" || toolName === "Edit" || toolName === "write" || toolName === "Write") {
          const content = toolOutputContent;
          if (typeof content === "string" && content.length > 100) {
            const threshold = pluginConfig.hooks?.comment_checker?.threshold ?? 0.3;
            const densityResult = checkCommentDensity(content, threshold);
            if (densityResult.excessive) {
              console.warn(formatCommentWarning(densityResult));
            }
            if (hasExcessiveAIComments(content)) {
              console.warn("[CliKit:comment-checker] Detected AI-style boilerplate comments. Remove unnecessary comments.");
            }
          }
        }
      }

      // Truncator: trim large outputs
      if (pluginConfig.hooks?.truncator?.enabled !== false) {
        if (shouldTruncate(toolOutputContent, pluginConfig.hooks?.truncator)) {
          const result = truncateOutput(toolOutputContent, pluginConfig.hooks?.truncator);
          if (result.truncated) {
            toolOutputContent = result.content;
            output.output = result.content;
            if (pluginConfig.hooks?.truncator?.log !== false) {
              console.log(formatTruncationLog(result));
            }
          }
        }
      }

      // Auto-Format: run formatter after file edits
      if (pluginConfig.hooks?.auto_format?.enabled) {
        if (toolName === "edit" || toolName === "Edit" || toolName === "write" || toolName === "Write") {
          const filePath = getEditTargetPath(toolInput);
          if (filePath) {
            const fmtConfig = pluginConfig.hooks.auto_format;
            if (shouldFormat(filePath, fmtConfig?.extensions)) {
              const result = runFormatter(filePath, ctx.directory, fmtConfig?.formatter);
              if (fmtConfig?.log !== false) {
                console.log(formatAutoFormatLog(result));
              }
            }
          }
        }
      }

      // TypeCheck Gate: run tsc after TypeScript edits
      if (pluginConfig.hooks?.typecheck_gate?.enabled) {
        if (toolName === "edit" || toolName === "Edit" || toolName === "write" || toolName === "Write") {
          const filePath = getEditTargetPath(toolInput);
          if (filePath && isTypeScriptFile(filePath)) {
            const tcConfig = pluginConfig.hooks.typecheck_gate;
            const result = runTypeCheck(filePath, ctx.directory, tcConfig);
            if (!result.clean) {
              console.warn(formatTypeCheckWarning(result));
              if (tcConfig?.block_on_error) {
                blockToolExecution(`Type errors in ${filePath}`);
              }
            } else if (tcConfig?.log !== false) {
              console.log(formatTypeCheckWarning(result));
            }
          }
        }
      }
    },
  };
};

export default CliKitPlugin;
