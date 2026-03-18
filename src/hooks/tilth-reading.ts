/**
 * Tilth Reading Hook
 *
 * Enhances file read output using the `tilth` binary when available.
 * Tilth provides smart outline-aware reading (full vs outline based on token threshold).
 *
 * Priority:
 *   1. tilth <path>           — smart read (full or outline)
 *   2. tilth <path> --section — section-targeted read
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
  /** Whether tilth binary was found on PATH */
  tilthAvailable: boolean;
  /** Final content after enhancement or fallback */
  content: string;
  /** Human-readable outcome for logging */
  outcome: "tilth_success" | "tilth_unavailable" | "tilth_error" | "skipped";
  /** Error message when outcome === "tilth_error" */
  error?: string;
}

const DEFAULT_MIN_CONTENT_LENGTH = 1000;

// Cache availability per process lifetime to avoid repeated PATH lookups.
let tilthAvailabilityCache: boolean | null = null;

/**
 * Check if the `tilth` binary is available on PATH.
 * Result is cached for the process lifetime.
 */
export function isTilthAvailable(): boolean {
  if (tilthAvailabilityCache !== null) return tilthAvailabilityCache;

  try {
    const result = Bun.spawnSync(["tilth", "--version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    tilthAvailabilityCache = result.exitCode === 0;
  } catch {
    tilthAvailabilityCache = false;
  }

  return tilthAvailabilityCache;
}

/**
 * Reset availability cache (useful in tests or after installing tilth).
 */
export function resetTilthAvailabilityCache(): void {
  tilthAvailabilityCache = null;
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
 */
function runTilth(filePath: string): string {
  const result = Bun.spawnSync(["tilth", filePath], {
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

  if (!isTilthAvailable()) {
    return {
      usedTilth: false,
      tilthAvailable: false,
      content: original,
      outcome: "tilth_unavailable",
    };
  }

  try {
    const enhanced = runTilth(filePath);
    // Sanity: if tilth returns empty output, keep the original.
    if (!enhanced || enhanced.trim().length === 0) {
      return {
        usedTilth: false,
        tilthAvailable: true,
        content: original,
        outcome: "tilth_error",
        error: "tilth returned empty output",
      };
    }

    return {
      usedTilth: true,
      tilthAvailable: true,
      content: enhanced,
      outcome: "tilth_success",
    };
  } catch (err) {
    return {
      usedTilth: false,
      tilthAvailable: true,
      content: original,
      outcome: "tilth_error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Format a log line for tilth hook outcome.
 */
export function formatTilthLog(result: TilthReadResult, filePath: string): string {
  switch (result.outcome) {
    case "tilth_success":
      return `[CliKit:tilth-reading] Enhanced read via tilth: ${filePath}`;
    case "tilth_unavailable":
      return `[CliKit:tilth-reading] tilth not available, using read output: ${filePath}`;
    case "tilth_error":
      return `[CliKit:tilth-reading] tilth error (fallback to read): ${filePath} — ${result.error ?? "unknown error"}`;
    case "skipped":
      return `[CliKit:tilth-reading] Skipped (content below threshold): ${filePath}`;
    default:
      return `[CliKit:tilth-reading] ${result.outcome}: ${filePath}`;
  }
}
