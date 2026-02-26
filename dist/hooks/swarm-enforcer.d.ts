/**
 * Swarm Enforcer Hook
 *
 * Enforces task isolation for worker agents in multi-agent swarms.
 * Prevents agents from editing files outside their assigned scope,
 * ensures claimed tasks are completed, and blocks cross-task interference.
 * Runs on tool.execute.before for edit/write/bash tools.
 */
export interface SwarmEnforcerConfig {
    enabled?: boolean;
    strict_file_locking?: boolean;
    block_unreserved_edits?: boolean;
    log?: boolean;
}
export interface TaskScope {
    taskId: string;
    agentId: string;
    reservedFiles: string[];
    allowedPatterns?: string[];
}
export interface EnforcementResult {
    allowed: boolean;
    file?: string;
    reason?: string;
    suggestion?: string;
}
export declare function isFileInScope(filePath: unknown, scope: TaskScope): boolean;
export declare function checkEditPermission(filePath: unknown, scope: TaskScope | undefined, config?: SwarmEnforcerConfig): EnforcementResult;
export declare function extractFileFromToolInput(toolName: unknown, input: Record<string, unknown>): string | undefined;
export declare function formatEnforcementWarning(result: EnforcementResult): string;
//# sourceMappingURL=swarm-enforcer.d.ts.map