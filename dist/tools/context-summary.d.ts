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
export declare function contextSummary(params?: unknown): ContextSummaryResult;
//# sourceMappingURL=context-summary.d.ts.map