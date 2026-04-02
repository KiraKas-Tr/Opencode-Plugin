/**
 * Tilth Reading Hook
 *
 * Enhances file read output using `tilth` when available.
 * Tilth provides smart outline-aware reading (full vs outline based on token threshold).
 *
 * Priority:
 *   1. tilth <path>           — direct CLI (fast path)
 *   2. npx tilth <path>       — fallback when CLI is not installed globally
 *   3. tilth <path> --section — section-targeted read
 *   Fallback → original read output (unchanged)
 *
 * Runs on tool.execute.after for the `read` tool only.
 */

export interface TilthReadingConfig {
  enabled?: boolean;
  /** Log tilth outcomes (success / fallback / unavailable). Default: false */
  log?: boolean;
  /**
   * Minimum file content length (chars) before attempting tilth.
   * Avoids tilth overhead on tiny files. Default: 1000
   */
  min_content_length?: number;
}

export interface TilthReadResult {
  /** Whether tilth was used (false = fallback to original) */
  usedTilth: boolean;
  /** Whether tilth is available for execution (direct CLI or npx fallback) */
  tilthAvailable: boolean;
  /** Final content after enhancement or fallback */
  content: string;
  /** Human-readable outcome for logging */
  outcome: "tilth_success" | "tilth_unavailable" | "tilth_error" | "skipped";
  /** Command used to invoke tilth (e.g. `tilth` or `npx tilth`) */
  commandUsed?: string;
  /** Error message when outcome === "tilth_error" */
  error?: string;
}

const DEFAULT_MIN_CONTENT_LENGTH = 1000;
const DIRECT_TILTH_PROBE_TIMEOUT_MS = 1_500;
const NPX_TILTH_PROBE_TIMEOUT_MS = 15_000;
const NEGATIVE_CACHE_TTL_MS = 30_000;

interface TilthAvailabilityCache {
  available: boolean;
  checkedAt: number;
}

// Cache negative availability briefly so a newly installed/warmed CLI can be picked up.
let tilthAvailabilityCache: TilthAvailabilityCache | null = null;
// Cache the resolved command so we keep using the fast path once found.
let tilthCmd: string[] | null = null;

function formatTilthCommand(cmd: string[] | null): string | undefined {
  return cmd ? cmd.join(" ") : undefined;
}

function resolveTilthCmd(now = Date.now()): string[] | null {
  if (tilthCmd) return tilthCmd;

  if (
    tilthAvailabilityCache?.available === false &&
    now - tilthAvailabilityCache.checkedAt < NEGATIVE_CACHE_TTL_MS
  ) {
    return null;
  }

  tilthCmd = probeTilthCmd();
  tilthAvailabilityCache = {
    available: tilthCmd !== null,
    checkedAt: now,
  };

  return tilthCmd;
}

/**
 * Probe candidates in order and return the first that exits 0.
 * Returns null if none found.
 */
function probeTilthCmd(): string[] | null {
  const candidates: Array<{ command: string[]; probe: string[]; timeout: number }> = [
    {
      command: ["tilth"],
      probe: ["tilth", "--version"],
      timeout: DIRECT_TILTH_PROBE_TIMEOUT_MS,
    },
    {
      command: ["npx", "tilth"],
      probe: ["npx", "tilth", "--version"],
      timeout: NPX_TILTH_PROBE_TIMEOUT_MS,
    },
  ];

  for (const candidate of candidates) {
    try {
      const result = Bun.spawnSync(candidate.probe, {
        stdout: "pipe",
        stderr: "pipe",
        timeout: candidate.timeout,
      });
      if (result.exitCode === 0) {
        return candidate.command;
      }
    } catch {
      // not found, try next
    }
  }
  return null;
}

/**
 * Check if `tilth` is available (direct CLI first, then `npx tilth`).
 * Positive results stay cached; negative probes expire so newly installed CLIs are picked up.
 */
export function isTilthAvailable(): boolean {
  return resolveTilthCmd() !== null;
}

/**
 * Reset availability cache (useful in tests or immediately after installing tilth).
 */
