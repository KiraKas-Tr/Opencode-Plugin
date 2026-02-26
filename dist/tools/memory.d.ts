export interface MemoryObservation {
    id: number;
    type: string;
    narrative: string;
    facts: string[];
    confidence: number;
    files_read: string[];
    files_modified: string[];
    created_at: string;
    expires_at?: string;
}
export declare function memoryRead(relativePath: string): string | null;
export interface MemorySearchParams {
    query: string;
    type?: string;
    limit?: number;
}
export interface MemorySearchResult {
    id: number;
    type: string;
    narrative: string;
    confidence: number;
    created_at: string;
}
export declare function memorySearch(params: unknown): MemorySearchResult[];
export declare function memoryGet(ids: unknown): MemoryObservation[];
export interface MemoryTimelineParams {
    id: number;
    before?: number;
    after?: number;
}
export declare function memoryTimeline(params: unknown): MemoryObservation[];
export interface MemoryUpdateParams {
    type: string;
    narrative: string;
    facts?: string[];
    confidence?: number;
    files_read?: string[];
    files_modified?: string[];
    expires_at?: string;
}
export declare function memoryUpdate(params: unknown): {
    id: number;
} | null;
export interface MemoryAdminParams {
    operation: "status" | "archive" | "checkpoint" | "vacuum" | "migrate";
    older_than_days?: number;
    dry_run?: boolean;
}
export interface MemoryAdminResult {
    operation: string;
    success: boolean;
    details: Record<string, unknown>;
}
export declare function memoryAdmin(params: unknown): MemoryAdminResult;
//# sourceMappingURL=memory.d.ts.map