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
export interface CliKitConfig {
    disabled_agents?: string[];
    disabled_commands?: string[];
    agents?: Record<string, AgentOverride>;
    commands?: Record<string, Partial<CommandConfig>>;
    lsp?: Record<string, LspServerConfig>;
    hooks?: HooksConfig;
}
declare function getUserConfigDir(): string;
export declare function loadCliKitConfig(projectDirectory: unknown): CliKitConfig;
export declare function filterAgents(agents: Record<string, AgentConfig>, config: CliKitConfig | undefined | null): Record<string, AgentConfig>;
export declare function filterCommands(commands: Record<string, CommandConfig>, config: CliKitConfig | undefined | null): Record<string, CommandConfig>;
export { getUserConfigDir };
//# sourceMappingURL=config.d.ts.map