export function resetTilthAvailabilityCache(): void {
  tilthAvailabilityCache = null;
  tilthCmd = null;
}

/**
 * Returns true when the tool and its input suggest a plain file read.
 * Tool name matching is lenient to handle variations in OpenCode tool naming.
 */
export function shouldAttemptTilthForTool(
  toolName: string,
  toolInput: Record<string, unknown>
): boolean {
  const normalized = toolName.toLowerCase();
  // Match "read", "Read", "read_file", "readFile" etc.
  if (!normalized.includes("read")) return false;
  // We need a concrete file path in the input.
  const path = extractFilePath(toolInput);
  return typeof path === "string" && path.length > 0;
}

/**
 * Extract file path from tool input — handles multiple field names used
 * by different OpenCode tool versions.
 */
export function extractFilePath(toolInput: Record<string, unknown>): string | null {
  for (const key of ["filePath", "file_path", "path", "file"]) {
    const v = toolInput[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

/**
 * Run tilth on a file path and return its stdout, or throw on error.
 * Uses the resolved command (direct CLI preferred, `npx tilth` fallback).
 */
function runTilth(filePath: string, cmd: string[]): string {
  const result = Bun.spawnSync([...cmd, filePath], {
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    const stderr = result.stderr ? new TextDecoder().decode(result.stderr).trim() : "";
    throw new Error(`tilth exited ${result.exitCode}: ${stderr}`);
  }

  return new TextDecoder().decode(result.stdout);
}

/**
 * Attempt to enhance read output with tilth.
 * Always safe to call — on any error, returns the original content unchanged.
 *
 * @param filePath   Path of the file that was read
 * @param original   Raw output from the `read` tool
 * @param config     Hook configuration
 */
export function applyTilthReading(
  filePath: string,
  original: string,
  config?: TilthReadingConfig
): TilthReadResult {
  const minLen = config?.min_content_length ?? DEFAULT_MIN_CONTENT_LENGTH;

  // Skip trivially small content — not worth spawning a process.
  if (original.length < minLen) {
    return {
      usedTilth: false,
      tilthAvailable: false,
      content: original,
      outcome: "skipped",
    };
  }

  const cmd = resolveTilthCmd();

  if (!cmd) {
    return {
      usedTilth: false,
      tilthAvailable: false,
      content: original,
      outcome: "tilth_unavailable",
    };
  }

  try {
    const enhanced = runTilth(filePath, cmd);
    // Sanity: if tilth returns empty output, keep the original.
    if (!enhanced || enhanced.trim().length === 0) {
      return {
        usedTilth: false,
        tilthAvailable: true,
        content: original,
        outcome: "tilth_error",
        commandUsed: formatTilthCommand(cmd),
        error: "tilth returned empty output",
      };
    }

    return {
      usedTilth: true,
      tilthAvailable: true,
      content: enhanced,
      outcome: "tilth_success",
      commandUsed: formatTilthCommand(cmd),
    };
  } catch (err) {
    return {
      usedTilth: false,
      tilthAvailable: true,
      content: original,
      outcome: "tilth_error",
      commandUsed: formatTilthCommand(cmd),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Format a log line for tilth hook outcome.
 */
export function formatTilthLog(result: TilthReadResult, filePath: string): string {
  const commandSuffix = result.commandUsed ? ` via ${result.commandUsed}` : "";

  switch (result.outcome) {
    case "tilth_success":
      return `[CliKit:tilth-reading] Enhanced read via tilth${commandSuffix}: ${filePath}`;
    case "tilth_unavailable":
      return `[CliKit:tilth-reading] tilth not available, using read output: ${filePath}`;
    case "tilth_error":
      return `[CliKit:tilth-reading] tilth error${commandSuffix} (fallback to read): ${filePath} — ${result.error ?? "unknown error"}`;
    case "skipped":
      return `[CliKit:tilth-reading] Skipped (content below threshold): ${filePath}`;
    default:
      return `[CliKit:tilth-reading] ${result.outcome}: ${filePath}`;
  }
}
