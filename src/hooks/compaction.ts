/**
 * Compaction Hook
 *
 * Injects beads-village state and memory references when a session
 * is being compacted (context window nearing limit). Ensures critical
 * state survives compaction so agents don't lose task context.
 * Runs on session.idle / compaction event.
 *
 * Beads state: reads from .beads/metadata.json + .reservations/
 * Memory refs: scans .opencode/memory/ subdirs for .md files
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface CompactionConfig {
  enabled?: boolean;
  include_beads_state?: boolean;
  include_memory_refs?: boolean;
  include_todo_state?: boolean;
  max_state_chars?: number;
}

export interface BeadsState {
  currentTask?: string;
  taskId?: string;
  reservedFiles?: string[];
  agentId?: string;
  team?: string;
  inProgressCount?: number;
  openCount?: number;
}

export interface MemoryRef {
  key: string;
  summary: string;
  timestamp: number;
  category: string;
}

export interface CompactionPayload {
  beads?: BeadsState;
  memories?: MemoryRef[];
  todos?: Array<{ id: string; content: string; status: string }>;
  sessionSummary?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isTodoStatus(value: unknown): value is "todo" | "in-progress" | "in_progress" | "completed" {
  return value === "todo" || value === "in-progress" || value === "in_progress" || value === "completed";
}

function normalizeTodoEntries(todos: unknown): Array<{ id: string; content: string; status: string }> {
  if (!Array.isArray(todos)) {
    return [];
  }

  const normalized: Array<{ id: string; content: string; status: string }> = [];
  for (const entry of todos) {
    if (!isRecord(entry) || !isTodoStatus(entry.status)) {
      continue;
    }
    normalized.push({
      id: typeof entry.id === "string" ? entry.id : "unknown",
      content: typeof entry.content === "string" ? entry.content : "(no content)",
      status: entry.status === "in_progress" ? "in-progress" : entry.status,
    });
  }

  return normalized;
}

/**
 * Read beads-village state from the actual beads infrastructure:
 * - .beads/metadata.json for DB config
 * - .reservations/ for active file locks
 * - `bd ls` command for current task status (if bd CLI available)
 */
