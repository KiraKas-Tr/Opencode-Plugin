import * as path from "path";
import * as fs from "fs";
import { Database } from "bun:sqlite";

const MEMORY_DIR = path.join(process.cwd(), ".opencode", "memory");
const MEMORY_DB = path.join(MEMORY_DIR, "memory.db");

export interface MemoryObservation {
  id: number;
  type: string;
  narrative: string;
  facts: string[];
  confidence: number;
  files_read: string[];
  files_modified: string[];
  created_at: string;
  expires_at?: string;
}

function parseStringArray(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function normalizeLimit(value: unknown, fallback = 10): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.floor(value));
}

function getDb(): Database {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
  
  const db = new Database(MEMORY_DB);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      narrative TEXT NOT NULL,
      facts TEXT DEFAULT '[]',
      confidence REAL DEFAULT 1.0,
      files_read TEXT DEFAULT '[]',
      files_modified TEXT DEFAULT '[]',
      concepts TEXT DEFAULT '[]',
      bead_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT
    );
    
    CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
      id UNINDEXED,
      type,
      narrative,
      facts,
      content='observations',
      content_rowid='id'
    );
    
    CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
      INSERT INTO observations_fts (id, type, narrative, facts)
      VALUES (new.id, new.type, new.narrative, new.facts);
    END;
    
    CREATE TRIGGER IF NOT EXISTS observations_ad AFTER DELETE ON observations BEGIN
      INSERT INTO observations_fts (observations_fts, id, type, narrative, facts)
      VALUES ('delete', old.id, old.type, old.narrative, old.facts);
    END;
    
    CREATE TRIGGER IF NOT EXISTS observations_au AFTER UPDATE ON observations BEGIN
      INSERT INTO observations_fts (observations_fts, id, type, narrative, facts)
      VALUES ('delete', old.id, old.type, old.narrative, old.facts);
      INSERT INTO observations_fts (id, type, narrative, facts)
      VALUES (new.id, new.type, new.narrative, new.facts);
    END;
  `);
  
  // Migration: add missing columns if they don't exist
  try { db.exec(`ALTER TABLE observations ADD COLUMN concepts TEXT DEFAULT '[]'`); } catch {}
  try { db.exec(`ALTER TABLE observations ADD COLUMN bead_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE observations ADD COLUMN expires_at TEXT`); } catch {}
  
  return db;
}

export function memoryRead(relativePath: string): string | null {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    return null;
  }

  const fullPath = path.join(MEMORY_DIR, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  
  return fs.readFileSync(fullPath, "utf-8");
}

export interface MemorySearchParams {
  query: string;
  type?: string;
  limit?: number;
}

export interface MemorySearchResult {
  id: number;
  type: string;
  narrative: string;
  confidence: number;
  created_at: string;
}

export function memorySearch(params: unknown): MemorySearchResult[] {
  if (!params || typeof params !== "object") {
    return [];
  }
  const p = params as Partial<MemorySearchParams>;
  if (!p.query || typeof p.query !== "string") {
    return [];
  }
  
  const db = getDb();
  const limit = normalizeLimit(p.limit, 10);
  
  let sql: string;
  let args: (string | number)[];
  
  if (p.type) {
    sql = `
      SELECT o.id, o.type, o.narrative, o.confidence, o.created_at
      FROM observations o
      JOIN observations_fts fts ON o.id = fts.id
      WHERE observations_fts MATCH ? AND o.type = ?
      ORDER BY o.confidence DESC, o.created_at DESC
      LIMIT ?
    `;
    args = [p.query, p.type, limit];
  } else {
    sql = `
      SELECT o.id, o.type, o.narrative, o.confidence, o.created_at
      FROM observations o
      JOIN observations_fts fts ON o.id = fts.id
      WHERE observations_fts MATCH ?
      ORDER BY o.confidence DESC, o.created_at DESC
      LIMIT ?
    `;
    args = [p.query, limit];
  }
  
  const rows = db.prepare(sql).all(...args) as MemorySearchResult[];
  return rows;
}

export function memoryGet(ids: unknown): MemoryObservation[] {
  if (typeof ids !== "string" || !ids) {
    return [];
  }
  const db = getDb();
  const idList = ids
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => Number.isFinite(id));
  if (idList.length === 0) {
    return [];
  }
  
  const placeholders = idList.map(() => "?").join(",");
  const sql = `SELECT * FROM observations WHERE id IN (${placeholders})`;
  
  const rows = db.prepare(sql).all(...idList) as any[];
  
  return rows.map((row) => ({
    ...row,
    facts: parseStringArray(row.facts),
    files_read: parseStringArray(row.files_read),
    files_modified: parseStringArray(row.files_modified),
  }));
}

export interface MemoryTimelineParams {
  id: number;
  before?: number;
  after?: number;
}

export function memoryTimeline(params: unknown): MemoryObservation[] {
  if (!params || typeof params !== "object") {
    return [];
  }
  const p = params as Partial<MemoryTimelineParams>;
  if (typeof p.id !== "number") {
    return [];
  }
  
  const db = getDb();
  const before = normalizeLimit(p.before, 3);
  const after = normalizeLimit(p.after, 3);
  
  const sql = `
    SELECT * FROM (
      SELECT * FROM observations WHERE id < ? ORDER BY id DESC LIMIT ?
      UNION
      SELECT * FROM observations WHERE id = ?
      UNION
      SELECT * FROM observations WHERE id > ? ORDER BY id ASC LIMIT ?
    ) ORDER BY id ASC
  `;
  
  const rows = db.prepare(sql).all(
    p.id, before,
    p.id,
    p.id, after
  ) as any[];
  
  return rows.map((row) => ({
    ...row,
    facts: parseStringArray(row.facts),
    files_read: parseStringArray(row.files_read),
    files_modified: parseStringArray(row.files_modified),
  }));
}

export interface MemoryUpdateParams {
  type: string;
  narrative: string;
  facts?: string[];
  confidence?: number;
  files_read?: string[];
  files_modified?: string[];
  expires_at?: string;
}

export function memoryUpdate(params: unknown): { id: number } | null {
  if (!params || typeof params !== "object") {
    return null;
  }
  const p = params as Partial<MemoryUpdateParams>;
  if (!p.type || !p.narrative) {
    return null;
  }
  
  const db = getDb();
  
  const sql = `
    INSERT INTO observations (type, narrative, facts, confidence, files_read, files_modified, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = db.prepare(sql).run(
    p.type,
    p.narrative,
    JSON.stringify(p.facts || []),
    p.confidence || 1.0,
    JSON.stringify(p.files_read || []),
    JSON.stringify(p.files_modified || []),
    p.expires_at || null
  );
  
  return { id: result.lastInsertRowid as number };
}

