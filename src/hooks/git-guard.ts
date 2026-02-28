/**
 * Git Guard Hook
 *
 * Blocks dangerous git commands: force push, hard reset, rm -rf.
 * Runs on tool.execute.before for bash tool.
 */

const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /git\s+push\s+.*--force/, reason: "Force push can destroy remote history" },
  { pattern: /git\s+push\s+.*-f\b/, reason: "Force push can destroy remote history" },
  { pattern: /git\s+reset\s+--hard/, reason: "Hard reset discards all uncommitted changes" },
  { pattern: /git\s+clean\s+-fd/, reason: "git clean -fd permanently deletes untracked files" },
  { pattern: /rm\s+-rf\s+\//, reason: "rm -rf / is catastrophically dangerous" },
  { pattern: /rm\s+-rf\s+~/, reason: "rm -rf ~ would delete home directory" },
  { pattern: /rm\s+-rf\s+\.\s/, reason: "rm -rf . would delete current directory" },
  { pattern: /git\s+branch\s+-D/, reason: "Force-deleting branch may lose unmerged work" },
];

export interface GitGuardResult {
  blocked: boolean;
  command: string;
  reason?: string;
}

export function checkDangerousCommand(command: unknown, allowForceWithLease = true): GitGuardResult {
  if (typeof command !== "string") {
    return { blocked: false, command: "" };
  }
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      if (allowForceWithLease && /--force-with-lease/.test(command)) {
        return { blocked: false, command };
      }
      return { blocked: true, command, reason };
    }
  }
  return { blocked: false, command };
}

export function formatBlockedWarning(result: GitGuardResult): string {
  return `[CliKit:git-guard] BLOCKED: "${result.command}"\n  Reason: ${result.reason}`;
}
