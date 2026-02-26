import * as fs from "fs";
import * as path from "path";
import { Database } from "bun:sqlite";

export interface OpenCodeTodo {
  id: string;
  content: string;
  status: string;
  priority?: string;
}

export interface TodoBeadsSyncConfig {
  enabled?: boolean;
  close_missing?: boolean;
  log?: boolean;
}

export interface TodoBeadsSyncResult {
  synced: boolean;
  sessionID: string;
  totalTodos: number;
  created: number;
  updated: number;
  closed: number;
  skippedReason?: string;
}

function mapTodoStatusToIssueStatus(status: string): "open" | "in_progress" | "closed" {
  const value = status.toLowerCase();
  if (value === "completed" || value === "done" || value === "cancelled") {
    return "closed";
  }
  if (value === "in_progress" || value === "in-progress") {
    return "in_progress";
  }
  return "open";
}

function mapTodoPriorityToIssuePriority(priority?: string): number {
  const value = (priority || "").toLowerCase();
  if (value === "high") return 1;
  if (value === "low") return 3;
  return 2;
}

function sanitizeId(value: string): string {
  const normalized = value.replace(/[^a-zA-Z0-9_-]/g, "-");
  return normalized.length > 0 ? normalized : "unknown";
}

function buildIssueId(sessionID: string, todoID: string): string {
  const sessionPart = sanitizeId(sessionID).slice(0, 16);
  const todoPart = sanitizeId(todoID).slice(0, 32);
  return `oc-${sessionPart}-${todoPart}`;
}

export function syncTodosToBeads(
  projectDirectory: string,
  sessionID: string,
  todos: OpenCodeTodo[],
  config?: TodoBeadsSyncConfig,
): TodoBeadsSyncResult {
  const beadsDbPath = path.join(projectDirectory, ".beads", "beads.db");
  if (!fs.existsSync(beadsDbPath)) {
    return {
      synced: false,
      sessionID,
      totalTodos: todos.length,
      created: 0,
      updated: 0,
      closed: 0,
      skippedReason: "No .beads/beads.db found",
    };
  }

  const db = new Database(beadsDbPath);
  let created = 0;
  let updated = 0;
  let closed = 0;

  try {
    const prefix = `opencode:todo:${sessionID}:`;
    const existingRows = db.query(
      "SELECT external_ref, status FROM issues WHERE external_ref LIKE ?",
    ).all(`${prefix}%`) as Array<{ external_ref: string; status: string }>;

    const existingByRef = new Map(existingRows.map((row) => [row.external_ref, row.status]));
    const activeRefs = new Set<string>();

    const upsertIssue = db.prepare(`
      INSERT INTO issues (
        id, title, description, status, priority, issue_type, external_ref, source_repo, updated_at, closed_at
      ) VALUES (?, ?, ?, ?, ?, 'task', ?, '.', CURRENT_TIMESTAMP, CASE WHEN ? = 'closed' THEN CURRENT_TIMESTAMP ELSE NULL END)
      ON CONFLICT(external_ref) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        status = excluded.status,
        priority = excluded.priority,
        updated_at = CURRENT_TIMESTAMP,
        closed_at = CASE
          WHEN excluded.status = 'closed' THEN COALESCE(issues.closed_at, CURRENT_TIMESTAMP)
          ELSE NULL
        END
    `);

    for (const todo of todos) {
      const externalRef = `${prefix}${todo.id}`;
      activeRefs.add(externalRef);

      const mappedStatus = mapTodoStatusToIssueStatus(todo.status);
      const issueId = buildIssueId(sessionID, todo.id);
      const title = (todo.content || "Untitled todo").slice(0, 500);
      const priority = mapTodoPriorityToIssuePriority(todo.priority);
      const description = `Synced from OpenCode todo ${todo.id} (session ${sessionID}).`;

      if (existingByRef.has(externalRef)) {
        updated += 1;
      } else {
        created += 1;
      }

      upsertIssue.run(issueId, title, description, mappedStatus, priority, externalRef, mappedStatus);
    }

    if (config?.close_missing !== false) {
      const closeIssue = db.prepare(
        "UPDATE issues SET status = 'closed', closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE external_ref = ? AND status != 'closed'",
      );

      for (const [externalRef, status] of existingByRef.entries()) {
        if (!activeRefs.has(externalRef) && status !== "closed") {
          closeIssue.run(externalRef);
          closed += 1;
        }
      }
    }

    return {
      synced: true,
      sessionID,
      totalTodos: todos.length,
      created,
      updated,
      closed,
    };
  } finally {
    db.close();
  }
}

export function formatTodoBeadsSyncLog(result: TodoBeadsSyncResult): string {
  if (!result.synced) {
    return `[CliKit:todo-beads-sync] skipped (${result.skippedReason || "unknown reason"})`;
  }

  return `[CliKit:todo-beads-sync] session=${result.sessionID} todos=${result.totalTodos} created=${result.created} updated=${result.updated} closed=${result.closed}`;
}