export function readBeadsState(projectDir: unknown): BeadsState | undefined {
  if (typeof projectDir !== "string" || !projectDir) {
    return undefined;
  }
  const beadsDir = path.join(projectDir, ".beads");
  if (!fs.existsSync(beadsDir)) return undefined;

  const state: BeadsState = {};

  // Read metadata to confirm beads is initialized
  try {
    const metaPath = path.join(beadsDir, "metadata.json");
    if (!fs.existsSync(metaPath)) return undefined;

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    if (!meta.database) return undefined;
  } catch {
    return undefined;
  }

  // Read active reservations
  const reservationsDir = path.join(projectDir, ".reservations");
  if (fs.existsSync(reservationsDir)) {
    try {
        const lockFiles = fs.readdirSync(reservationsDir).filter((f) => f.endsWith(".lock"));
        const reservedFiles: string[] = [];
        for (const lockFile of lockFiles) {
          try {
            const raw = fs.readFileSync(path.join(reservationsDir, lockFile), "utf-8");
            const lock = JSON.parse(raw);
            if (isRecord(lock) && typeof lock.path === "string") {
              reservedFiles.push(lock.path);
            }
            if (isRecord(lock) && typeof lock.agent === "string") {
              state.agentId = lock.agent;
            }
          } catch {
            // Skip corrupt lock files
          }
      }
      if (reservedFiles.length > 0) {
        state.reservedFiles = reservedFiles;
      }
    } catch {
      // ignore
    }
  }

  // Try to get current task info via bd CLI
  try {
    const output = execSync("bd ls --status in_progress --json 2>/dev/null", {
      cwd: projectDir,
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (output.trim()) {
      const tasks = JSON.parse(output);
      if (Array.isArray(tasks) && tasks.length > 0) {
        const first = tasks[0];
        if (isRecord(first)) {
          const title = typeof first.title === "string" ? first.title : undefined;
          const shortTitle = typeof first.t === "string" ? first.t : undefined;
          const id = typeof first.id === "string" ? first.id : undefined;
          if (title || shortTitle) state.currentTask = title || shortTitle;
          if (id) state.taskId = id;
        }
        state.inProgressCount = tasks.length;
      }
    }
  } catch {
    // bd CLI not available or no in-progress tasks — that's fine
  }

  // Try to get open task count
  try {
    const output = execSync("bd ls --status open --json 2>/dev/null", {
      cwd: projectDir,
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (output.trim()) {
      const tasks = JSON.parse(output);
      if (Array.isArray(tasks)) {
        state.openCount = tasks.length;
      }
    }
  } catch {
    // ignore
  }

  // Only return if we have meaningful state
  if (state.currentTask || state.reservedFiles?.length || state.agentId || state.inProgressCount || state.openCount) {
    return state;
  }

  return undefined;
}

/**
 * Read memory references from .opencode/memory/ subdirectories.
 * Scans for .md files in subdirs: specs/, plans/, research/, reviews/, handoffs/, beads/
 * Extracts title from first heading or filename.
 */
export function readMemoryRefs(projectDir: unknown, limit: number = 10): MemoryRef[] {
  if (typeof projectDir !== "string" || !projectDir) {
    return [];
  }
  const memoryDir = path.join(projectDir, ".opencode", "memory");
  if (!fs.existsSync(memoryDir)) return [];

  const MEMORY_SUBDIRS = ["specs", "plans", "research", "reviews", "handoffs", "beads", "prds"];
  const refs: MemoryRef[] = [];

  try {
    for (const subdir of MEMORY_SUBDIRS) {
      const subdirPath = path.join(memoryDir, subdir);
      if (!fs.existsSync(subdirPath)) continue;

      const files = fs.readdirSync(subdirPath)
        .filter((f) => f.endsWith(".md") || f.endsWith(".json"))
        .sort();

      for (const file of files) {
        if (file === ".gitkeep") continue;

        try {
          const fullPath = path.join(subdirPath, file);
          const stat = fs.statSync(fullPath);
          const raw = fs.readFileSync(fullPath, "utf-8");

          if (typeof raw !== "string" || !raw.trim()) continue;

          let summary: string;
          const ext = path.extname(file);

          if (ext === ".md") {
            const headingMatch = raw.match(/^#\s+(.+)$/m);
            summary = headingMatch ? headingMatch[1] : raw.substring(0, 100).trim();
          } else if (ext === ".json") {
             const parsed = JSON.parse(raw);
             const safe = isRecord(parsed) ? parsed : {};
             const content = safe.content;
             const summaryText = typeof safe.summary === "string" ? safe.summary : undefined;
             const titleText = typeof safe.title === "string" ? safe.title : undefined;
             const contentText = typeof content === "string" ? content.substring(0, 100) : "";
             summary = summaryText || titleText || contentText || "";
           } else {
             summary = raw.substring(0, 100).trim();
           }

          refs.push({
            key: path.basename(file, ext),
            summary,
            timestamp: stat.mtimeMs,
            category: subdir,
          });
        } catch {
          // Skip unreadable files
        }
      }
    }

    // Sort by most recent, limit
    return refs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function buildCompactionBlock(payload: CompactionPayload, maxChars: number = 5000): string {
  const lines: string[] = ["<compaction-context>"];

  if (payload.sessionSummary) {
    lines.push(`\nSession Summary: ${payload.sessionSummary}`);
  }

  if (payload.beads) {
    lines.push("\nBeads State:");
    if (payload.beads.currentTask) lines.push(`  Current task: ${payload.beads.currentTask}`);
    if (payload.beads.taskId) lines.push(`  Task ID: ${payload.beads.taskId}`);
    if (payload.beads.agentId) lines.push(`  Agent: ${payload.beads.agentId}`);
    if (payload.beads.team) lines.push(`  Team: ${payload.beads.team}`);
    if (payload.beads.inProgressCount) lines.push(`  In-progress tasks: ${payload.beads.inProgressCount}`);
    if (payload.beads.openCount) lines.push(`  Open tasks: ${payload.beads.openCount}`);
    if (payload.beads.reservedFiles?.length) {
      lines.push(`  Reserved files: ${payload.beads.reservedFiles.join(", ")}`);
    }
  }

   const normalizedTodos = normalizeTodoEntries(payload.todos);
   if (normalizedTodos.length) {
     lines.push("\nTodo State:");
    for (const todo of normalizedTodos) {
      const icon = todo.status === "completed" ? "[x]" : todo.status === "in-progress" ? "[~]" : "[ ]";
      lines.push(`  ${icon} ${todo.id}: ${todo.content}`);
    }
  }

  if (payload.memories?.length) {
    lines.push("\nRecent Memory References:");
    for (const mem of payload.memories) {
      lines.push(`  - [${mem.category}] ${mem.key}: ${mem.summary}`);
    }
  }

  lines.push("</compaction-context>");

  const block = lines.join("\n");
  if (typeof block !== "string") return "<compaction-context>\n</compaction-context>";
  if (block.length > maxChars) {
    return block.substring(0, maxChars) + "\n... [compaction context truncated]\n</compaction-context>";
  }

  return block;
}

export function collectCompactionPayload(
  projectDir: unknown,
  config?: CompactionConfig
): CompactionPayload {
  const payload: CompactionPayload = {};

  if (typeof projectDir !== "string" || !projectDir) {
    return payload;
  }

  if (config?.include_beads_state !== false) {
    payload.beads = readBeadsState(projectDir);
  }

  if (config?.include_memory_refs !== false) {
    payload.memories = readMemoryRefs(projectDir);
  }

  return payload;
}

export function formatCompactionLog(payload: CompactionPayload): string {
  const parts: string[] = [];
  if (payload.beads) parts.push("beads-state");
  if (payload.memories?.length) parts.push(`${payload.memories.length} memories`);
  if (payload.todos?.length) parts.push(`${payload.todos.length} todos`);
  return `[CliKit:compaction] Injected: ${parts.join(", ") || "nothing"}`;
}
