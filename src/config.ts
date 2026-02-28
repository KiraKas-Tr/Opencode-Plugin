import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { AgentConfig, CommandConfig } from "./types";
import type { SkillConfig } from "./skills";

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

export interface TruncatorHookConfig {
  enabled?: boolean;
  max_output_chars?: number;
  max_output_lines?: number;
  preserve_head_lines?: number;
  preserve_tail_lines?: number;
  log?: boolean;
}

export interface SwarmEnforcerHookConfig {
  enabled?: boolean;
  strict_file_locking?: boolean;
  block_unreserved_edits?: boolean;
  log?: boolean;
}

export interface MemoryDigestHookConfig {
  enabled?: boolean;
  max_per_type?: number;
  include_types?: string[];
  index_highlights_per_type?: number;
  write_topic_files?: boolean;
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
  truncator?: TruncatorHookConfig;
  swarm_enforcer?: SwarmEnforcerHookConfig;
  memory_digest?: MemoryDigestHookConfig;
  todo_beads_sync?: TodoBeadsSyncHookConfig;
}

export interface SkillOverride {
  disable?: boolean;
  description?: string;
  template?: string;
  from?: string;
  model?: string;
  agent?: string;
  subtask?: boolean;
  "argument-hint"?: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, unknown>;
  "allowed-tools"?: string[];
}

export interface SkillsConfigObject {
  sources?: Array<string | { path: string; recursive?: boolean; glob?: string }>;
  enable?: string[];
  disable?: string[];
  [key: string]: unknown;
}

export type SkillsConfig = string[] | SkillsConfigObject | Record<string, boolean | SkillOverride>;

export interface CliKitConfig {
  disabled_agents?: string[];
  disabled_commands?: string[];
  disabled_skills?: string[];
  agents?: Record<string, AgentOverride>;
  commands?: Record<string, Partial<CommandConfig>>;
  skills?: SkillsConfig;
  lsp?: Record<string, LspServerConfig>;
  hooks?: HooksConfig;
}

const DEFAULT_CONFIG: CliKitConfig = {
  disabled_agents: [],
  disabled_commands: [],
  disabled_skills: [],
  agents: {},
  commands: {},
  skills: {},
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
      log_empty: false,
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
    truncator: {
      enabled: true,
      max_output_chars: 30000,
      max_output_lines: 500,
      preserve_head_lines: 50,
      preserve_tail_lines: 50,
      log: false,
    },
    swarm_enforcer: {
      enabled: true,
      strict_file_locking: true,
      block_unreserved_edits: false,
      log: false,
    },
    memory_digest: {
      enabled: true,
      max_per_type: 10,
      include_types: ["decision", "learning", "blocker", "progress", "handoff"],
      index_highlights_per_type: 2,
      write_topic_files: true,
      log: false,
    },
    todo_beads_sync: {
      enabled: true,
      close_missing: true,
      log: false,
    },
  },
};

function getUserConfigDir(): string {
  if (process.platform === "win32") {
    return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  }
  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
}

function getOpenCodeConfigDir(): string {
  if (process.env.OPENCODE_CONFIG_DIR) {
    return process.env.OPENCODE_CONFIG_DIR;
  }

  return path.join(getUserConfigDir(), "opencode");
}

function stripJsonComments(content: string): string {
  let result = "";
  let inString = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let escaped = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inSingleLineComment) {
      if (char === "\n") {
        inSingleLineComment = false;
        result += char;
      }
      continue;
    }

    if (inMultiLineComment) {
      if (char === "*" && nextChar === "/") {
        inMultiLineComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      result += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      inSingleLineComment = true;
      i += 1;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      inMultiLineComment = true;
      i += 1;
      continue;
    }

    result += char;
  }

  return result;
}

function loadJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");

    try {
      return JSON.parse(content) as T;
    } catch {
      const withoutComments = stripJsonComments(content);
      const withoutTrailingCommas = withoutComments.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(withoutTrailingCommas) as T;
    }
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
    
  // Config file locations (priority order per scope):
  // - Preferred: clikit.jsonc, clikit.json
  // - Legacy fallback: clikit.config.json
  // Global config loads first, then project config overrides it.
  const userBaseDir = getOpenCodeConfigDir();
  const projectBaseDir = path.join(safeDir, ".opencode");
  const configCandidates = ["clikit.jsonc", "clikit.json", "clikit.config.json"];

  // Start with defaults
  let config: CliKitConfig = { ...DEFAULT_CONFIG };

  // Load and merge user config
  for (const candidate of configCandidates) {
    const userConfigPath = path.join(userBaseDir, candidate);
    const userConfig = loadJsonFile<CliKitConfig>(userConfigPath);
    if (userConfig) {
      config = deepMerge(config, userConfig);
      break;
    }
  }

  // Load and merge project config
  for (const candidate of configCandidates) {
    const projectConfigPath = path.join(projectBaseDir, candidate);
    const projectConfig = loadJsonFile<CliKitConfig>(projectConfigPath);
    if (projectConfig) {
      config = deepMerge(config, projectConfig);
      break;
    }
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

function isSkillsConfigObject(value: unknown): value is SkillsConfigObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function filterSkills(
  skills: Record<string, SkillConfig>,
  config: CliKitConfig | undefined | null
): Record<string, SkillConfig> {
  if (!config?.skills) {
    return skills;
  }

  const skillsConfig = config.skills;

  if (Array.isArray(skillsConfig)) {
    return Object.fromEntries(
      Object.entries(skills).filter(([name]) => skillsConfig.includes(name))
    );
  }

  let enabledSet: Set<string> | null = null;
  let disabledSet = new Set(config.disabled_skills || []);
  let overrides: Record<string, boolean | SkillOverride> = {};

  if (isSkillsConfigObject(skillsConfig)) {
    if (Array.isArray(skillsConfig.enable) && skillsConfig.enable.length > 0) {
      enabledSet = new Set(skillsConfig.enable);
    }
    if (Array.isArray(skillsConfig.disable) && skillsConfig.disable.length > 0) {
      disabledSet = new Set(skillsConfig.disable);
    }

    const { sources: _sources, enable: _enable, disable: _disable, ...rest } = skillsConfig;
    overrides = rest as Record<string, boolean | SkillOverride>;
  }

  const filtered: Record<string, SkillConfig> = {};

  for (const [name, skill] of Object.entries(skills)) {
    if (enabledSet && !enabledSet.has(name)) {
      continue;
    }
    if (disabledSet.has(name)) {
      continue;
    }

    const override = overrides[name];
    if (override === false) {
      continue;
    }

    if (override && typeof override === "object") {
      if (override.disable === true) {
        continue;
      }

      const mergedSkill: SkillConfig = {
        ...skill,
        ...(override.description ? { description: override.description } : {}),
        ...(override.template ? { content: override.template } : {}),
      };

      if (override.from !== undefined) mergedSkill.from = override.from;
      if (override.model !== undefined) mergedSkill.model = override.model;
      if (override.agent !== undefined) mergedSkill.agent = override.agent;
      if (override.subtask !== undefined) mergedSkill.subtask = override.subtask;
      if (override["argument-hint"] !== undefined) mergedSkill["argument-hint"] = override["argument-hint"];
      if (override.license !== undefined) mergedSkill.license = override.license;
      if (override.compatibility !== undefined) mergedSkill.compatibility = override.compatibility;
      if (override.metadata !== undefined) mergedSkill.metadata = override.metadata;
      if (override["allowed-tools"] !== undefined) mergedSkill["allowed-tools"] = [...override["allowed-tools"]];

      filtered[name] = mergedSkill;
      continue;
    }

    filtered[name] = skill;
  }

  return filtered;
}

export { getUserConfigDir };
