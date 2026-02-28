import * as path from "path";
import * as fs from "fs";
import { Database } from "bun:sqlite";

const MEMORY_DIR = path.join(process.cwd(), ".opencode", "memory");
const MEMORY_DB = path.join(MEMORY_DIR, "memory.db");

export interface ContextSummaryParams {
  scope?: "session" | "bead" | "all";
  beadId?: string;
  maxTokens?: number;
}

export interface ContextSummaryResult {
  summary: string;
  sections: {
    decisions: string[];
    learnings: string[];
    blockers: string[];
    progress: string[];
  };
  recentFiles: {
    read: string[];
    modified: string[];
  };
  tokenEstimate: number;
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

function getMemoryDb(): Database {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
  const db = new Database(MEMORY_DB);
  
  db.run(`
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

export function contextSummary(params: unknown = {}): ContextSummaryResult {
  const p = (params && typeof params === "object" ? params : {}) as Partial<ContextSummaryParams>;
  const db = getMemoryDb();
  
  let whereClause = "1=1";
  const args: (string | number)[] = [];
  
  if (p.scope === "bead" && p.beadId) {
    whereClause = "bead_id = ?";
    args.push(p.beadId);
  }
  
  if (p.scope === "session") {
    whereClause = "created_at > datetime('now', '-1 day')";
  }
  
  const observations = db.query(`
    SELECT * FROM observations 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT 50
  `).all(...args) as Array<{
    id: number;
    type: string;
    narrative: string;
    facts: string;
    files_read: string;
    files_modified: string;
    created_at: string;
  }>;
  
  const sections = {
    decisions: observations
      .filter(o => o.type === "decision")
      .map(o => o.narrative)
      .slice(0, 5),
    learnings: observations
      .filter(o => o.type === "learning")
      .map(o => o.narrative)
      .slice(0, 5),
    blockers: observations
      .filter(o => o.type === "blocker")
      .map(o => o.narrative)
      .slice(0, 3),
    progress: observations
      .filter(o => o.type === "progress")
      .map(o => o.narrative)
      .slice(0, 5),
  };
  
  const allFilesRead = new Set<string>();
  const allFilesModified = new Set<string>();
  
  for (const obs of observations) {
    const read = parseStringArray(obs.files_read);
    const modified = parseStringArray(obs.files_modified);
    read.forEach(f => allFilesRead.add(f));
    modified.forEach(f => allFilesModified.add(f));
  }
  
  const summary = buildSummary(sections, p.maxTokens || 2000);
  const tokenEstimate = Math.ceil(summary.length / 4);
  
  return {
    summary,
    sections,
    recentFiles: {
      read: Array.from(allFilesRead).slice(0, 10),
      modified: Array.from(allFilesModified).slice(0, 10),
    },
    tokenEstimate,
  };
}

function buildSummary(
  sections: ContextSummaryResult["sections"],
  maxTokens: number
): string {
  const lines: string[] = ["## Context Summary\n"];
  
  if (sections.decisions.length > 0) {
    lines.push("### Decisions");
    sections.decisions.forEach(d => lines.push(`- ${d}`));
    lines.push("");
  }
  
  if (sections.blockers.length > 0) {
    lines.push("### Active Blockers");
    sections.blockers.forEach(b => lines.push(`- ${b}`));
    lines.push("");
  }
  
  if (sections.learnings.length > 0) {
    lines.push("### Key Learnings");
    sections.learnings.forEach(l => lines.push(`- ${l}`));
    lines.push("");
  }
  
  if (sections.progress.length > 0) {
    lines.push("### Recent Progress");
    sections.progress.forEach(p => lines.push(`- ${p}`));
  }
  
  let summary = lines.join("\n");
  
  if (summary.length > maxTokens * 4) {
    summary = summary.slice(0, maxTokens * 4) + "\n... (truncated)";
  }
  
  return summary;
}
