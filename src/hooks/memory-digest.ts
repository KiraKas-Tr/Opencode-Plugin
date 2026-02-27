/**
 * Memory Digest Hook
 *
 * Generates .opencode/memory/_digest.md on session start with
 * recent observations from the SQLite memory DB. This makes
 * past decisions, learnings, blockers, and handoffs accessible
 * to agents that can read files but cannot query SQLite directly
 * (e.g., Plan agent with bash: false).
 *
 * Runs on session.created event.
 */

import * as fs from "fs";
import * as path from "path";
import { Database } from "bun:sqlite";

export interface MemoryDigestConfig {
  enabled?: boolean;
  max_per_type?: number;
  include_types?: string[];
  index_highlights_per_type?: number;
  write_topic_files?: boolean;
  log?: boolean;
}

interface ObservationRow {
  id: number;
  type: string;
  narrative: string;
  facts: string;
  confidence: number;
  files_read: string;
  files_modified: string;
  concepts: string;
  bead_id: string | null;
  created_at: string;
}

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  try {
    return iso.split("T")[0] || iso.substring(0, 10);
  } catch {
    return iso;
  }
}

function writeTopicFile(
  memoryDir: string,
  type: string,
  heading: string,
  rows: ObservationRow[]
): void {
  const topicPath = path.join(memoryDir, `${type}.md`);
  const lines: string[] = [];
  lines.push(`# ${heading}`);
  lines.push("");
  lines.push(`> Auto-generated from SQLite observations (${rows.length} entries).`);
  lines.push("");

  for (const row of rows) {
    const date = formatDate(row.created_at);
    const facts = parseJsonArray(row.facts);
    const concepts = parseJsonArray(row.concepts);
    const filesModified = parseJsonArray(row.files_modified);

    lines.push(`## ${date} — ${row.narrative.split("\n")[0]}`);
    if (row.confidence < 1.0) {
      lines.push(`> Confidence: ${(row.confidence * 100).toFixed(0)}%`);
    }
    lines.push("");

    lines.push(row.narrative);
    lines.push("");

    if (facts.length > 0) {
      lines.push("**Facts:**");
      for (const fact of facts) {
        lines.push(`- ${fact}`);
      }
      lines.push("");
    }

    if (filesModified.length > 0) {
      lines.push(`**Files:** ${filesModified.map((f) => `\`${f}\``).join(", ")}`);
      lines.push("");
    }

    if (concepts.length > 0) {
      lines.push(`**Concepts:** ${concepts.join(", ")}`);
      lines.push("");
    }

    if (row.bead_id) {
      lines.push(`**Bead:** ${row.bead_id}`);
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  fs.writeFileSync(topicPath, lines.join("\n"), "utf-8");
}

export function generateMemoryDigest(
  projectDir: unknown,
  config?: MemoryDigestConfig
): { written: boolean; path: string; counts: Record<string, number> } {
  const result = { written: false, path: "", counts: {} as Record<string, number> };

  if (typeof projectDir !== "string" || !projectDir) return result;

  const memoryDir = path.join(projectDir, ".opencode", "memory");
  const dbPath = path.join(memoryDir, "memory.db");

  if (!fs.existsSync(dbPath)) {
    return result;
  }

  const maxPerType = config?.max_per_type ?? 10;
  const indexHighlightsPerType = config?.index_highlights_per_type ?? 2;
  const writeTopicFiles = config?.write_topic_files !== false;
  const includeTypes = config?.include_types ?? [
    "decision",
    "learning",
    "blocker",
    "progress",
    "handoff",
  ];

  let db: Database;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch {
    return result;
  }

  const sections: string[] = [];
  sections.push("# Memory Digest");
  sections.push("");
  sections.push(`> Auto-generated on ${new Date().toISOString().split("T")[0]}. Read-only reference for agents.`);
  sections.push(`> Source: \`.opencode/memory/memory.db\``);
  sections.push("");

  const typeLabels: Record<string, { heading: string; emoji: string }> = {
    decision: { heading: "Past Decisions", emoji: "🔷" },
    learning: { heading: "Learnings & Gotchas", emoji: "💡" },
    blocker: { heading: "Past Blockers", emoji: "🚧" },
    progress: { heading: "Recent Progress", emoji: "📈" },
    handoff: { heading: "Session Handoffs", emoji: "🔄" },
  };

  let totalCount = 0;

  for (const type of includeTypes) {
    try {
      const rows = db
        .prepare(
          `SELECT * FROM observations WHERE type = ? ORDER BY created_at DESC LIMIT ?`
        )
        .all(type, maxPerType) as ObservationRow[];

      if (rows.length === 0) continue;

      result.counts[type] = rows.length;
      totalCount += rows.length;

      const label = typeLabels[type] || { heading: type, emoji: "📌" };
      sections.push(`## ${label.emoji} ${label.heading}`);
      sections.push(`- Entries: ${rows.length}`);
      sections.push(`- Topic file: \`${writeTopicFiles ? `${type}.md` : "(disabled)"}\``);

      for (const row of rows.slice(0, indexHighlightsPerType)) {
        const date = formatDate(row.created_at);
        const headline = row.narrative.split("\n")[0];
        sections.push(`- ${date}: ${headline}`);
      }
      sections.push("");

      if (writeTopicFiles) {
        writeTopicFile(memoryDir, type, label.heading, rows);
      }
    } catch {
      // Skip types that fail to query
    }
  }

  try {
    db.close();
  } catch {
    // ignore
  }

  if (totalCount === 0) {
    sections.push("*No observations found in memory database.*");
    sections.push("");
  }

  const digestPath = path.join(memoryDir, "_digest.md");
  const content = sections.join("\n");

  try {
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    fs.writeFileSync(digestPath, content, "utf-8");
    result.written = true;
    result.path = digestPath;
  } catch {
    // Failed to write digest
  }

  return result;
}

export function formatDigestLog(result: {
  written: boolean;
  counts: Record<string, number>;
}): string {
  if (!result.written) {
    return "[CliKit:memory-digest] No digest generated (no DB or empty)";
  }
  const parts = Object.entries(result.counts)
    .map(([type, count]) => `${count} ${type}s`)
    .join(", ");
  return `[CliKit:memory-digest] Generated digest: ${parts || "empty"}`;
}
