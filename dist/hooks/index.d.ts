/**
 * CliKit Hooks
 *
 * Runtime hooks for enhanced plugin behavior:
 * - Todo Continuation Enforcer — ensures all todos are completed
 * - Empty Message Sanitizer — prevents empty tool outputs
 * - Git Guard — blocks dangerous git commands
 * - Security Check — scans for secrets before commits
 * - Subagent Question Blocker — prevents subagents from asking questions
 * - Comment Checker — detects excessive AI-generated comments
 * - Context Injector — removed (use /resume, /start commands instead)
 * - Environment Context — injects project/env info into prompts
 * - Auto-Format — runs formatter after file edits
 * - TypeCheck Gate — runs tsc after TypeScript edits
 * - Session Notification — desktop notifications on idle/error
 * - Truncator — dynamic output truncation
 * - Compaction — preserves state during context compaction
 * - Swarm Enforcer — enforces task isolation in multi-agent swarms
 * - Ritual Enforcer — enforces DISCOVER → PLAN → IMPLEMENT → VERIFY → COMPLETE phases
 * - Memory Digest — generates _digest.md from SQLite observations for agent access
 */
export { checkTodoCompletion, formatIncompleteWarning, type TodoItem, type TodoCheckResult, } from "./todo-enforcer";
export { isEmptyContent, sanitizeContent, } from "./empty-message-sanitizer";
export { checkDangerousCommand, formatBlockedWarning, type GitGuardResult, } from "./git-guard";
export { scanContentForSecrets, isSensitiveFile, formatSecurityWarning, type SecurityFinding, type SecurityCheckResult, } from "./security-check";
export { containsQuestion, isSubagentTool, formatBlockerWarning, } from "./subagent-question-blocker";
export { checkCommentDensity, hasExcessiveAIComments, formatCommentWarning, type CommentCheckResult, } from "./comment-checker";
export { collectEnvInfo, buildEnvBlock, formatEnvSummary, getGitInfo, getPackageInfo, getTopLevelStructure, type EnvContextConfig, type EnvInfo, type GitInfo, type PackageInfo, } from "./env-context";
export { detectFormatter, shouldFormat, runFormatter, formatAutoFormatLog, type AutoFormatConfig, type FormatResult, } from "./auto-format";
export { isTypeScriptFile, findTsConfig, hasTscInstalled, runTypeCheck, formatTypeCheckWarning, type TypeCheckConfig, type TypeDiagnostic, type TypeCheckResult, } from "./typecheck-gate";
export { sendNotification, buildIdleNotification, buildErrorNotification, formatNotificationLog, type SessionNotificationConfig, type NotificationPayload, } from "./session-notification";
export { shouldTruncate, truncateOutput, formatTruncationLog, type TruncatorConfig, type TruncateResult, } from "./truncator";
export { readBeadsState, readMemoryRefs, buildCompactionBlock, collectCompactionPayload, formatCompactionLog, type CompactionConfig, type BeadsState, type MemoryRef, type CompactionPayload, } from "./compaction";
export { isFileInScope, checkEditPermission, extractFileFromToolInput, formatEnforcementWarning, type SwarmEnforcerConfig, type TaskScope, type EnforcementResult, } from "./swarm-enforcer";
export { initRitual, getCurrentPhase, advancePhase, completePhase, checkRitualProgress, formatRitualStatus, type RitualPhase, type RitualState, type RitualEnforcerConfig, } from "./ritual-enforcer";
export { generateMemoryDigest, formatDigestLog, type MemoryDigestConfig, } from "./memory-digest";
export { syncTodosToBeads, formatTodoBeadsSyncLog, type OpenCodeTodo, type TodoBeadsSyncConfig, type TodoBeadsSyncResult, } from "./todo-beads-sync";
//# sourceMappingURL=index.d.ts.map