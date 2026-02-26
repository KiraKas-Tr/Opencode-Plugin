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
    log?: boolean;
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
declare function getUserConfigDir(): string;
export declare function loadCliKitConfig(projectDirectory: unknown): CliKitConfig;
export declare function filterAgents(agents: Record<string, AgentConfig>, config: CliKitConfig | undefined | null): Record<string, AgentConfig>;
export declare function filterCommands(commands: Record<string, CommandConfig>, config: CliKitConfig | undefined | null): Record<string, CommandConfig>;
export { getUserConfigDir };
//# sourceMappingURL=config.d.ts.map