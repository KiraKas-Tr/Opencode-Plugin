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
export interface CassMemoryHookConfig {
    enabled?: boolean;
    context_on_session_created?: boolean;
    reflect_on_session_idle?: boolean;
    context_limit?: number;
    reflect_days?: number;
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
    cass_memory?: CassMemoryHookConfig;
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
    sources?: Array<string | {
        path: string;
        recursive?: boolean;
        glob?: string;
    }>;
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
declare function getUserConfigDir(): string;
export declare function loadCliKitConfig(projectDirectory: unknown): CliKitConfig;
export declare function filterAgents(agents: Record<string, AgentConfig>, config: CliKitConfig | undefined | null): Record<string, AgentConfig>;
export declare function filterCommands(commands: Record<string, CommandConfig>, config: CliKitConfig | undefined | null): Record<string, CommandConfig>;
export declare function filterSkills(skills: Record<string, SkillConfig>, config: CliKitConfig | undefined | null): Record<string, SkillConfig>;
export { getUserConfigDir };
//# sourceMappingURL=config.d.ts.map