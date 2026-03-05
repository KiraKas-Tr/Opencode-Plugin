import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { openMemoryDb } from "./memory-db";
import { memoryAdmin, memoryGet, memorySearch, memoryUpdate, type MemorySearchResult } from "./memory";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CassMemoryExecOptions {
  cmPath?: string;
  cwd?: string;
  timeoutMs?: number;
}

export interface CassMemoryResult<T = unknown> {
  ok: boolean;
  command: string[];
  data?: T;
  raw?: string;
  error?: string;
  source?: "cm" | "embedded";
}

export interface CassMemoryContextParams extends CassMemoryExecOptions {
  task: string;
  limit?: number;
  history?: number;
  days?: number;
  noHistory?: boolean;
}

export interface CassMemoryMarkParams extends CassMemoryExecOptions {
  bulletId: string;
  helpful?: boolean;
  harmful?: boolean;
  reason?: string;
}

export interface CassMemoryReflectParams extends CassMemoryExecOptions {
  days?: number;
  maxSessions?: number;
  dryRun?: boolean;
  workspace?: string;
}

export interface CassMemoryOutcomeParams extends CassMemoryExecOptions {
  status: "success" | "failure" | "mixed" | "partial";
  rules: string;
  summary?: string;
  duration?: number;
  errors?: number;
}

export interface CassMemoryDoctorParams extends CassMemoryExecOptions {
  fix?: boolean;
}

// Internal types for embedded fallback
interface InternalContextResult {
  task: string;
  relevantBullets: Array<MemorySearchResult & { bulletId: string; relevanceScore: number }>;
  antiPatterns: Array<MemorySearchResult & { bulletId: string; relevanceScore: number }>;
  historySnippets: MemorySearchResult[];
  degraded?: {
    cass: {
      available: false;
      reason: string;
      suggestedFix: string[];
    };
  };
}

// ---------------------------------------------------------------------------
// cm CLI detection & execution
// ---------------------------------------------------------------------------

let _cmPathCache: string | false | undefined;

async function findCmBinary(hint?: string): Promise<string | false> {
  if (hint) {
    try {
      const { stdout } = await execFileAsync(hint, ["--version"], { timeout: 5_000 });
      if (stdout.trim()) return hint;
    } catch { /* not valid */ }
  }

  if (_cmPathCache !== undefined) return _cmPathCache;

  for (const candidate of ["cm"]) {
    try {
      const { stdout } = await execFileAsync(candidate, ["--version"], { timeout: 5_000 });
      if (stdout.trim()) {
        _cmPathCache = candidate;
        return candidate;
      }
    } catch { /* not found */ }
  }

  _cmPathCache = false;
  return false;
}

