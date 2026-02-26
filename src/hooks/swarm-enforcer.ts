/**
 * Swarm Enforcer Hook
 *
 * Enforces task isolation for worker agents in multi-agent swarms.
 * Prevents agents from editing files outside their assigned scope,
 * ensures claimed tasks are completed, and blocks cross-task interference.
 * Runs on tool.execute.before for edit/write/bash tools.
 */

import * as path from "path";

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

export function isFileInScope(
  filePath: unknown,
  scope: TaskScope
): boolean {
  if (typeof filePath !== "string") return false;
  const normalizedPath = path.resolve(filePath);

  // Check explicit reservations
  for (const reserved of scope.reservedFiles) {
    const normalizedReserved = path.resolve(reserved);
    if (normalizedPath === normalizedReserved) {
      return true;
    }
  }

  // Check allowed glob patterns (simple prefix matching)
  if (scope.allowedPatterns) {
    for (const pattern of scope.allowedPatterns) {
      if (normalizedPath.includes(pattern) || normalizedPath.startsWith(path.resolve(pattern))) {
        return true;
      }
    }
  }

  return false;
}

export function checkEditPermission(
  filePath: unknown,
  scope: TaskScope | undefined,
  config?: SwarmEnforcerConfig
): EnforcementResult {
  // If no scope is set, allow everything (non-swarm mode)
  if (!scope) {
    return { allowed: true };
  }

  // If strict file locking is disabled, allow everything
  if (config?.strict_file_locking === false) {
    return { allowed: true };
  }

  if (typeof filePath !== "string") {
    return { allowed: false, reason: "Invalid file path" };
  }

  if (isFileInScope(filePath, scope)) {
    return { allowed: true, file: filePath };
  }

  return {
    allowed: false,
    file: filePath,
    reason: `File is not in task scope for task ${scope.taskId}`,
    suggestion: `Reserve the file first using beads-village reserve, or ask the lead agent to reassign.`,
  };
}

export function extractFileFromToolInput(
  toolName: unknown,
  input: Record<string, unknown>
): string | undefined {
  if (typeof toolName !== "string") return undefined;
  switch (toolName.toLowerCase()) {
    case "edit":
    case "write":
    case "read":
      return input.filePath as string | undefined;
    case "bash": {
      // Try to extract file paths from bash commands
      const cmd = input.command as string | undefined;
      if (!cmd) return undefined;

      // Simple heuristics for common write patterns
      const writePatterns = [
        />\s*["']?([^\s"'|&;]+)/,       // redirect: > file
        /tee\s+["']?([^\s"'|&;]+)/,     // tee file
        /mv\s+\S+\s+["']?([^\s"'|&;]+)/, // mv src dst
        /cp\s+\S+\s+["']?([^\s"'|&;]+)/, // cp src dst
      ];

      for (const pattern of writePatterns) {
        const match = cmd.match(pattern);
        if (match) return match[1];
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

export function formatEnforcementWarning(result: EnforcementResult): string {
  if (result.allowed) return "";
  const lines = [`[CliKit:swarm-enforcer] BLOCKED edit to ${result.file}`];
  if (result.reason) lines.push(`  Reason: ${result.reason}`);
  if (result.suggestion) lines.push(`  Suggestion: ${result.suggestion}`);
  return lines.join("\n");
}
