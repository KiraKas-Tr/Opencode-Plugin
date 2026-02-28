import * as fs from "fs";
import * as path from "path";
import { Database } from "bun:sqlite";

export interface MemoryDbPaths {
  memoryDir: string;
  memoryDbPath: string;
}

export interface OpenMemoryDbOptions {
  projectDir?: string;
  readonly?: boolean;
}

export function getMemoryPaths(projectDir = process.cwd()): MemoryDbPaths {
  const memoryDir = path.join(projectDir, ".opencode", "memory");
  const memoryDbPath = path.join(memoryDir, "memory.db");
  return { memoryDir, memoryDbPath };
}

function ensureObservationSchema(db: Database): void {
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

    CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type);
    CREATE INDEX IF NOT EXISTS idx_observations_bead_id ON observations(bead_id);
    CREATE INDEX IF NOT EXISTS idx_observations_created_at ON observations(created_at);

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

  // Backward-compatible migrations for existing DBs.
  try { db.exec(`ALTER TABLE observations ADD COLUMN concepts TEXT DEFAULT '[]'`); } catch {}
  try { db.exec(`ALTER TABLE observations ADD COLUMN bead_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE observations ADD COLUMN expires_at TEXT`); } catch {}
}

export function openMemoryDb(options: OpenMemoryDbOptions = {}): Database {
  const { projectDir, readonly = false } = options;
  const { memoryDir, memoryDbPath } = getMemoryPaths(projectDir);

  if (!readonly && !fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  const db = new Database(memoryDbPath, readonly ? { readonly: true } : undefined);

  if (!readonly) {
    ensureObservationSchema(db);
  }

  return db;
}
