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
  active_only?: boolean;
  ready_limit?: number;
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

function formatIssueLine(issue: BeadsIssueRow): string {
  const icon = STATUS_ICONS[issue.status] ?? "?";
  const priority = PRIORITY_LABELS[issue.priority] ?? `p${issue.priority}`;
  const assignee = issue.assignee ? ` @${issue.assignee}` : "";
  return `- ${icon} \`${issue.id}\` **${issue.title}** (${priority}${assignee})`;
}

function formatCompressedBeadsSnapshot(
  issues: BeadsIssueRow[],
  config?: BeadsContextConfig,
): string | null {
  if (issues.length === 0) {
    return null;
  }

  const inProgress = issues.filter((issue) => issue.status === "in_progress");
  const ready = issues.filter((issue) => issue.status === "open");
  const includeClosed = config?.include_closed === true;
  const closed = includeClosed ? issues.filter((issue) => issue.status === "closed") : [];
  const readyLimit = config?.ready_limit ?? 3;
  const activeOnly = config?.active_only !== false;

  const lines: string[] = [
    "## Beads Task State",
    "",
    "Beads is the live execution source of truth. Prefer the active issue and its direct dependencies.",
    "",
  ];

  if (inProgress.length > 0) {
    lines.push("### Active Issue");
    lines.push(formatIssueLine(inProgress[0]));
    if (inProgress.length > 1) {
      lines.push(`- +${inProgress.length - 1} additional in-progress issue(s)`);
    }
    lines.push("");
  }

  if (!activeOnly && ready.length > 0) {
    lines.push("### Ready Queue");
    for (const issue of ready.slice(0, readyLimit)) {
      lines.push(formatIssueLine(issue));
    }
    if (ready.length > readyLimit) {
      lines.push(`- +${ready.length - readyLimit} more ready issue(s)`);
    }
    lines.push("");
  } else if (activeOnly && ready.length > 0 && inProgress.length === 0) {
    lines.push("### Ready Queue (fallback)");
    for (const issue of ready.slice(0, readyLimit)) {
      lines.push(formatIssueLine(issue));
    }
    if (ready.length > readyLimit) {
      lines.push(`- +${ready.length - readyLimit} more ready issue(s)`);
    }
    lines.push("");
  } else if (activeOnly && ready.length > 0) {
    lines.push(`Ready queue hidden (active_only=true, ${ready.length} ready issue(s) available).`);
    lines.push("");
  }

  if (closed.length > 0) {
    lines.push(`Recently closed available on demand: ${closed.length}`);
    lines.push("");
  }

  lines.push("Use `mcp__beads_village__show({id})` for full details.");
  lines.push("Use `mcp__beads_village__claim()` only when starting the next packet.");
  return lines.join("\n");
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

    return formatCompressedBeadsSnapshot(issues, {
      ...config,
      include_closed: includeClosed,
    });
  } catch {
    return null;
  } finally {
    db.close();
  }
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
    "Preserve active Beads task state across compaction. Prefer the active issue and direct packet scope.",
    "OpenCode todos are informational only when Beads state is available.",
    "",
    snapshot,
  ].join("\n");
}
