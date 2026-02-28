import * as path from "path";
import * as fs from "fs";
import { Database } from "bun:sqlite";
import { openMemoryDb } from "./memory-db";

const BEADS_DIR = path.join(process.cwd(), ".beads");

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

function getMemoryDb() {
  return openMemoryDb();
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
  try {
    const tasks = beadsDb.query(`
      SELECT id, title, description, t, desc
      FROM issues
      WHERE status IN ('done', 'closed')
    `).all() as Array<{
      id: string;
      title?: string;
      description?: string;
      t?: string;
      desc?: string;
    }>;
  
    let synced = 0;
    const existsStmt = memoryDb.prepare(`
      SELECT id FROM observations WHERE type = 'progress' AND bead_id = ? AND narrative = ? LIMIT 1
    `);
    const insertStmt = memoryDb.prepare(`
      INSERT INTO observations (type, narrative, facts, bead_id)
      VALUES ('progress', ?, '[]', ?)
    `);
  
    for (const task of tasks) {
      const narrative = task.title || task.t || task.description || task.desc || task.id;
      const existing = existsStmt.get(task.id, narrative);
      if (existing) {
        continue;
}
      insertStmt.run(narrative, task.id);
      synced += 1;
    }

    return {
      success: true,
      operation: "sync_to_memory",
      details: { tasksSynced: synced },
    };
  } finally {
    memoryDb.close();
    beadsDb.close();
  }
}

function syncMemoryToTasks(): BeadsMemorySyncResult {
  const beadsDb = getBeadsDb();
  if (!beadsDb) {
    return { success: false, operation: "sync_from_memory", details: {} };
  }
  
  const memoryDb = getMemoryDb();
  try {
    beadsDb.exec(`
      CREATE TABLE IF NOT EXISTS issue_observations (
        issue_id TEXT NOT NULL,
        observation_id INTEGER NOT NULL,
        observation_type TEXT NOT NULL,
        narrative TEXT NOT NULL,
        synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (issue_id, observation_id)
      )
    `);
  
    const observations = memoryDb.query(`
      SELECT id, type, narrative, bead_id
      FROM observations
      WHERE bead_id IS NOT NULL
      AND type IN ('blocker', 'decision')
    `).all() as Array<{
      id: number;
      type: string;
      narrative: string;
      bead_id: string;
    }>;

    let linked = 0;
    const issueExistsStmt = beadsDb.prepare("SELECT id FROM issues WHERE id = ? LIMIT 1");
    const linkStmt = beadsDb.prepare(`
      INSERT OR IGNORE INTO issue_observations (issue_id, observation_id, observation_type, narrative)
      VALUES (?, ?, ?, ?)
    `);

    for (const obs of observations) {
      const existingIssue = issueExistsStmt.get(obs.bead_id);
      if (!existingIssue) {
        continue;
      }
      const result = linkStmt.run(obs.bead_id, obs.id, obs.type, obs.narrative);
      if (result.changes > 0) {
        linked += 1;
      }
    }

    return {
      success: true,
      operation: "sync_from_memory",
      details: { observationsLinked: linked },
    };
  } finally {
    memoryDb.close();
    beadsDb.close();
  }
}

function linkObservationToTask(observationId: number, beadId: string): BeadsMemorySyncResult {
  const memoryDb = getMemoryDb();
  try {
  memoryDb.run("UPDATE observations SET bead_id = ? WHERE id = ?", [beadId, observationId]);
  
  return {
    success: true,
    operation: "link",
    details: { observationsLinked: 1 },
  };
  } finally {
    memoryDb.close();
  }
}

function getSyncStatus(): BeadsMemorySyncResult {
  const memoryDb = getMemoryDb();
  const beadsDb = getBeadsDb();
  try {
    const memoryCount = memoryDb.query("SELECT COUNT(*) as count FROM observations").get() as { count: number };

  let activeTasks = 0;
    if (beadsDb) {
      const taskCount = beadsDb.query("SELECT COUNT(*) as count FROM issues WHERE status != 'closed'").get() as { count: number };
      activeTasks = taskCount.count;
    }

    return {
      success: true,
      operation: "status",
      details: {
        memoryCount: memoryCount.count,
        activeTasks,
      },
    };
  } finally {
    memoryDb.close();
    beadsDb?.close();
  }
}
