/**
 * Beads Context Hook
 *
 * Reads active Beads issues from `.beads/beads.db` and formats them
 * as a compact snapshot for injection into the agent system prompt.
 *
 * This makes Beads the "source of truth" for task management —
 * agents always see the current state of Beads issues without
 * relying on OpenCode's internal todo list.
 */

import * as fs from "fs";
import * as path from "path";
import { Database } from "bun:sqlite";

const BEADS_CONTEXT_BUSY_TIMEOUT_MS = 2000;

export interface BeadsContextConfig {
  enabled?: boolean;
  max_issues?: number;
  include_closed?: boolean;
  log?: boolean;
}

interface BeadsIssueRow {
  id: string;
  title: string;
  status: string;
  priority: number;
  issue_type: string;
  assignee: string | null;
  external_ref: string | null;
  created_at: string;
  updated_at: string;
}

const PRIORITY_LABELS: Record<number, string> = {
  0: "critical",
  1: "high",
  2: "normal",
  3: "low",
  4: "backlog",
};

const STATUS_ICONS: Record<string, string> = {
  open: "○",
  in_progress: "◉",
  closed: "✓",
};

function openBeadsDbReadonly(projectDirectory: string): Database | null {
  const beadsDbPath = path.join(projectDirectory, ".beads", "beads.db");
  if (!fs.existsSync(beadsDbPath)) {
    return null;
  }

  try {
    const db = new Database(beadsDbPath, { readonly: true });
    db.exec(`PRAGMA busy_timeout = ${BEADS_CONTEXT_BUSY_TIMEOUT_MS}`);
    return db;
  } catch {
    return null;
  }
}

export function getBeadsSnapshot(
  projectDirectory: string,
  config?: BeadsContextConfig,
): string | null {
  const db = openBeadsDbReadonly(projectDirectory);
  if (!db) {
    return null;
  }

  try {
    const maxIssues = config?.max_issues ?? 20;
    const includeClosed = config?.include_closed ?? false;

    const statusFilter = includeClosed
      ? ""
      : "WHERE status != 'closed'";

    const issues = db.query(`
      SELECT id, title, status, priority, issue_type, assignee, external_ref, created_at, updated_at
      FROM issues
      ${statusFilter}
      ORDER BY
        CASE status WHEN 'in_progress' THEN 0 WHEN 'open' THEN 1 ELSE 2 END,
        priority ASC,
        updated_at DESC
      LIMIT ?
    `).all(maxIssues) as BeadsIssueRow[];

    if (issues.length === 0) {
      return null;
    }

    // Count by status
    const countByStatus: Record<string, number> = {};
    for (const issue of issues) {
      countByStatus[issue.status] = (countByStatus[issue.status] ?? 0) + 1;
    }

    // Format header
    const statusSummary = Object.entries(countByStatus)
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ");

    const lines: string[] = [
      `## Active Beads Issues (${statusSummary})`,
      "",
    ];

    // Group by status
    const inProgress = issues.filter((i) => i.status === "in_progress");
    const open = issues.filter((i) => i.status === "open");
    const closed = issues.filter((i) => i.status === "closed");

    if (inProgress.length > 0) {
      lines.push("### In Progress");
      for (const issue of inProgress) {
        lines.push(formatIssueLine(issue));
      }
      lines.push("");
    }

    if (open.length > 0) {
      lines.push("### Ready");
      for (const issue of open) {
        lines.push(formatIssueLine(issue));
      }
      lines.push("");
    }

    if (closed.length > 0 && includeClosed) {
      lines.push("### Recently Closed");
      for (const issue of closed) {
        lines.push(formatIssueLine(issue));
      }
      lines.push("");
    }

    lines.push("Use `mcp__beads_village__show({id})` to see full issue details.");
    lines.push("Use `mcp__beads_village__claim()` to pick up the next ready task.");

    return lines.join("\n");
  } catch {
    return null;
  } finally {
    db.close();
  }
}

function formatIssueLine(issue: BeadsIssueRow): string {
  const icon = STATUS_ICONS[issue.status] ?? "?";
  const priority = PRIORITY_LABELS[issue.priority] ?? `p${issue.priority}`;
  const assignee = issue.assignee ? ` @${issue.assignee}` : "";
  return `- ${icon} \`${issue.id}\` **${issue.title}** (${priority}${assignee})`;
}

export function getBeadsCompactionContext(
  projectDirectory: string,
  config?: BeadsContextConfig,
): string | null {
  const snapshot = getBeadsSnapshot(projectDirectory, {
    ...config,
    include_closed: true,
    max_issues: 30,
  });

  if (!snapshot) {
    return null;
  }

  return [
    "## Beads Task State (Source of Truth)",
    "",
    "The following Beads issues represent the canonical task state.",
    "Preserve this context across compaction — it takes priority over OpenCode todos.",
    "",
    snapshot,
  ].join("\n");
}
