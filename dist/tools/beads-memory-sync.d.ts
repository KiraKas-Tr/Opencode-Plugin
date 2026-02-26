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
export declare function beadsMemorySync(params: unknown): BeadsMemorySyncResult;
//# sourceMappingURL=beads-memory-sync.d.ts.map