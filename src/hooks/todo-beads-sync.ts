import * as fs from "fs";
import * as path from "path";
import { Database } from "bun:sqlite";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SQLITE_BUSY_CODES = new Set([
  "SQLITE_BUSY",
  "SQLITE_BUSY_RECOVERY",
  "SQLITE_BUSY_SNAPSHOT",
  "SQLITE_LOCKED",
]);

const DEFAULT_BUSY_TIMEOUT_MS = 3000;
const MAX_SYNC_RETRIES = 4;

export interface OpenCodeTodo {
  id: string;
  content: string;
  status: string;
  priority?: string;
}

export interface TodoBeadsSyncConfig {
  enabled?: boolean;
  close_missing?: boolean;
  mode?: "disabled" | "legacy_sync";
  log?: boolean;
}

export interface TodoBeadsSyncResult {
  synced: boolean;
  sessionID: string;
  totalTodos: number;
  created: number;
  updated: number;
  closed: number;
  flushed?: boolean;
  skippedReason?: string;
}

interface ExistingIssueRow {
  id: string;
  external_ref: string;
  status: string;
}

function sleepSync(ms: number): void {
  const shared = new SharedArrayBuffer(4);
  const view = new Int32Array(shared);
  Atomics.wait(view, 0, 0, ms);
}

function getSqliteErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "string" ? maybeCode : undefined;
}

function isBusySqliteError(error: unknown): boolean {
  const code = getSqliteErrorCode(error);
  if (code && SQLITE_BUSY_CODES.has(code)) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /database is locked|SQLITE_BUSY|SQLITE_LOCKED/i.test(message);
}

function configureBeadsDb(db: Database): void {
  db.exec(`PRAGMA busy_timeout = ${DEFAULT_BUSY_TIMEOUT_MS}`);

  try {
    db.exec("PRAGMA journal_mode = WAL");
  } catch {
    // WAL is helpful but non-fatal if another process is currently busy.
  }
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

function syncTodosToBeadsAttempt(
  beadsDbPath: string,
  sessionID: string,
  todos: OpenCodeTodo[],
  config?: TodoBeadsSyncConfig,
): TodoBeadsSyncResult {
  const db = new Database(beadsDbPath);
  configureBeadsDb(db);

  try {
    const prefix = `opencode:todo:${sessionID}:`;
    let created = 0;
    let updated = 0;
    let closed = 0;

    db.exec("BEGIN IMMEDIATE");

    try {
      const existingRows = db.query(
        "SELECT id, external_ref, status FROM issues WHERE external_ref LIKE ?",
      ).all(`${prefix}%`) as ExistingIssueRow[];

      const existingByRef = new Map(existingRows.map((row) => [row.external_ref, row]));
      const activeRefs = new Set<string>();

      const insertIssue = db.prepare(`
        INSERT INTO issues (
          id, title, description, status, priority, issue_type, external_ref, source_repo, updated_at, closed_at
        ) VALUES (?, ?, ?, ?, ?, 'task', ?, '.', CURRENT_TIMESTAMP, CASE WHEN ? = 'closed' THEN CURRENT_TIMESTAMP ELSE NULL END)
      `);

      const updateIssue = db.prepare(`
        UPDATE issues SET
          title = ?,
          description = ?,
          status = ?,
          priority = ?,
          external_ref = ?,
          updated_at = CURRENT_TIMESTAMP,
          closed_at = CASE
            WHEN ? = 'closed' THEN COALESCE(closed_at, CURRENT_TIMESTAMP)
            ELSE NULL
          END
        WHERE external_ref = ?
      `);

      for (const todo of todos) {
        const externalRef = `${prefix}${todo.id}`;
        activeRefs.add(externalRef);

        const mappedStatus = mapTodoStatusToIssueStatus(todo.status);
        const issueId = buildIssueId(sessionID, todo.id);
        const title = (todo.content || "Untitled todo").slice(0, 500);
        const priority = mapTodoPriorityToIssuePriority(todo.priority);
        const description = `Synced from OpenCode todo ${todo.id} (session ${sessionID}).`;

        const existingIssue = existingByRef.get(externalRef);

        if (existingIssue) {
          updated += 1;
          updateIssue.run(title, description, mappedStatus, priority, externalRef, mappedStatus, externalRef);
        } else {
          created += 1;
          insertIssue.run(issueId, title, description, mappedStatus, priority, externalRef, mappedStatus);
        }
      }

      if (config?.close_missing !== false) {
        const closeIssue = db.prepare(
          "UPDATE issues SET status = 'closed', closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE external_ref = ? AND status != 'closed'",
        );

        for (const [externalRef, row] of existingByRef.entries()) {
          if (!activeRefs.has(externalRef) && row.status !== "closed") {
            closeIssue.run(externalRef);
            closed += 1;
          }
        }
      }

      db.exec("COMMIT");

      return {
        synced: true,
        sessionID,
        totalTodos: todos.length,
        created,
        updated,
        closed,
      };
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // Ignore rollback failures; original error is more useful.
      }

      throw error;
    }
  } finally {
    db.close();
  }
}

export function syncTodosToBeads(
  projectDirectory: string,
  sessionID: string,
  todos: OpenCodeTodo[],
  config?: TodoBeadsSyncConfig,
): TodoBeadsSyncResult {
  if (config?.mode === "disabled" || config?.enabled === false) {
    return {
      synced: false,
      sessionID,
      totalTodos: todos.length,
      created: 0,
      updated: 0,
      closed: 0,
      skippedReason: "Todo sync disabled; Beads is authoritative",
    };
  }

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

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_SYNC_RETRIES; attempt += 1) {
    try {
      const result = syncTodosToBeadsAttempt(beadsDbPath, sessionID, todos, config);

      // Flush JSONL after a successful write so the bd daemon and CLI tools
      // (e.g. `bd list`, `beads-village_ls`) see the changes immediately.
      if (result.created > 0 || result.updated > 0 || result.closed > 0) {
        flushBeadsJsonl(projectDirectory, result);
      }

      return result;
    } catch (error) {
      lastError = error;

      if (!isBusySqliteError(error) || attempt === MAX_SYNC_RETRIES) {
        throw error;
      }

      sleepSync(50 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Todo-Beads sync failed after retries");
}

/**
 * Flush the SQLite DB to JSONL so that `bd` CLI and the daemon pick up the
 * changes that were written directly via the sync hook.
 *
 * Uses `bd export -o .beads/issues.jsonl` which is the canonical JSONL path
 * read by `bd list`, `bd show`, and beads-village MCP tools.
 * Falls back silently — a flush failure should never break the sync result.
 */
function flushBeadsJsonl(projectDirectory: string, result: TodoBeadsSyncResult): void {
  const jsonlPath = path.join(projectDirectory, ".beads", "issues.jsonl");

  // Fire-and-forget: don't await, don't throw
  execFileAsync("bd", ["export", "--force", "-o", jsonlPath], {
    cwd: projectDirectory,
    timeout: 5000,
  })
    .then(() => {
      result.flushed = true;
    })
    .catch(() => {
      // Non-fatal: JSONL will be updated on next daemon cycle
      result.flushed = false;
    });
}

export function formatTodoBeadsSyncLog(result: TodoBeadsSyncResult): string {
  if (!result.synced) {
    return `[CliKit:todo-beads-sync] skipped (${result.skippedReason || "unknown reason"})`;
  }

  return `[CliKit:todo-beads-sync] session=${result.sessionID} todos=${result.totalTodos} created=${result.created} updated=${result.updated} closed=${result.closed}`;
}
