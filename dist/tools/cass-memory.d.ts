import { type MemorySearchResult } from "./memory";
export interface CassMemoryExecOptions {
    cmPath?: string;
    cwd?: string;
    timeoutMs?: number;
}
export interface CassMemoryResult<T = unknown> {
    ok: boolean;
    command: string[];
    data?: T;
    raw?: string;
    error?: string;
}
export interface CassMemoryContextParams extends CassMemoryExecOptions {
    task: string;
    limit?: number;
    history?: number;
    days?: number;
    noHistory?: boolean;
}
export interface CassMemoryMarkParams extends CassMemoryExecOptions {
    bulletId: string;
    helpful?: boolean;
    harmful?: boolean;
    reason?: string;
}
export interface CassMemoryReflectParams extends CassMemoryExecOptions {
    days?: number;
    maxSessions?: number;
    dryRun?: boolean;
}
interface InternalContextResult {
    task: string;
    relevantBullets: Array<MemorySearchResult & {
        bulletId: string;
        relevanceScore: number;
    }>;
    antiPatterns: Array<MemorySearchResult & {
        bulletId: string;
        relevanceScore: number;
    }>;
    historySnippets: MemorySearchResult[];
    degraded?: {
        cass: {
            available: false;
            reason: string;
            suggestedFix: string[];
        };
    };
}
export declare function cassMemoryContext(params: unknown): CassMemoryResult<InternalContextResult>;
export declare function cassMemoryMark(params: unknown): CassMemoryResult<{
    id: number;
}>;
export declare function cassMemoryReflect(params?: unknown): CassMemoryResult;
export declare function cassMemoryDoctor(_params?: CassMemoryExecOptions): CassMemoryResult;
export {};
//# sourceMappingURL=cass-memory.d.ts.map