export interface MemoryAdminParams {
  operation: "status" | "archive" | "checkpoint" | "vacuum" | "migrate";
  older_than_days?: number;
  dry_run?: boolean;
}

export interface MemoryAdminResult {
  operation: string;
  success: boolean;
  details: Record<string, unknown>;
}

export function memoryAdmin(params: unknown): MemoryAdminResult {
  if (!params || typeof params !== "object") {
    return { operation: "unknown", success: false, details: { error: "Invalid params" } };
  }
  const p = params as Partial<MemoryAdminParams>;
  if (!p.operation) {
    return { operation: "unknown", success: false, details: { error: "Missing operation" } };
  }
  
  const db = getDb();
  
  switch (p.operation) {
    case "status": {
      const count = db.prepare("SELECT COUNT(*) as count FROM observations").get() as { count: number };
      const types = db.prepare("SELECT type, COUNT(*) as count FROM observations GROUP BY type").all() as { type: string; count: number }[];
      return {
        operation: "status",
        success: true,
        details: { total_observations: count.count, by_type: types },
      };
    }
    
    case "archive": {
      const days = p.older_than_days || 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      if (p.dry_run) {
        const count = db.prepare("SELECT COUNT(*) as count FROM observations WHERE created_at < ?").get(cutoff) as { count: number };
        return {
          operation: "archive",
          success: true,
          details: { would_archive: count.count, cutoff_date: cutoff },
        };
      }
      
      const result = db.prepare("DELETE FROM observations WHERE created_at < ?").run(cutoff);
      return {
        operation: "archive",
        success: true,
        details: { archived: result.changes, cutoff_date: cutoff },
      };
    }
    
    case "checkpoint": {
      const checkpointPath = path.join(MEMORY_DIR, `checkpoint-${Date.now()}.db`);
      fs.copyFileSync(MEMORY_DB, checkpointPath);
      return {
        operation: "checkpoint",
        success: true,
        details: { checkpoint_path: checkpointPath },
      };
    }
    
    case "vacuum": {
      db.exec("VACUUM");
      const stats = fs.statSync(MEMORY_DB);
      return {
        operation: "vacuum",
        success: true,
        details: { db_size_bytes: stats.size },
      };
    }
    
    case "migrate": {
      return {
        operation: "migrate",
        success: true,
        details: { message: "Migration not implemented - SQLite is already the storage backend" },
      };
    }
    
    default:
      return {
        operation: p.operation || "unknown",
        success: false,
        details: { error: "Unknown operation" },
      };
  }
}
