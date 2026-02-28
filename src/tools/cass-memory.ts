import { openMemoryDb } from "./memory-db";
import { memoryAdmin, memoryGet, memorySearch, memoryUpdate, type MemorySearchResult } from "./memory";

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
}

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
  if (!match) {
    return null;
  }
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function toLikePattern(text: string): string {
  return `%"${text.replace(/[\\%_]/g, "\\$&")}"%`;
}

function invertToAntiPattern(content: string): string {
  const text = content.trim();
  if (!text) {
    return "PITFALL: Avoid repeating this pattern without validation";
  }
  if (/^always\s+/i.test(text)) {
    return `PITFALL: Don't ${text.replace(/^always\s+/i, "").toLowerCase()}`;
  }
  if (/^use\s+/i.test(text)) {
    return `PITFALL: Avoid ${text.charAt(0).toLowerCase()}${text.slice(1)} without careful validation`;
  }
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
        if (row.type === "cass_feedback_harmful") {
          harmful = row.count;
        } else if (row.type === "cass_feedback_helpful") {
          helpful = row.count;
        }
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
        SELECT id
        FROM observations
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
  if (harmful < ANTI_PATTERN_FEEDBACK_THRESHOLD || harmful <= helpful) {
    return;
  }
  if (antiPatternAlreadyExists(bulletId)) {
    return;
  }

  const sourceId = parseObservationId(bulletId);
  if (!sourceId) {
    return;
  }

  const source = memoryGet(String(sourceId))[0];
  if (!source) {
    return;
  }

  const reasonSuffix = reason?.trim() ? ` Reason: ${reason.trim()}` : "";
  const narrative = `${invertToAntiPattern(source.narrative)} (derived from ${bulletId} after ${harmful} harmful marks.${reasonSuffix})`;
  memoryUpdate({
    type: "cass_anti_pattern",
    narrative,
    facts: [bulletId, `source:${sourceId}`, `harmful:${harmful}`, `helpful:${helpful}`],
    confidence: Math.min(1, 0.6 + harmful * 0.05),
  });
}

export function cassMemoryContext(params: unknown): CassMemoryResult<InternalContextResult> {
  if (!params || typeof params !== "object") {
    return { ok: false, command: ["internal", "context"], error: "Invalid params" };
  }

  const p = params as Partial<CassMemoryContextParams>;
  if (!p.task || typeof p.task !== "string") {
    return { ok: false, command: ["internal", "context"], error: "Missing task" };
  }

  const limit = typeof p.limit === "number" && Number.isFinite(p.limit) ? Math.max(1, Math.floor(p.limit)) : 10;
  const searchLimit = Math.max(limit * 4, 20);
  const rows = memorySearch({ query: p.task, limit: searchLimit });
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
    command: ["internal", "context"],
    data: {
      task: p.task,
      relevantBullets,
      antiPatterns,
      historySnippets: rankedRows.slice(0, Math.max(limit * 2, 10)).map(({ relevanceScore: _score, ...row }) => row),
      degraded: {
        cass: {
          available: false,
          reason: "Running in embedded CliKit mode (no external cm/cass binary).",
          suggestedFix: ["None required for plugin-local usage."],
        },
      },
    },
  };
}

export function cassMemoryMark(params: unknown): CassMemoryResult<{ id: number }> {
  if (!params || typeof params !== "object") {
    return { ok: false, command: ["internal", "mark"], error: "Invalid params" };
  }

  const p = params as Partial<CassMemoryMarkParams>;
  if (!p.bulletId || typeof p.bulletId !== "string") {
    return { ok: false, command: ["internal", "mark"], error: "Missing bulletId" };
  }

  const type = p.harmful ? "cass_feedback_harmful" : "cass_feedback_helpful";
  const narrative = p.reason?.trim()
    ? `Feedback for ${p.bulletId}: ${p.reason.trim()}`
    : `Feedback for ${p.bulletId}`;

  const saved = memoryUpdate({
    type,
    narrative,
    facts: [p.bulletId],
    confidence: 1.0,
  });

  if (!saved) {
    return { ok: false, command: ["internal", "mark"], error: "Failed to save feedback" };
  }

  if (p.harmful) {
    maybePromoteToAntiPattern(p.bulletId, p.reason);
  }

  return { ok: true, command: ["internal", "mark"], data: saved };
}

export function cassMemoryReflect(params: unknown = {}): CassMemoryResult {
  const p = (params && typeof params === "object" ? params : {}) as Partial<CassMemoryReflectParams>;
  return {
    ok: true,
    command: ["internal", "reflect"],
    data: {
      reflected: true,
      mode: "embedded",
      days: p.days ?? 7,
      maxSessions: p.maxSessions ?? 10,
      dryRun: !!p.dryRun,
    },
  };
}

export function cassMemoryDoctor(_params: CassMemoryExecOptions = {}): CassMemoryResult {
  const status = memoryAdmin({ operation: "status" });
  return {
    ok: status.success,
    command: ["internal", "doctor"],
    data: {
      mode: "embedded",
      memory: status.details,
      externalCmRequired: false,
    },
    error: status.success ? undefined : "Memory status check failed",
  };
}
