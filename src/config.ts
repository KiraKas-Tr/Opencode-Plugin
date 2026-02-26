import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { AgentConfig, CommandConfig } from "./types";

export interface AgentOverride {
  model?: string;
  temperature?: number;
  mode?: "subagent" | "primary" | "all";
  disabled?: boolean;
  tools?: Record<string, boolean>;
  permission?: AgentConfig["permission"];
}

export interface LspServerConfig {
  command: string[];
  extensions?: string[];
  priority?: number;
  disabled?: boolean;
  env?: Record<string, string>;
  initialization?: Record<string, unknown>;
}

export interface TodoEnforcerHookConfig {
  enabled?: boolean;
  warn_on_incomplete?: boolean;
}

export interface EmptyMessageSanitizerHookConfig {
  enabled?: boolean;
  log_empty?: boolean;
  placeholder?: string;
}

export interface GitGuardHookConfig {
  enabled?: boolean;
  allow_force_with_lease?: boolean;
}

export interface SecurityCheckHookConfig {
  enabled?: boolean;
  block_commits?: boolean;
}

export interface SubagentQuestionBlockerHookConfig {
  enabled?: boolean;
}

export interface CommentCheckerHookConfig {
  enabled?: boolean;
  threshold?: number;
}

export interface EnvContextHookConfig {
  enabled?: boolean;
  include_git?: boolean;
  include_package?: boolean;
  include_structure?: boolean;
  max_depth?: number;
}

export interface AutoFormatHookConfig {
  enabled?: boolean;
  formatter?: string;
  extensions?: string[];
  log?: boolean;
}

export interface TypeCheckGateHookConfig {
  enabled?: boolean;
  tsconfig?: string;
  log?: boolean;
  block_on_error?: boolean;
}

export interface SessionNotificationHookConfig {
  enabled?: boolean;
  on_idle?: boolean;
  on_error?: boolean;
  title_prefix?: string;
}

export interface TruncatorHookConfig {
  enabled?: boolean;
  max_output_chars?: number;
  max_output_lines?: number;
  preserve_head_lines?: number;
  preserve_tail_lines?: number;
  log?: boolean;
}

export interface CompactionHookConfig {
  enabled?: boolean;
  include_beads_state?: boolean;
  include_memory_refs?: boolean;
  include_todo_state?: boolean;
  max_state_chars?: number;
}

export interface SwarmEnforcerHookConfig {
  enabled?: boolean;
  strict_file_locking?: boolean;
  block_unreserved_edits?: boolean;
  log?: boolean;
}

export interface RitualEnforcerHookConfig {
  enabled?: boolean;
  enforceOrder?: boolean;
  log?: boolean;
}

export interface MemoryDigestHookConfig {
  enabled?: boolean;
  max_per_type?: number;
  include_types?: string[];
  log?: boolean;
}

export interface TodoBeadsSyncHookConfig {
  enabled?: boolean;
  close_missing?: boolean;
  log?: boolean;
}

export interface HooksConfig {
  session_logging?: boolean;
  tool_logging?: boolean;
  todo_enforcer?: TodoEnforcerHookConfig;
  empty_message_sanitizer?: EmptyMessageSanitizerHookConfig;
  git_guard?: GitGuardHookConfig;
  security_check?: SecurityCheckHookConfig;
  subagent_question_blocker?: SubagentQuestionBlockerHookConfig;
  comment_checker?: CommentCheckerHookConfig;
  env_context?: EnvContextHookConfig;
  auto_format?: AutoFormatHookConfig;
  typecheck_gate?: TypeCheckGateHookConfig;
  session_notification?: SessionNotificationHookConfig;
  truncator?: TruncatorHookConfig;
  compaction?: CompactionHookConfig;
  swarm_enforcer?: SwarmEnforcerHookConfig;
  ritual_enforcer?: RitualEnforcerHookConfig;
  memory_digest?: MemoryDigestHookConfig;
  todo_beads_sync?: TodoBeadsSyncHookConfig;
}

export interface CliKitConfig {
  disabled_agents?: string[];
  disabled_commands?: string[];
  agents?: Record<string, AgentOverride>;
  commands?: Record<string, Partial<CommandConfig>>;
  lsp?: Record<string, LspServerConfig>;
  hooks?: HooksConfig;
}

