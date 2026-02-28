import { openMemoryDb } from "./memory-db";

export interface ObservationParams {
  type: "learning" | "decision" | "blocker" | "progress" | "handoff";
  narrative: string;
  facts?: string[];
  confidence?: number;
  files_read?: string[];
  files_modified?: string[];
  bead_id?: string;
  concepts?: string[];
  expires_at?: string;
}

export interface ObservationResult {
  id: number;
  type: string;
  narrative: string;
  facts: string[];
  confidence: number;
  files_read: string[];
  files_modified: string[];
  concepts: string[];
  bead_id?: string;
  created_at: string;
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

function getDb() {
  return openMemoryDb();
}

export function createObservation(params: unknown): ObservationResult | null {
  // Validate params
  if (!params || typeof params !== "object") {
    return null;
  }
  
  const p = params as Partial<ObservationParams>;
  
  if (!p.type || !p.narrative) {
    return null;
  }
  
  const db = getDb();
  try {

    const sql = `
      INSERT INTO observations (type, narrative, facts, confidence, files_read, files_modified, concepts, bead_id, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(sql).run(
      p.type,
      p.narrative,
      JSON.stringify(p.facts || []),
      p.confidence || 1.0,
      JSON.stringify(p.files_read || []),
      JSON.stringify(p.files_modified || []),
      JSON.stringify(p.concepts || []),
      p.bead_id || null,
      p.expires_at || null
    );

    return {
      id: result.lastInsertRowid as number,
      type: p.type,
      narrative: p.narrative,
      facts: p.facts || [],
      confidence: p.confidence || 1.0,
      files_read: p.files_read || [],
      files_modified: p.files_modified || [],
      concepts: p.concepts || [],
      bead_id: p.bead_id,
      created_at: new Date().toISOString(),
    };
  } finally {
    db.close();
  }
}

export function getObservationsByType(type: string, limit = 10): ObservationResult[] {
  if (typeof type !== "string" || !type.trim()) {
    return [];
  }
  const db = getDb();
  const safeLimit = normalizeLimit(limit, 10);
  try {

    const sql = `SELECT * FROM observations WHERE type = ? ORDER BY created_at DESC LIMIT ?`;
    let rows: any[] = [];
    try {
      rows = db.prepare(sql).all(type.trim(), safeLimit) as any[];
    } catch (err) {
      if (err instanceof Error && /datatype mismatch/i.test(err.message)) {
        // Retry with a stringified limit to handle SQLite type mismatch quirks
        try {
          rows = db.prepare(sql).all(type.trim(), String(safeLimit)) as any[];
        } catch {
          return [];
        }
      } else {
        return [];
      }
    }

    return rows.map((row) => ({
      ...row,
      facts: parseStringArray(row.facts),
      files_read: parseStringArray(row.files_read),
      files_modified: parseStringArray(row.files_modified),
      concepts: parseStringArray(row.concepts),
    }));
  } finally {
    db.close();
  }
}

export function getObservationsByBead(beadId: string): ObservationResult[] {
  if (typeof beadId !== "string" || !beadId.trim()) {
    return [];
  }
  const db = getDb();
  try {

    const sql = `SELECT * FROM observations WHERE bead_id = ? ORDER BY created_at DESC`;
    let rows: any[] = [];
    try {
      rows = db.prepare(sql).all(beadId.trim()) as any[];
    } catch {
      return [];
    }

    return rows.map((row) => ({
      ...row,
      facts: parseStringArray(row.facts),
      files_read: parseStringArray(row.files_read),
      files_modified: parseStringArray(row.files_modified),
      concepts: parseStringArray(row.concepts),
    }));
  } finally {
    db.close();
  }
}

export function linkObservations(observationId: number, concept: string): void {
  const db = getDb();
  try {

    const row = db.prepare("SELECT concepts FROM observations WHERE id = ?").get(observationId) as { concepts: string } | undefined;

    if (row) {
      const concepts = parseStringArray(row.concepts);
      if (!concepts.includes(concept)) {
        concepts.push(concept);
        db.prepare("UPDATE observations SET concepts = ? WHERE id = ?").run(JSON.stringify(concepts), observationId);
  }
}
  } finally {
    db.close();
  }
}
