/**
 * Comment Checker Hook
 *
 * Detects excessive AI-generated comments in code output.
 * AI code should be indistinguishable from human-written code.
 * Runs on tool.execute.after for edit/write tools.
 */

const EXCESSIVE_COMMENT_PATTERNS = [
  /\/\/\s*TODO:?\s*$/i,
  /\/\/\s*This (?:function|method|class|variable|constant)/i,
  /\/\/\s*(?:Initialize|Create|Set up|Configure|Define|Declare) the/i,
  /\/\/\s*(?:Import|Export|Return|Handle|Process|Get|Set|Update|Delete|Add|Remove) /i,
  /\/\*\*?\s*\n\s*\*\s*(?:This|The|A|An) (?:function|method|class|component)/i,
  /#\s*(?:This|The|A|An) (?:function|method|class|script)/i,
];

export interface CommentCheckResult {
  excessive: boolean;
  count: number;
  totalLines: number;
  ratio: number;
}

export function checkCommentDensity(content: unknown, threshold: number = 0.3): CommentCheckResult {
  if (typeof content !== "string") {
    return { excessive: false, count: 0, totalLines: 0, ratio: 0 };
  }
  const lines = content.split("\n");
  const totalLines = lines.filter((l) => l.trim().length > 0).length;

  if (totalLines === 0) {
    return { excessive: false, count: 0, totalLines: 0, ratio: 0 };
  }

  let commentLines = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes("*/")) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith("/*")) {
      commentLines++;
      if (!trimmed.includes("*/")) {
        inBlockComment = true;
      }
      continue;
    }

    if (trimmed.startsWith("//")) {
      commentLines++;
    } else if (trimmed.startsWith("#") && !trimmed.startsWith("#!") && !trimmed.startsWith("# ")) {
      // # comments: exclude shebangs and common non-comment patterns (YAML keys, markdown headings)
      // Only count lines like "# some comment" not "#key: value" or "# Heading"
      const rest = trimmed.slice(1).trim();
      if (rest.length > 0 && !rest.includes(":") && !rest.startsWith(" ") === false) {
        commentLines++;
      }
    }
  }

  const ratio = commentLines / totalLines;

  return {
    excessive: ratio > threshold,
    count: commentLines,
    totalLines,
    ratio,
  };
}

export function hasExcessiveAIComments(content: unknown): boolean {
  if (typeof content !== "string") {
    return false;
  }
  let matches = 0;
  for (const pattern of EXCESSIVE_COMMENT_PATTERNS) {
    const found = content.match(new RegExp(pattern, "gm"));
    if (found) {
      matches += found.length;
    }
  }
  return matches >= 5;
}

export function formatCommentWarning(result: CommentCheckResult): string {
  const pct = (result.ratio * 100).toFixed(0);
  return `[CliKit:comment-checker] ${result.count}/${result.totalLines} lines are comments (${pct}%). Reduce unnecessary comments — code should be self-documenting.`;
}
