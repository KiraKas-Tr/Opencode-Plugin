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
export interface MemoryDigestConfig {
    enabled?: boolean;
    max_per_type?: number;
    include_types?: string[];
    index_highlights_per_type?: number;
    write_topic_files?: boolean;
    log?: boolean;
}
export declare function generateMemoryDigest(projectDir: unknown, config?: MemoryDigestConfig): {
    written: boolean;
    path: string;
    counts: Record<string, number>;
};
export declare function formatDigestLog(result: {
    written: boolean;
    counts: Record<string, number>;
}): string;
//# sourceMappingURL=memory-digest.d.ts.map