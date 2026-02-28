import * as path from "path";
import * as fs from "fs";
import { Database } from "bun:sqlite";

const MEMORY_DIR = path.join(process.cwd(), ".opencode", "memory");
const BEADS_DIR = path.join(process.cwd(), ".beads");
const MEMORY_DB = path.join(MEMORY_DIR, "memory.db");

export interface BeadsMemorySyncParams {
  operation: "sync_to_memory" | "sync_from_memory" | "link" | "status";
  beadId?: string;
  observationId?: number;
}

export interface BeadsMemorySyncResult {
  success: boolean;
  operation: string;
  details: {
    tasksSynced?: number;
    observationsLinked?: number;
    memoryCount?: number;
    activeTasks?: number;
  };
}

function getMemoryDb(): Database {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
  const db = new Database(MEMORY_DB);
  
  // Ensure table exists with all columns
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
    )
  `);
  
  // Migration: add missing columns
  try { db.exec(`ALTER TABLE observations ADD COLUMN concepts TEXT DEFAULT '[]'`); } catch {}
  try { db.exec(`ALTER TABLE observations ADD COLUMN bead_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE observations ADD COLUMN expires_at TEXT`); } catch {}
  
  return db;
}

function getBeadsDb(): Database | null {
  const beadsDbPath = path.join(BEADS_DIR, "beads.db");
  if (!fs.existsSync(beadsDbPath)) {
    return null;
  }
  return new Database(beadsDbPath);
}

export function beadsMemorySync(params: unknown): BeadsMemorySyncResult {
  if (!params || typeof params !== "object") {
    return { success: false, operation: "unknown", details: {} };
  }
  const p = params as Partial<BeadsMemorySyncParams>;
  if (!p.operation) {
    return { success: false, operation: "unknown", details: {} };
  }
  
  switch (p.operation) {
    case "sync_to_memory":
      return syncTasksToMemory();
    case "sync_from_memory":
      return syncMemoryToTasks();
    case "link":
      if (!p.beadId || !p.observationId) {
        return { success: false, operation: "link", details: {} };
      }
      return linkObservationToTask(p.observationId, p.beadId);
    case "status":
      return getSyncStatus();
    default:
      return { success: false, operation: p.operation, details: {} };
  }
}

function syncTasksToMemory(): BeadsMemorySyncResult {
  const beadsDb = getBeadsDb();
  if (!beadsDb) {
    return { success: false, operation: "sync_to_memory", details: { tasksSynced: 0 } };
  }
  
  const memoryDb = getMemoryDb();
  
  const tasks = beadsDb.query("SELECT * FROM issues WHERE status = 'done'").all() as Array<{
    id: string;
    t: string;
    desc?: string;
  }>;
  
  let synced = 0;
  const insertStmt = memoryDb.prepare(`
    INSERT OR IGNORE INTO observations (type, narrative, facts, bead_id)
    VALUES ('progress', ?, '[]', ?)
  `);
  
  for (const task of tasks) {
    try {
      insertStmt.run(task.t, task.id);
      synced++;
    } catch {}
  }
  
  beadsDb.close();
  
  return {
    success: true,
    operation: "sync_to_memory",
    details: { tasksSynced: synced },
  };
}

function syncMemoryToTasks(): BeadsMemorySyncResult {
  const beadsDb = getBeadsDb();
  if (!beadsDb) {
    return { success: false, operation: "sync_from_memory", details: {} };
  }
  
  const memoryDb = getMemoryDb();
  
  const observations = memoryDb.query(`
    SELECT * FROM observations 
    WHERE bead_id IS NOT NULL 
    AND type IN ('blocker', 'decision')
  `).all() as Array<{
    id: number;
    type: string;
    narrative: string;
    bead_id: string;
  }>;
  
  let linked = 0;
  
  for (const obs of observations) {
    const existing = beadsDb.query("SELECT id FROM issues WHERE id = ?").get(obs.bead_id);
    if (existing) {
      linked++;
    }
  }
  
  beadsDb.close();
  
  return {
    success: true,
    operation: "sync_from_memory",
    details: { observationsLinked: linked },
  };
}

function linkObservationToTask(observationId: number, beadId: string): BeadsMemorySyncResult {
  const memoryDb = getMemoryDb();
  
  memoryDb.run("UPDATE observations SET bead_id = ? WHERE id = ?", [beadId, observationId]);
  
  return {
    success: true,
    operation: "link",
    details: { observationsLinked: 1 },
  };
}

function getSyncStatus(): BeadsMemorySyncResult {
  const memoryDb = getMemoryDb();
  
  const memoryCount = memoryDb.query("SELECT COUNT(*) as count FROM observations").get() as { count: number };
  
  const beadsDb = getBeadsDb();
  let activeTasks = 0;
  
  if (beadsDb) {
    const taskCount = beadsDb.query("SELECT COUNT(*) as count FROM issues WHERE status != 'closed'").get() as { count: number };
    activeTasks = taskCount.count;
    beadsDb.close();
  }
  
  return {
    success: true,
    operation: "status",
    details: {
      memoryCount: memoryCount.count,
      activeTasks,
    },
  };
}
