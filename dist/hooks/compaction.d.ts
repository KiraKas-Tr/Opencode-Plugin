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
    todos?: Array<{
        id: string;
        content: string;
        status: string;
    }>;
    sessionSummary?: string;
}
/**
 * Read beads-village state from the actual beads infrastructure:
 * - .beads/metadata.json for DB config
 * - .reservations/ for active file locks
 * - `bd ls` command for current task status (if bd CLI available)
 */
export declare function readBeadsState(projectDir: unknown): BeadsState | undefined;
/**
 * Read memory references from .opencode/memory/ subdirectories.
 * Scans for .md files in subdirs: specs/, plans/, research/, reviews/, handoffs/, beads/
 * Extracts title from first heading or filename.
 */
export declare function readMemoryRefs(projectDir: unknown, limit?: number): MemoryRef[];
export declare function buildCompactionBlock(payload: CompactionPayload, maxChars?: number): string;
export declare function collectCompactionPayload(projectDir: unknown, config?: CompactionConfig): CompactionPayload;
export declare function formatCompactionLog(payload: CompactionPayload): string;
//# sourceMappingURL=compaction.d.ts.map