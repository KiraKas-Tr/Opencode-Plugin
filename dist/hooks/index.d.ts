/**
 * CliKit Hooks
 *
 * Runtime hooks for enhanced plugin behavior:
 * - Todo Continuation Enforcer — ensures all todos are completed
 * - Empty Message Sanitizer — prevents empty tool outputs
 * - Git Guard — blocks dangerous git commands
 * - Security Check — scans for secrets before commits
 * - Subagent Question Blocker — prevents subagents from asking questions
 * - Truncator — dynamic output truncation
 * - Swarm Enforcer — enforces task isolation in multi-agent swarms
 * - Memory Digest — generates _digest.md from SQLite observations for agent access
 */
export { checkTodoCompletion, formatIncompleteWarning, type TodoItem, type TodoCheckResult, } from "./todo-enforcer";
export { isEmptyContent, sanitizeContent, } from "./empty-message-sanitizer";
export { checkDangerousCommand, formatBlockedWarning, type GitGuardResult, } from "./git-guard";
export { scanContentForSecrets, isSensitiveFile, formatSecurityWarning, type SecurityFinding, type SecurityCheckResult, } from "./security-check";
export { containsQuestion, isSubagentTool, formatBlockerWarning, } from "./subagent-question-blocker";
export { shouldTruncate, truncateOutput, formatTruncationLog, type TruncatorConfig, type TruncateResult, } from "./truncator";
export { isFileInScope, checkEditPermission, extractFileFromToolInput, formatEnforcementWarning, type SwarmEnforcerConfig, type TaskScope, type EnforcementResult, } from "./swarm-enforcer";
export { generateMemoryDigest, formatDigestLog, type MemoryDigestConfig, } from "./memory-digest";
export { syncTodosToBeads, formatTodoBeadsSyncLog, type OpenCodeTodo, type TodoBeadsSyncConfig, type TodoBeadsSyncResult, } from "./todo-beads-sync";
export { isBlockedToolExecutionError, formatHookErrorLog, logHookError, } from "./error-logger";
//# sourceMappingURL=index.d.ts.map