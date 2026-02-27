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

// Todo Enforcer
export {
  checkTodoCompletion,
  formatIncompleteWarning,
  type TodoItem,
  type TodoCheckResult,
} from "./todo-enforcer";

// Empty Message Sanitizer
export {
  isEmptyContent,
  sanitizeContent,
} from "./empty-message-sanitizer";

// Git Guard
export {
  checkDangerousCommand,
  formatBlockedWarning,
  type GitGuardResult,
} from "./git-guard";

// Security Check
export {
  scanContentForSecrets,
  isSensitiveFile,
  formatSecurityWarning,
  type SecurityFinding,
  type SecurityCheckResult,
} from "./security-check";

// Subagent Question Blocker
export {
  containsQuestion,
  isSubagentTool,
  formatBlockerWarning,
} from "./subagent-question-blocker";

// Truncator
export {
  shouldTruncate,
  truncateOutput,
  formatTruncationLog,
  type TruncatorConfig,
  type TruncateResult,
} from "./truncator";

// Swarm Enforcer
export {
  isFileInScope,
  checkEditPermission,
  extractFileFromToolInput,
  formatEnforcementWarning,
  type SwarmEnforcerConfig,
  type TaskScope,
  type EnforcementResult,
} from "./swarm-enforcer";

// Memory Digest
export {
  generateMemoryDigest,
  formatDigestLog,
  type MemoryDigestConfig,
} from "./memory-digest";

// Todo -> Beads Sync
export {
  syncTodosToBeads,
  formatTodoBeadsSyncLog,
  type OpenCodeTodo,
  type TodoBeadsSyncConfig,
  type TodoBeadsSyncResult,
} from "./todo-beads-sync";