const DEFAULT_CONFIG: CliKitConfig = {
  disabled_agents: [],
  disabled_commands: [],
  agents: {},
  commands: {},
  lsp: {},
  hooks: {
    session_logging: false,
    tool_logging: false,
    todo_enforcer: {
      enabled: true,
      warn_on_incomplete: true,
    },
    empty_message_sanitizer: {
      enabled: true,
      log_empty: true,
      placeholder: "(No output)",
    },
    git_guard: {
      enabled: true,
      allow_force_with_lease: true,
    },
    security_check: {
      enabled: true,
      block_commits: false,
    },
    subagent_question_blocker: {
      enabled: true,
    },
    comment_checker: {
      enabled: true,
      threshold: 0.3,
    },
    env_context: {
      enabled: true,
      include_git: true,
      include_package: true,
      include_structure: true,
      max_depth: 2,
    },
    auto_format: {
      enabled: false,
      log: true,
    },
    typecheck_gate: {
      enabled: false,
      log: true,
      block_on_error: false,
    },
    session_notification: {
      enabled: false,
      on_idle: true,
      on_error: true,
      title_prefix: "OpenCode",
    },
    truncator: {
      enabled: true,
      max_output_chars: 30000,
      max_output_lines: 500,
      preserve_head_lines: 50,
      preserve_tail_lines: 50,
      log: true,
    },
    compaction: {
      enabled: true,
      include_beads_state: true,
      include_memory_refs: true,
      include_todo_state: true,
      max_state_chars: 5000,
    },
    swarm_enforcer: {
      enabled: true,
      strict_file_locking: true,
      block_unreserved_edits: false,
      log: true,
    },
    ritual_enforcer: {
      enabled: true,
      enforceOrder: true,
      log: true,
    },
    memory_digest: {
      enabled: true,
      max_per_type: 10,
      include_types: ["decision", "learning", "blocker", "progress", "handoff"],
      log: true,
    },
    todo_beads_sync: {
      enabled: true,
      close_missing: true,
      log: true,
    },
  },
};

function getUserConfigDir(): string {
  if (process.platform === "win32") {
    return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  }
  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
}

function loadJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`[CliKit] Failed to load config from ${filePath}:`, error);
    return null;
  }
}

function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result = { ...base } as T;

  for (const key of Object.keys(override) as Array<keyof T>) {
    const overrideValue = override[key];
    const baseValue = base[key];

    if (
      overrideValue !== undefined &&
      typeof overrideValue === "object" &&
      overrideValue !== null &&
      !Array.isArray(overrideValue) &&
      typeof baseValue === "object" &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as object,
        overrideValue as object
      ) as T[keyof T];
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue as T[keyof T];
    }
  }

  return result;
}

export function loadCliKitConfig(projectDirectory: unknown): CliKitConfig {
  const safeDir = typeof projectDirectory === "string" && projectDirectory 
    ? projectDirectory 
    : process.cwd();
    
  // Config file locations (priority order, later overrides earlier):
  // 1. User global: ~/.config/opencode/clikit.config.json
  // 2. Project: <project>/.opencode/clikit.config.json

  const userConfigPath = path.join(
    getUserConfigDir(),
    "opencode",
    "clikit.config.json"
  );

  const projectConfigPath = path.join(
    safeDir,
    ".opencode",
    "clikit.config.json"
  );

  // Start with defaults
  let config: CliKitConfig = { ...DEFAULT_CONFIG };

  // Load and merge user config
  const userConfig = loadJsonFile<CliKitConfig>(userConfigPath);
  if (userConfig) {
    config = deepMerge(config, userConfig);
    console.log(`[CliKit] Loaded user config from ${userConfigPath}`);
  }

  // Load and merge project config
  const projectConfig = loadJsonFile<CliKitConfig>(projectConfigPath);
  if (projectConfig) {
    config = deepMerge(config, projectConfig);
    console.log(`[CliKit] Loaded project config from ${projectConfigPath}`);
  }

  return config;
}

export function filterAgents(
  agents: Record<string, AgentConfig>,
  config: CliKitConfig | undefined | null
): Record<string, AgentConfig> {
  if (!config) {
    return agents;
  }
  const disabledSet = new Set(config.disabled_agents || []);
  const filtered: Record<string, AgentConfig> = {};

  for (const [name, agent] of Object.entries(agents)) {
    // Skip if explicitly disabled
    if (disabledSet.has(name)) {
      continue;
    }

    // Check if disabled via agents override
    const override = config.agents?.[name];
    if (override?.disabled) {
      continue;
    }

    // Apply overrides if any
    if (override) {
      filtered[name] = deepMerge(agent, override as Partial<AgentConfig>);
    } else {
      filtered[name] = agent;
    }
  }

  return filtered;
}

export function filterCommands(
  commands: Record<string, CommandConfig>,
  config: CliKitConfig | undefined | null
): Record<string, CommandConfig> {
  if (!config) {
    return commands;
  }
  const disabledSet = new Set(config.disabled_commands || []);
  const filtered: Record<string, CommandConfig> = {};

  for (const [name, command] of Object.entries(commands)) {
    if (disabledSet.has(name)) {
      continue;
    }

    // Apply overrides if any
    const override = config.commands?.[name];
    if (override) {
      filtered[name] = deepMerge(command, override);
    } else {
      filtered[name] = command;
    }
  }

  return filtered;
}

export { getUserConfigDir };
