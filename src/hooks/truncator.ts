/**
 * Truncator Hook
 *
 * Dynamic output truncation when tool output is too large.
 * Prevents context window overflow by intelligently trimming
 * large outputs while preserving key information.
 * Runs on tool.execute.after for bash/read tools.
 */

export interface TruncatorConfig {
  enabled?: boolean;
  max_output_chars?: number;
  max_output_lines?: number;
  preserve_head_lines?: number;
  preserve_tail_lines?: number;
  log?: boolean;
}

export interface TruncateResult {
  truncated: boolean;
  originalLength: number;
  truncatedLength: number;
  originalLines: number;
  truncatedLines: number;
  content: string;
}

const DEFAULT_MAX_CHARS = 30_000;
const DEFAULT_MAX_LINES = 500;
const DEFAULT_HEAD_LINES = 50;
const DEFAULT_TAIL_LINES = 50;

export function shouldTruncate(
  content: string,
  config?: TruncatorConfig
): boolean {
  if (typeof content !== "string") return false;

  const maxChars = config?.max_output_chars ?? DEFAULT_MAX_CHARS;
  const maxLines = config?.max_output_lines ?? DEFAULT_MAX_LINES;

  if (content.length > maxChars) return true;

  const lineCount = content.split("\n").length;
  if (lineCount > maxLines) return true;

  return false;
}

export function truncateOutput(
  content: string,
  config?: TruncatorConfig
): TruncateResult {
  if (typeof content !== "string") {
    return {
      truncated: false,
      originalLength: 0,
      truncatedLength: 0,
      originalLines: 0,
      truncatedLines: 0,
      content: "",
    };
  }

  const maxChars = config?.max_output_chars ?? DEFAULT_MAX_CHARS;
  const maxLines = config?.max_output_lines ?? DEFAULT_MAX_LINES;
  const headLines = config?.preserve_head_lines ?? DEFAULT_HEAD_LINES;
  const tailLines = config?.preserve_tail_lines ?? DEFAULT_TAIL_LINES;

  const lines = content.split("\n");
  const originalLength = content.length;
  const originalLineCount = lines.length;

  // No truncation needed
  if (content.length <= maxChars && lines.length <= maxLines) {
    return {
      truncated: false,
      originalLength,
      truncatedLength: originalLength,
      originalLines: originalLineCount,
      truncatedLines: originalLineCount,
      content,
    };
  }

  // Truncate by lines first
  if (lines.length > maxLines) {
    const head = lines.slice(0, headLines);
    const tail = lines.slice(-tailLines);
    const omitted = lines.length - headLines - tailLines;

    const truncated = [
      ...head,
      "",
      `... [${omitted} lines omitted — showing first ${headLines} and last ${tailLines} of ${lines.length} lines] ...`,
      "",
      ...tail,
    ].join("\n");

    // If still too long by chars, do a char-level trim
    if (truncated.length > maxChars) {
      const finalContent = truncated.substring(0, maxChars) + "\n... [truncated at character limit]";
      return {
        truncated: true,
        originalLength,
        truncatedLength: finalContent.length,
        originalLines: originalLineCount,
        truncatedLines: finalContent.split("\n").length,
        content: finalContent,
      };
    }

    return {
      truncated: true,
      originalLength,
      truncatedLength: truncated.length,
      originalLines: originalLineCount,
      truncatedLines: truncated.split("\n").length,
      content: truncated,
    };
  }

  // Only char-level truncation needed
  const halfMax = Math.floor(maxChars / 2);
  const headPart = content.substring(0, halfMax);
  const tailPart = content.substring(content.length - halfMax);
  const omittedChars = content.length - maxChars;

  const truncatedContent = `${headPart}\n\n... [${omittedChars} characters omitted] ...\n\n${tailPart}`;

  return {
    truncated: true,
    originalLength,
    truncatedLength: truncatedContent.length,
    originalLines: originalLineCount,
    truncatedLines: truncatedContent.split("\n").length,
    content: truncatedContent,
  };
}

export function formatTruncationLog(result: TruncateResult): string {
  if (!result.truncated) return "";
  const saved = result.originalLength - result.truncatedLength;
  return `[CliKit:truncator] Truncated output: ${result.originalLines} → ${result.truncatedLines} lines, saved ${(saved / 1024).toFixed(1)}KB`;
}