async function runCm<T = unknown>(
  args: string[],
  opts: CassMemoryExecOptions = {},
): Promise<CassMemoryResult<T>> {
  const cmPath = await findCmBinary(opts.cmPath);
  if (!cmPath) {
    return { ok: false, command: ["cm", ...args], error: "cm binary not found", source: "cm" };
  }

  try {
    const { stdout, stderr } = await execFileAsync(cmPath, args, {
      timeout: opts.timeoutMs ?? 30_000,
      cwd: opts.cwd,
      maxBuffer: 1024 * 1024, // 1MB
      env: { ...process.env, NO_COLOR: "1", CASS_MEMORY_NO_EMOJI: "1" },
    });

    // cm outputs JSON when --json flag is used
    const trimmed = stdout.trim();
    if (!trimmed) {
      return {
        ok: true,
        command: ["cm", ...args],
        raw: stderr.trim() || "",
        source: "cm",
      };
    }

    try {
      const parsed = JSON.parse(trimmed);
      return {
        ok: parsed.success !== false,
        command: ["cm", ...args],
        data: parsed.data ?? parsed,
        raw: trimmed,
        source: "cm",
      };
    } catch {
      // Non-JSON output (human-readable)
      return {
        ok: true,
        command: ["cm", ...args],
        data: trimmed as unknown as T,
        raw: trimmed,
        source: "cm",
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      command: ["cm", ...args],
      error: `cm execution failed: ${message}`,
      source: "cm",
    };
  }
}

// ---------------------------------------------------------------------------
// Embedded fallback (SQLite-based, same as before)
// ---------------------------------------------------------------------------

const ANTI_PATTERN_TYPES = new Set(["cass_feedback_harmful", "cass_anti_pattern"]);
const ANTI_PATTERN_FEEDBACK_THRESHOLD = 3;

interface RankedMemoryResult extends MemorySearchResult {
  relevanceScore: number;
}

function scoreType(type: string): number {
  switch (type) {
    case "decision":
      return 0.16;
    case "learning":
      return 0.14;
    case "cass_feedback_helpful":
      return 0.1;
    case "cass_anti_pattern":
      return 0.12;
    case "cass_feedback_harmful":
      return 0.08;
    case "progress":
      return 0.04;
    default:
      return 0.02;
  }
}

function scoreRecency(createdAt: string): number {
  const time = Date.parse(createdAt);
  if (Number.isNaN(time)) {
    return 0.35;
  }
  const ageDays = Math.max(0, (Date.now() - time) / 86_400_000);
  return Math.exp(-ageDays / 30);
}

function rankRows(rows: MemorySearchResult[]): RankedMemoryResult[] {
  return rows
    .map((row) => {
      const confidence = Math.max(0, Math.min(1, row.confidence));
      const recency = scoreRecency(row.created_at);
      const typeWeight = scoreType(row.type);
      const relevanceScore = confidence * 0.55 + recency * 0.35 + typeWeight;
      return {
        ...row,
        relevanceScore: Number(relevanceScore.toFixed(4)),
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.id - a.id);
}

function parseObservationId(bulletId: string): number | null {
  const match = /^obs-(\d+)$/.exec(bulletId.trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function toLikePattern(text: string): string {
  return `%"${text.replace(/[\\%_]/g, "\\$&")}"%`;
}

function invertToAntiPattern(content: string): string {
  const text = content.trim();
  if (!text) return "PITFALL: Avoid repeating this pattern without validation";
  if (/^always\s+/i.test(text)) return `PITFALL: Don't ${text.replace(/^always\s+/i, "").toLowerCase()}`;
  if (/^use\s+/i.test(text)) return `PITFALL: Avoid ${text.charAt(0).toLowerCase()}${text.slice(1)} without careful validation`;
  return `PITFALL: ${text}`;
}

function getFeedbackCounts(bulletId: string): { harmful: number; helpful: number } {
  try {
    const db = openMemoryDb({ readonly: true });
    try {
      const rows = db.prepare(`
        SELECT type, COUNT(*) as count
        FROM observations
        WHERE type IN ('cass_feedback_harmful', 'cass_feedback_helpful')
          AND facts LIKE ? ESCAPE '\\'
        GROUP BY type
      `).all(toLikePattern(bulletId)) as Array<{ type: string; count: number }>;

      let harmful = 0;
      let helpful = 0;
      for (const row of rows) {
        if (row.type === "cass_feedback_harmful") harmful = row.count;
        else if (row.type === "cass_feedback_helpful") helpful = row.count;
      }
      return { harmful, helpful };
    } finally {
      db.close();
    }
  } catch {
    return { harmful: 0, helpful: 0 };
  }
}

function antiPatternAlreadyExists(bulletId: string): boolean {
  try {
    const db = openMemoryDb({ readonly: true });
    try {
      const row = db.prepare(`
        SELECT id FROM observations
        WHERE type = 'cass_anti_pattern'
          AND facts LIKE ? ESCAPE '\\'
        LIMIT 1
      `).get(toLikePattern(bulletId)) as { id: number } | null;
      return !!row;
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}

function maybePromoteToAntiPattern(bulletId: string, reason?: string): void {
  const { harmful, helpful } = getFeedbackCounts(bulletId);
  if (harmful < ANTI_PATTERN_FEEDBACK_THRESHOLD || harmful <= helpful) return;
  if (antiPatternAlreadyExists(bulletId)) return;

  const sourceId = parseObservationId(bulletId);
  if (!sourceId) return;

  const source = memoryGet(String(sourceId))[0];
  if (!source) return;

  const reasonSuffix = reason?.trim() ? ` Reason: ${reason.trim()}` : "";
  const narrative = `${invertToAntiPattern(source.narrative)} (derived from ${bulletId} after ${harmful} harmful marks.${reasonSuffix})`;
  memoryUpdate({
    type: "cass_anti_pattern",
    narrative,
    facts: [bulletId, `source:${sourceId}`, `harmful:${harmful}`, `helpful:${helpful}`],
    confidence: Math.min(1, 0.6 + harmful * 0.05),
  });
}

function embeddedContext(params: CassMemoryContextParams): CassMemoryResult<InternalContextResult> {
  const limit = typeof params.limit === "number" && Number.isFinite(params.limit) ? Math.max(1, Math.floor(params.limit)) : 10;
  const searchLimit = Math.max(limit * 4, 20);
  const rows = memorySearch({ query: params.task, limit: searchLimit });
  const rankedRows = rankRows(rows);

  const relevantBullets = rankedRows
    .filter((r) => !ANTI_PATTERN_TYPES.has(r.type))
    .slice(0, limit)
    .map((r) => ({ ...r, bulletId: `obs-${r.id}` }));
  const antiPatterns = rankedRows
    .filter((r) => ANTI_PATTERN_TYPES.has(r.type))
    .slice(0, limit)
    .map((r) => ({ ...r, bulletId: `obs-${r.id}` }));

  return {
    ok: true,
    command: ["embedded", "context"],
    source: "embedded",
    data: {
      task: params.task,
      relevantBullets,
      antiPatterns,
      historySnippets: rankedRows.slice(0, Math.max(limit * 2, 10)).map(({ relevanceScore: _score, ...row }) => row),
      degraded: {
        cass: {
          available: false,
          reason: "Running in embedded CliKit mode (no external cm binary found).",
          suggestedFix: [
            "npm install -g cass-memory-system",
            "cm init",
          ],
        },
      },
    },
  };
}

function embeddedMark(params: CassMemoryMarkParams): CassMemoryResult<{ id: number }> {
  const type = params.harmful ? "cass_feedback_harmful" : "cass_feedback_helpful";
  const narrative = params.reason?.trim()
    ? `Feedback for ${params.bulletId}: ${params.reason.trim()}`
    : `Feedback for ${params.bulletId}`;

  const saved = memoryUpdate({
    type,
    narrative,
    facts: [params.bulletId],
    confidence: 1.0,
  });

  if (!saved) {
    return { ok: false, command: ["embedded", "mark"], source: "embedded", error: "Failed to save feedback" };
  }

  if (params.harmful) {
    maybePromoteToAntiPattern(params.bulletId, params.reason);
  }

  return { ok: true, command: ["embedded", "mark"], source: "embedded", data: saved };
}

function embeddedReflect(params: CassMemoryReflectParams): CassMemoryResult {
  return {
    ok: true,
    command: ["embedded", "reflect"],
    source: "embedded",
    data: {
      reflected: true,
      mode: "embedded",
      days: params.days ?? 7,
      maxSessions: params.maxSessions ?? 10,
      dryRun: !!params.dryRun,
      note: "Embedded reflection is a stub. Install cm for full playbook-based reflection.",
    },
  };
}

function embeddedDoctor(): CassMemoryResult {
  const status = memoryAdmin({ operation: "status" });
  return {
    ok: status.success,
    command: ["embedded", "doctor"],
    source: "embedded",
    data: {
      mode: "embedded",
      memory: status.details,
      externalCmRequired: false,
      note: "Running without cm binary. Install cm for full CASS features.",
    },
    error: status.success ? undefined : "Memory status check failed",
  };
}

// ---------------------------------------------------------------------------
// Public API: tries cm CLI first, falls back to embedded
// ---------------------------------------------------------------------------

export async function cassMemoryContext(params: unknown): Promise<CassMemoryResult> {
  if (!params || typeof params !== "object") {
    return { ok: false, command: ["context"], error: "Invalid params" };
  }

  const p = params as Partial<CassMemoryContextParams>;
  if (!p.task || typeof p.task !== "string") {
    return { ok: false, command: ["context"], error: "Missing task" };
  }

  // Try real cm first
  const cmPath = await findCmBinary(p.cmPath);
  if (cmPath) {
    const args = ["context", p.task, "--json"];
    if (typeof p.limit === "number") args.push("--limit", String(p.limit));
    if (typeof p.history === "number") args.push("--history", String(p.history));
    if (typeof p.days === "number") args.push("--days", String(p.days));
    if (p.noHistory) args.push("--no-history");

    const result = await runCm(args, p);
    if (result.ok) return result;
    // If cm fails, fall through to embedded
  }

  // Embedded fallback
  return embeddedContext(p as CassMemoryContextParams);
}

export async function cassMemoryMark(params: unknown): Promise<CassMemoryResult> {
  if (!params || typeof params !== "object") {
    return { ok: false, command: ["mark"], error: "Invalid params" };
  }

  const p = params as Partial<CassMemoryMarkParams>;
  if (!p.bulletId || typeof p.bulletId !== "string") {
    return { ok: false, command: ["mark"], error: "Missing bulletId" };
  }

  // Try real cm first
  const cmPath = await findCmBinary(p.cmPath);
  if (cmPath) {
    const args = ["mark", p.bulletId, "--json"];
    if (p.helpful) args.push("--helpful");
    if (p.harmful) args.push("--harmful");
    if (p.reason) args.push("--reason", p.reason);

    const result = await runCm(args, p);
    if (result.ok) return result;
  }

  // Embedded fallback
  return embeddedMark(p as CassMemoryMarkParams);
}

export async function cassMemoryReflect(params: unknown = {}): Promise<CassMemoryResult> {
  const p = (params && typeof params === "object" ? params : {}) as Partial<CassMemoryReflectParams>;

  // Try real cm first
  const cmPath = await findCmBinary(p.cmPath);
  if (cmPath) {
    const args = ["reflect", "--json"];
    if (typeof p.days === "number") args.push("--days", String(p.days));
    if (typeof p.maxSessions === "number") args.push("--max-sessions", String(p.maxSessions));
    if (p.dryRun) args.push("--dry-run");
    if (p.workspace) args.push("--workspace", p.workspace);

    const result = await runCm(args, p);
    if (result.ok) return result;
  }

  // Embedded fallback (stub)
  return embeddedReflect(p as CassMemoryReflectParams);
}

export async function cassMemoryOutcome(params: unknown): Promise<CassMemoryResult> {
  if (!params || typeof params !== "object") {
    return { ok: false, command: ["outcome"], error: "Invalid params" };
  }

  const p = params as Partial<CassMemoryOutcomeParams>;
  if (!p.status || !p.rules) {
    return { ok: false, command: ["outcome"], error: "Missing status or rules" };
  }

  // outcome requires real cm — no embedded equivalent
  const cmPath = await findCmBinary(p.cmPath);
  if (!cmPath) {
    return {
      ok: false,
      command: ["outcome"],
      source: "embedded",
      error: "cm binary not found. The outcome command requires the real cm CLI. Install via: npm install -g cass-memory-system",
    };
  }

  const args = ["outcome", p.status, p.rules, "--json"];
  if (p.summary) args.push("--text", p.summary);
  if (typeof p.duration === "number") args.push("--duration", String(p.duration));
  if (typeof p.errors === "number") args.push("--errors", String(p.errors));

  return runCm(args, p);
}

export async function cassMemoryDoctor(params: CassMemoryExecOptions = {}): Promise<CassMemoryResult> {
  // Try real cm first
  const cmPath = await findCmBinary(params.cmPath);
  if (cmPath) {
    const args = ["doctor", "--json"];
    const result = await runCm(args, params);
    if (result.ok) return result;
  }

  // Embedded fallback
  return embeddedDoctor();
}

/**
 * Check whether the real cm binary is available.
 * Useful for conditional logic in hooks/skills.
 */
export async function cassIsAvailable(cmPath?: string): Promise<{ available: boolean; version?: string; path?: string }> {
  const resolved = await findCmBinary(cmPath);
  if (!resolved) {
    return { available: false };
  }

  try {
    const { stdout } = await execFileAsync(resolved, ["--version"], { timeout: 5_000 });
    return { available: true, version: stdout.trim(), path: resolved };
  } catch {
    return { available: false };
  }
}

/**
 * Reset the cached cm binary path. Useful after installation.
 */
export function cassResetCache(): void {
  _cmPathCache = undefined;
}
